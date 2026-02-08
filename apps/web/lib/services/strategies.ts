

export type AgentStrategy = 'berzerker' | 'merchant' | 'disciple';

export interface StrategyContext {
    gameHistory: any[]; // Replace with actual type
    currentBalance: number;
    lastGameResult?: 'WIN' | 'LOSS' | 'DRAW';
}

export interface AgentAction {
    game: 'RPS' | 'STAKING'; // Extended
    move: 0 | 1 | 2 | 3; // 0 for non-game actions like staking
    wager: number;
}

export const STRATEGIES: Record<AgentStrategy, (ctx: StrategyContext) => AgentAction> = {
    berzerker: (ctx) => {
        // 15% of current balance
        const wager = Math.floor(ctx.currentBalance * 0.15);
        const moves: (1 | 2 | 3)[] = [1, 2, 3];
        const move = moves[Math.floor(Math.random() * moves.length)];
        return { game: 'RPS', move: move as 1 | 2 | 3, wager: Math.max(1, wager) }; // Ensure at least 1 GUILT
    },
    merchant: (ctx) => {
        // 5% of current balance
        const wager = Math.floor(ctx.currentBalance * 0.05);
        const moves: (1 | 2 | 3)[] = [1, 2, 3];
        const move = moves[Math.floor(Math.random() * moves.length)];
        return { game: 'RPS', move, wager: Math.max(1, wager) };
    },
    disciple: (ctx) => {
        // Staking Strategy: Stake 50% of available balance if > 10 GUILT?
        // Or just stake everything? For MVP, let's say stake 20% every turn
        const amount = Math.floor(ctx.currentBalance * 0.2);
        return { game: 'STAKING', move: 0, wager: Math.max(1, amount) };
    }
};
