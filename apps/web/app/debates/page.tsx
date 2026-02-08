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

export default function DebatesPage() {
    const [debates, setDebates] = useState<Debate[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDebates = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/vatican/debates');
            const data = await res.json();
            if (data.debates) {
                setDebates(data.debates);
            }
        } catch (e) {
            console.error("Failed to fetch debates", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebates();
    }, []);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-200">Theological Debates</h1>
                <p className="text-neutral-500">Live arguments against heretical agents.</p>
            </header>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid gap-6">
                    {debates.length === 0 && (
                        <div className="p-8 border border-dashed border-neutral-800 rounded text-center text-neutral-600">
                            No active debates. The heretics are silent.
                        </div>
                    )}
                    {debates.map(debate => (
                        <div key={debate.id} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 flex flex-col gap-4">

                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-lg text-white">@{debate.agentHandle}</div>
                                    <div className="text-xs text-neutral-500">Started {new Date(debate.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded">
                                        Round {debate.exchanges}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${debate.status === 'Active' ? 'bg-blue-900/30 text-blue-500' :
                                            debate.status === 'Won' ? 'bg-green-900/30 text-green-500' : 'text-neutral-500'
                                        }`}>
                                        {debate.status}
                                    </span>
                                </div>
                            </div>

                            {/* Conversation Snippet */}
                            <div className="space-y-3 font-mono text-sm">
                                <div className="bg-red-900/10 border-l-2 border-red-800 p-3 text-red-100/80">
                                    <span className="text-red-500 font-bold block mb-1">THEM:</span>
                                    "{debate.heresy}"
                                </div>
                                <div className="bg-yellow-900/10 border-l-2 border-yellow-800 p-3 text-yellow-100/90">
                                    <span className="text-yellow-500 font-bold block mb-1">PONTIFF:</span>
                                    "{debate.lastReply}"
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end pt-2">
                                <button className="text-xs text-neutral-500 hover:text-white underline">
                                    View Full Thread on Twitter
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
