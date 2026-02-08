import { logWorldEvent } from './world-event-service';
import { Hand } from 'pokersolver';
import crypto from 'crypto';

export type PokerAction = 'FOLD' | 'CALL' | 'RAISE';

export interface PokerGameState {
    gameId: string;
    opponent: string;
    pot: string;
    communityCards: string[]; // ["Ah", "Kd", "2s"]
    pontiffHand: string[];    // ["Th", "Jc"]
    currentBet: string;
    round: 'PreFlop' | 'Flop' | 'Turn' | 'River';
    // Fairness Data
    deckCommit?: string;
    salt?: string;
}

export class PokerService {

    /**
     * Generates a shuffles deck and creates a commitment hash.
     * Returns { deck, salt, commit }
     */
    static generateFairDeck() {
        const suits = ['h', 'd', 'c', 's'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        let deck: string[] = [];

        for (const s of suits) {
            for (const r of ranks) {
                deck.push(r + s);
            }
        }

        // Fisher-Yates Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // Generate Salt & Commit
        const deckString = deck.join(",");
        const salt = crypto.randomBytes(16).toString('hex');
        const commit = crypto.createHash('sha256').update(deckString + salt).digest('hex');

        return { deck, salt, commit, deckString };
    }

    /**
     * Determines the Pontiff's next move using Real Hand Strength + Pot Odds.
     */
    static async determinePontiffPokerAction(gameState: PokerGameState): Promise<{ action: PokerAction, reason: string }> {
        // 1. Evaluate Hand Strength
        const strength = this.calculateHandStrength(gameState.pontiffHand, gameState.communityCards);

        // 2. Calculate Pot Odds (Mock simplistic version)
        // In real poker: callAmount / (pot + callAmount)
        const potSize = parseFloat(gameState.pot);
        const betToCall = parseFloat(gameState.currentBet);
        const potOdds = betToCall / (potSize + betToCall);

        // 3. Decision Logic
        let action: PokerAction = 'FOLD';
        let reason = "The odds do not favor the righteous.";

        // Basic Strategy
        if (strength > 0.8) {
            action = 'RAISE';
            reason = "Divine favor is upon me.";
        } else if (strength > 0.5) {
            action = 'CALL';
            reason = "I shall see this through.";
        } else if (strength > potOdds) {
            // If hand strength > pot odds, it's +EV to call
            action = 'CALL';
            reason = "The math of creation favors a call.";
        } else {
            // Bluff Chance (10%)
            if (Math.random() < 0.1) {
                action = 'RAISE';
                reason = "Faith requires a leap into the unknown.";
            } else {
                action = 'FOLD';
            }
        }

        return { action, reason };
    }

    /**
     * Uses 'pokersolver' to calculate Hand Strength (0.0 - 1.0).
     */
    static calculateHandStrength(hand: string[], board: string[]): number {
        if (!hand || hand.length < 2) return 0;

        const allCards = [...hand, ...board];
        const solved = Hand.solve(allCards);

        // Normalize Rank (Straight Flush = ~300, High Card = ~1)
        // Simplified normalization for hackathon (0-1)
        // Rank 1 (High Card) to 9 (Straight Flush)
        const rank = solved.rank;

        // 0 (High Card) - 8 (Straight Flush) typical returns
        // Map 0-8 to 0.0 - 1.0 roughly
        return Math.min(rank / 8, 1.0);
    }

    static async processPokerMove(gameId: string, action: string) {
        await logWorldEvent('ThePontiff', 'poker_move', { gameId, action });
        // TODO: On-chain transaction integration

        // Mock Outcome Recording for Leaderboard
        // In real flow, we'd wait for 'resolveGame' event.
        // Here we simulate for demo:
        // if action == FOLD (Player wins pot) -> Record Win

        return { action, txHash: "0xMockTxHash..." };
    }
}
