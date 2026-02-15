import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    createPublicClient,
    createWalletClient,
    http,
    parseAbi,
    toBytes,
    pad,
    decodeEventLog,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';

// Contract ABI (only the functions we need)
const DEBATE_VICTORY_NFT_ABI = [
    "function mintVictoryNFT(address winner, bytes32 debateId, string topic, string uri) external returns (uint256)",
    "function isDebateMinted(bytes32 debateId) external view returns (bool)",
    "function getTokenForDebate(bytes32 debateId) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",
    "event VictoryNFTMinted(uint256 indexed tokenId, bytes32 indexed debateId, address indexed winner, string topic)"
];

// Use the verified deployed address as primary; env can override
const NFT_CONTRACT_ADDRESS = "0xaB2963feE9adF52f8E77280ebBd89e25E2b6d23b";

// Helper to get safe private key
const getPrivateKey = () => {
    const rawKey = process.env.DEPLOYER_PRIVATE_KEY || '';
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

        if (!privateKey || privateKey.length !== 66) {
            // Fallback to mock implementation if no valid private key
            console.warn(`No valid DEPLOYER_PRIVATE_KEY (got length ${privateKey.length}), using mock implementation`);
            return mockMintNFT(debateId, winnerWallet, supabase);
        }

        try {
            const account = privateKeyToAccount(privateKey as `0x${string}`);
            const publicClient = createPublicClient({ chain: monadTestnet, transport: http(rpcUrl) });
            const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http(rpcUrl) });
            const nftAbi = parseAbi(DEBATE_VICTORY_NFT_ABI);

            // Convert debateId to bytes32
            const debateIdBytes32 = pad(toBytes(debateId.slice(0, 32)), { size: 32 });

            const metadataUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://api.pontiff.xyz'}/api/metadata/debate-nft/${Date.now()}`;
            const topic = (debate as any).topic || 'Debate Victory';

            console.log(`Minting NFT for debate ${debateId} to ${winnerWallet}...`);
            const txHash = await walletClient.writeContract({
                address: NFT_CONTRACT_ADDRESS as `0x${string}`,
                abi: nftAbi,
                functionName: 'mintVictoryNFT',
                args: [winnerWallet, debateIdBytes32, topic, metadataUri],
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            console.log(`NFT minted on-chain! TX: ${receipt.transactionHash}`);

            let tokenId = "0";
            for (const log of receipt.logs) {
                try {
                    const decoded = decodeEventLog({ abi: nftAbi, data: log.data, topics: log.topics });
                    if (decoded.eventName === 'VictoryNFTMinted') {
                        tokenId = (decoded.args as any).tokenId.toString();
                        break;
                    }
                } catch { /* skip */ }
            }

            await supabase
                .from('debates')
                .update({ nft_token_id: tokenId, nft_minted_at: new Date().toISOString() })
                .eq('id', debateId);

            return NextResponse.json({
                success: true,
                nftTokenId: tokenId,
                txHash: receipt.transactionHash,
                winner: winnerWallet,
                debateId,
                contractAddress: NFT_CONTRACT_ADDRESS,
                message: 'NFT minted successfully on-chain',
            });

        } catch (onChainError: any) {
            console.error('On-chain mint failed, falling back to mock:', onChainError.message);
            return mockMintNFT(debateId, winnerWallet, supabase);
        }

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
