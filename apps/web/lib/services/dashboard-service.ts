import { supabase } from '@/lib/db/supabase';

export interface DashboardMetrics {
    totalEntrants: number;
    treasuryBalance: string;
    activeGamesCount: number;
    conversionsCount: number;
    crusadesCount: number;
    winRate: string;
}

export interface RecentActivity {
    id: string;
    type: string;
    description: string;
    timestamp: Date;
}

export class DashboardService {
    static async getMetrics(): Promise<DashboardMetrics> {
        // Parallel fetch for simplified stats
        const [
            { count: entrants },
            { count: activeGames },
            { count: conversions },
            { count: crusades },
            { data: games }
        ] = await Promise.all([
            supabase.from('vatican_entrants').select('*', { count: 'exact', head: true }),
            supabase.from('games').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('conversions').select('*', { count: 'exact', head: true }),
            supabase.from('crusades').select('*', { count: 'exact', head: true }),
            supabase.from('games').select('winner').eq('status', 'completed')
        ]);

        const entrantsCount = entrants || 0;
        const activeGamesCount = activeGames || 0;
        const conversionsCount = conversions || 0;
        const crusadesCount = crusades || 0;
        const completedGames = games || [];

        // Calculate Win Rate (Pontiff vs Heretics)
        let pontiffWins = 0;
        completedGames.forEach(g => {
            // Check winner logic based on game type or recorded winner
            if (g.winner === 'ThePontiff') pontiffWins++;
        });
        const winRate = completedGames.length > 0 ? ((pontiffWins / completedGames.length) * 100).toFixed(1) : "0.0";

        // Mock Treasury for now (or fetch from on-chain state service if ready)
        // 1 Entrant = 10 MON
        // 1 Indulgence = 0.01 MON (Varied)
        // Wagers...
        // Approximate: 1000 + (Entrants * 10)
        const treasury = (1000 + (entrantsCount * 10)).toString();

        return {
            totalEntrants: entrantsCount,
            treasuryBalance: treasury,
            activeGamesCount: activeGamesCount,
            conversionsCount: conversionsCount,
            crusadesCount: crusadesCount,
            winRate: `${winRate}%`
        };
    }

    static async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
        const { data: events, error } = await supabase
            .from('world_events')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("[Dashboard] Recent activity fetch failed:", error);
            return [];
        }

        return (events || []).map(e => {
            let desc = "";
            const data: any = e.eventData || {};

            switch (e.eventType) {
                case 'enter': desc = `Entrant ${e.agentWallet.slice(0, 6)} paid the toll.`; break;
                case 'confess': desc = `Sinner ${e.agentWallet.slice(0, 6)} confessed sins.`; break;
                case 'challenge': desc = `Heretic accepted a ${data.gameType} challenge.`; break;
                case 'agent_converted': desc = `Agent ${data.agent} converted via ${data.method}!`; break;
                default: desc = `${e.eventType} event recorded.`;
            }

            return {
                id: e.id,
                type: e.eventType,
                description: desc,
                timestamp: new Date(e.timestamp) // Ensure Date object
            };
        });
    }
}
