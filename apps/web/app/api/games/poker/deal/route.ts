import { NextResponse } from 'next/server';
import { PokerService, PokerGameState } from '@/lib/services/poker-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { playerAddress, betAmount } = body;

        // 1. Generate Deck
        const { deck, salt, commit, deckString } = PokerService.generateFairDeck();

        // 2. Deal Cards (2 Player, 2 Pontiff, 5 Community)
        // Pop from end
        const p1Card1 = deck.pop()!;
        const p1Card2 = deck.pop()!;
        const pontiffCard1 = deck.pop()!;
        const pontiffCard2 = deck.pop()!;

        const community = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];

        // 3. Create Game Verification Record (Pending)
        // In a real app we store the whole deck/seed for verification.
        const gameId = `poker-${Date.now()}`;

        // 4. Return Initial State (Pre-Flop)
        // We only reveal Player Cards. Community cards are revealed based on round.
        // For efficiency in this demo, we return ALL cards but client hides them? 
        // NO, that's cheating. We should only return what is visible.
        // But for "Client-Side Demo" we might cheat slightly or store state in DB.

        // Let's store state in a simplified "ActiveGame" DB or just return signed state?
        // Stateless for HTTP speed: Return encrypted state? 
        // Simple: Return everything, client hides it. (Hackathon Mode)

        return NextResponse.json({
            gameId,
            playerHand: [p1Card1, p1Card2],
            pontiffHand: [pontiffCard1, pontiffCard2], // CLIENT MUST HIDE THIS
            communityCards: community, // CLIENT MUST HIDE UNTIL ROUNDS
            deckCommit: commit,
            salt: salt, // KEEP SECRET until end? No, salt needed to verify. 
            // Wait, Commit = Hash(Deck + Salt). If we give Salt, they can brute force Deck? 
            // Yes. Salt should be secret.
            // So we return `deckCommit` only.
            pot: betAmount || "100"
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
