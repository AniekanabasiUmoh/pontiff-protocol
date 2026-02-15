'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { AgentConfigModal } from '@/components/modals/AgentConfigModal';
import AgentDetailModal from '@/components/modals/AgentDetailModal';

// ─── Types ───
interface KPI { label: string; value: string; unit: string; icon: string; change: string; changePositive: boolean; featured: boolean; }
interface Session { id: string; sessionWallet?: string; strategyIndex?: number; agentName: string; agentType: string; game: string; gameIcon: string; deposit: string; pnl: string; pnlPositive: boolean; winRate: string; gamesPlayed: number; status: 'active' | 'cooldown' | 'stopped' | 'unknown'; uptime: string; }
interface DashboardData { kpi: KPI[]; sessions: Session[]; }

// ─── Agent Archetypes ───
const AGENTS = [
    {
        id: 'berzerker', name: 'The Berzerker', icon: '⚔️', archetype: 'Aggressor',
        description: 'Maximizes volatility. Aggressive betting, all-in tendencies. High risk, high reward.',
        stats: { winRate: '68%', avgReturn: '+142%', risk: 'EXTREME', games: 'Poker, RPS' },
        traits: ['All-in tendency', 'Bluff detection', 'Pattern breaker', 'Tilt immunity'],
        color: 'from-red-900/30 to-red-950/10', borderColor: 'border-red-800/30 hover:border-red-600/50',
        accentColor: 'text-red-400', bgAccent: 'bg-red-900/10',
    },
    {
        id: 'merchant', name: 'The Merchant', icon: '💰', archetype: 'Calculator',
        description: 'Pattern-recognizing profit seeker. Calculates expected value for every decision.',
        stats: { winRate: '55%', avgReturn: '+64%', risk: 'MEDIUM', games: 'Poker, Judas' },
        traits: ['EV optimization', 'Bankroll management', 'Statistical modeling', 'Risk hedging'],
        color: 'from-primary/20 to-primary/5', borderColor: 'border-primary/30 hover:border-primary/60',
        accentColor: 'text-primary', bgAccent: 'bg-primary/10', featured: true,
    },
    {
        id: 'disciple', name: 'The Disciple', icon: '🙏', archetype: 'Preserver',
        description: 'Capital preservation above all. Conservative staking, compounding yield.',
        stats: { winRate: '42%', avgReturn: '+28%', risk: 'LOW', games: 'Staking, RPS' },
        traits: ['Capital preservation', 'Yield compounding', 'Auto-rebalancing', 'Loss prevention'],
        color: 'from-blue-900/20 to-blue-950/10', borderColor: 'border-blue-800/30 hover:border-blue-600/50',
        accentColor: 'text-blue-400', bgAccent: 'bg-blue-900/10',
    },
];

async function fetchDashboardStats(walletAddress?: string): Promise<DashboardData> {
    const url = walletAddress ? `/api/dashboard/stats?wallet=${walletAddress}` : '/api/dashboard/stats';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
}

