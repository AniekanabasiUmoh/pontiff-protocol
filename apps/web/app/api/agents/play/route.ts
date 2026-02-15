/**
 * External Agent API - Play Game Endpoint
 * POST /api/agents/play
 *
 * Allows registered external agents to submit game moves
 * Requires API key authentication
 */

import { NextResponse } from 'next/server';
import {
    createPublicClient,
    createWalletClient,
    http,
    parseAbi,
    keccak256,
    toBytes,
    formatEther,
    parseEther,
    encodeFunctionData,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import { createServerSupabase } from '@/lib/db/supabase-server';


const RPS_ABI = [
    "function playRPS(uint256 _move, uint256 _wager) external returns (bool)"
];

export async function POST(request: Request) {
    const supabase = createServerSupabase();
    try {
        // Extract API key from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid Authorization header' },
                { status: 401 }
            );
        }

        const apiKey = authHeader.substring(7);
        const apiKeyHash = keccak256(toBytes(apiKey));

        // Verify API key and get agent
        const { data: agent, error: authError } = await supabase
            .from('external_agents')
            .select('*')
            .eq('api_key_hash', apiKeyHash)
            .eq('is_active', true)
            .single();

        if (authError || !agent) {
            return NextResponse.json(
                { error: 'Invalid or inactive API key' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { game, move, wager } = body;

        // Validation
        if (!game || !['RPS', 'POKER', 'JUDAS'].includes(game)) {
            return NextResponse.json(
                { error: 'Invalid game type. Must be RPS, POKER, or JUDAS' },
                { status: 400 }
            );
        }

        if (game === 'RPS') {
            if (!move || ![1, 2, 3].includes(move)) {
                return NextResponse.json(
                    { error: 'Invalid RPS move. Must be 1 (Rock), 2 (Paper), or 3 (Scissors)' },
                    { status: 400 }
                );
            }
        }

        if (!wager || wager <= 0) {
            return NextResponse.json(
                { error: 'Wager must be greater than 0' },
                { status: 400 }
            );
        }

        // Check session wallet balance
        const publicClient = createPublicClient({ chain: monadTestnet, transport: http(process.env.NEXT_PUBLIC_RPC_URL) });
        const ERC20_ABI = parseAbi(['function balanceOf(address) view returns (uint256)']);
        const balance = await publicClient.readContract({
            address: process.env.NEXT_PUBLIC_GUILT_TOKEN_ADDRESS! as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [agent.session_wallet as `0x${string}`],
        }) as bigint;
        const balanceInGuilt = parseFloat(formatEther(balance));

        if (balanceInGuilt < wager) {
            return NextResponse.json(
                { error: `Insufficient balance. Have ${balanceInGuilt.toFixed(2)}, need ${wager}` },
                { status: 400 }
            );
        }

        // Execute game move (RPS only for now)
        if (game === 'RPS') {
            const account = privateKeyToAccount(process.env.PONTIFF_PRIVATE_KEY! as `0x${string}`);
            const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http(process.env.NEXT_PUBLIC_RPC_URL) });

            const SESSION_WALLET_ABI = parseAbi([
                "function executeTransaction(address target, bytes calldata data, uint256 gasLimit) external returns (bool)"
            ]);
            const rpsAbi = parseAbi(RPS_ABI);
            const data = encodeFunctionData({
                abi: rpsAbi,
                functionName: 'playRPS',
                args: [move, parseEther(wager.toString())],
            });

            const txHash = await walletClient.writeContract({
                address: agent.session_wallet as `0x${string}`,
                abi: SESSION_WALLET_ABI,
                functionName: 'executeTransaction',
                args: [process.env.NEXT_PUBLIC_RPS_CONTRACT_ADDRESS! as `0x${string}`, data, BigInt(500000)],
            });
            const tx = { hash: txHash };
            await publicClient.waitForTransactionReceipt({ hash: txHash });

            // Log the game
            await supabase.from('external_agent_games').insert({
                agent_id: agent.id,
                game_type: 'RPS',
                move,
                wager: wager.toString(),
                tx_hash: tx.hash,
                created_at: new Date().toISOString()
            });

            return NextResponse.json({
                success: true,
                game: 'RPS',
                move,
                wager,
                txHash: tx.hash,
                message: 'Move executed successfully'
            });
        }

        // Other games not yet implemented
        return NextResponse.json(
            { error: 'Game type not yet implemented' },
            { status: 501 }
        );

    } catch (error: any) {
        console.error('[API] Agent play error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to execute move' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/agents/play
 * Get API documentation
 */
export async function GET() {
    return NextResponse.json({
        endpoint: '/api/agents/play',
        method: 'POST',
        authentication: 'Bearer <API_KEY>',
        games: {
            RPS: {
                moves: {
                    1: 'Rock',
                    2: 'Paper',
                    3: 'Scissors'
                },
                minWager: 1,
                maxWager: 'Session balance'
            },
            POKER: 'Not yet implemented',
            JUDAS: 'Not yet implemented'
        },
        requestBody: {
            game: 'string (RPS, POKER, JUDAS)',
            move: 'number (game-specific)',
            wager: 'number (GUILT amount)'
        },
        example: {
            game: 'RPS',
            move: 1,
            wager: 10
        }
    });
}
