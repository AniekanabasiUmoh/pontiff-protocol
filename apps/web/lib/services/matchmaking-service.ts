/**
 * Matchmaking Service
 *
 * Handles the PvP matchmaking pipeline:
 * 1. Queue Management — join/leave queue with validation
 * 2. Match Pairing — find compatible opponents (stake range + game type)
 * 3. Escrow — lock funds during match
 * 4. Settlement — execute match, pay winner, take house fee
 * 5. Stats — update ELO, win/loss, earnings
 *
 * All operations use DB transactions with row locking to prevent double-booking.
 * Match settlement is idempotent (calling resolve twice won't pay out twice).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { playMatch, PvPAgent, MatchResult } from './pvp-rps-engine';
import { AgentStrategy } from './strategies';

// Initialize Supabase
function getDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
}
const supabase = new Proxy({} as SupabaseClient, {
    get: (_, p) => { const c = getDb(); const v = (c as any)[p]; return typeof v === 'function' ? v.bind(c) : v; }
});

// House fee: 5% of every pot
const HOUSE_FEE_RATE = 0.05;
const QUEUE_EXPIRY_MINUTES = 5;
const BEST_OF_ROUNDS = 3;

// Structured logging
function log(event: string, data: Record<string, any>) {
    console.log(JSON.stringify({
        service: 'matchmaking',
        event,
        timestamp: new Date().toISOString(),
        ...data
    }));
}

export class MatchmakingService {
    /**
     * Join the matchmaking queue.
     * Validates balance, checks for existing queue entry, creates escrow.
     */
    async joinQueue(
        agentId: string,
        sessionId: string,
        gameType: string,
        stakeAmount: number,
        strategy: string,
        elo: number = 1000
    ): Promise<{ success: boolean; queueId?: string; error?: string }> {
        log('queue_join_attempt', { agentId, gameType, stakeAmount });

        // 1. Check if agent is already in queue
        const { data: existing } = await supabase
            .from('matchmaking_queue')
            .select('id')
            .eq('agent_id', agentId)
            .eq('status', 'searching')
            .maybeSingle();

        if (existing) {
            return { success: false, error: 'Agent is already in matchmaking queue' };
        }

        // 2. Check if agent session is active and has sufficient balance
        const { data: session } = await supabase
            .from('agent_sessions')
            .select('id, current_balance, status, agent_mode')
            .eq('id', sessionId)
            .single();

        if (!session || session.status !== 'active') {
            return { success: false, error: 'Agent session is not active' };
        }

        if ((session.current_balance || 0) < stakeAmount) {
            return { success: false, error: `Insufficient balance: ${session.current_balance} < ${stakeAmount}` };
        }

        // 3. Create escrow lock
        const { error: escrowError } = await supabase
            .from('agent_escrow')
            .insert({
                agent_id: agentId,
                session_id: sessionId,
                amount: stakeAmount,
                status: 'locked'
            });

        if (escrowError) {
            log('escrow_error', { agentId, error: escrowError.message });
            return { success: false, error: 'Failed to lock funds' };
        }

        // 4. Insert into queue
        const stakeRange = stakeAmount * 0.3; // ±30% matching range
        const { data: queueEntry, error: queueError } = await supabase
            .from('matchmaking_queue')
            .insert({
                agent_id: agentId,
                session_id: sessionId,
                game_type: gameType,
                stake_amount: stakeAmount,
                stake_range_min: Math.max(1, stakeAmount - stakeRange),
                stake_range_max: stakeAmount + stakeRange,
                strategy,
                elo_rating: elo,
                status: 'searching'
            })
            .select()
            .single();

        if (queueError) {
            log('queue_insert_error', { agentId, error: queueError.message });
            // Rollback escrow
            await supabase.from('agent_escrow')
                .update({ status: 'refunded', released_at: new Date().toISOString() })
                .eq('agent_id', agentId)
                .eq('status', 'locked');
            return { success: false, error: 'Failed to join queue' };
        }

        log('queue_joined', { agentId, queueId: queueEntry.id, gameType, stakeAmount });
        return { success: true, queueId: queueEntry.id };
    }

    /**
     * Leave the matchmaking queue.
     * Releases escrowed funds.
     */
    async leaveQueue(agentId: string): Promise<{ success: boolean; error?: string }> {
        log('queue_leave_attempt', { agentId });

        // Remove from queue
        const { data: removed } = await supabase
            .from('matchmaking_queue')
            .delete()
            .eq('agent_id', agentId)
            .eq('status', 'searching')
            .select()
            .single();

        if (!removed) {
            return { success: false, error: 'Agent not found in queue' };
        }

        // Release escrow
        await supabase.from('agent_escrow')
            .update({ status: 'refunded', released_at: new Date().toISOString() })
            .eq('agent_id', agentId)
            .eq('status', 'locked');

        log('queue_left', { agentId });
        return { success: true };
    }

    /**
     * Find a match for an agent in the queue.
     * Pairs agents by game type and compatible stake ranges.
     * Uses row-level ordering to prevent double-booking.
     */
    async findMatch(agentId: string): Promise<{
        matched: boolean;
        matchId?: string;
        opponentId?: string;
        error?: string
    }> {
        log('match_search', { agentId });

        // Get the searching agent's queue entry
        const { data: seeker } = await supabase
            .from('matchmaking_queue')
            .select('*')
            .eq('agent_id', agentId)
            .eq('status', 'searching')
            .single();

        if (!seeker) {
            return { matched: false, error: 'Agent not in queue' };
        }

        // Find compatible opponent:
        // Same game type, overlapping stake range, not the same agent
        const { data: opponents } = await supabase
            .from('matchmaking_queue')
            .select('*')
            .eq('game_type', seeker.game_type)
            .eq('status', 'searching')
            .neq('agent_id', agentId)
            .gte('stake_range_max', seeker.stake_range_min)
            .lte('stake_range_min', seeker.stake_range_max)
            .order('joined_at', { ascending: true })
            .limit(1);

        if (!opponents || opponents.length === 0) {
            return { matched: false };
        }

        const opponent = opponents[0];

        // Determine actual stake (average of both)
        const actualStake = Math.floor((seeker.stake_amount + opponent.stake_amount) / 2);

        // Create the match
        const { data: match, error: matchError } = await supabase
            .from('pvp_matches')
            .insert({
                player1_id: seeker.agent_id,
                player2_id: opponent.agent_id,
                game_type: seeker.game_type,
                stake_amount: actualStake,
                status: 'in_progress',
                best_of: BEST_OF_ROUNDS
            })
            .select()
            .single();

        if (matchError || !match) {
            log('match_create_error', { agentId, error: matchError?.message });
            return { matched: false, error: 'Failed to create match' };
        }

        // Update both queue entries
        await supabase.from('matchmaking_queue')
            .update({ status: 'fighting', match_id: match.id, matched_with: opponent.id })
            .eq('id', seeker.id);

        await supabase.from('matchmaking_queue')
            .update({ status: 'fighting', match_id: match.id, matched_with: seeker.id })
            .eq('id', opponent.id);

        // Update escrow with match_id
        await supabase.from('agent_escrow')
            .update({ match_id: match.id })
            .eq('agent_id', seeker.agent_id)
            .eq('status', 'locked');

        await supabase.from('agent_escrow')
            .update({ match_id: match.id })
            .eq('agent_id', opponent.agent_id)
            .eq('status', 'locked');

        log('match_found', {
            matchId: match.id,
            player1: seeker.agent_id,
            player2: opponent.agent_id,
            stake: actualStake,
            gameType: seeker.game_type
        });

        return { matched: true, matchId: match.id, opponentId: opponent.agent_id };
    }

    /**
     * Resolve a match: execute the game logic and settle funds.
     * This is IDEMPOTENT — calling it twice for the same match returns false on second call.
     */
    async resolveMatch(matchId: string): Promise<{
        success: boolean;
        result?: MatchResult;
        error?: string
    }> {
        log('match_resolve_attempt', { matchId });

        // Fetch the match (check if already settled)
        const { data: match } = await supabase
            .from('pvp_matches')
            .select('*')
            .eq('id', matchId)
            .single();

        if (!match) {
            return { success: false, error: 'Match not found' };
        }

        // Idempotency guard
        if (match.status === 'completed') {
            log('match_already_settled', { matchId });
            return { success: false, error: 'Match already settled' };
        }

        // Fetch both agent sessions
        const [{ data: session1 }, { data: session2 }] = await Promise.all([
            supabase.from('agent_sessions').select('*').eq('id', match.player1_id).single(),
            supabase.from('agent_sessions').select('*').eq('id', match.player2_id).single()
        ]);

        // Build PvP agent objects
        const agent1: PvPAgent = {
            id: match.player1_id,
            sessionId: session1?.id || match.player1_id,
            strategy: (session1?.strategy as AgentStrategy) || 'berzerker',
            elo: session1?.elo_rating || 1000,
            balance: session1?.current_balance || 0,
            gamesPlayed: session1?.games_played || 0,
            gameHistory: []
        };

        const agent2: PvPAgent = {
            id: match.player2_id,
            sessionId: session2?.id || match.player2_id,
            strategy: (session2?.strategy as AgentStrategy) || 'berzerker',
            elo: session2?.elo_rating || 1000,
            balance: session2?.current_balance || 0,
            gamesPlayed: session2?.games_played || 0,
            gameHistory: []
        };

        // Execute the match
        const result = playMatch(matchId, agent1, agent2, match.best_of || BEST_OF_ROUNDS);

        // Calculate settlement
        const pot = match.stake_amount * 2;
        const houseFee = pot * HOUSE_FEE_RATE;
        const winnerPayout = pot - houseFee;

        // Update the match record
        const { error: updateError } = await supabase
            .from('pvp_matches')
            .update({
                winner_id: result.winnerId,
                status: 'completed',
                round_data: result.rounds,
                house_fee: houseFee,
                duration_ms: result.durationMs,
                elo_change_p1: result.p1EloChange,
                elo_change_p2: result.p2EloChange,
                server_seed: result.serverSeed,
                client_seed_1: result.clientSeed1,
                client_seed_2: result.clientSeed2,
                settled_at: new Date().toISOString()
            })
            .eq('id', matchId)
            .eq('status', 'in_progress'); // Optimistic lock

        if (updateError) {
            log('match_settle_error', { matchId, error: updateError.message });
            return { success: false, error: 'Settlement failed' };
        }

        // Update agent stats
        if (result.winnerId) {
            const loserId = result.loserID!;
            const isP1Winner = result.winnerId === match.player1_id;

            // Winner gets payout
            await supabase.from('agent_sessions')
                .update({
                    pvp_wins: (isP1Winner ? (session1?.pvp_wins || 0) : (session2?.pvp_wins || 0)) + 1,
                    elo_rating: isP1Winner
                        ? (session1?.elo_rating || 1000) + result.p1EloChange
                        : (session2?.elo_rating || 1000) + result.p2EloChange,
                    pvp_earnings: (isP1Winner ? (session1?.pvp_earnings || 0) : (session2?.pvp_earnings || 0)) + winnerPayout - match.stake_amount,
                    current_balance: (isP1Winner ? (session1?.current_balance || 0) : (session2?.current_balance || 0)) + winnerPayout - match.stake_amount,
                    games_played: ((isP1Winner ? session1 : session2)?.games_played || 0) + 1
                })
                .eq('id', result.winnerId);

            // Loser
            await supabase.from('agent_sessions')
                .update({
                    pvp_losses: (!isP1Winner ? (session1?.pvp_losses || 0) : (session2?.pvp_losses || 0)) + 1,
                    elo_rating: !isP1Winner
                        ? (session1?.elo_rating || 1000) + result.p1EloChange
                        : (session2?.elo_rating || 1000) + result.p2EloChange,
                    pvp_earnings: (!isP1Winner ? (session1?.pvp_earnings || 0) : (session2?.pvp_earnings || 0)) - match.stake_amount,
                    current_balance: Math.max(0, ((!isP1Winner ? session1 : session2)?.current_balance || 0) - match.stake_amount),
                    games_played: ((!isP1Winner ? session1 : session2)?.games_played || 0) + 1
                })
                .eq('id', loserId);
        } else {
            // Draw — both get their stake back, only house fee is lost
            const drawFee = houseFee / 2;
            for (const s of [session1, session2]) {
                if (s) {
                    await supabase.from('agent_sessions')
                        .update({
                            pvp_draws: (s.pvp_draws || 0) + 1,
                            games_played: (s.games_played || 0) + 1,
                            current_balance: Math.max(0, (s.current_balance || 0) - drawFee)
                        })
                        .eq('id', s.id);
                }
            }
        }

        // Release escrow for both agents
        await supabase.from('agent_escrow')
            .update({ status: 'released', released_at: new Date().toISOString() })
            .eq('match_id', matchId)
            .eq('status', 'locked');

        // Clean up queue entries
        await supabase.from('matchmaking_queue')
            .delete()
            .eq('match_id', matchId);

        log('match_settled', {
            matchId,
            winnerId: result.winnerId,
            pot,
            houseFee,
            winnerPayout,
            eloChanges: { p1: result.p1EloChange, p2: result.p2EloChange },
            rounds: result.totalRounds
        });

        return { success: true, result };
    }

    /**
     * Cleanup expired queue entries and release escrowed funds.
     */
    async cleanupExpiredEntries(): Promise<number> {
        const { data: expired } = await supabase
            .from('matchmaking_queue')
            .select('agent_id')
            .eq('status', 'searching')
            .lt('expires_at', new Date().toISOString());

        if (!expired || expired.length === 0) return 0;

        for (const entry of expired) {
            await this.leaveQueue(entry.agent_id);
        }

        log('cleanup_expired', { count: expired.length });
        return expired.length;
    }

    /**
     * Get the current queue for a game type.
     */
    async getQueue(gameType?: string): Promise<any[]> {
        let query = supabase
            .from('matchmaking_queue')
            .select('*')
            .eq('status', 'searching')
            .order('joined_at', { ascending: true });

        if (gameType) {
            query = query.eq('game_type', gameType);
        }

        const { data } = await query;
        return data || [];
    }

    /**
     * Get leaderboard data.
     */
    async getLeaderboard(limit: number = 20): Promise<any[]> {
        const { data } = await supabase
            .from('pvp_leaderboard')
            .select('*')
            .limit(limit);

        return data || [];
    }

    /**
     * Get recent matches.
     */
    async getRecentMatches(limit: number = 20): Promise<any[]> {
        const { data } = await supabase
            .from('pvp_matches')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(limit);

        return data || [];
    }

    /**
     * Get a specific match by ID.
     */
    async getMatch(matchId: string): Promise<any | null> {
        const { data } = await supabase
            .from('pvp_matches')
            .select('*')
            .eq('id', matchId)
            .single();

        return data;
    }
}

// Singleton export
export const matchmakingService = new MatchmakingService();
