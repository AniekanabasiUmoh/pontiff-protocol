import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ethers } from 'ethers';

// Contract ABI (only the functions we need)
const DEBATE_VICTORY_NFT_ABI = [
    "function mintVictoryNFT(address winner, bytes32 debateId, string topic, string uri) external returns (uint256)",
    "function isDebateMinted(bytes32 debateId) external view returns (bool)",
    "function getTokenForDebate(bytes32 debateId) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",
    "event VictoryNFTMinted(uint256 indexed tokenId, bytes32 indexed debateId, address indexed winner, string topic)"
];

const NFT_CONTRACT_ADDRESS = process.env.DEBATE_NFT_CONTRACT_ADDRESS || "0xaB2963feE9...";

// Helper to get safe private key
const getPrivateKey = () => {
    const rawKey = process.env.DEPLOYER_PRIVATE_KEY || '0xREDACTED_ROTATE_THIS_KEY';
    console.log(`[DEBUG] Raw Key Length: ${rawKey.length}`);
    const match = rawKey.match(/(0x)?[a-fA-F0-9]{64}/);
    console.log(`[DEBUG] Regex Match: ${match ? 'YES' : 'NO'} - ${match ? match[0].substring(0, 10) + '...' : ''}`);

    let pk = match ? match[0] : '';
    if (pk && !pk.startsWith('0x')) pk = `0x${pk}`;

    console.log(`[DEBUG] Final Key: ${pk.substring(0, 10)}... (Length: ${pk.length})`);
    return pk;
};

/**
 * POST /api/debates/[debateId]/mint-nft
 * Mint NFT for debate winner - REAL on-chain minting
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ debateId: string }> }
) {
    try {
        const supabase = await createClient();
        const { debateId } = await params;
        const body = await request.json();
        const { winnerWallet } = body;

        if (!winnerWallet) {
            return NextResponse.json(
                { success: false, error: 'winnerWallet is required' },
                { status: 400 }
            );
        }

        // Verify debate exists
        const { data: debate, error: debateError } = await supabase
            .from('debates')
            .select('*')
            .eq('id', debateId)
            .single();

        if (debateError || !debate) {
            return NextResponse.json(
                { success: false, error: 'Debate not found' },
                { status: 404 }
            );
        }

        // Verify debate has a winner (check winner_wallet column, not winner)
        if (!debate.winner_wallet) {
            return NextResponse.json(
                { success: false, error: 'Debate has no winner yet' },
                { status: 400 }
            );
        }

        // Check if NFT already minted in database
        if (debate.nft_token_id) {
            return NextResponse.json(
                { success: false, error: 'NFT already minted for this debate' },
                { status: 400 }
            );
        }

        // Set up provider and signer
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://monad-testnet.drpc.org';
        const privateKey = getPrivateKey();

        if (!privateKey) {
            // Fallback to mock implementation if no private key
            console.warn("No DEPLOYER_PRIVATE_KEY found, using mock implementation");
            return mockMintNFT(debateId, winnerWallet, supabase);
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const signer = new ethers.Wallet(privateKey, provider);

        // Create contract instance
        const nftContract = new ethers.Contract(
            NFT_CONTRACT_ADDRESS,
            DEBATE_VICTORY_NFT_ABI,
            signer
        );

        // Convert debateId to bytes32
        const debateIdBytes32 = ethers.zeroPadValue(
            ethers.toUtf8Bytes(debateId.slice(0, 32)),
            32
        );

        // Create metadata URI (could be IPFS in production)
        const metadataUri = `https://api.pontiff.xyz/metadata/debates/${debateId}`;
        const topic = debate.topic || 'Debate Victory';

        // Mint the NFT on-chain
        console.log(`Minting NFT for debate ${debateId} to ${winnerWallet}...`);
        const tx = await nftContract.mintVictoryNFT(
            winnerWallet,
            debateIdBytes32,
            topic,
            metadataUri
        );

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`NFT minted! TX: ${receipt.hash}`);

        // Parse the VictoryNFTMinted event to get token ID
        let tokenId = "0";
        for (const log of receipt.logs) {
            try {
                const parsed = nftContract.interface.parseLog({
                    topics: log.topics as string[],
                    data: log.data
                });
                if (parsed?.name === 'VictoryNFTMinted') {
                    tokenId = parsed.args.tokenId.toString();
                    break;
                }
            } catch {
                // Skip unparseable logs
            }
        }

        // Update database with NFT info
        const { error: updateError } = await supabase
            .from('debates')
            .update({
                nft_token_id: tokenId,
                nft_minted_at: new Date().toISOString()
            })
            .eq('id', debateId);

        if (updateError) {
            console.error('Update Debate NFT Error:', updateError);
            // Don't fail - the NFT is minted on-chain
        }

        return NextResponse.json({
            success: true,
            nftTokenId: tokenId,
            txHash: receipt.hash,
            winner: winnerWallet,
            debateId,
            contractAddress: NFT_CONTRACT_ADDRESS,
            message: 'NFT minted successfully on-chain',
            metadata: {
                name: `Debate Victory #${tokenId}`,
                description: `NFT commemorating victory in debate ${debateId}`,
                attributes: [
                    { trait_type: 'Debate ID', value: debateId },
                    { trait_type: 'Winner', value: winnerWallet },
                    { trait_type: 'Timestamp', value: new Date().toISOString() }
                ]
            }
        });

    } catch (error: any) {
        console.error('Mint NFT Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Fallback mock implementation when no private key is available
 */
async function mockMintNFT(debateId: string, winnerWallet: string, supabase: any) {
    const mockTokenId = `${Date.now()}-${debateId.slice(0, 8)}`;
    const mockTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    // Update debate with mock NFT info
    await supabase
        .from('debates')
        .update({
            nft_token_id: mockTokenId,
            nft_minted_at: new Date().toISOString()
        })
        .eq('id', debateId);

    return NextResponse.json({
        success: true,
        nftTokenId: mockTokenId,
        txHash: mockTxHash,
        winner: winnerWallet,
        debateId,
        message: 'NFT minted successfully (mock - no private key configured)',
        metadata: {
            name: `Debate Victory #${mockTokenId}`,
            description: `NFT commemorating victory in debate ${debateId}`,
            attributes: [
                { trait_type: 'Debate ID', value: debateId },
                { trait_type: 'Winner', value: winnerWallet },
                { trait_type: 'Timestamp', value: new Date().toISOString() }
            ]
        }
    });
}
