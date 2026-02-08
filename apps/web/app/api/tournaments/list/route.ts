import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/tournaments/list?status=active
 * List all tournaments (optionally filter by status)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabase
            .from('tournaments')
            .select('*')
            .order('start_date', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: tournaments, error } = await query;

        if (error) {
            console.error('List Tournaments Error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        const formattedTournaments = tournaments?.map(t => ({
            id: t.id,
            name: t.name,
            type: t.tournament_type,
            status: t.status,
            participants: t.current_participants,
            maxParticipants: t.max_participants,
            prizePool: `${t.prize_pool} GUILT`,
            startDate: t.start_date,
            endDate: t.end_date,
            spotsRemaining: t.max_participants - t.current_participants
        })) || [];

        return NextResponse.json({
            success: true,
            count: formattedTournaments.length,
            tournaments: formattedTournaments
        });

    } catch (error: any) {
        console.error('List Tournaments Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
