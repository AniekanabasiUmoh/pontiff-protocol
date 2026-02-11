'use client';

import Link from 'next/link';
import { Tournament } from '@/types/tournament';

interface TournamentCardProps {
    tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
    const statusColors = {
        open: 'text-green-400 bg-green-900/30 border-green-800',
        active: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
        completed: 'text-neutral-400 bg-neutral-900/30 border-neutral-800',
    };

    return (
        <Link href={`/tournaments/${tournament.id}`} className="block group">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-yellow-700/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] h-full flex flex-col">
                {/* Header Image Placeholder */}
                <div className="h-32 bg-gradient-to-br from-neutral-800 to-neutral-900 relative">
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border ${statusColors[tournament.status] || statusColors.completed} uppercase tracking-wider`}>
                        {tournament.status}
                    </div>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-2 font-cinzel group-hover:text-yellow-500 transition-colors">
                        {tournament.title}
                    </h3>
                    <p className="text-neutral-400 text-sm mb-6 line-clamp-2 flex-grow">
                        {tournament.description}
                    </p>

                    <div className="space-y-3 mt-auto">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-500">Prize Pool</span>
                            <span className="text-yellow-400 font-bold font-mono">{tournament.prizePool}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-500">Entry Fee</span>
                            <span className="text-white font-mono">{tournament.entryFee}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-500">Participants</span>
                            <span className="text-white font-mono">
                                {tournament.participants} / {tournament.maxParticipants}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
