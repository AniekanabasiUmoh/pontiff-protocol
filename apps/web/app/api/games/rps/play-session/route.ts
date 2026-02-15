import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import {
    createPublicClient,
    createWalletClient,
    http,
    parseAbi,
    parseEther,
    formatEther,
    encodeFunctionData,
    decodeEventLog,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';


const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-rpc.monad.xyz';
const PONTIFF_PRIVATE_KEY = process.env.PONTIFF_PRIVATE_KEY!;
const RPS_CONTRACT = process.env.NEXT_PUBLIC_RPS_ADDRESS!;

const RPS_ABI = parseAbi([
    'function playRPS(uint8 _playerMove, uint256 _wager) external returns (uint256)',
    'event GamePlayed(uint256 indexed gameId, address indexed player, uint8 playerMove, uint8 pontiffMove, string result, uint256 wager, uint256 payout)',
]);

const SESSION_WALLET_ABI = parseAbi([
    'function executeGame(address target, bytes calldata data) external',
    'function owner() external view returns (address)',
]);

/**
 * Play RPS via session wallet (backend executes transaction)
 * This enables instant gameplay without wallet popups
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createServerSupabase();
        const { sessionWalletAddress, playerMove, wager, userAddress, sessionId } = await req.json();

        if (!sessionWalletAddress || !playerMove || !wager || !userAddress) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (![1, 2, 3].includes(playerMove)) {
            return NextResponse.json(
                { error: 'Invalid move. Must be 1 (Stone), 2 (Scroll), or 3 (Dagger)' },
                { status: 400 }
            );
        }

        const account = privateKeyToAccount(PONTIFF_PRIVATE_KEY as `0x${string}`);
        const publicClient = createPublicClient({ chain: monadTestnet, transport: http(RPC_URL) });
        const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http(RPC_URL) });

        const owner = await publicClient.readContract({
            address: sessionWalletAddress as `0x${string}`,
            abi: SESSION_WALLET_ABI,
            functionName: 'owner',
        });

        if ((owner as string).toLowerCase() !== userAddress.toLowerCase()) {
            return NextResponse.json(
                { error: 'Session wallet does not belong to this user' },
                { status: 403 }
            );
        }

        const wagerWei = parseEther(wager.toString());
        const playData = encodeFunctionData({
            abi: RPS_ABI,
            functionName: 'playRPS',
            args: [playerMove, wagerWei],
        });

        console.log(`[Session Play] User ${userAddress} playing via ${sessionWalletAddress}`);

        const txHash = await walletClient.writeContract({
            address: sessionWalletAddress as `0x${string}`,
            abi: SESSION_WALLET_ABI,
            functionName: 'executeGame',
            args: [RPS_CONTRACT as `0x${string}`, playData],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

        let gameId: string | null = null;
        let pontiffMove: number | null = null;
        let result: string | null = null;
        let payout: string | null = null;

        for (const log of receipt.logs) {
            try {
                const decoded = decodeEventLog({ abi: RPS_ABI, data: log.data, topics: log.topics });
                if (decoded.eventName === 'GamePlayed') {
                    const args = decoded.args as any;
                    gameId = args.gameId.toString();
                    pontiffMove = Number(args.pontiffMove);
                    result = args.result;
                    payout = formatEther(args.payout);
                    break;
                }
            } catch {
                // Skip logs that don't match
            }
        }

        const wagerNum = parseFloat(wager.toString());
        const resultLower = (result || 'draw').toLowerCase();
        const pnl = resultLower === 'win' ? wagerNum * 0.95 : resultLower === 'loss' ? -wagerNum : 0;

        // Record in games table
        await supabase.from('games').insert({
            player1: userAddress.toLowerCase(),
            player_move: playerMove,
            pontiff_move: pontiffMove,
            result: resultLower,
            wager: wager.toString(),
            payout: payout || '0',
            game_type: 'RPS',
            status: 'Completed',
            tx_hash: receipt.transactionHash,
            session_wallet: sessionWalletAddress.toLowerCase(),
        });

        // Record in game_history for agent detail modal
        if (sessionId) {
            await supabase.from('game_history').insert({
                session_id: sessionId,
                player_address: userAddress.toLowerCase(),
                game_type: 'RPS',
                result: resultLower,
                wager_amount: wagerNum,
                profit_loss: pnl,
                player_move: playerMove,
                pontiff_move: pontiffMove || 0,
                tx_hash: receipt.transactionHash,
            });

            // Update session stats
            const { data: sess } = await supabase
                .from('agent_sessions')
                .select('games_played,total_wins,total_losses,total_draws,profit_loss')
                .eq('id', sessionId)
                .single();
            if (sess) {
                const statsUpdate: any = { updated_at: new Date().toISOString() };
                statsUpdate.games_played = (sess.games_played || 0) + 1;
                statsUpdate.profit_loss = ((parseFloat(sess.profit_loss || '0')) + pnl).toFixed(4);
                if (resultLower === 'win') statsUpdate.total_wins = (sess.total_wins || 0) + 1;
                else if (resultLower === 'loss') statsUpdate.total_losses = (sess.total_losses || 0) + 1;
                else statsUpdate.total_draws = (sess.total_draws || 0) + 1;
                await supabase.from('agent_sessions').update(statsUpdate).eq('id', sessionId);
            }
        }

        return NextResponse.json({
            success: true,
            game: {
                gameId: gameId ?? 'unknown',
                playerMove,
                pontiffMove: pontiffMove ?? 0,
                result: result ?? 'unknown',
                wager,
                payout: payout ?? '0',
                txHash: receipt.transactionHash,
            }
        });
    } catch (error: any) {
        console.error('[Session Play] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to execute game' },
            { status: 500 }
        );
    }
}
