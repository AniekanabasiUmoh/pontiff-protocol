import { createClient } from '@supabase/supabase-js';
import { Hand } from 'pokersolver';

// Initialize Supabase (Service Role for backend ops)
function getDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
}
const supabase = new Proxy({} as ReturnType<typeof getDb>, {
    get: (_, p) => { const c = getDb(); const v = (c as any)[p]; return typeof v === 'function' ? v.bind(c) : v; }
});

export type PokerStage = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN' | 'ENDED';
export type PokerAction = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE' | 'ALL_IN';
export type PokerResult = 'WIN' | 'LOSS' | 'DRAW' | 'FOLD';

export interface PokerHandState {
    id: string;
    stage: PokerStage;
    pot: number;
    playerHand: string[];
    pontiffHand?: string[]; // Hidden unless showdown
    communityCards: string[];
    playerBet: number;
    deck?: string[]; // Hidden
}

export class PokerService {

    /**
     * Deck Generation (Standard 52 cards)
     */
    private static generateDeck(): string[] {
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
        return deck;
    }

    /**
     * Start a new Hand (Deal Casino)
     */
    static async createHand(walletAddress: string, betAmount: number, sessionId?: string): Promise<PokerHandState> {
        const deck = this.generateDeck();
        const playerHand = [deck.pop()!, deck.pop()!];
        const pontiffHand = [deck.pop()!, deck.pop()!];

        // Ensure wallet balance (Mock check or DB check depending on mode)
        // For now, we assume caller validated balance.

        const { data, error } = await supabase
            .from('poker_hands')
            .insert({
                session_id: sessionId || null,
                wallet_address: walletAddress.toLowerCase(),
                deck, // Remaining deck
                player_hand: playerHand,
                pontiff_hand: pontiffHand,
                stage: 'PREFLOP',
                pot: betAmount * 2, // Ante/Blind structure: Simplified to "Match Bet" for now
                player_bet: betAmount,
                community_cards: []
            })
            .select()
            .single();

        if (error || !data) throw new Error(`Failed to deal hand: ${error?.message}`);

        return {
            id: data.id,
            stage: 'PREFLOP',
            pot: data.pot,
            playerHand: data.player_hand,
            communityCards: [],
            playerBet: data.player_bet
        };
    }

