import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServerSupabase();
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }

        // Fetch agent session
        const { data: session, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !session) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const s = session as any;

        // Fetch game history
        const { data: gameHistory } = await supabase
            .from('game_history')
            .select('*')
            .eq('session_id', id)
            .order('created_at', { ascending: false })
            .limit(50);

        // Calculate stats
        const totalWins = s.total_wins || 0;
        const totalLosses = s.total_losses || 0;
        const totalDraws = s.total_draws || 0;

        return NextResponse.json({
            sessionWallet: s.session_wallet || null,
            strategyIndex: s.strategy_index,
            balance: s.current_balance || s.starting_balance || '0',
            startingBalance: s.starting_balance || '0',
            stopLoss: s.stop_loss || 0,
            takeProfit: s.take_profit || null,
            totalWins,
            totalLosses,
            totalDraws,
            createdAt: s.created_at,
            txHash: s.tx_hash || '',
            gameHistory: ((gameHistory || []) as any[]).map(g => ({
                id: g.id,
                result: g.result || 'draw',
                wager: g.wager_amount || 0,
                pnl: g.profit_loss || 0,
                playedAt: g.created_at,
                game: g.game_type || 'RPS',
            })),
        });

    } catch (error: any) {
        console.error('Agent Detail API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
