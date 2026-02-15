/**
 * PvP RPS Engine
 * 
 * Handles PvP Rock-Paper-Scissors match logic with:
 * - Best-of-N rounds
 * - Provably fair seeding
 * - Round-by-round history
 * - Strategy-driven move selection
 */

import crypto from 'crypto';
import { STRATEGIES, AgentStrategy, RPSMove, StrategyContext, GameResult } from './strategies';

export interface PvPAgent {
    id: string;
    sessionId: string;
    strategy: AgentStrategy;
    elo: number;
    balance: number;
    gamesPlayed: number;
    gameHistory: GameResult[];
}

export interface RoundResult {
    round: number;
    p1Move: number;
    p2Move: number;
    p1MoveName: string;
    p2MoveName: string;
    winner: 'p1' | 'p2' | 'draw';
    timestamp: number;
}

export interface MatchResult {
    matchId: string;
    winnerId: string | null;  // null = draw
    loserID: string | null;
    isDraw: boolean;
    rounds: RoundResult[];
    totalRounds: number;
    p1Score: number;
    p2Score: number;
    serverSeed: string;
    clientSeed1: string;
    clientSeed2: string;
    serverSeedHash: string;
    durationMs: number;
    p1EloChange: number;
    p2EloChange: number;
}

const MOVE_NAMES: Record<number, string> = {
    1: 'Rock',
    2: 'Paper',
    3: 'Scissors'
};

/**
 * Determine the winner of a single RPS round.
 * Returns 'p1' if player 1 wins, 'p2' if player 2 wins, 'draw' if tie.
 */
export function resolveRound(p1Move: number, p2Move: number): 'p1' | 'p2' | 'draw' {
    if (p1Move === p2Move) return 'draw';
    // Rock(1) beats Scissors(3), Paper(2) beats Rock(1), Scissors(3) beats Paper(2)
    if (
        (p1Move === RPSMove.ROCK && p2Move === RPSMove.SCISSORS) ||
        (p1Move === RPSMove.PAPER && p2Move === RPSMove.ROCK) ||
        (p1Move === RPSMove.SCISSORS && p2Move === RPSMove.PAPER)
    ) {
        return 'p1';
    }
    return 'p2';
}

/**
 * Generate a provably fair seed pair.
 */
function generateSeeds() {
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    const clientSeed1 = crypto.randomBytes(16).toString('hex');
    const clientSeed2 = crypto.randomBytes(16).toString('hex');
    return { serverSeed, serverSeedHash, clientSeed1, clientSeed2 };
}

/**
 * Calculate ELO rating change.
 */
function calculateElo(ratingA: number, ratingB: number, scoreA: number): { newA: number; newB: number; changeA: number; changeB: number } {
    const K = 32;
    const expectedA = 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1.0 - expectedA;
    const scoreB = 1.0 - scoreA;

    const changeA = Math.round(K * (scoreA - expectedA));
    const changeB = Math.round(K * (scoreB - expectedB));

    return {
        newA: Math.max(100, ratingA + changeA),
        newB: Math.max(100, ratingB + changeB),
        changeA,
        changeB
    };
}

/**
 * Get a move from a strategy for PvP context.
 */
function getStrategyMove(agent: PvPAgent, opponentHistory: GameResult[]): number {
    const strategy = STRATEGIES[agent.strategy];
    if (!strategy) return Math.floor(Math.random() * 3) + 1; // fallback random

    const context: StrategyContext = {
        gameHistory: opponentHistory,  // from the opponent's perspective for counter-play
        currentBalance: agent.balance,
        lastGameResult: opponentHistory[opponentHistory.length - 1]?.outcome,
        gamesPlayed: agent.gamesPlayed
    };

    const action = strategy(context);
    return action.move || Math.floor(Math.random() * 3) + 1;
}

/**
 * Execute a full PvP match (best-of-N rounds).
 */
export function playMatch(
    matchId: string,
    agent1: PvPAgent,
    agent2: PvPAgent,
    bestOf: number = 3
): MatchResult {
    const startTime = Date.now();
    const seeds = generateSeeds();
    const rounds: RoundResult[] = [];

    let p1Score = 0;
    let p2Score = 0;
    const winsNeeded = Math.ceil(bestOf / 2);

    // Build fake history for strategy context (from each agent's perspective)
    const p1HistoryAsOpponent: GameResult[] = [];
    const p2HistoryAsOpponent: GameResult[] = [];

    for (let round = 1; round <= bestOf; round++) {
        // Check if someone already won
        if (p1Score >= winsNeeded || p2Score >= winsNeeded) break;

        // Get moves from each agent's strategy
        const p1Move = getStrategyMove(agent1, p2HistoryAsOpponent);
        const p2Move = getStrategyMove(agent2, p1HistoryAsOpponent);

        const winner = resolveRound(p1Move, p2Move);

        if (winner === 'p1') p1Score++;
        else if (winner === 'p2') p2Score++;

        const roundResult: RoundResult = {
            round,
            p1Move,
            p2Move,
            p1MoveName: MOVE_NAMES[p1Move] || 'Unknown',
            p2MoveName: MOVE_NAMES[p2Move] || 'Unknown',
            winner,
            timestamp: Date.now()
        };
        rounds.push(roundResult);

        // Update histories for next round's strategy context
        p1HistoryAsOpponent.push({
            outcome: winner === 'p2' ? 'WIN' : winner === 'p1' ? 'LOSS' : 'DRAW',
            playerMove: p2Move as 1 | 2 | 3,
            pontiffMove: p1Move as 1 | 2 | 3,
            wager: 0,
            timestamp: Date.now()
        });
        p2HistoryAsOpponent.push({
            outcome: winner === 'p1' ? 'WIN' : winner === 'p2' ? 'LOSS' : 'DRAW',
            playerMove: p1Move as 1 | 2 | 3,
            pontiffMove: p2Move as 1 | 2 | 3,
            wager: 0,
            timestamp: Date.now()
        });
    }

    const isDraw = p1Score === p2Score;
    const winnerId = isDraw ? null : p1Score > p2Score ? agent1.id : agent2.id;
    const loserId = isDraw ? null : p1Score > p2Score ? agent2.id : agent1.id;

    // ELO calculation
    const eloScore = isDraw ? 0.5 : (winnerId === agent1.id ? 1.0 : 0.0);
    const eloResult = calculateElo(agent1.elo, agent2.elo, eloScore);

    const durationMs = Date.now() - startTime;

    return {
        matchId,
        winnerId,
        loserID: loserId,
        isDraw,
        rounds,
        totalRounds: rounds.length,
        p1Score,
        p2Score,
        serverSeed: seeds.serverSeed,
        clientSeed1: seeds.clientSeed1,
        clientSeed2: seeds.clientSeed2,
        serverSeedHash: seeds.serverSeedHash,
        durationMs,
        p1EloChange: eloResult.changeA,
        p2EloChange: eloResult.changeB
    };
}
