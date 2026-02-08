/**
 * API Route for Unified Dashboard (Module 12)
 * Aggregates data from all systems for the Vatican Command Deck
 */

import express from 'express';
import { supabase } from '../utils/database';
import { getAllCompetitorAgents } from '../services/agent-detection';
import { getAllDebates } from '../services/debate';
import { getAllConversions, getConversionStats } from '../services/conversion-tracking';

const router = express.Router();

/**
 * GET /api/dashboard
 * Get unified dashboard data
 */
router.get('/', async (req, res) => {
    try {
        // Fetch all necessary data in parallel
        const [
            competitors,
            debates,
            conversions,
            conversionStats,
            worldEvents,
            games,
            crusades
        ] = await Promise.all([
            getAllCompetitorAgents(),
            getAllDebates(),
            getAllConversions(),
            getConversionStats(),
            getWorldEvents(50), // Last 50 events
            getGames(),
            getCrusades()
        ]);

        // Calculate metrics
        const totalEntrants = await getTotalEntrants();
        const treasuryBalance = await getTreasuryBalance();
        const activeGamesCount = games.filter(g => g.status === 'active').length;
        const completedGamesCount = games.filter(g => g.status === 'completed').length;
        const winRate = calculateWinRate(games);

        const metrics = {
            totalEntrants,
            treasuryBalance,
            activeGamesCount,
            completedGamesCount,
            conversionsCount: conversionStats.verified,
            totalConversions: conversionStats.total,
            winRate: `${winRate.toFixed(1)}%`,
            competitorsDetected: competitors.length,
            activeDebates: debates.filter(d => d.status === 'active').length,
            totalDebates: debates.length,
            activeCrusades: crusades.filter(c => c.status === 'active').length
        };

        // Format activity feed
        const activity = worldEvents.map(event => ({
            id: event.id,
            type: event.event_type,
            description: event.description,
            timestamp: event.timestamp,
            data: event.event_data
        }));

        // Active games for widget
        const activeGames = games
            .filter(g => g.status === 'active')
            .slice(0, 5)
            .map(g => ({
                id: g.id,
                gameType: g.game_type,
                opponent: g.player1 !== process.env.PONTIFF_WALLET ? g.player1 : g.player2,
                wager: g.wager,
                status: g.status
            }));

        // Recent debates for widget
        const recentDebates = debates
            .filter(d => d.status === 'active')
            .slice(0, 5)
            .map(d => ({
                id: d.id,
                competitor: competitors.find(c => c.id === d.competitor_agent_id),
                exchanges: d.exchanges,
                lastExchange: d.last_exchange_at
            }));

        // Leaderboards
        const leaderboards = await getLeaderboards();

        res.json({
            success: true,
            metrics,
            activity,
            activeGames,
            recentDebates,
            leaderboards,
            conversions: conversions.slice(0, 10), // Last 10 conversions
            competitors: competitors.slice(0, 5) // Top 5 by threat level
        });
    } catch (error: any) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get world events (activity feed)
 */
async function getWorldEvents(limit: number = 50) {
    const { data, error } = await supabase
        .from('world_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching world events:', error);
        return [];
    }

    return data || [];
}

/**
 * Get games
 */
async function getGames() {
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching games:', error);
        return [];
    }

    return data || [];
}

/**
 * Get crusades
 */
async function getCrusades() {
    const { data, error } = await supabase
        .from('Crusade')
        .select('*')
        .order('startTime', { ascending: false });

    if (error) {
        console.error('Error fetching crusades:', error);
        return [];
    }

    return data || [];
}

/**
 * Get total Vatican entrants
 */
async function getTotalEntrants() {
    // Count unique wallets from confessions or a vatican_entrants table
    const { count, error } = await supabase
        .from('confessions')
        .select('wallet_address', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting entrants:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Get treasury balance (mock for now - should query blockchain)
 */
async function getTreasuryBalance() {
    // TODO: Query actual GUILT token balance from blockchain
    // For now, return mock data
    return '125000';
}

/**
 * Calculate win rate from games
 */
function calculateWinRate(games: any[]): number {
    const pontiffWallet = process.env.PONTIFF_WALLET || '';
    const completedGames = games.filter(g => g.status === 'completed');

    if (completedGames.length === 0) return 0;

    const wins = completedGames.filter(g => g.winner === pontiffWallet).length;
    return (wins / completedGames.length) * 100;
}

/**
 * Get leaderboards
 */
async function getLeaderboards() {
    // Top Sinners (Lowest Score / Sinner Category)
    const { data: sinners } = await supabase
        .from('leaderboard_entries')
        .select('*') // Select all columns to map correctly
        .or('category.eq.Sinner,score.lt.0') // Sinners or negative score
        .order('score', { ascending: true }) // Ascending because sinners have negative scores? Or just lowest.
        .limit(5);

    // Top Saints (Highest Score / Saint Category)
    const { data: saints } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('category', 'Saint')
        .order('score', { ascending: false })
        .limit(5);

    // Top Heretics (Heretic Category)
    const { data: heretics } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('category', 'Heretic')
        .order('metadata->totalBetrayals', { ascending: false }) // Order by betrayals? Or score. Service sets category based on betrayals.
        .limit(5);

    // Map to Dashboard Interface if needed, but dashboard just passes it through.
    // The widget expects { wallet_address, score, amount? }.
    // Our leaderboard_entries has { wallet_address, score, metadata }.
    // We should map 'amount' from score or metadata if needed for UI "GUILT" display.

    const mapEntry = (e: any) => ({
        wallet_address: e.wallet_address,
        score: e.score,
        amount: e.score // Use score as amount for now
    });

    return {
        topSinners: (sinners || []).map(mapEntry),
        topSaints: (saints || []).map(mapEntry),
        topHeretics: (heretics || []).map(mapEntry)
    };
}

export default router;
