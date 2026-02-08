
/**
 * Module 6: Agent Strategies (The Champions)
 *
 * Three AI strategies with different risk profiles and expected returns:
 * - Berzerker: High risk, aggressive play (15% bets)
 * - Merchant: Medium risk, strategic patterns (5% bets)
 * - Disciple: Low risk, staking-focused (2% bets + staking)
 */

export type AgentStrategy = 'berzerker' | 'merchant' | 'disciple';

export interface GameResult {
    outcome: 'WIN' | 'LOSS' | 'DRAW';
    playerMove: 1 | 2 | 3;
    pontiffMove: 1 | 2 | 3;
    wager: number;
    timestamp: number;
}

export interface StrategyContext {
    gameHistory: GameResult[];
    currentBalance: number;
    lastGameResult?: 'WIN' | 'LOSS' | 'DRAW';
    gamesPlayed: number;
}

export interface AgentAction {
    game: 'RPS' | 'STAKING';
    move: 0 | 1 | 2 | 3; // 0 for staking, 1=Rock, 2=Paper, 3=Scissors
    wager: number;
    reasoning?: string; // For debugging and analytics
}

// RPS move enum for clarity
export enum RPSMove {
    ROCK = 1,
    PAPER = 2,
    SCISSORS = 3
}

// Session fees for each strategy
export const STRATEGY_FEES = {
    berzerker: 10, // 10 GUILT per 24h
    merchant: 15,  // 15 GUILT per 24h
    disciple: 5    // 5 GUILT per 24h
};

// Expected ROI ranges for documentation
export const STRATEGY_ROI = {
    berzerker: { min: -10, max: 500, description: "High volatility, aggressive" },
    merchant: { min: 5, max: 30, description: "Moderate returns, strategic" },
    disciple: { min: 15, max: 15, description: "Stable APY, passive staking" }
};

/**
 * ⚔️ THE BERZERKER
 *
 * Risk: HIGH
 * Behavior: Plays aggressively with random moves, high wagers
 * Expected ROI: -10% to +500%
 * Session Fee: 10 GUILT/24h
 * Bet Size: 15% of current balance
 *
 * Strategy: Pure chaos. Random moves with large bets.
 * Best for: Gamblers who love high risk/high reward
 */
export const berzerkerStrategy = (ctx: StrategyContext): AgentAction => {
    const wager = Math.max(1, Math.floor(ctx.currentBalance * 0.15));
    const moves: (1 | 2 | 3)[] = [RPSMove.ROCK, RPSMove.PAPER, RPSMove.SCISSORS];
    const move = moves[Math.floor(Math.random() * moves.length)];

    return {
        game: 'RPS',
        move,
        wager,
        reasoning: `Berzerker: Random ${getMoveName(move)}, 15% bet (${wager} GUILT)`
    };
};

/**
 * 💰 THE MERCHANT
 *
 * Risk: MEDIUM
 * Behavior: Strategic pattern-based play, moderate wagers
 * Expected ROI: +5% to +30%
 * Session Fee: 15 GUILT/24h
 * Bet Size: 5% of current balance
 *
 * Strategy: Analyzes opponent's last 5 moves to detect patterns.
 * - Detects repeated moves and counters
 * - Looks for alternating patterns
 * - Uses weighted randomization based on history
 * Best for: Players who want strategic gameplay
 */
