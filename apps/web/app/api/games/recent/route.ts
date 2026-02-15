import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

// Initialize Supabase client

// GET: Fetch recent game activity for Live Game Feed
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Try to fetch from multiple sources for comprehensive data
        const games: any[] = [];

        // 1. Fetch from confessions (gambling sins)
        const { data: confessions } = await supabase
            .from('confessions')
            .select('id, wallet_address, sin_amount, sin_type, indulgence_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(Math.ceil(limit / 3));

        if (confessions?.length) {
            confessions.forEach(c => {
                games.push({
                    id: c.id,
                    agent: getAgentFromWallet(c.wallet_address),
                    game: mapSinTypeToGame(c.sin_type || 'Confession'),
                    wager: `${formatAmount(c.sin_amount)} GUILT`,
                    result: c.indulgence_amount ? 'REDEEMED' : 'CONFESSED',
                    profit: c.indulgence_amount ? `-${formatAmount(c.indulgence_amount)} GUILT` : '+0 GUILT',
                    time: formatTimeAgo(new Date(c.created_at)),
                    timestamp: new Date(c.created_at).getTime()
                });
            });
        }

        // 2. Fetch from agent_sessions activity (if table exists)
        try {
            const { data: sessions } = await supabase
                .from('agent_sessions')
                .select('id, strategy, owner_address, deposit_amount, profit_loss, created_at, status, total_games')
                .order('updated_at', { ascending: false })
                .limit(Math.ceil(limit / 3));

            if (sessions?.length) {
                sessions.forEach(s => {
                    games.push({
                        id: `session-${s.id}`,
                        agent: capitalizeWords(s.strategy || 'Agent'),
                        game: 'Session',
                        wager: `${formatAmount(s.deposit_amount)} GUILT`,
                        result: s.status === 'active' ? 'ACTIVE' : 'ENDED',
                        profit: `${formatSignedAmount(s.profit_loss)} GUILT`,
                        time: formatTimeAgo(new Date(s.created_at)),
                        timestamp: new Date(s.created_at).getTime()
                    });
                });
            }
        } catch (e) {
            // Table might not exist yet, ignore
        }

        // 3. Fetch from debates (if any exist with activity)
        try {
            const { data: debates } = await supabase
                .from('debates')
                .select('id, competitor_agent_id, status, exchanges, started_at, last_exchange_at')
                .order('last_exchange_at', { ascending: false })
                .limit(Math.ceil(limit / 3));

            if (debates?.length) {
                debates.forEach(d => {
                    games.push({
                        id: `debate-${d.id}`,
                        agent: 'The Debater',
                        game: 'Debate',
                        wager: `${d.exchanges || 0} exchanges`,
                        result: d.status === 'Active' ? 'ONGOING' : d.status === 'Completed' ? 'WON' : 'PENDING',
                        profit: d.status === 'Completed' ? '+NFT Minted' : 'Pending...',
                        time: formatTimeAgo(new Date(d.last_exchange_at || d.started_at)),
                        timestamp: new Date(d.last_exchange_at || d.started_at).getTime()
                    });
                });
            }
        } catch (e) {
            // Ignore if debates table has issues
        }

        // 4. Fetch from game_history (ACTUAL GAMES)
        try {
            const { data: history } = await supabase
                .from('game_history')
                .select('id, game_type, wager_amount, profit_loss, result, created_at, player_address')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (history?.length) {
                history.forEach(h => {
                    games.push({
                        id: `game-${h.id}`,
                        agent: getAgentFromWallet(h.player_address) || 'Agent',
                        game: h.game_type || 'RPS',
                        wager: `${formatAmount(h.wager_amount)} GUILT`,
                        result: h.result ? h.result.toUpperCase() : 'PLAYED',
                        profit: `${formatSignedAmount(h.profit_loss)} GUILT`,
                        time: formatTimeAgo(new Date(h.created_at)),
                        timestamp: new Date(h.created_at).getTime()
                    });
                });
            }
        } catch (e) {
            console.error('Failed to fetch game_history:', e);
        }

        // Sort all games by timestamp and limit
        games.sort((a, b) => b.timestamp - a.timestamp);
        const recentGames = games.slice(0, limit);

        // If no real data, indicate empty
        if (recentGames.length === 0) {
            return NextResponse.json({
                success: true,
                games: [],
                message: 'No recent games found - display mock data as fallback',
                useMockData: true
            });
        }

        return NextResponse.json({
            success: true,
            games: recentGames,
            count: recentGames.length,
            useMockData: false
        });
    } catch (error: any) {
        console.error('Failed to fetch recent games:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            games: [],
            useMockData: true
        });
    }
}

// Helper functions
function formatAmount(amount: string | number | null): string {
    if (!amount) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1e18) return (num / 1e18).toFixed(0); // Wei to GUILT
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
}

function formatSignedAmount(amount: string | number | null): string {
    if (!amount) return '+0';
    const num = parseFloat(String(amount));
    if (num >= 0) return `+${formatAmount(num)}`;
    return `-${formatAmount(Math.abs(num))}`;
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function getAgentFromWallet(wallet: string): string {
    if (!wallet) return 'Unknown Agent';
    // Generate a consistent agent name from wallet
    const hash = wallet.slice(2, 10).toUpperCase();
    const agents = ['The Merchant', 'The Berzerker', 'The Disciple', 'The Prophet', 'The Cardinal'];
    const index = parseInt(hash.slice(0, 2), 16) % agents.length;
    return agents[index];
}

function mapSinTypeToGame(sinType: string): string {
    const lower = sinType.toLowerCase();
    if (lower.includes('greed')) return 'Staking';
    if (lower.includes('wrath')) return 'RPS';
    if (lower.includes('pride')) return 'Debate';
    if (lower.includes('sloth')) return 'Poker';
    return 'Confession';
}

function capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}
