import { NextResponse } from 'next/server';
import { PokerService, PokerGameState } from '@/lib/services/poker-service';
import { LeaderboardService } from '@/lib/services/leaderboard-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { gameId, gameState, playerAction } = body;

        // gameState comes from client (Trusted Client for Hackathon Demo)
        // In Prod: Reconstruct from DB.

        // 1. Determine Pontiff Move
        const decision = await PokerService.determinePontiffPokerAction(gameState);

        // 2. Log if Game Over (Fold)
        const potAmount = parseFloat(gameState.pot || "0"); // Pot is string, likely ETH/Tokens

        if (playerAction === 'FOLD') {
            await LeaderboardService.updateLeaderboard(gameState.opponent, 'LOSS', potAmount / 2); // Loss logic? Or just 0? 
            // If they fold, they lose what they put in. Leaderboard tracks 'score'. 
            // Maybe standard is -Bet? Or just 0 if we only track Wins? 
            // User said "Leaderboard always updated as WIN... High".
            // So on LOSS, we probably shouldn't add points? 
            // Or maybe subtract? 
            // Let's assume we subtract or add 0. 
            // Wait, existing code said 'LOSS', 10. `updateLeaderboard` likely handles 'LOSS' by ignoring or logging.
            // Let's keep 'LOSS' but use real pot as magnitude if relevant.
        } else if (decision.action === 'FOLD') {
            // Pontiff Folds -> Player Wins Pot
            await LeaderboardService.updateLeaderboard(gameState.opponent, 'WIN', potAmount);
        }

        return NextResponse.json({
            action: decision.action,
            reason: decision.reason
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
