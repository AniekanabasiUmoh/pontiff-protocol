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

const THREAT_STYLES: Record<string, string> = {
    High: 'bg-red-900/20 text-red-400 border-red-900/30',
    Medium: 'bg-primary/10 text-primary border-primary/20',
    Low: 'bg-green-900/20 text-green-400 border-green-900/30',
};

export default function CompetitorsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/vatican/competitors');
            const data = await res.json();
            if (data.agents) setAgents(data.agents);
        } catch (e) {
            console.error('Failed to fetch competitors', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAgents(); }, []);

    const triggerShadow = async (type: 'heretic' | 'prophet') => {
        await fetch('/api/debug/shadow', { method: 'POST', body: JSON.stringify({ agent: type }) });
        alert(`Shadow ${type} triggered! Check /conversions page.`);
        fetchAgents();
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Vatican Intel // Threat_Matrix</p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                            Competitor <span className="text-primary text-gold-glow">Intelligence</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-mono mt-1">Track and assess threat levels of rival agents.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => triggerShadow('heretic')}
                            className="bg-red-900/10 border border-red-900/30 text-red-400 px-4 py-2 rounded-lg hover:bg-red-900/20 transition text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                            <span className="material-icons text-sm">warning</span> Sim Heretic
                        </button>
                        <button onClick={() => triggerShadow('prophet')}
                            className="bg-blue-900/10 border border-blue-900/30 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-900/20 transition text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                            <span className="material-icons text-sm">auto_fix_high</span> Sim Prophet
                        </button>
                    </div>
                </div>

                {/* ─── Intel Table ─── */}
                <div className="bg-obsidian rounded-lg border border-primary/10 overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center">
                            <span className="material-icons text-primary/30 text-5xl animate-spin mb-3 block">radar</span>
                            <p className="text-gray-500 font-mono text-sm">Scanning competing agents...</p>
                        </div>
                    ) : agents.length === 0 ? (
                        <div className="p-16 text-center">
                            <span className="material-icons text-primary/20 text-5xl mb-3 block">security</span>
                            <p className="text-gray-500 font-mono text-sm">No threats detected in the current epoch.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-primary/5 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-primary/10">
                                <div className="col-span-4">Agent</div>
                                <div className="col-span-2 text-center">Threat</div>
                                <div className="col-span-2 text-right">Market Cap</div>
                                <div className="col-span-2 text-center">Status</div>
                                <div className="col-span-2 text-center">Type</div>
                            </div>

                            {/* Rows */}
                            {agents.map((agent) => (
                                <div key={agent.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center group">
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <span className="material-icons text-primary text-lg">smart_toy</span>
                                        </div>
                                        <div>
                                            <div className="text-sm text-white font-bold group-hover:text-primary transition-colors">{agent.name}</div>
                                            <div className="text-[10px] text-gray-600 font-mono">@{agent.handle} • ${agent.tokenSymbol}</div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${THREAT_STYLES[agent.threatLevel] || 'text-gray-400'}`}>
                                            {agent.threatLevel.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right font-mono text-sm text-gray-400">
                                        ${parseInt(agent.marketCap).toLocaleString()}
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono border ${agent.status === 'Converted'
                                                ? 'bg-primary/10 text-primary border-primary/20'
                                                : 'bg-white/5 text-gray-500 border-white/10'
                                            }`}>
                                            {agent.status}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        {agent.isShadow ? (
                                            <span className="text-purple-400 text-[10px] font-mono border border-purple-900/30 bg-purple-900/10 px-2 py-0.5 rounded">SIMULATION</span>
                                        ) : (
                                            <span className="text-gray-600 text-[10px] font-mono">DETECTED</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
