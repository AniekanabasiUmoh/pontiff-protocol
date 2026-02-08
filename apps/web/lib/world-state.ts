export type PontiffPersonality = "Zealot" | "Merchant" | "Heretic";

export interface LeaderboardEntry {
    rank: number;
    agentAddress: string;
    score: number;
    metadata?: Record<string, any>;
}

export interface GameState {
    id: string;
    type: "RPS" | "Poker" | "JudasProtocol";
    players: string[];
    status: "pending" | "active" | "completed";
    wager: string;
}

export interface VaticanWorldState {
    // Core Vatican State
    currentPontiff: PontiffPersonality;
    treasuryBalance: string; // GUILT tokens
    totalEntrants: number;

    // Judas Protocol / Time State
    currentEpoch: number;
    epochTimeRemaining: number; // seconds
    betrayalPercentage: number;

    // Active Activity
    activeGames: GameState[];
    recentConfessions: number;

    // Leaderboards
    topSinners: LeaderboardEntry[];
    topSaints: LeaderboardEntry[];

    // System Status
    lastUpdated: string;
}
