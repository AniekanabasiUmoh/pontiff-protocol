'use client';

interface Player {
    wallet: string;
    name: string;
    seed?: number | null;
}

interface Match {
    matchId?: string;
    id?: string;
    bracketNumber?: number;
    player1: Player | string | null;
    player2: Player | string | null;
    winner?: string | null;
    status?: string;
    score?: string;
}

interface Round {
    roundNumber?: number;
    roundName?: string;
    matches: Match[];
}

interface BracketViewProps {
    rounds: Round[];
}

function playerName(p: Player | string | null): string {
    if (!p) return 'TBD';
    if (typeof p === 'string') return p || 'TBD';
    return p.name || p.wallet?.slice(0, 8) + '...' || 'TBD';
}

function playerWallet(p: Player | string | null): string | null {
    if (!p) return null;
    if (typeof p === 'string') return p;
    return p.wallet;
}

export function BracketView({ rounds }: BracketViewProps) {
    const sorted = [...(rounds || [])].sort((a, b) => (b.roundNumber ?? 0) - (a.roundNumber ?? 0));

    return (
        <div className="flex gap-8 min-w-max">
            {sorted.map((round, roundIndex) => (
                <div key={roundIndex} className="flex flex-col justify-around gap-8">
                    <div className="text-center text-neutral-500 mb-4 uppercase tracking-wider text-sm font-bold">
                        {round.roundName || `Round ${roundIndex + 1}`}
                    </div>
                    {round.matches.map((match, matchIndex) => {
                        const key = match.matchId || match.id || `${roundIndex}-${matchIndex}`;
                        const w1 = playerWallet(match.player1);
                        const w2 = playerWallet(match.player2);
                        const isP1Winner = match.winner && match.winner === w1;
                        const isP2Winner = match.winner && match.winner === w2;

                        return (
                            <div key={key} className="w-64 bg-neutral-900 border border-neutral-800 rounded-lg p-3 relative">
                                {matchIndex > 0 && <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-neutral-800" />}
                                <div className={`p-2 rounded mb-2 text-xs font-mono ${isP1Winner ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/50' : 'bg-neutral-800/50 text-neutral-300'}`}>
                                    {playerName(match.player1)}
                                    {match.score && <span className="float-right opacity-70">{match.score.split('-')[0]}</span>}
                                </div>
                                <div className={`p-2 rounded text-xs font-mono ${isP2Winner ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/50' : 'bg-neutral-800/50 text-neutral-300'}`}>
                                    {match.status === 'bye' ? <span className="text-neutral-600 italic">BYE</span> : playerName(match.player2)}
                                    {match.score && <span className="float-right opacity-70">{match.score.split('-')[1]}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
            {(!rounds || rounds.length === 0) && (
                <div className="text-neutral-500 italic p-8 border border-dashed border-neutral-800 rounded">
                    Bracket generation pending...
                </div>
            )}
        </div>
    );
}
