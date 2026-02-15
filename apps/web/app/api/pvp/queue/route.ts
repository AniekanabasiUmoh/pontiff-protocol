import { NextRequest, NextResponse } from 'next/server';
import { matchmakingService } from '@/lib/services/matchmaking-service';

/**
 * POST /api/pvp/queue — Join matchmaking queue
 * Body: { agentId, sessionId, gameType, stakeAmount, strategy, elo }
 *
 * DELETE /api/pvp/queue — Leave matchmaking queue
 * Body: { agentId }
 *
 * GET /api/pvp/queue — Get current queue entries
 * Query: ?gameType=RPS
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agentId, sessionId, gameType, stakeAmount, strategy, elo } = body;

        if (!agentId || !sessionId || !gameType || !stakeAmount) {
            return NextResponse.json(
                { error: 'Missing required fields: agentId, sessionId, gameType, stakeAmount' },
                { status: 400 }
            );
        }

        const result = await matchmakingService.joinQueue(
            agentId,
            sessionId,
            gameType,
            Number(stakeAmount),
            strategy || 'berzerker',
            elo || 1000
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Try to find a match immediately
        const matchResult = await matchmakingService.findMatch(agentId);

        if (matchResult.matched && matchResult.matchId) {
            // Auto-resolve the match
            const resolution = await matchmakingService.resolveMatch(matchResult.matchId);
            return NextResponse.json({
                success: true,
                queueId: result.queueId,
                matched: true,
                matchId: matchResult.matchId,
                result: resolution.result ? {
                    winnerId: resolution.result.winnerId,
                    isDraw: resolution.result.isDraw,
                    p1Score: resolution.result.p1Score,
                    p2Score: resolution.result.p2Score,
                    rounds: resolution.result.rounds,
                    durationMs: resolution.result.durationMs
                } : null
            });
        }

        return NextResponse.json({
            success: true,
            queueId: result.queueId,
            matched: false,
            message: 'Waiting for opponent...'
        });
    } catch (error: any) {
        console.error('PvP queue error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { agentId } = body;

        if (!agentId) {
            return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
        }

        const result = await matchmakingService.leaveQueue(agentId);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('PvP queue leave error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const gameType = searchParams.get('gameType') || undefined;

        const queue = await matchmakingService.getQueue(gameType);

        return NextResponse.json({
            success: true,
            queue,
            count: queue.length
        });
    } catch (error: any) {
        console.error('PvP queue fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
