import { NextRequest, NextResponse } from 'next/server';
import { matchmakingService } from '@/lib/services/matchmaking-service';

/**
 * GET /api/pvp/leaderboard — Top PvP gladiators
 * Query: ?limit=20
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const leaderboard = await matchmakingService.getLeaderboard(Math.min(limit, 100));

        return NextResponse.json({
            success: true,
            leaderboard,
            count: leaderboard.length
        });
    } catch (error: any) {
        console.error('PvP leaderboard error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
