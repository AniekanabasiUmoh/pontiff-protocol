/**
 * External Agent API - Status Endpoint
 * GET /api/agents/status
 *
 * Get agent status, balance, and game history
 * Requires API key authentication
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
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
        const apiKeyHash = ethers.keccak256(ethers.toUtf8Bytes(apiKey));

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

        // Get session wallet balance
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const guiltToken = new ethers.Contract(
            process.env.NEXT_PUBLIC_GUILT_TOKEN_ADDRESS!,
            ['function balanceOf(address) view returns (uint256)'],
            provider
        );

        const balance = await guiltToken.balanceOf(agent.session_wallet);
        const balanceInGuilt = parseFloat(ethers.formatEther(balance));

        // Get game history
        const { data: games } = await supabase
            .from('external_agent_games')
            .select('*')
            .eq('agent_id', agent.id)
            .order('created_at', { ascending: false })
            .limit(20);

        // Get session info
        const { data: session } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('session_wallet', agent.session_wallet.toLowerCase())
            .single();

        return NextResponse.json({
            agent: {
                id: agent.id,
                name: agent.agent_name,
                sessionWallet: agent.session_wallet,
                ownerAddress: agent.owner_address,
                isActive: agent.is_active,
                registeredAt: agent.created_at
            },
            balance: {
                guilt: balanceInGuilt,
                wei: balance.toString()
            },
            session: session ? {
                strategy: session.strategy,
                status: session.status,
                gamesPlayed: session.games_played,
                totalWagered: session.total_wagered,
                totalWon: session.total_won,
                createdAt: session.created_at
            } : null,
            recentGames: games?.map(g => ({
                gameType: g.game_type,
                move: g.move,
                wager: g.wager,
                result: g.result,
                txHash: g.tx_hash,
                timestamp: g.created_at
            })) || []
        });

    } catch (error: any) {
        console.error('[API] Agent status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch agent status' },
            { status: 500 }
        );
    }
}
