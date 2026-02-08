import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

        const { matchId, winner, gameId } = body;

        if (!matchId || !winner) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: matchId, winner' },
                { status: 400 }
            );
        }

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

        // Validate winner is one of the players
        if (winner !== match.player1_wallet && winner !== match.player2_wallet) {
            return NextResponse.json(
                { success: false, error: 'Winner must be one of the match participants' },
                { status: 400 }
            );
        }

        // Update match with result
        const { error: updateError } = await supabase
            .from('tournament_brackets')
            .update({
                winner_wallet: winner,
                status: 'completed',
                game_id: gameId
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
                    .update({ [updateField]: winner })
                    .eq('id', nextMatch.id);
            } else {
                // Create new match for next round
                const { data: newMatch } = await supabase
                    .from('tournament_brackets')
                    .insert({
                        tournament_id: tournamentId,
                        bracket_number: nextBracketNumber,
                        round_number: nextRound,
                        player1_wallet: match.bracket_number % 2 === 1 ? winner : null,
                        player2_wallet: match.bracket_number % 2 === 0 ? winner : null,
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
                    wallet_address: winner,
                    games_won: 1,
                    games_played: 1,
                    win_rate: 100.0
                });
        }

        return NextResponse.json({
            success: true,
            matchId,
            winner,
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
