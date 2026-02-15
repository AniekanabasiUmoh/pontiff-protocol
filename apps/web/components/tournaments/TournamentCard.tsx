'use client';

import Link from 'next/link';
import { Tournament } from '@/types/tournament';

interface TournamentCardProps {
    tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
    const statusColors: Record<string, string> = {
        pending: 'text-primary bg-primary/10 border-primary/30',
        open: 'text-green-400 bg-green-900/30 border-green-800',
        active: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
        completed: 'text-neutral-400 bg-neutral-900/30 border-neutral-800',
    };

    return (
        <Link href={`/tournaments/${tournament.id}`} className="block group">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-yellow-700/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] h-full flex flex-col">
                {/* Header Banner */}
                <div className={`h-32 relative overflow-hidden flex items-center justify-center
                    ${tournament.status === 'active' ? 'bg-gradient-to-br from-yellow-950 via-neutral-900 to-neutral-950' :
                      tournament.status === 'completed' ? 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950' :
                      'bg-gradient-to-br from-neutral-900 via-neutral-900 to-yellow-950/30'}`}>
                    {/* Decorative cross pattern */}
                    <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 200 128" preserveAspectRatio="xMidYMid slice">
                        <pattern id={`grid-${tournament.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M20 0 L20 40 M0 20 L40 20" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-yellow-400"/>
                        </pattern>
                        <rect width="200" height="128" fill={`url(#grid-${tournament.id})`}/>
                    </svg>
                    {/* Center icon */}
                    <div className={`relative z-10 flex flex-col items-center gap-1
                        ${tournament.status === 'active' ? 'text-yellow-500/60' :
                          tournament.status === 'completed' ? 'text-neutral-500/60' :
                          'text-yellow-700/50'}`}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1">
                            <path d="M12 2 L12 22 M2 12 L22 12" strokeLinecap="round"/>
                            <path d="M7 7 L17 17 M17 7 L7 17" strokeOpacity="0.4" strokeLinecap="round"/>
                            <circle cx="12" cy="12" r="4" strokeOpacity="0.5"/>
                        </svg>
                    </div>
                    {/* Status badge */}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border ${statusColors[tournament.status] || statusColors.completed} uppercase tracking-wider`}>
                        {tournament.status}
                    </div>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-2 font-cinzel group-hover:text-yellow-500 transition-colors">
                        {tournament.name}
                    </h3>
                    <p className="text-neutral-400 text-sm mb-6 line-clamp-2 flex-grow">
                        {tournament.type || 'Holy Tournament'} · {tournament.spotsRemaining} spots remaining
                    </p>

                    <div className="space-y-3 mt-auto">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-500">Prize Pool</span>
                            <span className="text-yellow-400 font-bold font-mono">{tournament.prizePool}</span>
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
