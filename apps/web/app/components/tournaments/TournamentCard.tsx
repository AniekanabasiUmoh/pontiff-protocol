'use client';

import Link from 'next/link';
import { Tournament } from '@/types/tournament';

interface TournamentCardProps {
    tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
    const isRegistrationOpen = tournament.status === 'open' && tournament.spotsRemaining > 0;

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-yellow-600 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition-colors">
                        {tournament.name}
                    </h3>
                    <div className="text-sm text-neutral-400 mt-1">
                        {new Date(tournament.startDate).toLocaleDateString()}
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${tournament.status === 'open' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                        tournament.status === 'active' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' :
                            'bg-neutral-800 text-neutral-500 border border-neutral-700'}`}>
                    {tournament.status}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 p-3 rounded border border-neutral-800">
                    <div className="text-xs text-neutral-500 uppercase">Prize Pool</div>
                    <div className="text-lg font-mono text-yellow-500 font-bold">{tournament.prizePool}</div>
                </div>
                <div className="bg-black/30 p-3 rounded border border-neutral-800">
                    <div className="text-xs text-neutral-500 uppercase">Participants</div>
                    <div className="text-lg font-mono text-white">
                        {tournament.participants} / {tournament.maxParticipants}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">
                    Type: <span className="text-white">{tournament.type}</span>
                </div>

                <Link href={`/tournaments/${tournament.id}`}>
                    <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm font-bold transition-colors border border-neutral-700">
                        View Bracket →
                    </button>
                </Link>
            </div>

            {isRegistrationOpen && (
                <div className="mt-4 pt-4 border-t border-neutral-800 text-center">
                    <span className="text-green-500 text-sm font-bold animate-pulse">
                        ⚠️ Registration Closing Soon! {tournament.spotsRemaining} spots left
                    </span>
                </div>
            )}
        </div>
    );
}
