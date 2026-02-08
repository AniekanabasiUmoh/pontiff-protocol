import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/tournaments/create
 * Create a new tournament
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const {
            name,
            type = 'Holy',
            maxParticipants = 32,
            prizePool,
            startDate,
            endDate
        } = body;

        // Validate required fields
        if (!name || !prizePool || !startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: name, prizePool, startDate, endDate' },
                { status: 400 }
            );
        }

        // Validate max participants (must be power of 2 for bracket system)
        const validSizes = [8, 16, 32, 64, 128];
        if (!validSizes.includes(maxParticipants)) {
            return NextResponse.json(
                { success: false, error: 'maxParticipants must be 8, 16, 32, 64, or 128' },
                { status: 400 }
            );
        }

        // Create tournament
        const { data: tournament, error } = await supabase
            .from('tournaments')
            .insert({
                name,
                tournament_type: type,
                status: 'pending',
                start_date: startDate,
                end_date: endDate,
                max_participants: maxParticipants,
                current_participants: 0,
                prize_pool: prizePool
            })
            .select()
            .single();

        if (error) {
            console.error('Create Tournament Error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            tournamentId: tournament.id,
            name: tournament.name,
            status: tournament.status,
            maxParticipants: tournament.max_participants,
            prizePool: `${tournament.prize_pool} GUILT`,
            startDate: tournament.start_date,
            endDate: tournament.end_date
        });

    } catch (error: any) {
        console.error('Create Tournament Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}