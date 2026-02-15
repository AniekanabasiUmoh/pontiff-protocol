export type TournamentStatus = 'pending' | 'open' | 'active' | 'completed' | 'cancelled';

export interface Tournament {
    id: string;
    name: string;
    type: string;
    status: TournamentStatus;
    participants: number;
    maxParticipants: number;
    prizePool: string;
    startDate: string;
    endDate: string;
    spotsRemaining: number;
}

export interface TournamentPlayer {
    wallet: string;
    name: string;
    strategy?: string;
    seed: number;
}

export interface TournamentMatch {
    matchId: string;
    bracketNumber: number;
    player1: TournamentPlayer | null;
    player2: TournamentPlayer | null;
    winner: string | null;
    status: 'pending' | 'scheduled' | 'active' | 'completed' | 'bye';
    gameId: string | null;
    matchTimestamp: string | null;
}

export interface TournamentRound {
    roundNumber: number;
    roundName: string;
    matches: TournamentMatch[];
}

export interface TournamentDetail extends Tournament {
    rounds: TournamentRound[];
}
