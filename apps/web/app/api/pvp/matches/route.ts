import { NextRequest, NextResponse } from 'next/server';
import { matchmakingService } from '@/lib/services/matchmaking-service';

/**
 * GET /api/pvp/matches — List recent PvP matches
 * Query: ?limit=20
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const matches = await matchmakingService.getRecentMatches(Math.min(limit, 100));

        return NextResponse.json({
            success: true,
            matches,
            count: matches.length
        });
    } catch (error: any) {
        console.error('PvP matches fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
