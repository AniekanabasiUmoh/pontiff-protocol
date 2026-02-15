import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/tournaments/:tournamentId/bracket
 * Get tournament bracket with all matches
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tournamentId: string }> }
) {
    try {
        const supabase = await createClient();
        const { tournamentId } = await params;

        // Get tournament
        const { data: tournament, error: tournamentError } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', tournamentId)
            .single();

        if (tournamentError || !tournament) {
            return NextResponse.json(
                { success: false, error: 'Tournament not found' },
                { status: 404 }
            );
        }

        // Get all brackets/matches
        const { data: brackets, error: bracketsError } = await supabase
            .from('tournament_brackets')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('round_number', { ascending: false })
            .order('bracket_number', { ascending: true });

        if (bracketsError) {
            console.error('Get Brackets Error:', bracketsError);
            return NextResponse.json(
                { success: false, error: bracketsError.message },
                { status: 500 }
            );
        }

        // Get registrations for seed numbers
        const { data: registrations } = await supabase
            .from('tournament_registrations')
            .select('wallet_address, seed_number')
            .eq('tournament_id', tournamentId);

        // Create lookup map for seed numbers
        const playerMap = new Map(
            registrations?.map(r => [r.wallet_address, r]) || []
        );

        // Group matches by round
        const rounds: any[] = [];
        const roundMap = new Map<number, any[]>();

        brackets?.forEach(bracket => {
            const round = bracket.round_number;
            if (!roundMap.has(round)) {
                roundMap.set(round, []);
            }

            const player1 = playerMap.get(bracket.player1_wallet);
            const player2 = bracket.player2_wallet ? playerMap.get(bracket.player2_wallet) : null;

            roundMap.get(round)?.push({
                matchId: bracket.id,
                bracketNumber: bracket.bracket_number,
                player1: bracket.player1_wallet ? {
                    wallet: bracket.player1_wallet,
                    name: `Agent ${player1?.seed_number || '?'}`,
                    seed: player1?.seed_number || null
                } : null,
                player2: bracket.player2_wallet ? {
                    wallet: bracket.player2_wallet,
                    name: `Agent ${player2?.seed_number || '?'}`,
                    seed: player2?.seed_number || null
                } : null,
                winner: bracket.winner_wallet,
                status: bracket.status,
                matchTimestamp: bracket.match_timestamp
            });
        });

        // Convert map to array
        roundMap.forEach((matches, roundNum) => {
            const totalRounds = Math.max(...Array.from(roundMap.keys()));
            const roundName = getRoundName(roundNum, totalRounds);

            rounds.push({
                roundNumber: roundNum,
                roundName,
                matches
            });
        });

        return NextResponse.json({
            success: true,
            tournamentId: tournament.id,
            name: tournament.name,
            status: tournament.status,
            participants: tournament.current_participants,
            maxParticipants: tournament.max_participants,
            prizePool: `${tournament.prize_pool} GUILT`,
            startDate: tournament.start_date,
            endDate: tournament.end_date,
            rounds
        });

    } catch (error: any) {
        console.error('Get Bracket Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Helper function to get round name
 */
function getRoundName(roundNumber: number, totalRounds: number): string {
    const roundsFromFinal = roundNumber;

    if (roundsFromFinal === 1) return 'Finals';
    if (roundsFromFinal === 2) return 'Semi-Finals';
    if (roundsFromFinal === 3) return 'Quarter-Finals';

    const participantsInRound = Math.pow(2, roundsFromFinal);
    return `Round of ${participantsInRound}`;
}
