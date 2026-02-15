import { NextRequest, NextResponse } from 'next/server';
import { PokerService } from '@/lib/services/poker-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { walletAddress, betAmount } = body;

        if (!walletAddress || !betAmount) {
            return NextResponse.json({ success: false, error: 'Missing walletAddress or betAmount' }, { status: 400 });
        }

        // Logic check: Validate balance
        // For simulation, we assume user has funds (or frontend checked)

        const hand = await PokerService.createHand(walletAddress, parseFloat(betAmount));

        // Return client-view of the hand
        return NextResponse.json({
            success: true,
            gameId: hand.id,
            playerHand: hand.playerHand,
            pot: hand.pot,
            round: hand.stage,
            serverStateToken: hand.id, // Simple token for now
            casinoBalance: 10000 // Mock balance for UI
        });

    } catch (e: any) {
        console.error('Deal API Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