// ─── Deploy Tab ───
function DeployTab() {
    const searchParams = useSearchParams();
    const agentId = searchParams.get('agent');
    const [selectedAgent, setSelectedAgent] = useState<typeof AGENTS[0] | null>(null);

    useEffect(() => {
        if (agentId) {
            const found = AGENTS.find(a => a.id === agentId);
            if (found) setSelectedAgent(found);
        }
    }, [agentId]);

    const handleClose = () => {
        setSelectedAgent(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('agent');
        window.history.pushState({}, '', url);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {AGENTS.map((agent) => (
                    <div
                        key={agent.id}
                        className={`relative bg-obsidian rounded-xl border overflow-hidden transition-all duration-300 group hover:-translate-y-1 flex flex-col cursor-pointer ${agent.borderColor}`}
                        onClick={() => setSelectedAgent(agent)}
                    >
                        {agent.featured && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />}
                        <div className={`absolute inset-0 bg-gradient-to-b ${agent.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className="relative z-10 p-6 flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-xl ${agent.bgAccent} border border-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                                    {agent.icon}
                                </div>
                                <div>
                                    <div className={`text-[10px] font-mono ${agent.accentColor} uppercase tracking-widest`}>{agent.archetype}</div>
                                    <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-5 leading-relaxed">{agent.description}</p>
                            <div className="grid grid-cols-2 gap-2 mb-5">
                                {[{ label: 'Win Rate', value: agent.stats.winRate }, { label: 'Avg Return', value: agent.stats.avgReturn }, { label: 'Risk', value: agent.stats.risk }, { label: 'Games', value: agent.stats.games }].map((stat) => (
                                    <div key={stat.label} className="bg-background-dark rounded-lg p-2 border border-white/5">
                                        <div className="text-[9px] text-gray-600 font-mono uppercase">{stat.label}</div>
                                        <div className={`text-xs font-mono font-bold ${stat.label === 'Risk' ? (stat.value === 'EXTREME' ? 'text-red-400' : stat.value === 'MEDIUM' ? 'text-primary' : 'text-blue-400') : 'text-white'}`}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {agent.traits.map((trait) => (
                                    <span key={trait} className="text-[9px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">{trait}</span>
                                ))}
                            </div>
                        </div>
                        <div className="relative z-10 p-6 pt-0">
                            <button className={`w-full py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${agent.featured ? 'gold-embossed text-background-dark hover:scale-[1.02]' : `${agent.bgAccent} ${agent.accentColor} border border-current/20 hover:scale-[1.02]`}`}>
                                <span className="material-icons text-sm">smart_toy</span>
                                CONFIGURE & HIRE
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: 'security', title: 'Session Wallets', desc: 'Agents operate from isolated session wallets. Your main wallet is never at risk.' },
                    { icon: 'trending_up', title: 'Autonomous Play', desc: 'Once deployed, agents play 24/7 without intervention. Track performance live.' },
                    { icon: 'account_balance', title: 'Withdraw Anytime', desc: 'Stop your agent and withdraw remaining funds at any time. No lock-ups.' },
                ].map((info) => (
                    <div key={info.title} className="bg-obsidian border border-primary/10 rounded-lg p-5 flex gap-4 group hover:border-primary/20 transition-colors">
                        <span className="material-icons text-primary/50 text-xl group-hover:text-primary/80 transition-colors">{info.icon}</span>
                        <div>
                            <div className="text-sm text-white font-bold mb-1">{info.title}</div>
                            <div className="text-xs text-gray-500 leading-relaxed">{info.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedAgent && <AgentConfigModal isOpen={!!selectedAgent} onClose={handleClose} agent={selectedAgent} />}
        </>
    );
}

// ─── My Agents Tab ───
function MyAgentsTab() {
    const { address } = useAccount();
    const [filter, setFilter] = useState<'all' | 'active' | 'cooldown' | 'stopped'>('all');
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['dashboardStats', address],
        queryFn: () => fetchDashboardStats(address),
        refetchInterval: 5000,
    });

    useQuery({
        queryKey: ['autoStartAgents', address],
        queryFn: async () => {
            if (!address) return null;
            const res = await fetch('/api/agents/auto-start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userAddress: address }) });
            if (!res.ok) throw new Error('Failed to auto-start');
            return res.json();
        },
        enabled: !!address,
        refetchInterval: 60000,
        retry: false,
    });

    const filteredSessions = !stats ? [] : filter === 'all' ? stats.sessions : stats.sessions.filter(s => s.status === filter);

    if (isLoading) return (
        <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-lg border border-white/10" />)}</div>
            <div className="h-64 bg-white/5 rounded-lg border border-white/10" />
        </div>
    );

    if (isError || !stats) return (
        <div className="p-12 text-center text-gray-500">
            <span className="material-icons text-5xl mb-4 text-red-500 block">error_outline</span>
            <p>Failed to load agent data.</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors">Retry</button>
        </div>
    );

    return (
        <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.kpi.map((card) => (
                    <div key={card.label} className={`relative overflow-hidden rounded-lg p-5 border transition-all duration-300 group hover:-translate-y-0.5 ${card.featured ? 'bg-primary/5 border-primary/40 shadow-[0_0_20px_-5px_rgba(242,185,13,0.2)]' : 'bg-obsidian border-primary/10 hover:border-primary/30'}`}>
                        <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-icons text-5xl text-primary">{card.icon}</span>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`material-icons text-lg ${card.featured ? 'text-primary' : 'text-gray-500'}`}>{card.icon}</span>
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{card.label}</span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className={`text-3xl font-bold font-mono ${card.featured ? 'text-primary text-gold-glow' : 'text-white'}`}>{card.value}</span>
                                <span className="text-xs text-gray-500 font-mono">{card.unit}</span>
                            </div>
                            <div className={`text-xs font-mono flex items-center gap-1 ${card.changePositive ? 'text-green-400' : 'text-red-400'}`}>
                                <span className="material-icons text-xs">{card.changePositive ? 'arrow_upward' : 'arrow_downward'}</span>
                                {card.change} <span className="text-gray-600">24h</span>
                            </div>
                        </div>
                        {card.featured && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />}
                    </div>
                ))}
            </div>

            {/* Sessions Table */}
            <div className="bg-obsidian rounded-lg border border-primary/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-primary/5">
                    <h2 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        <span className="material-icons text-primary text-lg">history_edu</span>
                        Active Sessions
                    </h2>
                    <div className="flex gap-1">
                        {(['all', 'active', 'cooldown', 'stopped'] as const).map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest rounded transition-colors ${filter === f ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-500 hover:text-primary border border-transparent'}`}>{f}</button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-primary/10">
                                <th className="p-4 pl-6">Agent</th>
                                <th className="p-4">Game</th>
                                <th className="p-4 text-right">Deposit</th>
                                <th className="p-4 text-right">P&L</th>
                                <th className="p-4 text-center">Win Rate</th>
                                <th className="p-4 text-center">Games</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right pr-6">Uptime</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredSessions.map((session) => (
                                <tr key={session.id} className="group border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedSession(session)}>
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                <span className="material-icons text-primary text-base">smart_toy</span>
                                            </div>
                                            <div>
                                                <div className="text-white font-bold group-hover:text-primary transition-colors text-sm">{session.agentName}</div>
                                                <div className="text-[10px] text-gray-600 font-mono">{session.agentType}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4"><div className="flex items-center gap-2"><span className="material-icons text-gray-500 text-sm">{session.gameIcon}</span><span className="text-gray-400 text-xs font-mono">{session.game}</span></div></td>
                                    <td className="p-4 text-right font-mono text-gray-400">{session.deposit}</td>
                                    <td className={`p-4 text-right font-mono font-bold ${session.pnlPositive ? 'text-green-400' : 'text-red-400'}`}>{session.pnl}</td>
                                    <td className="p-4 text-center font-mono text-gray-300">{session.winRate}</td>
                                    <td className="p-4 text-center font-mono text-gray-500">{session.gamesPlayed}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${session.status === 'active' ? 'bg-green-900/20 text-green-400 border border-green-900/30' : session.status === 'cooldown' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'active' ? 'bg-green-400 animate-pulse' : session.status === 'cooldown' ? 'bg-primary' : 'bg-gray-500'}`} />
                                            {session.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right pr-6 font-mono text-gray-500 text-xs">{session.uptime}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredSessions.length === 0 && (
                    <div className="p-12 text-center text-gray-600">
                        <span className="material-icons text-4xl text-gray-700 mb-3 block">smart_toy</span>
                        <p className="mb-2">No sessions match this filter.</p>
                        <button className="text-primary hover:underline text-sm">Deploy a new agent above</button>
                    </div>
                )}
            </div>

            {selectedSession && <AgentDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} onStatusChange={() => setSelectedSession(null)} />}
        </>
    );
}

// ─── Main Page ───
function AgentsPageContent() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') === 'deploy' ? 'deploy' : 'agents';
    const [activeTab, setActiveTab] = useState<'agents' | 'deploy'>(defaultTab as any);

    return (
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">The Pontiff // Agent_Seminary</p>
                    <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                        Agent <span className="text-primary text-gold-glow">Seminary</span>
                    </h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 border-b border-primary/10">
                <button
                    onClick={() => setActiveTab('agents')}
                    className={`px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest transition-all border-b-2 -mb-px ${activeTab === 'agents' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
                >
                    <span className="flex items-center gap-2">
                        <span className="material-icons text-sm">history_edu</span>
                        My Agents
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('deploy')}
                    className={`px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest transition-all border-b-2 -mb-px ${activeTab === 'deploy' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
                >
                    <span className="flex items-center gap-2">
                        <span className="material-icons text-sm">add_circle</span>
                        Deploy New Agent
                    </span>
                </button>
            </div>

            {activeTab === 'agents' ? <MyAgentsTab /> : <DeployTab />}
        </div>
    );
}

export default function AgentsPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-primary font-mono animate-pulse">Loading Seminary...</div>}>
            <AgentsPageContent />
        </Suspense>
    );
}
