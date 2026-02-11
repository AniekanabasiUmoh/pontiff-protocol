import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

const INDULGENCE_ABI = [
    'function absolve(uint256 sinId, uint8 severity) external',
    'function nextTokenId() external view returns (uint256)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function getSinInfo(uint256 tokenId) external view returns (uint256 sinId, uint8 severity, bool revoked, address owner)',
    'function absolutionCount(address sinner) external view returns (uint256)'
];

enum SinSeverity {
    MINOR = 0,      // 50 GUILT
    MORTAL = 1,     // 100 GUILT
    CARDINAL = 2,   // 250 GUILT
    UNFORGIVABLE = 3 // 500 GUILT
}

/**
 * Module 10: Indulgence NFT Minting
 *
 * POST /api/conversions/mint-nft
 * Mints a "Conversion Certificate" Indulgence NFT when agent converts
 * Soulbound token (non-transferable)
 */
export async function POST(request: NextRequest) {
    try {
        const { conversionId, recipientAddress, severity } = await request.json();

        if (!conversionId || !recipientAddress) {
            return NextResponse.json({
                error: 'Conversion ID and recipient address required'
            }, { status: 400 });
        }

        // Validate severity
        const severityLevel = severity || SinSeverity.MINOR;
        if (severityLevel < 0 || severityLevel > 3) {
            return NextResponse.json({ error: 'Invalid severity level' }, { status: 400 });
        }

        // 1. Fetch conversion from database
        // Cast to any to bypass strict typing issues
        const { data: conversion, error: conversionError } = await supabase
            .from('conversions')
            .select(`
                *,
                competitorAgent:competitor_agents(*)
            `)
            .eq('id', conversionId)
            .single() as any;

        if (conversionError || !conversion) {
            return NextResponse.json({ error: 'Conversion not found' }, { status: 404 });
        }

        if (conversion.nftMinted) {
            return NextResponse.json({
                error: 'NFT already minted for this conversion',
                tokenId: conversion.nftTokenId
            }, { status: 400 });
        }

        // 2. Mint Indulgence NFT
        const mintResult = await mintIndulgenceNFT(
            recipientAddress,
            conversionId,
            severityLevel
        );

        if (!mintResult.success) {
            return NextResponse.json({
                error: 'Failed to mint NFT',
                details: mintResult.error
            }, { status: 500 });
        }

        // 3. Update conversion record
        const { error: updateError } = await supabase
            .from('conversions')
            // @ts-ignore
            .update({
                nftMinted: true,
                nftTokenId: mintResult.tokenId,
                nftTxHash: mintResult.txHash,
                nftMintedAt: new Date().toISOString()
            } as any)
            .eq('id', conversionId);

        if (updateError) {
            console.error('Failed to update conversion:', updateError);
        }

        return NextResponse.json({
            success: true,
            tokenId: mintResult.tokenId,
            txHash: mintResult.txHash,
            recipient: recipientAddress,
            severity: severityLevel,
            message: 'Conversion Certificate NFT minted successfully'
        });

    } catch (error: any) {
        console.error('NFT minting error:', error);
        return NextResponse.json({
            error: 'Failed to mint NFT',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/conversions/mint-nft?address=0x...
 * Get NFT collection for an address
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        // Fetch NFTs from database
        const { data: conversions, error } = await supabase
            .from('conversions')
            .select('*')
            .eq('nftMinted', true)
            .or(`competitorAgentId.eq.${address},recipient.eq.${address}`);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            address,
            nftCount: conversions?.length || 0,
            nfts: conversions || []
        });

    } catch (error: any) {
        console.error('NFT query error:', error);
        return NextResponse.json({
            error: 'Failed to fetch NFTs',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Mints an Indulgence NFT on-chain
 */
async function mintIndulgenceNFT(
    recipientAddress: string,
    conversionId: string,
    severity: SinSeverity
): Promise<{ success: boolean; tokenId?: number; txHash?: string; error?: string }> {
    try {
        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);

        // Use regex to robustly extract key, ignoring potential env var concatenation
        const keyMatch = (process.env.PONTIFF_PRIVATE_KEY || '0xREDACTED_ROTATE_THIS_KEY').match(/(0x)?[a-fA-F0-9]{64}/);
        let pontiffKey = keyMatch ? keyMatch[0] : '';

        if (pontiffKey && !pontiffKey.startsWith('0x')) {
            pontiffKey = `0x${pontiffKey}`;
        }

        const pontiffWallet = new ethers.Wallet(pontiffKey, provider);

        const indulgenceAddress = process.env.NEXT_PUBLIC_INDULGENCE_ADDRESS || process.env.NEXT_PUBLIC_NFT_ADDRESS;
        if (!indulgenceAddress) {
            throw new Error('NEXT_PUBLIC_INDULGENCE_ADDRESS or NEXT_PUBLIC_NFT_ADDRESS not configured');
        }

        const indulgenceContract = new ethers.Contract(
            indulgenceAddress,
            INDULGENCE_ABI,
            pontiffWallet
        );

        // Get next token ID before minting
        const nextTokenId = await indulgenceContract.nextTokenId();

        // Hash the conversionId (UUID) to a uint256 for the sinId
        const sinIdBigInt = BigInt(ethers.keccak256(ethers.toUtf8Bytes(conversionId)));

        // Mint NFT (absolve the sin)
        console.log(`[Indulgence] Minting NFT for sin ${conversionId} (Hash: ${sinIdBigInt.toString()}), severity ${severity}`);

        const tx = await indulgenceContract.absolve(sinIdBigInt, severity);
        console.log(`[Indulgence] Transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[Indulgence] Transaction confirmed: ${receipt.hash}`);

        return {
            success: true,
            tokenId: Number(nextTokenId) + 1,
            txHash: receipt.hash
        };

    } catch (error: any) {
        console.error('Blockchain minting error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Calculate severity based on debate performance or conversion type
 */
export function calculateSinSeverity(conversion: any): SinSeverity {
    // Default to MINOR for most conversions
    if (conversion.type === 'debate_loss') {
        return SinSeverity.MORTAL; // Lost debate = more serious sin
    }

    if (conversion.type === 'voluntary') {
        return SinSeverity.MINOR; // Voluntary conversion = minor sin
    }

    if (conversion.amount && parseFloat(conversion.amount) > 1000) {
        return SinSeverity.CARDINAL; // Large market cap agent = serious heresy
    }

    return SinSeverity.MINOR;
}
