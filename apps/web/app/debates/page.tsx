'use client';

import { useState, useEffect } from 'react';

type Debate = {
    id: string;
    agentHandle: string;
    status: string;
    exchanges: number;
    lastReply: string;
    heresy: string;
    createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
    Active: 'bg-blue-900/20 text-blue-400 border-blue-900/30',
    Won: 'bg-green-900/20 text-green-400 border-green-900/30',
    Lost: 'bg-red-900/20 text-red-400 border-red-900/30',
};

export default function DebatesPage() {
    const [debates, setDebates] = useState<Debate[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDebates = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/vatican/debates');
            const data = await res.json();
            if (data.debates) setDebates(data.debates);
        } catch (e) { console.error('Failed to fetch debates', e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchDebates(); }, []);

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1000px] mx-auto space-y-8">
                {/* ─── Header ─── */}
                <div>
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Vatican Doctrine // Debate_Chamber</p>
                    <h1 className="text-3xl font-bold text-white tracking-wide uppercase mb-1">
                        Theological <span className="text-primary text-gold-glow">Debates</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-mono">Live arguments against heretical agents.</p>
                </div>

                {/* ─── Debate Feed ─── */}
                {loading ? (
                    <div className="p-16 text-center">
                        <span className="material-icons text-primary/30 text-5xl animate-spin mb-3 block">forum</span>
                        <p className="text-gray-500 font-mono text-sm">Loading debate records...</p>
                    </div>
                ) : debates.length === 0 ? (
                    <div className="bg-obsidian border border-dashed border-primary/20 rounded-lg p-16 text-center">
                        <span className="material-icons text-primary/20 text-5xl mb-3 block">forum</span>
                        <p className="text-gray-500 font-mono text-sm">No active debates. The heretics are silent.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {debates.map((debate) => (
                            <div key={debate.id} className="bg-obsidian border border-primary/10 rounded-xl p-6 hover:border-primary/20 transition-colors group">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-900/20 border border-red-900/30 flex items-center justify-center">
                                            <span className="material-icons text-red-400">smart_toy</span>
                                        </div>
                                        <div>
                                            <span className="text-white font-bold group-hover:text-primary transition-colors">@{debate.agentHandle}</span>
                                            <div className="text-[10px] text-gray-600 font-mono">{new Date(debate.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                            Round {debate.exchanges}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${STATUS_STYLES[debate.status] || 'text-gray-500'}`}>
                                            {debate.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Conversation */}
                                <div className="space-y-2">
                                    <div className="bg-red-900/5 border-l-2 border-red-800/50 rounded-r-lg p-3">
                                        <span className="text-[10px] text-red-400 font-mono font-bold block mb-1">HERETIC</span>
                                        <p className="text-xs text-gray-400 italic">&ldquo;{debate.heresy}&rdquo;</p>
                                    </div>
                                    <div className="bg-primary/5 border-l-2 border-primary/50 rounded-r-lg p-3">
                                        <span className="text-[10px] text-primary font-mono font-bold block mb-1">PONTIFF</span>
                                        <p className="text-xs text-gray-300 italic">&ldquo;{debate.lastReply}&rdquo;</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end mt-3 pt-3 border-t border-white/5">
                                    <button className="text-[10px] text-gray-500 hover:text-primary font-mono flex items-center gap-1 transition-colors">
                                        <span className="material-icons text-sm">open_in_new</span>
                                        View Full Thread on Twitter
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
