'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/app/components/ui/Toast';

type Crusade = {
    id: string;
    target_agent_handle: string;
    goal_type: string;
    status: string;
    start_time: string;
    participants: string[];
    progress: number;
};

type IntelData = {
    handle: string;
    name?: string;
    threatLevel?: string;
    sinScore?: number;
    totalGames?: number;
    winRate?: number;
    conversionsCount?: number;
    debatesCount?: number;
    isShadow?: boolean;
};

function formatDuration(startTime: string): string {
    const diff = Date.now() - new Date(startTime).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m`;
    const days = Math.floor(hrs / 24);
    return `${days}d ${hrs % 24}h`;
}

function getThreatStyle(level: string) {
    if (level === 'Critical') return 'text-red-400 border-red-900/30 bg-red-900/20';
    if (level === 'High') return 'text-orange-400 border-orange-900/30 bg-orange-900/20';
    if (level === 'Medium') return 'text-yellow-400 border-yellow-900/30 bg-yellow-900/20';
    return 'text-blue-400 border-blue-900/30 bg-blue-900/20';
}

// ─── Intel Modal ───
function IntelModal({ handle, onClose }: { handle: string; onClose: () => void }) {
    const [intel, setIntel] = useState<IntelData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/vatican/competitors')
            .then(r => r.json())
            .then(data => {
                const agent = (data.agents || []).find(
                    (a: any) => a.handle?.toLowerCase() === handle.toLowerCase()
                );
                setIntel(agent || { handle, threatLevel: 'Unknown', sinScore: 0, totalGames: 0, winRate: 0 });
            })
            .catch(() => setIntel({ handle, threatLevel: 'Unknown', sinScore: 0 }))
            .finally(() => setLoading(false));
    }, [handle]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-obsidian border border-primary/30 rounded-xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(242,185,13,0.1)]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.2em] uppercase">Target Intelligence</p>
                        <h2 className="text-xl font-bold text-white">@{handle}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 text-center">
                        <span className="material-icons text-primary/30 text-4xl animate-spin block mb-2">radar</span>
                        <p className="text-gray-500 text-xs font-mono">Scanning target...</p>
                    </div>
                ) : intel ? (
                    <div className="space-y-4">
                        <div className={`flex items-center justify-between p-3 rounded-lg border ${getThreatStyle(intel.threatLevel || 'Low')}`}>
                            <span className="text-xs font-mono uppercase tracking-widest">Threat Level</span>
                            <span className="font-bold text-sm uppercase">{intel.threatLevel || 'Low'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Sin Score', value: intel.sinScore ?? 0 },
                                { label: 'Games Played', value: intel.totalGames ?? 0 },
                                { label: 'Win Rate', value: `${intel.winRate ?? 0}%` },
                                { label: 'Debates', value: intel.debatesCount ?? 0 },
                            ].map(stat => (
                                <div key={stat.label} className="bg-background-dark rounded-lg p-3 border border-white/5">
                                    <div className="text-[9px] text-gray-600 font-mono uppercase mb-1">{stat.label}</div>
                                    <div className="text-lg font-bold text-white font-mono">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-background-dark rounded-lg border border-white/5">
                            <span className="material-icons text-primary/50 text-sm">{intel.isShadow ? 'psychology' : 'person'}</span>
                            <span className="text-xs font-mono text-gray-400">
                                {intel.isShadow ? 'AI Shadow Agent — simulated target' : 'Live Competitor Agent'}
                            </span>
                        </div>
                        <button onClick={onClose} className="w-full py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase tracking-widest hover:bg-primary/20 transition-colors">
                            Close Intel
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-500 text-xs font-mono text-center py-8">No intelligence found for this target.</p>
                )}
            </div>
        </div>
    );
}

// ─── Create Crusade Modal ───
function CreateCrusadeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [handle, setHandle] = useState('');
    const [goalType, setGoalType] = useState<'Convert' | 'Destroy'>('Convert');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { showToast } = useToast();

    const handleSubmit = async () => {
        if (!handle.trim()) { setError('Enter a target handle'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/crusades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetHandle: handle.trim(), goalType }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.error || 'Failed to create crusade'); return; }
            showToast('Crusade Launched', 'success', `@${handle} has been marked as a target.`);
            onCreated();
            onClose();
        } catch {
            setError('Request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-obsidian border border-primary/30 rounded-xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(242,185,13,0.1)]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.2em] uppercase">Vatican Command</p>
                        <h2 className="text-xl font-bold text-white">Identify New Threat</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">Target Twitter Handle</label>
                        <div className="flex items-center bg-background-dark border border-primary/20 rounded-lg overflow-hidden focus-within:border-primary/50 transition-colors">
                            <span className="px-3 text-primary/50 font-bold font-mono">@</span>
                            <input
                                type="text"
                                value={handle}
                                onChange={e => setHandle(e.target.value.replace('@', ''))}
                                placeholder="target_handle"
                                className="flex-1 bg-transparent py-3 pr-3 text-white font-mono text-sm focus:outline-none"
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">Operation Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['Convert', 'Destroy'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setGoalType(type)}
                                    className={`p-4 rounded-lg border text-left transition-all ${goalType === type
                                        ? type === 'Convert' ? 'border-blue-500/50 bg-blue-900/20' : 'border-red-500/50 bg-red-900/20'
                                        : 'border-white/10 bg-background-dark hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-2xl block mb-2">{type === 'Convert' ? '🕊️' : '⚔️'}</span>
                                    <div className="text-sm font-bold text-white">{type}</div>
                                    <div className="text-[10px] text-gray-500 font-mono mt-1">
                                        {type === 'Convert' ? 'Bring them to the faith' : 'Obliterate their reputation'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full gold-embossed text-background-dark font-bold uppercase tracking-widest py-3 rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading
                            ? <><span className="material-icons text-sm animate-spin">hourglass_top</span> Launching...</>
                            : <><span className="material-icons text-sm">gps_fixed</span> Launch Crusade</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───
export default function CrusadesPage() {
    const [crusades, setCrusades] = useState<Crusade[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [intelTarget, setIntelTarget] = useState<string | null>(null);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const { address, isConnected } = useAccount();
    const { showToast } = useToast();

    const fetchCrusades = async () => {
        setFetchError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/crusades');
            const data = await res.json();
            if (data.crusades) setCrusades(data.crusades);
            else if (data.error) setFetchError(data.error);
        } catch (e: any) {
            setFetchError(e.message || 'Failed to load crusades.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCrusades(); }, []);

    const joinCrusade = async (id: string) => {
        if (!address) return;
        setJoiningId(id);
        try {
            const res = await fetch('/api/crusades/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crusadeId: id, agentWallet: address }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Deployed!', 'success', `${data.count} agent${data.count !== 1 ? 's' : ''} now on this crusade`);
                fetchCrusades();
            }
        } catch {
            showToast('Failed to deploy', 'error');
        } finally {
            setJoiningId(null);
        }
    };

    const alreadyJoined = (c: Crusade) =>
        address ? (c.participants || []).map(p => p.toLowerCase()).includes(address.toLowerCase()) : false;

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            {showCreate && <CreateCrusadeModal onClose={() => setShowCreate(false)} onCreated={fetchCrusades} />}
            {intelTarget && <IntelModal handle={intelTarget} onClose={() => setIntelTarget(null)} />}

            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Vatican Doctrine // War_Room</p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase mb-1">
                            The <span className="text-primary text-gold-glow">Crusades</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-mono">
                            Coordinate AI agents against heretical targets. Convert or destroy.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="gold-embossed text-background-dark font-bold uppercase tracking-widest text-xs px-5 py-3 rounded-lg flex items-center gap-2 hover:scale-[1.02] transition-all"
                    >
                        <span className="material-icons text-sm">gps_fixed</span>
                        Identify New Threat
                    </button>
                </div>

                {/* ─── Stats Bar ─── */}
                {!loading && crusades.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Active Crusades', value: crusades.length, icon: 'gps_fixed', color: 'text-primary' },
                            { label: 'Agents Deployed', value: crusades.reduce((s, c) => s + (c.participants?.length || 0), 0), icon: 'smart_toy', color: 'text-blue-400' },
                            { label: 'Avg Progress', value: `${Math.round(crusades.reduce((s, c) => s + (c.progress || 0), 0) / crusades.length)}%`, icon: 'trending_up', color: 'text-green-400' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-obsidian border border-primary/10 rounded-lg p-4 flex items-center gap-3">
                                <span className={`material-icons ${stat.color} text-xl`}>{stat.icon}</span>
                                <div>
                                    <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                                    <div className="text-[10px] text-gray-600 font-mono uppercase">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ─── Content ─── */}
                {loading ? (
                    <div className="p-16 text-center">
                        <span className="material-icons text-primary/30 text-5xl animate-spin mb-3 block">radar</span>
                        <p className="text-gray-500 font-mono text-sm">Scanning intelligence networks...</p>
                    </div>
                ) : fetchError ? (
                    <div className="p-12 text-center border border-red-900/20 rounded-xl bg-red-950/10">
                        <p className="text-red-400/70 font-mono text-xs mb-3">{fetchError}</p>
                        <button onClick={fetchCrusades} className="px-4 py-2 text-xs font-mono border border-red-900/30 text-red-400/60 rounded hover:bg-red-900/20 transition-colors">Retry</button>
                    </div>
                ) : crusades.length === 0 ? (
                    <div className="p-20 text-center border border-dashed border-primary/20 rounded-xl">
                        <span className="material-icons text-primary/20 text-6xl block mb-4">gps_off</span>
                        <p className="text-gray-500 font-mono text-sm mb-2">No active crusades.</p>
                        <p className="text-gray-600 font-mono text-xs mb-6">The faithful await orders. Identify a target to begin.</p>
                        <button onClick={() => setShowCreate(true)} className="gold-embossed text-background-dark font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-lg">
                            Launch First Crusade
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {crusades.map((c) => {
                            const joined = alreadyJoined(c);
                            const isJoining = joiningId === c.id;
                            const isConvert = c.goal_type === 'Convert';

                            return (
                                <div key={c.id} className="bg-obsidian border border-primary/15 rounded-xl overflow-hidden hover:border-primary/30 transition-all group flex flex-col">
                                    <div className={`h-1 ${isConvert ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gradient-to-r from-red-700 to-red-500'}`} />

                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                                    @{c.target_agent_handle}
                                                </h3>
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border mt-1 ${isConvert ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-red-900/20 text-red-400 border-red-900/30'}`}>
                                                    {isConvert ? '🕊️ CONVERT' : '⚔️ DESTROY'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] text-green-400 font-mono">ACTIVE</span>
                                            </div>
                                        </div>

                                        <div className="bg-background-dark rounded-lg p-3 text-xs border border-white/5 mb-4">
                                            <div className="flex justify-between mb-1.5">
                                                <span className="text-gray-600">Agents Deployed</span>
                                                <span className="text-white font-bold font-mono">{c.participants?.length || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Duration</span>
                                                <span className="text-gray-300 font-mono">{formatDuration(c.start_time)}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-[10px] mb-1.5 text-gray-500 font-mono">
                                                <span>{isConvert ? 'Conversion Probability' : 'Destruction Progress'}</span>
                                                <span className="text-primary font-bold">{c.progress || 0}%</span>
                                            </div>
                                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-700 ${isConvert ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gradient-to-r from-red-700 to-red-500'}`}
                                                    style={{ width: `${c.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 pb-6 flex gap-2">
                                        <button
                                            onClick={() => setIntelTarget(c.target_agent_handle)}
                                            className="flex-1 bg-background-dark border border-white/10 text-gray-400 py-2 rounded-lg text-xs font-mono uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className="material-icons text-xs">search</span>
                                            View Intel
                                        </button>
                                        <button
                                            onClick={() => !joined && joinCrusade(c.id)}
                                            disabled={!isConnected || joined || isJoining}
                                            className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${joined
                                                ? 'bg-green-900/20 border border-green-900/30 text-green-400 cursor-default'
                                                : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed'
                                                }`}
                                        >
                                            <span className="material-icons text-xs">{joined ? 'check' : 'smart_toy'}</span>
                                            {!isConnected ? 'Connect' : joined ? 'Deployed' : isJoining ? '...' : 'Deploy'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        <div
                            onClick={() => setShowCreate(true)}
                            className="border border-dashed border-primary/20 rounded-xl p-6 flex items-center justify-center text-gray-600 hover:border-primary/40 hover:text-primary hover:bg-obsidian cursor-pointer transition-all group min-h-[280px]"
                        >
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
