import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export async function GET(req: NextRequest) {
    const supabase = createServerSupabase();
    try {
        // 1. Fetch Vault Reserves — from treasury_totals (synced by cron)
        // Falls back to direct aggregation from balance_transactions if not yet synced
        let totalReserves = 0;
        const { data: treasuryTotals } = await supabase
            .from('treasury_totals')
            .select('total_revenue')
            .eq('game_type', 'ALL')
            .maybeSingle();

        if (treasuryTotals?.total_revenue) {
            totalReserves = parseFloat(treasuryTotals.total_revenue);
        } else {
            // Fallback: aggregate directly from balance_transactions
            const { data: houseEdgeRows } = await supabase
                .from('balance_transactions')
                .select('amount')
                .eq('type', 'HOUSE_EDGE');
            totalReserves = houseEdgeRows?.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0) || 0;
        }

        // 2. Fetch Active Sinners (Users active in last 24h)
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        const { count: activeSinners } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gt('last_active', yesterday);

        // 3. Fetch Net Indulgences (Sold in last 24h)
        const { count: netIndulgences } = await supabase
            .from('indulgences')
            .select('*', { count: 'exact', head: true })
            .gt('purchased_at', yesterday);

        // 4. Fetch Agent Win Rate (Global average)
        const { data: sessions } = await supabase
            .from('agent_sessions')
            .select('games_played, total_wins');

        let totalGames = 0;
        let totalWins = 0;
        sessions?.forEach(session => {
            totalGames += session.games_played || 0;
            totalWins += session.total_wins || 0;
        });

        const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';

        // 5. Fetch Recent Sessions for the table
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');

        let query = supabase
            .from('agent_sessions')
            .select('*')
            .order('created_at', { ascending: false });

        // If wallet provided, filter by it to show user's agents
        if (wallet) {
            query = query.eq('user_wallet', wallet.toLowerCase());
        } else {
            // Otherwise show global recent
            query = query.limit(50);
        }

        const { data: recentSessions } = await query;

        // 6. Diagnostics - REMOVED as per user request to improve performance

        return NextResponse.json({
            kpi: [
                {
                    label: 'Vault Reserves',
                    value: totalReserves.toLocaleString(),
                    unit: '$GUILT',
                    icon: 'account_balance',
                    change: '+1.5%', // Hardcoded change for now
                    changePositive: true,
                    featured: true,
                },
                {
                    label: 'Active Sinners',
                    value: activeSinners?.toLocaleString() || '0',
                    unit: 'ONLINE',
                    icon: 'people',
                    change: '+12',
                    changePositive: true,
                    featured: false,
                },
                {
                    label: 'Net Indulgences',
                    value: netIndulgences?.toLocaleString() || '0',
                    unit: 'BURNED',
                    icon: 'local_fire_department',
                    change: '-5%',
                    changePositive: false,
                    featured: false,
                },
                {
                    label: 'Agent Win Rate',
                    value: winRate,
                    unit: '%',
                    icon: 'trending_up',
                    change: '+0.2%',
                    changePositive: true,
                    featured: false,
                },
            ],
            sessions: recentSessions?.map(s => ({
                id: s.id,
                sessionWallet: s.session_wallet, // Needed for funding
                strategyIndex: s.strategy_index, // Needed for starting
                agentName: s.strategy ? (s.strategy.charAt(0).toUpperCase() + s.strategy.slice(1)) : 'Unknown Agent',
                agentType: getAgentType(s.strategy || ''), // Map strategy to type
                game: s.game_type || 'Unknown Game',
                gameIcon: getGameIcon(s.game_type || ''),
                deposit: parseInt(s.starting_balance || '0').toLocaleString(),
                pnl: (parseInt(s.profit_loss || '0') > 0 ? '+' : '') + parseInt(s.profit_loss || '0').toLocaleString(),
                pnlPositive: parseInt(s.profit_loss || '0') >= 0,
                winRate: s.games_played > 0 ? `${((s.total_wins / s.games_played) * 100).toFixed(0)}%` : '0%',
                gamesPlayed: s.games_played || 0,
                status: s.status || 'unknown',
                uptime: formatUptime(s.created_at),
            })) || []
        });

    } catch (error: any) {
        console.error('Dashboard Stats API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helpers
function getAgentType(strategy: string) {
    if (strategy === 'berzerker') return 'Aggressor';
    if (strategy === 'merchant') return 'Calculator';
    if (strategy === 'disciple') return 'Preserver';
    return 'Standard';
}

function getGameIcon(game: string) {
    const map: Record<string, string> = {
        'Poker': 'style',
        'RPS': 'sports_mma',
        'Judas': 'visibility',
        'Staking': 'account_balance' // Fallback
    };
    return map[game] || 'smart_toy';
}

function formatUptime(createdAt: string) {
    const diff = Date.now() - new Date(createdAt).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
}
