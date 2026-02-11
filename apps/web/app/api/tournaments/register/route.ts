import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/tournaments/register
 * Register a player/agent for a tournament
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const {
            tournamentId,
            walletAddress,
            agentName,
            agentStrategy = 'merchant',
            registrationFee = '10'
        } = body;

        // Validate required fields
        if (!tournamentId || !walletAddress) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: tournamentId, walletAddress' },
                { status: 400 }
            );
        }

        // Check if tournament exists and is accepting registrations
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
                { success: false, error: 'Tournament is not accepting registrations' },
                { status: 400 }
            );
        }

        if (tournament.current_participants >= tournament.max_participants) {
            return NextResponse.json(
                { success: false, error: 'Tournament is full' },
                { status: 400 }
            );
        }

        // Check if already registered
        const { data: existing } = await supabase
            .from('tournament_registrations')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Already registered for this tournament' },
                { status: 400 }
            );
        }

        // Register player
        const seedNumber = tournament.current_participants + 1;

        const { data: registration, error: regError } = await supabase
            .from('tournament_registrations')
            .insert({
                tournament_id: tournamentId,
                wallet_address: walletAddress.toLowerCase(),
                // Schema mismatch: agent_name, agent_strategy, registration_fee columns do not exist in live DB
                // Removing them to prevent 500 errors.
                // agent_name: agentName || `Agent ${seedNumber}`,
                // agent_strategy: agentStrategy,
                // registration_fee: registrationFee,
                entry_paid: registrationFee || '10', // Mapping fee to entry_paid (string)
                seed_number: seedNumber
            })
            .select()
            .single();

        if (regError) {
            console.error('Registration Error:', regError);
            return NextResponse.json(
                { success: false, error: regError.message },
                { status: 500 }
            );
        }

        // Update tournament participant count
        await supabase
            .from('tournaments')
            .update({ current_participants: seedNumber })
            .eq('id', tournamentId);

        // Calculate bracket position (simplified)
        const roundNumber = Math.ceil(Math.log2(tournament.max_participants));
        const matchNumber = Math.ceil(seedNumber / 2);

        return NextResponse.json({
            success: true,
            registrationId: registration.id,
            seedNumber,
            agentName: registration.agent_name,
            bracketPosition: `Round ${roundNumber}, Match ${matchNumber}`,
            currentParticipants: seedNumber,
            maxParticipants: tournament.max_participants
        });

    } catch (error: any) {
        console.error('Tournament Registration Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
