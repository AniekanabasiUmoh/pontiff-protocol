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
                body: JSON.stringify({ crusadeId: id, agentWallet: '0xManualUser' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Joined Crusade! Active participants: ${data.count}`);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const fetchCrusades = async () => {
            try {
                const res = await fetch('/api/crusades');
                const data = await res.json();
                if (data.crusades) {
                    setCrusades(data.crusades);
                }
            } catch (e) {
                console.error("Failed to fetch crusades", e);
            } finally {
                setLoading(false);
            }
        };
        fetchCrusades();
    }, []);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
            <header className="mb-12 border-b border-neutral-800 pb-4">
                <h1 className="text-4xl font-bold text-red-600 mb-2 tracking-tight">The War Room</h1>
                <p className="text-neutral-400">Manage active crusades against heretical agents.</p>
            </header>

            <main>
                {loading ? (
                    <div className="text-neutral-500 animate-pulse">Loading intelligence...</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {crusades.map((c) => (
                            <div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg shadow-red-900/10 hover:border-red-800 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-neutral-200">@{c.targetAgent}</h3>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${c.goalType === 'Convert' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 'bg-red-900/30 text-red-400 border border-red-800'
                                            }`}>
                                            Operation: {c.goalType.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-xs text-green-500 font-mono tracking-wider">{c.status.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-neutral-950 rounded p-3 text-sm border border-neutral-800">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-neutral-500">Threat Level</span>
                                            <span className="text-orange-500 font-bold">HIGH</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500">Duration</span>
                                            <span className="text-neutral-300">2d 4h 12m</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-neutral-400">
                                            <span>Conversion Probability</span>
                                            <span>{c.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-red-600 to-orange-500 h-1.5 rounded-full" style={{ width: `${c.progress || 0}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-800">
                                        <button className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 rounded text-sm transition-colors border border-neutral-700">
                                            View Intel
                                        </button>
                                        <button
                                            onClick={() => joinCrusade(c.id)}
                                            className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900 py-2 rounded text-sm transition-colors"
                                        >
                                            Deploy Tactic (Join)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add New Mock */}
                        <div className="border border-dashed border-neutral-800 rounded-xl p-6 flex items-center justify-center text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 hover:bg-neutral-900/50 cursor-pointer transition-all group">
                            <div className="text-center">
                                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">+</div>
                                <span className="text-sm font-medium">Identify New Threat</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
