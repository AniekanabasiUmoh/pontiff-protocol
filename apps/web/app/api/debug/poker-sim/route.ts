import { NextResponse } from 'next/server';
import { PokerService, PokerGameState } from '@/lib/services/poker-service';
import { Hand } from 'pokersolver';

export async function POST(request: Request) {
    try {
        let wins = 0;
        let losses = 0;
        let actions = { FOLD: 0, CALL: 0, RAISE: 0 };
        const history = [];

        for (let i = 0; i < 100; i++) {
            // 1. Setup Game
            const { deck } = PokerService.generateFairDeck();
            const pontiffHand = [deck.pop()!, deck.pop()!];
            const opponentHand = [deck.pop()!, deck.pop()!];
            const communityCards = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];

            // 2. Pontiff Decision (Pre-River for decision, but we verify showdown win)
            const gameState: PokerGameState = {
                gameId: `sim-${i}`,
                opponent: "SimulatedHeretic",
                pot: "100",
                communityCards: communityCards.slice(0, 3), // Decision on Flop
                pontiffHand: pontiffHand,
                currentBet: "20",
                round: 'Flop'
            };

            const decision = await PokerService.determinePontiffPokerAction(gameState);
            actions[decision.action]++;

            // 3. Determine Winner (Showdown)
            const pontiffStrength = Hand.solve([...pontiffHand, ...communityCards]);
            const opponentStrength = Hand.solve([...opponentHand, ...communityCards]);
            const winner = Hand.winners([pontiffStrength, opponentStrength]);

            const isPontiffWin = winner.length === 1 && winner[0] === pontiffStrength;

            if (isPontiffWin) wins++;
            else losses++; // Draws count as loss for simple sim

            history.push({
                hand: i + 1,
                pontiff: pontiffHand.join(','),
                board: communityCards.join(','),
                action: decision.action,
                reason: decision.reason,
                result: isPontiffWin ? "WIN" : "LOSS"
            });
        }

        return NextResponse.json({
            stats: {
                totalHands: 100,
                wins,
                losses,
                winRate: `${wins}%`,
                actions
            },
            history: history.slice(0, 5) // Show first 5 for sanity check
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
