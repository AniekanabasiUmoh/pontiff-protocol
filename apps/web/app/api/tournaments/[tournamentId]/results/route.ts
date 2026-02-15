import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/tournaments/:tournamentId/results
 * Get tournament results and leaderboard
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

        // Get all matches to calculate statistics
        const { data: brackets } = await supabase
            .from('tournament_brackets')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('status', 'completed');

        // Get registrations
        const { data: registrations } = await supabase
            .from('tournament_registrations')
            .select('*')
            .eq('tournament_id', tournamentId);

        if (!registrations || registrations.length === 0) {
            return NextResponse.json({
                success: true,
                tournamentId,
                status: tournament.status,
                leaderboard: []
            });
        }

        // Calculate stats for each player
        const playerStats = new Map<string, any>();

        registrations.forEach(reg => {
            playerStats.set(reg.wallet_address, {
                wallet: reg.wallet_address,
                agentName: `Agent ${reg.seed_number || '?'}`,
                seed: reg.seed_number,
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                rank: 0,
                prizeWon: '0'
            });
        });

        // Count wins and losses from brackets
        brackets?.forEach(bracket => {
            const player1Stats = playerStats.get(bracket.player1_wallet);
            const player2Stats = playerStats.get(bracket.player2_wallet);

            if (player1Stats) {
                player1Stats.gamesPlayed++;
                if (bracket.winner_wallet === bracket.player1_wallet) {
                    player1Stats.gamesWon++;
                } else {
                    player1Stats.gamesLost++;
                }
            }

            if (player2Stats) {
                player2Stats.gamesPlayed++;
                if (bracket.winner_wallet === bracket.player2_wallet) {
                    player2Stats.gamesWon++;
                } else {
                    player2Stats.gamesLost++;
                }
            }
        });

        // Sort by wins (descending) then by seed (ascending for tiebreaker)
        const leaderboard = Array.from(playerStats.values())
            .sort((a, b) => {
                if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
                return a.seed - b.seed;
            })
            .map((player, index) => {
                const rank = index + 1;
                const totalPrize = parseFloat(tournament.prize_pool);

                // Prize distribution (1st: 50%, 2nd: 30%, 3rd: 20%)
                let prizeWon = '0';
                if (rank === 1) prizeWon = (totalPrize * 0.5).toFixed(2);
                else if (rank === 2) prizeWon = (totalPrize * 0.3).toFixed(2);
                else if (rank === 3) prizeWon = (totalPrize * 0.2).toFixed(2);

                return {
                    rank,
                    wallet: player.wallet,
                    agentName: player.agentName,
                    seed: player.seed,
                    gamesPlayed: player.gamesPlayed,
                    gamesWon: player.gamesWon,
                    gamesLost: player.gamesLost,
                    winRate: player.gamesPlayed > 0
                        ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(1) + '%'
                        : '0%',
                    prizeWon: prizeWon !== '0' ? `${prizeWon} GUILT` : '0 GUILT',
                    nftRewardId: rank <= 3 ? 10000 + rank : null // Mock NFT IDs for top 3
                };
            });

        return NextResponse.json({
            success: true,
            tournamentId,
            name: tournament.name,
            status: tournament.status,
            totalPrizePool: `${tournament.prize_pool} GUILT`,
            participants: tournament.current_participants,
            startDate: tournament.start_date,
            endDate: tournament.end_date,
            leaderboard
        });

    } catch (error: any) {
        console.error('Get Tournament Results Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
