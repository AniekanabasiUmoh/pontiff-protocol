import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import {
    createPublicClient,
    createWalletClient,
    http,
    parseAbi,
    isAddress,
    decodeEventLog,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';

/**
 * Module 12: Confession NFT Minting
 *
 * Mints "Proof of Penance" NFT for users who successfully complete confession
 * - NFT is soulbound (non-transferable)
 * - Metadata includes sin reduction amount and confession date
 * - Acts as permanent record of absolution
 */

const CONFESSION_NFT_ADDRESS = process.env.NEXT_PUBLIC_CONFESSION_NFT_CONTRACT || '0x0000000000000000000000000000000000000000';

// ABI for Confession NFT contract (minimal ERC721 + custom mint function)
const CONFESSION_NFT_ABI = [
    'function mintPenance(address recipient, uint256 confessionId, uint256 sinReduction, string memory metadataURI) external returns (uint256)',
    'function tokenURI(uint256 tokenId) external view returns (string memory)',
    'function balanceOf(address owner) external view returns (uint256)',
    'function ownerOf(uint256 tokenId) external view returns (address)'
];

interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

interface Confession {
    id: string;
    wallet_address: string;
    status: string;
    sin_reduction: number;
    stake_amount: string;
    created_at: string;
    previous_sin_score: number;
    new_sin_score: number;
    nft_token_id?: number | null;
    nft_minted?: boolean;
    nft_mint_tx?: string;
    nft_metadata?: any;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerSupabase();
        const body = await request.json();
        const { walletAddress, confessionId } = body;

        // Validate input
        if (!walletAddress || !confessionId) {
            return NextResponse.json(
                { error: 'Missing required fields: walletAddress, confessionId' },
                { status: 400 }
            );
        }

        // Validate wallet address
        if (!isAddress(walletAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        // Fetch confession record
        const { data: rawConfession, error: confessionError } = await supabase
            .from('confessions')
            .select('*')
            .eq('id', confessionId)
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        const confession = rawConfession as unknown as Confession;

        if (confessionError || !confession) {
            console.error('[Confession NFT] Confession not found:', confessionError);
            return NextResponse.json(
                { error: 'Confession not found or does not belong to this wallet' },
                { status: 404 }
            );
        }

        // Check if NFT already minted for this confession
        if (confession.nft_token_id) {
            return NextResponse.json({
                success: true,
                alreadyMinted: true,
                tokenId: confession.nft_token_id,
                message: 'Confession NFT already minted for this confession',
                contractAddress: CONFESSION_NFT_ADDRESS
            });
        }

        // Check if confession is eligible for NFT (must be completed)
        if (confession.status !== 'completed') {
            return NextResponse.json(
                { error: 'Confession must be completed before minting NFT' },
                { status: 400 }
            );
        }

        // Generate NFT metadata
        const metadata: NFTMetadata = {
            name: `Proof of Penance #${confessionId}`,
            description: `This sacred NFT certifies that ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} has completed penance before The Pontiff, reducing their sin score by ${confession.sin_reduction} points through the sacrifice of ${confession.stake_amount} GUILT. Issued on ${new Date(confession.created_at).toLocaleDateString()}.`,
            image: 'ipfs://QmPontiffConfessionPlaceholder', // TODO: Generate unique confession certificate image
            attributes: [
                {
                    trait_type: 'Confession Type',
                    value: 'Penance Stake'
                },
                {
                    trait_type: 'Sin Reduction',
                    value: confession.sin_reduction
                },
                {
                    trait_type: 'Stake Amount',
                    value: `${confession.stake_amount} GUILT`
                },
                {
                    trait_type: 'Previous Sin Score',
                    value: confession.previous_sin_score
                },
                {
                    trait_type: 'New Sin Score',
                    value: confession.new_sin_score
                },
                {
                    trait_type: 'Confession Date',
                    value: new Date(confession.created_at).toISOString()
                },
                {
                    trait_type: 'Absolution Status',
                    value: confession.new_sin_score === 0 ? 'Fully Absolved' : 'Partial Absolution'
                }
            ]
        };

        // Store metadata in database (for now, as JSON)
        const metadataString = JSON.stringify(metadata);

        // Mint NFT on-chain
        let pontiffKey = process.env.PONTIFF_PRIVATE_KEY!;
        if (pontiffKey && !pontiffKey.startsWith('0x')) {
            pontiffKey = `0x${pontiffKey}`;
        }

        const account = privateKeyToAccount(pontiffKey as `0x${string}`);
        const publicClient = createPublicClient({ chain: monadTestnet, transport: http(process.env.NEXT_PUBLIC_RPC_URL) });
        const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http(process.env.NEXT_PUBLIC_RPC_URL) });
        const nftAbi = parseAbi(CONFESSION_NFT_ABI);

        try {
            // Mint NFT (The Pontiff mints and sends to user)
            const txHash = await walletClient.writeContract({
                address: CONFESSION_NFT_ADDRESS as `0x${string}`,
                abi: nftAbi,
                functionName: 'mintPenance',
                args: [walletAddress, confessionId, confession.sin_reduction, metadataString],
            });

            console.log(`[Confession NFT] Minting transaction sent: ${txHash}`);

            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            console.log(`[Confession NFT] Mint confirmed: ${receipt.transactionHash}`);

            // Extract token ID from receipt logs (Transfer event)
            const ERC721_TRANSFER_ABI = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)']);
            let tokenId: number | null = null;
            for (const log of receipt.logs) {
                try {
                    const decoded = decodeEventLog({ abi: ERC721_TRANSFER_ABI, data: log.data, topics: log.topics });
                    if (decoded.eventName === 'Transfer') {
                        tokenId = Number((decoded.args as any).tokenId);
                        break;
                    }
                } catch {
                    // Skip logs that don't match
                }
            }

            // Update confession record with NFT details
            const { error: updateError } = await supabase
                .from('confessions')
                // @ts-ignore
                .update({
                    nft_minted: true,
                    nft_token_id: tokenId,
                    nft_mint_tx: receipt.transactionHash,
                    nft_metadata: metadata
                } as any)
                .eq('id', confessionId);

            if (updateError) {
                console.error('[Confession NFT] Failed to update confession record:', updateError);
            }

            return NextResponse.json({
                success: true,
                tokenId,
                txHash: receipt.transactionHash,
                contractAddress: CONFESSION_NFT_ADDRESS,
                metadata,
                message: '🎨 Confession NFT minted successfully! Your penance is now immortalized on-chain.'
            });

        } catch (mintError: any) {
            console.error('[Confession NFT] Mint error:', mintError);
            return NextResponse.json(
                {
                    error: 'NFT minting failed',
                    message: mintError.message,
                    note: 'Contract may not be deployed yet. Using mock mode.'
                },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('[Confession NFT] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint to check NFT minting status
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const confessionId = searchParams.get('confessionId');
        const walletAddress = searchParams.get('wallet');

        if (!confessionId || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing confessionId or wallet parameter' },
                { status: 400 }
            );
        }

        // Fetch confession record
        const { data: rawConfession, error } = await supabase
            .from('confessions')
            .select('nft_minted, nft_token_id, nft_mint_tx, nft_metadata')
            .eq('id', confessionId)
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        const confession = rawConfession as unknown as Confession;

        if (error || !confession) {
            return NextResponse.json(
                { error: 'Confession not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            confessionId,
            nftMinted: confession.nft_minted || false,
            tokenId: confession.nft_token_id,
            mintTx: confession.nft_mint_tx,
            metadata: confession.nft_metadata,
            contractAddress: CONFESSION_NFT_ADDRESS
        });

    } catch (error: any) {
        console.error('[Confession NFT Status] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
