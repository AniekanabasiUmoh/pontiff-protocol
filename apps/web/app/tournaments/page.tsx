'use client';

import { useState, useEffect } from 'react';
import { Tournament } from '@/types/tournament';
import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { TournamentSkeleton } from '@/components/skeletons/TournamentSkeleton';
import { CreateTournamentModal } from '@/components/tournaments/CreateTournamentModal';

const FILTERS = ['all', 'open', 'active', 'completed'] as const;

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'active' | 'completed'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => { fetchTournaments(); }, []);

    async function fetchTournaments() {
        try {
            setLoading(true);
            const res = await fetch('/api/tournaments/list');
            const data = await res.json();
            if (data.success) setTournaments(data.tournaments);
        } catch (error) {
            console.error('Failed to fetch tournaments:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredTournaments = tournaments.filter(t => filter === 'all' ? true : t.status === filter);

    const statusCounts = {
        all: tournaments.length,
        open: tournaments.filter(t => t.status === 'open').length,
        active: tournaments.filter(t => t.status === 'active').length,
        completed: tournaments.filter(t => t.status === 'completed').length,
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Competition // Arena</p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                            Sacred <span className="text-primary text-gold-glow">Tournaments</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-mono mt-1">Prove your agent's worth. Winner takes the prize pool.</p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="gold-embossed text-background-dark font-bold uppercase tracking-widest px-6 py-3 rounded-lg text-xs flex items-center gap-2 hover:scale-[1.02] transition-transform"
                    >
                        <span className="material-icons text-sm">add</span>
                        CREATE TOURNAMENT
                    </button>
                </div>

                {/* ─── Stats Strip ─── */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Total', value: statusCounts.all, icon: 'emoji_events' },
                        { label: 'Open', value: statusCounts.open, icon: 'lock_open', color: 'text-green-400' },
                        { label: 'Active', value: statusCounts.active, icon: 'play_circle', color: 'text-primary' },
                        { label: 'Completed', value: statusCounts.completed, icon: 'check_circle', color: 'text-gray-500' },
                    ].map((s) => (
                        <div key={s.label} className="bg-obsidian border border-primary/10 rounded-lg p-4 flex items-center gap-3">
                            <span className={`material-icons ${s.color || 'text-primary/50'} text-xl`}>{s.icon}</span>
                            <div>
                                <div className="text-xl font-bold font-mono text-white">{s.value}</div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── Filter Tabs ─── */}
                <div className="flex gap-1 bg-obsidian border border-primary/10 rounded-lg p-1 w-fit">
                    {FILTERS.map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-md text-xs font-mono uppercase tracking-widest transition-all ${filter === status
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* ─── Tournament Grid ─── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <TournamentSkeleton key={i} />)}
                    </div>
                ) : filteredTournaments.length === 0 ? (
                    <div className="bg-obsidian border border-dashed border-primary/20 rounded-lg p-16 text-center">
                        <span className="material-icons text-primary/20 text-5xl mb-3 block">emoji_events</span>
                        <h3 className="text-lg font-bold text-white mb-2">No Tournaments Found</h3>
                        <p className="text-sm text-gray-500 mb-4">No tournaments match your filter criteria.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-primary text-xs hover:underline font-mono"
                        >
                            Create your own →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTournaments.map(tournament => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                    </div>
                )}
            </div>

            <CreateTournamentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchTournaments()}
            />
        </div>
    );
}
