'use client';

import { useState, useEffect } from 'react';

type Agent = {
    id: string;
    handle: string;
    name: string;
    threatLevel: string;
    status: string;
    tokenSymbol: string;
    marketCap: string;
    isShadow: boolean;
};

export default function CompetitorsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/vatican/competitors');
            const data = await res.json();
            if (data.agents) {
                setAgents(data.agents);
            }
        } catch (e) {
            console.error("Failed to fetch competitors", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const triggerShadow = async (type: 'heretic' | 'prophet') => {
        await fetch('/api/debug/shadow', {
            method: 'POST',
            body: JSON.stringify({ agent: type })
        });
        alert(`Shadow ${type} triggered! Check /conversions page.`);
        fetchAgents(); // Refresh
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-200">Competitor Intelligence</h1>
                    <p className="text-neutral-500">Track and assess threat levels of rival agents.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => triggerShadow('heretic')} className="bg-red-900/40 border border-red-800 text-red-400 px-4 py-2 rounded hover:bg-red-900/60 transition text-sm">
                        Simulate Heretic Cycle
                    </button>
                    <button onClick={() => triggerShadow('prophet')} className="bg-blue-900/40 border border-blue-800 text-blue-400 px-4 py-2 rounded hover:bg-blue-900/60 transition text-sm">
                        Simulate Prophet Cycle
                    </button>
                </div>
            </header>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Agent</th>
                                <th className="p-4">Threat</th>
                                <th className="p-4">Market Cap</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 bg-neutral-900/30">
                            {agents.map(agent => (
                                <tr key={agent.id} className="hover:bg-neutral-900/50">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{agent.name}</div>
                                        <div className="text-neutral-500">@{agent.handle} • {agent.tokenSymbol}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${agent.threatLevel === 'High' ? 'bg-red-900/50 text-red-500' :
                                            agent.threatLevel === 'Medium' ? 'bg-orange-900/50 text-orange-500' :
                                                'bg-green-900/50 text-green-500'
                                            }`}>
                                            {agent.threatLevel}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-neutral-400">
                                        ${parseInt(agent.marketCap).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${agent.status === 'Converted' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-800' : 'text-neutral-400'
                                            }`}>
                                            {agent.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {agent.isShadow ? (
                                            <span className="text-purple-400 text-xs border border-purple-900/50 px-2 py-0.5 rounded">SIMULATION</span>
                                        ) : (
                                            <span className="text-neutral-600 text-xs">DETECTED</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
