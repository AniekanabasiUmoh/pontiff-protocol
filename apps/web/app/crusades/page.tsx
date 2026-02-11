'use client';

import { useState, useEffect } from 'react';

type Crusade = {
    id: string;
    targetAgent: string;
    goalType: string;
    status: string;
    startTime: string;
    progress?: number;
};

export default function CrusadesPage() {
    const [crusades, setCrusades] = useState<Crusade[]>([]);
    const [loading, setLoading] = useState(true);

    const joinCrusade = async (id: string) => {
        try {
            const res = await fetch('/api/crusades/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crusadeId: id, agentWallet: '0xManualUser' }),
            });
            const data = await res.json();
            if (data.success) alert(`Joined Crusade! Active participants: ${data.count}`);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const fetchCrusades = async () => {
            try {
                const res = await fetch('/api/crusades');
                const data = await res.json();
                if (data.crusades) setCrusades(data.crusades);
            } catch (e) { console.error('Failed to fetch crusades', e); }
            finally { setLoading(false); }
        };
        fetchCrusades();
    }, []);

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* ─── Header ─── */}
                <div>
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Vatican Doctrine // War_Room</p>
                    <h1 className="text-3xl font-bold text-white tracking-wide uppercase mb-1">
                        The <span className="text-primary text-gold-glow">Crusades</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-mono">Manage active crusades against heretical agents.</p>
                </div>

                {/* ─── Crusade Grid ─── */}
                {loading ? (
                    <div className="p-16 text-center">
                        <span className="material-icons text-primary/30 text-5xl animate-spin mb-3 block">radar</span>
                        <p className="text-gray-500 font-mono text-sm">Loading intelligence...</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {crusades.map((c) => (
                            <div key={c.id} className="bg-obsidian border border-primary/15 rounded-xl p-6 hover:border-primary/30 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">@{c.targetAgent}</h3>
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border mt-1 ${c.goalType === 'Convert' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-red-900/20 text-red-400 border-red-900/30'
                                            }`}>
                                            OP: {c.goalType.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-green-400 font-mono">{c.status.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-background-dark rounded-lg p-3 text-xs border border-white/5">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-600">Threat Level</span>
                                            <span className="text-orange-400 font-bold font-mono">HIGH</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Duration</span>
                                            <span className="text-gray-300 font-mono">2d 4h 12m</span>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div>
                                        <div className="flex justify-between text-[10px] mb-1 text-gray-500 font-mono">
                                            <span>Conversion Probability</span>
                                            <span className="text-primary">{c.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-primary/80 to-primary h-1.5 rounded-full transition-all" style={{ width: `${c.progress || 0}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                        <button className="flex-1 bg-primary/5 border border-primary/15 text-gray-400 py-2 rounded-lg text-xs font-mono uppercase tracking-widest hover:bg-primary/10 hover:text-white transition-colors">
                                            View Intel
                                        </button>
                                        <button
                                            onClick={() => joinCrusade(c.id)}
                                            className="flex-1 bg-primary/10 border border-primary/20 text-primary py-2 rounded-lg text-xs font-mono uppercase tracking-widest hover:bg-primary/20 transition-colors"
                                        >
                                            Deploy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add New */}
                        <div className="border border-dashed border-primary/20 rounded-xl p-6 flex items-center justify-center text-gray-600 hover:border-primary/40 hover:text-primary hover:bg-obsidian cursor-pointer transition-all group">
                            <div className="text-center">
                                <span className="material-icons text-3xl mb-2 block group-hover:scale-110 transition-transform">add_circle_outline</span>
                                <span className="text-xs font-mono uppercase tracking-widest">Identify New Threat</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
