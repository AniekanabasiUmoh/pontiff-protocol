'use client';

import { TournamentRound, TournamentMatch } from '@/types/tournament';

interface BracketViewProps {
    rounds: TournamentRound[];
}

export function BracketView({ rounds }: BracketViewProps) {
    if (!rounds || rounds.length === 0) {
        return <div className="text-center text-neutral-500 py-10">Bracket not generated yet.</div>;
    }

    return (
        <div className="overflow-x-auto pb-8">
            <div className="flex gap-12 min-w-max p-4">
                {rounds.map((round, roundIndex) => (
                    <div key={round.roundNumber} className="flex flex-col flex-1 min-w-[280px]">
                        <h4 className="text-center text-yellow-500 font-bold mb-6 font-cinzel uppercase tracking-widest text-sm">
                            {round.roundName}
                        </h4>

                        <div className="flex flex-col justify-around flex-grow gap-4">
                            {round.matches.map((match) => (
                                <MatchNode key={match.matchId} match={match} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MatchNode({ match }: { match: TournamentMatch }) {
    const p1 = match.player1;
    const p2 = match.player2;
    const isCompleted = match.status === 'completed';

    const getPlayerClass = (wallet?: string) => {
        if (!isCompleted || !wallet) return 'text-neutral-300';
        return match.winner === wallet ? 'text-green-400 font-bold' : 'text-neutral-500 line-through';
    };

    return (
        <div className="relative flex items-center">
            {/* Connector Line (Left) - for later rounds could be added via CSS if needed */}

            <div className="bg-neutral-900 border border-neutral-700 rounded w-full overflow-hidden shadow-lg">
                <div className="flex justify-between items-center px-3 py-2 border-b border-neutral-800 bg-black/40">
                    <span className="text-xs text-neutral-500">Match #{match.bracketNumber}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded
                        ${match.status === 'completed' ? 'bg-neutral-800 text-neutral-400' :
                            match.status === 'scheduled' ? 'bg-blue-900/30 text-blue-400' :
                                'bg-yellow-900/10 text-yellow-600 animate-pulse'}`}>
                        {match.status === 'pending' ? 'LIVE' : match.status}
                    </span>
                </div>

                {/* Player 1 */}
                <div className={`px-4 py-2 flex justify-between items-center border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors ${getPlayerClass(p1?.wallet)}`}>
                    <div className="flex items-center gap-2">
                        {p1 ? (
                            <>
                                <span className="text-xs text-neutral-500">#{p1.seed}</span>
                                <span className="truncate max-w-[150px]">{p1.name}</span>
                            </>
                        ) : (
                            <span className="text-neutral-600 italic">TBD</span>
                        )}
                    </div>
                    {isCompleted && match.winner === p1?.wallet && <span>👑</span>}
                </div>

                {/* Player 2 */}
                <div className={`px-4 py-2 flex justify-between items-center hover:bg-neutral-800/50 transition-colors ${getPlayerClass(p2?.wallet)}`}>
                    <div className="flex items-center gap-2">
                        {p2 ? (
                            <>
                                <span className="text-xs text-neutral-500">#{p2.seed}</span>
                                <span className="truncate max-w-[150px]">{p2.name}</span>
                            </>
                        ) : (
                            <span className="text-neutral-600 italic">TBD</span>
                        )}
                    </div>
                    {isCompleted && match.winner === p2?.wallet && <span>👑</span>}
                </div>
            </div>

            {/* Connector Line (Right) - simplified visual */}
            <div className="absolute right-[-24px] top-1/2 w-6 border-t border-neutral-700 hidden"></div>
        </div>
    );
}
