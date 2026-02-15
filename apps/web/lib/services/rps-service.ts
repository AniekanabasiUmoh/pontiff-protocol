import { createServerSupabase } from '@/lib/db/supabase-server';
import { WorldEventType } from './world-event-service';

/**
 * ROCK = 1, PAPER = 2, SCISSORS = 3
 */
export type Move = 1 | 2 | 3;

// Strategy cache to prevent slow DB lookups on every request
interface StrategyCache {
    accountId: string;
    moveDistribution: { 1: number; 2: number; 3: number };
    moveCounts: { 1: number; 2: number; 3: number };
    totalGames: number;
    lastUpdate: number;
}
const strategyCache: Map<string, StrategyCache> = new Map();

// Cache cleanup interval (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    for (const [key, value] of strategyCache.entries()) {
        if (now - value.lastUpdate > maxAge) {
            strategyCache.delete(key);
        }
    }
}, 5 * 60 * 1000);

export async function determinePontiffMove(opponentAddress: string): Promise<Move> {
    const supabase = createServerSupabase();
    const startTime = Date.now();
    try {
        // 1. Check Cache (<500ms requirement)
        const cached = strategyCache.get(opponentAddress);
        if (cached && Date.now() - cached.lastUpdate < 30000) { // 30s TTL for better performance
            console.log(`[RPS Cache Hit] ${opponentAddress} - ${Date.now() - startTime}ms`);
            return selectMoveFromDistribution(cached.moveDistribution);
        }

        // 2. Fetch Opponent History (with timeout for <500ms requirement)
        const fetchTimeout = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout')), 400)
        );

        const fetchGames = supabase
            .from('games')
            .select('result, game_data')
            .eq('player1', opponentAddress)
            .eq('game_type', 'RPS')
            .eq('status', 'Completed')
            .order('created_at', { ascending: false })
            .limit(20);

        let pastGames: any[] = [];
        try {
            const { data, error } = await Promise.race([fetchGames, fetchTimeout]) as any;
            if (error) throw error;
            pastGames = data || [];
        } catch (fetchError) {
            console.warn(`[RPS] Fetch timeout or error for ${opponentAddress}, using cache or random`);
            // If we have old cache data, use it even if expired
            if (cached) {
                return selectMoveFromDistribution(cached.moveDistribution);
            }
            return getRandomMove();
        }

        // 3. Frequency Analysis (Pattern matching)
        const moveCounts: { 1: number; 2: number; 3: number } = { 1: 0, 2: 0, 3: 0 };
        let total = 0;

        pastGames.forEach(game => {
            // Try multiple data sources for move
            const result = game.result as any;
            const gameData = game.game_data as any;

            let playerMove: Move | null = null;

            // Check result.playerMove
            if (result?.playerMove) {
                playerMove = result.playerMove;
            }
            // Check game_data.playerMove
            else if (gameData?.playerMove) {
                playerMove = gameData.playerMove;
            }
            // Check game_data.moves array
            else if (gameData?.moves?.length > 0) {
                playerMove = gameData.moves[gameData.moves.length - 1]?.playerMove;
            }

            if (playerMove && [1, 2, 3].includes(playerMove)) {
                moveCounts[playerMove as Move]++;
                total++;
            }
        });

        console.log(`[RPS Analysis] ${opponentAddress}: Total games=${total}, Counts=`, moveCounts);

        // 4. Determine Strategy
        let distribution = { 1: 0.33, 2: 0.33, 3: 0.34 }; // Default random

        if (total > 0) {
            // Predict what opponent will likely play
            // If they play Rock 60% of time, they are likely to play Rock again.
            // So we should play Paper.

            const rockProb = moveCounts[1] / total;
            const paperProb = moveCounts[2] / total;
            const scissorsProb = moveCounts[3] / total;

            // Counter strategy:
            // If they play Rock -> We want Paper (2)
            // If they play Paper -> We want Scissors (3)
            // If they play Scissors -> We want Rock (1)

            // We weigh our moves based on the probability of THEIR moves
            distribution = {
                1: scissorsProb, // Play Rock if they play Scissors
                2: rockProb,     // Play Paper if they play Rock
                3: paperProb     // Play Scissors if they play Paper
            };
        }

        // 5. Update Cache
        strategyCache.set(opponentAddress, {
            accountId: opponentAddress,
            moveDistribution: distribution,
            moveCounts: moveCounts,
            totalGames: total,
            lastUpdate: Date.now()
        });

        const totalTime = Date.now() - startTime;
        console.log(`[RPS Strategy] ${opponentAddress} computed in ${totalTime}ms`);

        return selectMoveFromDistribution(distribution);

    } catch (error) {
        console.error("Failed to determine strategy:", error);
        return getRandomMove();
    }
}

function selectMoveFromDistribution(dist: { 1: number; 2: number; 3: number }): Move {
    const rand = Math.random();
    // Normalize if needed, but assuming sum ~ 1
    const threshold1 = dist[1];
    const threshold2 = dist[1] + dist[2];

    if (rand < threshold1) return 1;
    if (rand < threshold2) return 2;
    return 3;
}

function getRandomMove(): Move {
    const random = Math.random();
    if (random < 0.33) return 1;
    if (random < 0.66) return 2;
    return 3;
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
    return {
        size: strategyCache.size,
        entries: Array.from(strategyCache.entries()).map(([address, data]) => ({
            address,
            totalGames: data.totalGames,
            moveCounts: data.moveCounts,
            distribution: data.moveDistribution,
            age: Date.now() - data.lastUpdate
        }))
    };
}

/**
 * Clear the strategy cache (useful for testing or admin operations)
 */
export function clearCache(address?: string) {
    if (address) {
        strategyCache.delete(address);
    } else {
        strategyCache.clear();
    }
}
