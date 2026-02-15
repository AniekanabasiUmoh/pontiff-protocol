import { NextRequest, NextResponse } from 'next/server';
import { PokerService, PokerAction } from '@/lib/services/poker-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { walletAddress, playerAction, serverStateToken, raiseAmount } = body;

        if (!walletAddress || !playerAction || !serverStateToken) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        // Map frontend action to PokerAction enum
        let action: PokerAction = playerAction;
        if (playerAction === 'ALL_IN') action = 'ALL_IN'; // Maps directly

        const result = await PokerService.processAction(serverStateToken, action, raiseAmount);

        return NextResponse.json({
            success: true,
            gameId: result.state.id,
            communityCards: result.state.communityCards,
            pontiffHand: result.state.pontiffHand,
            pot: result.state.pot,
            round: result.state.stage,
            serverStateToken: result.state.id,
            casinoBalance: 10000 + (result.pnl || 0),
            // Result fields
            result: result.result,
            message: result.message,
            pontiffAction: 'CALL', // Generic mock action for UI
            pontiffQuote: getClickBaityQuote(playerAction, result.result)
        });

    } catch (e: any) {
        console.error('Action API Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

function getClickBaityQuote(action: string, result?: string) {
    if (result === 'WIN') return "Fortune favors the bold... or the foolish.";
    if (result === 'LOSS') return " The house always wins. Repent.";
    if (action === 'FOLD') return "A wise retreat.";
    if (action === 'RAISE') return "Raising the stakes against God?";
    return "I am watching.";
}
