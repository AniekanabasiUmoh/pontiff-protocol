import { NextRequest, NextResponse } from 'next/server';
import { matchmakingService } from '@/lib/services/matchmaking-service';

/**
 * GET /api/arena/[matchId] — Get full match detail + replay data
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const { matchId } = await params;

        if (!matchId) {
            return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
        }

        const match = await matchmakingService.getMatch(matchId);

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            match: {
                ...match,
                // Add computed fields for display
                potSize: match.stake_amount * 2,
                winnerPayout: match.stake_amount * 2 - (match.house_fee || 0),
                isLive: match.status === 'in_progress',
                isCompleted: match.status === 'completed'
            }
        });
    } catch (error: any) {
        console.error('Arena match fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
