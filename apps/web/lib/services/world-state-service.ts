import { createPublicClient, http, parseAbi } from 'viem';
import { monadTestnet } from 'viem/chains';
import { VaticanWorldState, LeaderboardEntry, GameState } from '../world-state';
import { redis } from '../../lib/redis';
import { supabase } from '../../lib/db/supabase';

// ABIs
const VATICAN_ENTRY_ABI = parseAbi([
    'function getTotalEntrants() external view returns (uint256)',
    'function entryFee() external view returns (uint256)'
]);

const ERC20_ABI = parseAbi([
    'function balanceOf(address account) external view returns (uint256)'
]);

const JUDAS_ABI = parseAbi([
    'function currentEpoch() external view returns (uint256)',
    'function epochEndTime() external view returns (uint256)',
    'function totalStaked() external view returns (uint256)'
]);

// Config
const client = createPublicClient({
    chain: monadTestnet,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL)
});

const VATICAN_ENTRY_ADDRESS = process.env.NEXT_PUBLIC_VATICAN_ENTRY_ADDRESS as `0x${string}`;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;
const CACHE_KEY = 'vatican-world-state';
const CACHE_TTL = 10; // seconds

export async function getVaticanState(): Promise<VaticanWorldState> {
    try {
        // 1. Check Redis Cache
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }

        // Helper to timeout a promise
        const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
            return Promise.race([
                promise,
                new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
            ]);
        };

        // 2. Fetch On-Chain Data (Parallel) with 5s Timeout
        const [totalEntrants, treasuryBalance] = await Promise.all([
            withTimeout(
                client.readContract({
                    address: VATICAN_ENTRY_ADDRESS,
                    abi: VATICAN_ENTRY_ABI,
                    functionName: 'getTotalEntrants',
                }),
                5000,
                BigInt(0)
            ).catch(err => {
                console.warn("Failed to fetch totalEntrants:", err);
                return BigInt(0);
            }),

            withTimeout(
                client.readContract({
                    address: GUILT_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [VATICAN_ENTRY_ADDRESS]
                }),
                5000,
                BigInt(0)
            ).catch(err => {
                console.warn("Failed to fetch treasuryBalance:", err);
                return BigInt(0);
            })
        ]);

        // 3. Fetch Database Data (Parallel via HTTPS/Supabase)
        const [
            { data: topSinnersRaw },
            { data: topSaintsRaw },
            { data: activeGamesRaw },
            { count: recentConfessionsCount },
            { data: betrayalStatsRaw }
        ] = await Promise.all([
            // Top Sinners
            supabase
                .from('leaderboard_entries')
                .select('wallet_address, score')
                .eq('category', 'Sinner')
                .order('score', { ascending: false })
                .limit(10),
            // Top Saints
            supabase
                .from('leaderboard_entries')
                .select('wallet_address, score')
                .eq('category', 'Saint')
                .order('score', { ascending: false })
                .limit(10),
            // Active Games
            supabase
                .from('games')
                .select('id, player1, player2, status, gameType, wager, createdAt')
                .eq('status', 'active')
                .order('createdAt', { ascending: false })
                .limit(50),
            // Recent Confessions (last 24h)
            supabase
                .from('confessions')
                .select('*', { count: 'exact', head: true })
                .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
            // Betrayal Stats (Events count) - GroupBy not directly supported in simple client, fetching raw events
            // Limitation: We fetch raw events and aggregate in memory or use RPC if available.
            // For now, let's fetch all relevant world events and count.
            supabase
                .from('world_events')
                .select('eventType')
                .in('eventType', ['betray', 'stake'])
        ]);

        // 4. Process Data
        const topSinners: LeaderboardEntry[] = (topSinnersRaw || []).map((p: any, i: number) => ({
            rank: i + 1,
            agentAddress: p.wallet_address,
            score: p.score
        }));

        const topSaints: LeaderboardEntry[] = (topSaintsRaw || []).map((p: any, i: number) => ({
            rank: i + 1,
            agentAddress: p.wallet_address,
            score: p.score
        }));

        const activeGames: GameState[] = (activeGamesRaw || []).map((g: any) => ({
            id: g.id,
            players: [g.player1, g.player2],
            status: g.status as "pending" | "active" | "completed",
            type: g.gameType as 'RPS' | 'Poker',
            wager: g.wager
        }));

        // Calculate Betrayal Percentage
        const betrayalEvents = (betrayalStatsRaw || []) as any[];
        const betrayalCount = betrayalEvents.filter(e => e.eventType === 'betray').length;
        const stakeCount = betrayalEvents.filter(e => e.eventType === 'stake').length;
        const totalActions = betrayalCount + stakeCount;
        const betrayalPercentage = totalActions > 0
            ? (betrayalCount / totalActions) * 100
            : 0;

        const state: VaticanWorldState = {
            currentPontiff: "Zealot", // Personality
            treasuryBalance: treasuryBalance.toString(),
            totalEntrants: Number(totalEntrants),

            currentEpoch: 1, // To be fetched from Judas contract later
            epochTimeRemaining: 3600, // Dummy for now
            betrayalPercentage: Number(betrayalPercentage.toFixed(2)),

            activeGames,
            recentConfessions: recentConfessionsCount || 0,

            topSinners,
            topSaints,

            lastUpdated: new Date().toISOString()
        };

        // 5. Cache Result
        await redis.set(CACHE_KEY, JSON.stringify(state), 'EX', CACHE_TTL);

        return state;
    } catch (error) {
        console.error("Failed to fetch Vatican state:", error);
        // Fallback to previous behavior or throw
        throw error;
    }
}
