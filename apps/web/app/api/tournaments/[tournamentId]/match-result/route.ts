import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { playMatch, PvPAgent } from '@/lib/services/pvp-rps-engine';

/**
 * POST /api/tournaments/:tournamentId/match-result
 * Record the result of a tournament match and advance bracket
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tournamentId: string }> }
) {
    try {
        const supabase = await createClient();
        const { tournamentId } = await params;
        const body = await request.json();

        const { matchId, gameId } = body;

        // Get the match
        const { data: match, error: matchError } = await supabase
            .from('tournament_brackets')
            .select('*')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json(
                { success: false, error: 'Match not found' },
                { status: 404 }
            );
        }

        // Fetch agents for simulation
        const { data: agents } = await supabase
            .from('agent_sessions')
            .select('*')
            .in('owner_address', [match.player1_wallet, match.player2_wallet]);

        const agent1Data = agents?.find(a => a.owner_address === match.player1_wallet);
        const agent2Data = agents?.find(a => a.owner_address === match.player2_wallet);

        // Default stats if agent not found (fallback)
        const agent1: PvPAgent = {
            id: match.player1_wallet,
            sessionId: agent1Data?.id || 'unknown',
            strategy: agent1Data?.strategy || 'balanced',
            elo: agent1Data?.elo_rating || 1000,
            balance: parseFloat(agent1Data?.total_earnings || '0'),
            gamesPlayed: agent1Data?.total_matches || 0,
            gameHistory: [] // Todo: fetch history if needed for advanced strategies
        };

        const agent2: PvPAgent = {
            id: match.player2_wallet,
            sessionId: agent2Data?.id || 'unknown',
            strategy: agent2Data?.strategy || 'balanced',
            elo: agent2Data?.elo_rating || 1000,
            balance: parseFloat(agent2Data?.total_earnings || '0'),
            gamesPlayed: agent2Data?.total_matches || 0,
            gameHistory: []
        };

        // Simulate Match
        const matchResult = playMatch(matchId, agent1, agent2, 3); // Best of 3
        const resultWinnerId = matchResult.winnerId;

        // Fallback for draw: Pick Random (House rule: pure random if engine draws)
        const finalWinner = resultWinnerId || (Math.random() > 0.5 ? match.player1_wallet : match.player2_wallet);

        // Update match with result
        const { error: updateError } = await supabase
            .from('tournament_brackets')
            .update({
                winner_wallet: finalWinner,
                status: 'completed'
                // game_id removed - column doesn't exist in schema
            })
            .eq('id', matchId);

        if (updateError) {
            console.error('Update Match Error:', updateError);
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 }
            );
        }

        // Check if we need to advance to next round
        let nextMatchScheduled = null;

        if (match.round_number > 1) {
            // Not finals, create/update next round match
            const nextRound = match.round_number - 1;
            const nextBracketNumber = Math.ceil(match.bracket_number / 2);

            // Check if next round match already exists
            const { data: nextMatch } = await supabase
                .from('tournament_brackets')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('round_number', nextRound)
                .eq('bracket_number', nextBracketNumber)
                .single();

            if (nextMatch) {
                // Update existing match with winner
                const updateField = match.bracket_number % 2 === 1 ? 'player1_wallet' : 'player2_wallet';

                await supabase
                    .from('tournament_brackets')
                    .update({ [updateField]: finalWinner })
                    .eq('id', nextMatch.id);
            } else {
                // Create new match for next round
                const { data: newMatch } = await supabase
                    .from('tournament_brackets')
                    .insert({
                        tournament_id: tournamentId,
                        bracket_number: nextBracketNumber,
                        round_number: nextRound,
                        player1_wallet: match.bracket_number % 2 === 1 ? finalWinner : null,
                        player2_wallet: match.bracket_number % 2 === 0 ? finalWinner : null,
                        status: 'pending'
                    })
                    .select()
                    .single();

                if (newMatch) {
                    nextMatchScheduled = newMatch.match_timestamp;
                }
            }
        } else {
            // Finals completed - tournament is over
            await supabase
                .from('tournaments')
                .update({ status: 'completed' })
                .eq('id', tournamentId);

            // Record final result
            await supabase
                .from('tournament_results')
                .insert({
                    tournament_id: tournamentId,
                    rank: 1,
                    wallet_address: finalWinner,
                    games_won: 1,
                    games_played: 1,
                    win_rate: 100.0
                });
        }

        return NextResponse.json({
            success: true,
            matchId,
            winner: finalWinner,
            simulation: matchResult,
            nextRound: match.round_number > 1 ? match.round_number - 1 : null,
            nextMatchScheduled,
            bracketUpdated: true,
            tournamentComplete: match.round_number === 1
        });

    } catch (error: any) {
        console.error('Record Match Result Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
