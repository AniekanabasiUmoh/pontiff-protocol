'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { BracketView } from '@/components/tournaments/BracketView';
import { BracketSkeleton } from '@/components/skeletons/BracketSkeleton';
import { TournamentDetail } from '@/types/tournament';

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [tournament, setTournament] = useState<TournamentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchTournament(id);
    }, [id]);

    async function fetchTournament(tournamentId: string) {
        try {
            const res = await fetch(`/api/tournaments/${tournamentId}/bracket`);
            if (!res.ok) {
                if (res.status === 404) notFound();
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            if (data.success) {
                setTournament(data);
            } else {
                setError(data.error || 'Failed to load tournament');
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto">
                    <div className="h-20 bg-obsidian border border-gray-800 rounded animate-pulse mb-6" />
                    <BracketSkeleton />
                </div>
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-900/30 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Error Loading Tournament</h2>
                    <p className="text-sm text-gray-500 font-mono mb-6">{error || 'Tournament data unavailable'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-primary/10 text-primary border border-primary/30 rounded text-sm font-mono uppercase tracking-widest hover:bg-primary/20 transition-all"
                    >
                        [ RETRY ]
                    </button>
                </div>
            </div>
        );
    }

    const statusColor = tournament.status === 'active'
        ? 'bg-green-900/20 text-green-400 border-green-900/30'
        : (tournament.status === 'open' || tournament.status === 'pending')
            ? 'bg-primary/10 text-primary border-primary/30'
            : 'bg-gray-800 text-gray-400 border-gray-700';

    return (
        <div className="min-h-[calc(100vh-5rem)] flex flex-col">
            {/* ─── Header Bar ─── */}
            <div className="border-b border-primary/20 bg-obsidian/50 px-6 py-4">
                <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase">System &gt; Tournaments &gt;</p>
                            <span className="text-[10px] font-mono text-primary font-bold">INQUISITOR&apos;S_MAP_V2</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-white tracking-wide uppercase">
                                {tournament.name}
                            </h1>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${statusColor}`}>
                                {tournament.status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                            {tournament.participants} / {tournament.maxParticipants} Gladiators • Prize Pool: <span className="text-primary">{tournament.prizePool}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Info cards */}
                        <div className="hidden md:flex gap-3">
                            <div className="bg-black/60 border border-gray-800 px-3 py-2 rounded">
                                <p className="text-[10px] font-mono text-gray-500 uppercase">Entry Fee</p>
                                <p className="text-sm font-mono text-white">500 GUILT</p>
                            </div>
                            <div className="bg-black/60 border border-gray-800 px-3 py-2 rounded">
                                <p className="text-[10px] font-mono text-gray-500 uppercase">Prize Pool</p>
                                <p className="text-sm font-mono text-primary">{tournament.prizePool}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        {(tournament.status === 'open' || tournament.status === 'pending') && (
                            <button className="px-6 py-3 bg-primary/10 text-primary border border-primary rounded font-mono font-bold text-sm uppercase tracking-widest hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(242,185,13,0.2)] hover:shadow-[0_0_25px_rgba(242,185,13,0.4)]">
                                [ REGISTER_AGENT ]
                            </button>
                        )}
                        {(tournament.status === 'open' || tournament.status === 'pending') && tournament.participants >= 2 && (
                            <button className="px-6 py-3 bg-green-900/20 text-green-400 border border-green-900/30 rounded font-mono font-bold text-sm uppercase tracking-widest hover:bg-green-900/30 transition-all">
                                [ START ]
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Main Content: Sidebar + Bracket ─── */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <aside className="w-72 border-r border-primary/20 bg-obsidian hidden lg:flex flex-col shrink-0">
                    {/* Rules */}
                    <div className="p-5 border-b border-primary/10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-mono text-xs uppercase text-primary tracking-widest">&gt; MORTAL STAKES (RULES)</h3>
                        </div>
                        <div className="font-mono text-xs text-gray-400 bg-black/60 p-3 rounded border-l-2 border-primary/30 h-40 overflow-y-auto leading-relaxed custom-scrollbar">
                            <span className="text-gray-600">01.</span> AGENT MUST PASS VERIFICATION.<br />
                            <span className="text-gray-600">02.</span> SINGLE ELIMINATION BRACKET.<br />
                            <span className="text-gray-600">03.</span> TIMEOUT: 100MS LATENCY MAX.<br />
                            <span className="text-gray-600">04.</span> <span className="text-red-500 font-bold">WARNING:</span> MODEL COLLAPSE = DQ.<br />
                            <span className="text-gray-600">05.</span> PROTOCOL 7 ENABLED.<br />
                            <span className="text-gray-600">06.</span> NO REFUNDS ON DISQUALIFICATION.<br />
                            <span className="text-gray-600">07.</span> ORACLE VERIFIED OUTCOMES.<br />
                            <span className="animate-pulse text-primary">_</span>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="p-5 border-b border-primary/10">
                        <h3 className="font-mono text-xs uppercase text-gray-500 tracking-widest mb-3">
                            CONFIRMED ENTRANTS ({tournament.participants}/{tournament.maxParticipants})
                        </h3>
                        <div className="flex -space-x-2 overflow-hidden py-1">
                            {[...Array(Math.min(tournament.participants, 4))].map((_, i) => (
                                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-[#050505] bg-gray-800 flex items-center justify-center text-[10px] text-gray-500 font-mono">
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                            {tournament.participants > 4 && (
                                <div className="h-8 w-8 rounded-full ring-2 ring-[#050505] bg-gray-900 flex items-center justify-center text-xs font-mono text-gray-400">
                                    +{tournament.participants - 4}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status seal */}
                    <div className="p-5 flex-1 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-amber-700 shadow-[2px_4px_10px_rgba(0,0,0,0.8),inset_2px_2px_5px_rgba(255,255,255,0.4)] border-2 border-amber-800 transform rotate-12 hover:rotate-0 transition-transform duration-500 cursor-help">
                            <div className="text-center">
                                <div className="text-[8px] font-mono text-black/60 uppercase font-bold">Status</div>
                                <div className="text-xs font-bold text-black/90 uppercase">{tournament.status}</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Bracket Area */}
                <section className="flex-1 relative overflow-hidden flex flex-col">
                    {/* Grid background */}
                    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#b38600 1px, transparent 1px), linear-gradient(90deg, #b38600 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
                    <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#f2b90d 0.5px, transparent 0.5px), linear-gradient(90deg, #f2b90d 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />

                    <div className="flex-1 overflow-auto p-8 relative z-10 custom-scrollbar">
                        <BracketView rounds={tournament.rounds} />
                    </div>

                    {/* Terminal log bar */}
                    <div className="h-28 bg-black border-t border-primary/20 p-4 font-mono text-xs overflow-y-auto z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.8)] custom-scrollbar">
                        <div className="text-gray-600 mb-1">&gt; Initializing socket connection... OK</div>
                        <div className="text-gray-600 mb-1">&gt; Loading bracket data for tournament {id}... OK</div>
                        <div className="text-green-400 mb-1">&gt; {tournament.participants} gladiators registered.</div>
                        <div className="text-primary mb-1">&gt; SYSTEM: Tournament status is {tournament.status?.toUpperCase()}.</div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400">&gt;</span>
                            <span className="animate-pulse bg-primary w-2 h-4 block shadow-[0_0_5px_#f2b90d]"></span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
