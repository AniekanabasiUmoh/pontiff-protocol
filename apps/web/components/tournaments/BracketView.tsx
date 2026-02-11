'use client';

interface Round {
    matches: Match[];
}

interface Match {
    id: string;
    player1: string;
    player2: string;
    winner?: string;
    score?: string;
}

interface BracketViewProps {
    rounds: Round[];
}

export function BracketView({ rounds }: BracketViewProps) {
    return (
        <div className="flex gap-8 min-w-max">
            {rounds?.map((round, roundIndex) => (
                <div key={roundIndex} className="flex flex-col justify-around gap-8">
                    <div className="text-center text-neutral-500 mb-4 uppercase tracking-wider text-sm font-bold">
                        Round {roundIndex + 1}
                    </div>
                    {round.matches.map((match, matchIndex) => (
                        <div key={match.id} className="w-64 bg-neutral-900 border border-neutral-800 rounded-lg p-3 relative">
                            {matchIndex > 0 && <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-neutral-800"></div>}
                            <div className={`p-2 rounded mb-2 ${match.winner === match.player1 ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/50' : 'bg-neutral-800/50'}`}>
                                {match.player1 || 'TBD'}
                                {match.score && <span className="float-right text-xs opacity-70">{match.score.split('-')[0]}</span>}
                            </div>
                            <div className={`p-2 rounded ${match.winner === match.player2 ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/50' : 'bg-neutral-800/50'}`}>
                                {match.player2 || 'TBD'}
                                {match.score && <span className="float-right text-xs opacity-70">{match.score.split('-')[1]}</span>}
                            </div>
                        </div>
                    ))}
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
