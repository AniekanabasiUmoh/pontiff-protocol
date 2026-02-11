export type TournamentStatus = 'open' | 'active' | 'completed';

export interface Tournament {
    id: string;
    title: string;
    description: string;
    status: TournamentStatus;
    participants: number;
    maxParticipants: number;
    prizePool: string;
    entryFee: string;
    startTime: string;
    endTime?: string;
    winner?: {
        name: string;
        address: string;
        avatar?: string;
    };
}

export interface TournamentDetail extends Tournament {
    rounds: any[]; // Define proper Round type if available, using any for now to unblock
}