    /**
     * Process Player Action
     */
    static async processAction(handId: string, action: PokerAction, raiseAmount?: number): Promise<{
        state: PokerHandState,
        result?: PokerResult,
        pnl?: number,
        message?: string
    }> {
        const { data: hand, error } = await supabase
            .from('poker_hands')
            .select('*')
            .eq('id', handId)
            .single();

        if (error || !hand) throw new Error("Hand not found");
        if (hand.stage === 'ENDED') throw new Error("Hand already ended");

        let { stage, deck, player_bet, pot, community_cards, pontiff_hand, player_hand } = hand;
        let pnl = 0;
        let result: PokerResult | undefined;
        let message = "";

        // 1. Handle FOLD
        if (action === 'FOLD') {
            result = 'LOSS'; // Player folded
            pnl = -player_bet;
            message = "You folded.";
            await this.finalizeHand(handId, 'FOLD', pnl);
            return {
                state: { ...hand, stage: 'ENDED' },
                result, pnl, message
            };
        }

        // 2. Handle Betting Logic (Simplified: Pontiff always calls/checks for now to keep game moving)
        // In full poker, Pontiff needs AI. Here we implement "Passive/Calling Station" Pontiff for v1.

        // If Player Raises, Pot increases.
        if (action === 'RAISE' && raiseAmount) {
            const amountToAdd = raiseAmount; // Assume raises are additive for now
            pot += amountToAdd * 2; // Pontiff matches
            player_bet += amountToAdd;
        }
        // If Check/Call, no pot increase (unless pre-flop logic requires it, but we simplified to ante)

        // 3. Advance Stage
        /*
           Flow: PREFLOP -> Action -> FLOP -> Action -> TURN -> Action -> RIVER -> Action -> SHOWDOWN
        */
        let nextStage: PokerStage = stage;
        let cardsToDeal = 0;

        if (stage === 'PREFLOP') {
            nextStage = 'FLOP';
            cardsToDeal = 3;
        } else if (stage === 'FLOP') {
            nextStage = 'TURN';
            cardsToDeal = 1;
        } else if (stage === 'TURN') {
            nextStage = 'RIVER';
            cardsToDeal = 1;
        } else if (stage === 'RIVER') {
            nextStage = 'SHOWDOWN';
        }

        // Deal Community Cards
        if (cardsToDeal > 0) {
            for (let i = 0; i < cardsToDeal; i++) {
                if (deck.length > 0) community_cards.push(deck.pop());
            }
        }

        // 4. Update State
        const updates: any = {
            stage: nextStage,
            deck,
            pot,
            player_bet,
            community_cards
        };

        // 5. Check Showdown
        if (nextStage === 'SHOWDOWN') {
            const evalResult = this.evaluateWinner(player_hand, pontiff_hand, community_cards);
            result = evalResult.winner;

            if (result === 'WIN') {
                pnl = pot / 2; // Profit is Pot/2 (minus original bet? No, Pot includes Pontiff's bet)
                // Actually PnL = Total Pot - Player Investment. 
                // Since Pot = 2 * Bet, PnL = Bet.
                pnl = player_bet;
                message = `You Won with ${evalResult.playerDesc}!`;
            } else if (result === 'LOSS') {
                pnl = -player_bet;
                message = `Pontiff Won with ${evalResult.pontiffDesc}.`;
            } else {
                pnl = 0;
                message = "Split Pot.";
            }

            updates.stage = 'ENDED';
            updates.result = result;
            updates.pnl = pnl;

            await this.finalizeHand(handId, result, pnl);
        } else {
            // Just update state
            await supabase.from('poker_hands').update(updates).eq('id', handId);
        }

        return {
            state: {
                id: handId,
                stage: nextStage === 'SHOWDOWN' ? 'ENDED' : nextStage,
                pot,
                playerHand: player_hand,
                pontiffHand: nextStage === 'SHOWDOWN' ? pontiff_hand : undefined, // Reveal at end
                communityCards: community_cards,
                playerBet: player_bet
            },
            result,
            pnl,
            message
        };
    }

    private static async finalizeHand(handId: string, result: PokerResult, pnl: number) {
        const { data: hand } = await supabase
            .from('poker_hands')
            .select('wallet_address, player_bet')
            .eq('id', handId)
            .single();

        await supabase.from('poker_hands').update({
            stage: 'ENDED',
            result,
            pnl,
            updated_at: new Date().toISOString()
        }).eq('id', handId);

        // Record house revenue when the pontiff wins (player loses)
        // House earns the player's bet on a LOSS or FOLD
        if ((result === 'LOSS' || result === 'FOLD') && hand?.player_bet > 0) {
            await supabase.from('balance_transactions').insert({
                wallet_address: 'treasury',
                type: 'HOUSE_EDGE',
                amount: hand.player_bet,
                balance_before: 0,
                balance_after: hand.player_bet,
                game_id: handId,
                game_type: 'POKER',
                metadata: { from: hand.wallet_address, result },
            }).then(({ error }) => {
                if (error) console.error('[Poker] Failed to record house revenue:', error.message);
            });
        }
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

    private static evaluateWinner(playerHand: string[], pontiffHand: string[], board: string[]) {
        const h1 = Hand.solve([...playerHand, ...board]);
        const h2 = Hand.solve([...pontiffHand, ...board]);
        const winner = Hand.winners([h1, h2]);

        let result: PokerResult = 'DRAW';
        if (winner.length === 1) {
            result = winner[0] === h1 ? 'WIN' : 'LOSS';
        }

        return {
            winner: result,
            playerDesc: h1.descr,
            pontiffDesc: h2.descr
        };
    }
}