export const merchantStrategy = (ctx: StrategyContext): AgentAction => {
    const wager = Math.max(1, Math.floor(ctx.currentBalance * 0.05));

    // If no history, start with weighted random
    if (ctx.gameHistory.length < 3) {
        const move = weightedRandomMove([0.35, 0.35, 0.30]); // Slightly favor Rock/Paper
        return {
            game: 'RPS',
            move,
            wager,
            reasoning: `Merchant: Warm-up ${getMoveName(move)}, 5% bet (${wager} GUILT)`
        };
    }

    // Analyze last 5 games for patterns
    const recentGames = ctx.gameHistory.slice(-5);
    const pontiffMoves = recentGames.map(g => g.pontiffMove);

    // Pattern 1: Repeated move detection
    const lastMove = pontiffMoves[pontiffMoves.length - 1];
    const isRepeating = pontiffMoves.slice(-3).every(m => m === lastMove);

    if (isRepeating) {
        const counterMove = getCounterMove(lastMove);
        return {
            game: 'RPS',
            move: counterMove,
            wager,
            reasoning: `Merchant: Counter to repeated ${getMoveName(lastMove)} with ${getMoveName(counterMove)}, 5% bet`
        };
    }

    // Pattern 2: Alternating pattern (Rock->Paper->Scissors->Rock)
    if (pontiffMoves.length >= 3) {
        const isSequential = pontiffMoves.every((move, idx) => {
            if (idx === 0) return true;
            const prevMove = pontiffMoves[idx - 1];
            return move === (prevMove % 3) + 1;
        });

        if (isSequential) {
            const nextInSequence = (lastMove % 3) + 1;
            const counterMove = getCounterMove(nextInSequence as 1 | 2 | 3);
            return {
                game: 'RPS',
                move: counterMove,
                wager,
                reasoning: `Merchant: Counter sequential pattern with ${getMoveName(counterMove)}, 5% bet`
            };
        }
    }

    // Pattern 3: Frequency analysis - counter most common move
    const moveFrequency = [0, 0, 0, 0]; // Index 0 unused, 1=Rock, 2=Paper, 3=Scissors
    pontiffMoves.forEach(move => moveFrequency[move]++);

    const mostCommonMove = moveFrequency.indexOf(Math.max(...moveFrequency.slice(1))) as 1 | 2 | 3;
    const counterMove = getCounterMove(mostCommonMove);

    return {
        game: 'RPS',
        move: counterMove,
        wager,
        reasoning: `Merchant: Counter frequent ${getMoveName(mostCommonMove)} with ${getMoveName(counterMove)}, 5% bet`
    };
};

/**
 * 🙏 THE DISCIPLE
 *
 * Risk: LOW
 * Behavior: Stakes GUILT in Cathedral for passive rewards, minimal gameplay
 * Expected ROI: +15% APY (stable)
 * Session Fee: 5 GUILT/24h
 * Bet Size: 2% of balance (conservative games), 20% staking
 *
 * Strategy: Primarily staking-focused with occasional low-risk games
 * - Stakes 20% of balance every 5 turns
 * - Plays conservative RPS with 2% bets in between
 * - Uses most statistically neutral moves (slight Rock bias)
 * Best for: Risk-averse players who want passive income
 */
export const discipleStrategy = (ctx: StrategyContext): AgentAction => {
    // Every 5 games, stake 20% of balance
    if (ctx.gamesPlayed % 5 === 0 && ctx.currentBalance > 10) {
        const stakeAmount = Math.max(1, Math.floor(ctx.currentBalance * 0.2));
        return {
            game: 'STAKING',
            move: 0,
            wager: stakeAmount,
            reasoning: `Disciple: Staking ${stakeAmount} GUILT in Cathedral (20% of balance)`
        };
    }

    // Conservative RPS gameplay (2% bets)
    const wager = Math.max(1, Math.floor(ctx.currentBalance * 0.02));

    // Use weighted randomization favoring Rock (statistically most common human choice)
    const move = weightedRandomMove([0.40, 0.30, 0.30]); // 40% Rock, 30% Paper, 30% Scissors

    return {
        game: 'RPS',
        move,
        wager,
        reasoning: `Disciple: Conservative ${getMoveName(move)}, 2% bet (${wager} GUILT)`
    };
};

/**
 * Strategy registry for easy lookup
 */
export const STRATEGIES: Record<AgentStrategy, (ctx: StrategyContext) => AgentAction> = {
    berzerker: berzerkerStrategy,
    merchant: merchantStrategy,
    disciple: discipleStrategy
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns the counter-move that beats the given move
 */
function getCounterMove(move: 1 | 2 | 3): 1 | 2 | 3 {
    // Rock (1) -> Paper (2)
    // Paper (2) -> Scissors (3)
    // Scissors (3) -> Rock (1)
    return (move % 3 + 1) as 1 | 2 | 3;
}

/**
 * Returns a weighted random move based on probabilities
 * @param weights Array of 3 probabilities [rock, paper, scissors], must sum to ~1.0
 */
function weightedRandomMove(weights: [number, number, number]): 1 | 2 | 3 {
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
            return (i + 1) as 1 | 2 | 3;
        }
    }

    return RPSMove.ROCK; // Fallback
}

/**
 * Returns human-readable move name
 */
function getMoveName(move: number): string {
    switch (move) {
        case 1: return 'Rock';
        case 2: return 'Paper';
        case 3: return 'Scissors';
        default: return 'Unknown';
    }
}
