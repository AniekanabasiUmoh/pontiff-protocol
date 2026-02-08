import { redis } from '../redis';
import { supabase } from '../db/supabase';

/**
 * Module 11: WebSocket Event Publisher
 *
 * Publishes events to Redis channels for WebSocket broadcasting
 */

export class WebSocketPublisher {
    /**
     * Publish game completion event
     */
    static async publishGameEvent(gameData: {
        gameId: string;
        player1: string;
        player2: string;
        gameType: 'RPS' | 'POKER' | 'JUDAS' | 'DEBATE';
        result: string;
        wager: string;
        payout?: string;
        winner?: string;
    }) {
        try {
            const event = {
                ...gameData,
                timestamp: new Date().toISOString()
            };

            // Publish to Redis
            await redis.publish('game-updates', JSON.stringify(event));
            console.log('[WebSocket Publisher] Game event published:', gameData.gameId);

            // Store in live_events table
            await supabase.from('live_events').insert({
                event_type: 'game_complete',
                event_data: event,
                broadcast_at: new Date().toISOString(),
                ttl: 300
            });

        } catch (error) {
            console.error('[WebSocket Publisher] Failed to publish game event:', error);
        }
    }

    /**
     * Publish leaderboard update event
     */
    static async publishLeaderboardUpdate(category: 'Saint' | 'Sinner' | 'Heretic') {
        try {
            // Fetch top 10 for the category
            const { data: entries, error } = await supabase
                .from('leaderboard_entries')
                .select('wallet_address, score')
                .eq('category', category)
                .order('score', { ascending: false })
                .limit(10);

            if (error) {
                console.error('[WebSocket Publisher] Failed to fetch leaderboard:', error);
                return;
            }

            const event = {
                category,
                topEntries: (entries || []).map((entry, index) => ({
                    rank: index + 1,
                    address: entry.wallet_address,
                    score: entry.score
                })),
                timestamp: new Date().toISOString()
            };

            // Publish to Redis
            await redis.publish('leaderboard-updates', JSON.stringify(event));
            console.log('[WebSocket Publisher] Leaderboard update published:', category);

            // Store in live_events table
            await supabase.from('live_events').insert({
                event_type: 'leaderboard_update',
                event_data: event,
                broadcast_at: new Date().toISOString(),
                ttl: 300
            });

        } catch (error) {
            console.error('[WebSocket Publisher] Failed to publish leaderboard update:', error);
        }
    }

    /**
     * Publish debate result event
     */
    static async publishDebateResult(debateData: {
        debateId: number;
        winner: 'pontiff' | 'competitor';
        pontiffScore: number;
        competitorScore: number;
        reasoning?: string;
    }) {
        try {
            const event = {
                ...debateData,
                timestamp: new Date().toISOString()
            };

            // Publish to Redis
            await redis.publish('debate-results', JSON.stringify(event));
            console.log('[WebSocket Publisher] Debate result published:', debateData.debateId);

            // Store in live_events table
            await supabase.from('live_events').insert({
                event_type: 'debate_result',
                event_data: event,
                broadcast_at: new Date().toISOString(),
                ttl: 300
            });

        } catch (error) {
            console.error('[WebSocket Publisher] Failed to publish debate result:', error);
        }
    }

    /**
     * Publish world state update event
     */
    static async publishWorldStateUpdate(worldState: {
        treasuryBalance: string;
        totalEntrants: number;
        activeGames: number;
        betrayalPercentage: number;
    }) {
        try {
            const event = {
                ...worldState,
                timestamp: new Date().toISOString()
            };

            // Publish to Redis
            await redis.publish('world-state-updates', JSON.stringify(event));
            console.log('[WebSocket Publisher] World state update published');

            // Store in live_events table
            await supabase.from('live_events').insert({
                event_type: 'world_state_update',
                event_data: event,
                broadcast_at: new Date().toISOString(),
                ttl: 60 // Shorter TTL for frequent updates
            });

        } catch (error) {
            console.error('[WebSocket Publisher] Failed to publish world state update:', error);
        }
    }

    /**
     * Publish conversion event (Agent converted to The Pontiff)
     */
    static async publishConversionEvent(conversionData: {
        agentHandle: string;
        conversionType: string;
        amount?: string;
        nftMinted?: boolean;
    }) {
        try {
            const event = {
                ...conversionData,
                timestamp: new Date().toISOString()
            };

            // Publish to Redis (use game-updates channel for general feed)
            await redis.publish('game-updates', JSON.stringify({
                gameId: `conversion-${Date.now()}`,
                player1: 'ThePontiff',
                player2: conversionData.agentHandle,
                gameType: 'DEBATE',
                result: 'CONVERSION',
                wager: conversionData.amount || '0',
                timestamp: event.timestamp
            }));

            console.log('[WebSocket Publisher] Conversion event published:', conversionData.agentHandle);

            // Store in live_events table
            await supabase.from('live_events').insert({
                event_type: 'conversion',
                event_data: event,
                broadcast_at: new Date().toISOString(),
                ttl: 300
            });

        } catch (error) {
            console.error('[WebSocket Publisher] Failed to publish conversion event:', error);
        }
    }

    /**
     * Clean up old events (called periodically)
     */
    static async cleanupOldEvents() {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

            const { error } = await supabase
                .from('live_events')
                .delete()
                .lt('broadcast_at', oneHourAgo);

            if (error) {
                console.error('[WebSocket Publisher] Failed to cleanup old events:', error);
            } else {
                console.log('[WebSocket Publisher] Old events cleaned up');
            }

        } catch (error) {
            console.error('[WebSocket Publisher] Cleanup error:', error);
        }
    }
}
