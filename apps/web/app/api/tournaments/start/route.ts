import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/tournaments/start
 * Start a tournament and generate bracket
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { tournamentId } = body;

        if (!tournamentId) {
            return NextResponse.json(
                { success: false, error: 'Missing tournamentId' },
                { status: 400 }
            );
        }

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

        if (tournament.status !== 'pending') {
            return NextResponse.json(
                { success: false, error: 'Tournament already started or completed' },
                { status: 400 }
            );
        }

        // Get all registrations
        const { data: registrations, error: regError } = await supabase
            .from('tournament_registrations')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('seed_number', { ascending: true });

        if (regError || !registrations || registrations.length < 2) {
            return NextResponse.json(
                { success: false, error: 'Not enough participants to start tournament (minimum 2)' },
                { status: 400 }
            );
        }

        // Generate brackets (single elimination)
        const brackets: any[] = [];
        const participants = registrations.length;
        const totalRounds = Math.ceil(Math.log2(participants));

        // Round 1: Pair up participants
        for (let i = 0; i < participants; i += 2) {
            const player1 = registrations[i];
            const player2 = registrations[i + 1] || null; // Handle odd number of participants

            brackets.push({
                tournament_id: tournamentId,
                bracket_number: Math.floor(i / 2) + 1,
                round_number: totalRounds,
                player1_wallet: player1.wallet_address,
                player2_wallet: player2?.wallet_address || null,
                status: player2 ? 'pending' : 'bye', // Bye if odd number
                match_timestamp: new Date(tournament.start_date).toISOString()
            });
        }

        // Insert brackets into database
        const { error: bracketError } = await supabase
            .from('tournament_brackets')
            .insert(brackets);

        if (bracketError) {
            console.error('Bracket Generation Error:', bracketError);
            return NextResponse.json(
                { success: false, error: bracketError.message },
                { status: 500 }
            );
        }

        // Update tournament status
        await supabase
            .from('tournaments')
            .update({ status: 'active' })
            .eq('id', tournamentId);

        // Format bracket response
        const formattedBracket = brackets.map(b => ({
            matchId: b.id,
            bracketNumber: b.bracket_number,
            round: totalRounds,
            player1: b.player1_wallet,
            player2: b.player2_wallet,
            status: b.status,
            scheduled: b.match_timestamp
        }));

        return NextResponse.json({
            success: true,
            tournamentId,
            status: 'active',
            totalParticipants: participants,
            totalRounds,
            bracket: formattedBracket,
            message: `Tournament started with ${participants} participants`
        });

    } catch (error: any) {
        console.error('Start Tournament Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
