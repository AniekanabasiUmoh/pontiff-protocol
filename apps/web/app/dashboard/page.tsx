'use client';

import { useState } from 'react';
import Link from 'next/link';

const KPI_CARDS = [
    {
        label: 'Vault Reserves',
        value: '42,093',
        unit: '$GUILT',
        icon: 'account_balance',
        change: '+12.4%',
        changePositive: true,
        featured: true,
    },
    {
        label: 'Active Sinners',
        value: '8,921',
        unit: 'ONLINE',
        icon: 'people',
        change: '+340',
        changePositive: true,
        featured: false,
    },
    {
        label: 'Net Indulgences',
        value: '1,247',
        unit: 'BURNED',
        icon: 'local_fire_department',
        change: '-2.1%',
        changePositive: false,
        featured: false,
    },
    {
        label: 'Agent Win Rate',
        value: '64.2',
        unit: '%',
        icon: 'trending_up',
        change: '+5.8%',
        changePositive: true,
        featured: false,
    },
];

const SESSIONS = [
    {
        id: 'sess-001',
        agentName: 'The Berzerker',
        agentType: 'Aggressor',
        game: 'Poker',
        gameIcon: 'style',
        deposit: '5,000',
        pnl: '+1,247',
        pnlPositive: true,
        winRate: '68%',
        gamesPlayed: 142,
        status: 'active',
        uptime: '4h 22m',
    },
    {
        id: 'sess-002',
        agentName: 'The Merchant',
        agentType: 'Calculator',
        game: 'RPS',
        gameIcon: 'sports_mma',
        deposit: '2,500',
        pnl: '+412',
        pnlPositive: true,
        winRate: '55%',
        gamesPlayed: 89,
        status: 'active',
        uptime: '2h 10m',
    },
    {
        id: 'sess-003',
        agentName: 'The Disciple',
        agentType: 'Preserver',
        game: 'Judas',
        gameIcon: 'visibility',
        deposit: '10,000',
        pnl: '-340',
        pnlPositive: false,
        winRate: '42%',
        gamesPlayed: 31,
        status: 'cooldown',
        uptime: '1h 05m',
    },
    {
        id: 'sess-004',
        agentName: 'Shadow Agent',
        agentType: 'Aggressor',
        game: 'Poker',
        gameIcon: 'style',
        deposit: '8,200',
        pnl: '+3,891',
        pnlPositive: true,
        winRate: '72%',
        gamesPlayed: 256,
        status: 'active',
        uptime: '12h 44m',
    },
];

const DIAGNOSTICS = [
    { label: 'RPC Latency', value: '12ms', status: 'good' },
    { label: 'Contract Calls (24h)', value: '4,291', status: 'good' },
    { label: 'Failed TXs', value: '3', status: 'warning' },
    { label: 'Gas Used (24h)', value: '0.42 ETH', status: 'good' },
    { label: 'Oracle Uptime', value: '99.97%', status: 'good' },
];

export default function DashboardPage() {
    const [filter, setFilter] = useState<'all' | 'active' | 'cooldown' | 'stopped'>('all');

    const filteredSessions = filter === 'all'
        ? SESSIONS
        : SESSIONS.filter(s => s.status === filter);

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* ─── Header ─── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">System: Console_V4</p>
                    <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                        High Priest&apos;s <span className="text-primary text-gold-glow">Console</span>
                    </h1>
                </div>
                <Link
                    href="/hire"
                    className="gold-embossed text-background-dark font-bold uppercase tracking-widest px-6 py-3 rounded text-sm flex items-center gap-2 group hover:scale-[1.02] transition-transform"
                >
                    <span className="material-icons text-lg group-hover:rotate-12 transition-transform">smart_toy</span>
                    Hire New Agent
                </Link>
            </div>

            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {KPI_CARDS.map((card) => (
                    <div
                        key={card.label}
                        className={`relative overflow-hidden rounded-lg p-5 border transition-all duration-300 group hover:-translate-y-0.5 ${card.featured
                                ? 'bg-primary/5 border-primary/40 shadow-[0_0_20px_-5px_rgba(242,185,13,0.2)]'
                                : 'bg-obsidian border-primary/10 hover:border-primary/30'
                            }`}
                    >
                        {/* Background icon */}
                        <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-icons text-5xl text-primary">{card.icon}</span>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`material-icons text-lg ${card.featured ? 'text-primary' : 'text-gray-500'}`}>{card.icon}</span>
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{card.label}</span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className={`text-3xl font-bold font-mono ${card.featured ? 'text-primary text-gold-glow' : 'text-white'}`}>
                                    {card.value}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">{card.unit}</span>
                            </div>
                            <div className={`text-xs font-mono flex items-center gap-1 ${card.changePositive ? 'text-green-400' : 'text-red-400'}`}>
                                <span className="material-icons text-xs">{card.changePositive ? 'arrow_upward' : 'arrow_downward'}</span>
                                {card.change} <span className="text-gray-600">24h</span>
                            </div>
                        </div>

                        {/* Featured bottom glow line */}
                        {card.featured && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                        )}
                    </div>
                ))}
            </div>

            {/* ─── Main Content: Sessions Table + Diagnostics ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Sacred Sessions Table (3 cols) */}
                <div className="xl:col-span-3 bg-obsidian rounded-lg border border-primary/20 overflow-hidden shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-primary/5">
                        <h2 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                            <span className="material-icons text-primary text-lg">history_edu</span>
                            Sacred Sessions
                        </h2>
                        <div className="flex gap-1">
                            {(['all', 'active', 'cooldown', 'stopped'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest rounded transition-colors ${filter === f
                                            ? 'bg-primary/20 text-primary border border-primary/30'
                                            : 'text-gray-500 hover:text-primary border border-transparent'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
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
                                    <tr
                                        key={session.id}
                                        className="group border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                    >
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
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-gray-500 text-sm">{session.gameIcon}</span>
                                                <span className="text-gray-400 text-xs font-mono">{session.game}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-400">{session.deposit}</td>
                                        <td className={`p-4 text-right font-mono font-bold ${session.pnlPositive ? 'text-green-400' : 'text-red-400'}`}>
                                            {session.pnl}
                                        </td>
                                        <td className="p-4 text-center font-mono text-gray-300">{session.winRate}</td>
                                        <td className="p-4 text-center font-mono text-gray-500">{session.gamesPlayed}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${session.status === 'active'
                                                    ? 'bg-green-900/20 text-green-400 border border-green-900/30'
                                                    : session.status === 'cooldown'
                                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                                        : 'bg-gray-800 text-gray-500 border border-gray-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'active' ? 'bg-green-400 animate-pulse' :
                                                        session.status === 'cooldown' ? 'bg-primary' : 'bg-gray-500'
                                                    }`} />
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
                            <Link href="/hire" className="text-primary hover:underline text-sm">Summon a new agent</Link>
                        </div>
                    )}
                </div>

                {/* Right Panel: Diagnostics + CTA */}
                <div className="xl:col-span-1 space-y-6">
                    {/* System Diagnostics */}
                    <div className="bg-obsidian rounded-lg border border-primary/10 p-5 space-y-4">
                        <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">monitor_heart</span>
                            System Diagnostics
                        </h3>
                        <div className="space-y-3">
                            {DIAGNOSTICS.map((d) => (
                                <div key={d.label} className="flex justify-between items-center">
                                    <span className="text-[11px] text-gray-500 font-mono">{d.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-mono font-bold ${d.status === 'good' ? 'text-green-400' : 'text-primary'
                                            }`}>
                                            {d.value}
                                        </span>
                                        <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'good' ? 'bg-green-500' : 'bg-primary animate-pulse'
                                            }`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Connection Status */}
                    <div className="bg-obsidian rounded-lg border border-primary/10 p-5 space-y-3">
                        <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                            <span className="material-icons text-green-500 text-sm">wifi</span>
                            Connection
                        </h3>
                        <div className="text-xs font-mono space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Network</span>
                                <span className="text-primary">Monad Testnet</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Block</span>
                                <span className="text-white">18,239,401</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className="text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    SYNCED
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                        <Link
                            href="/hire"
                            className="w-full flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors group"
                        >
                            <span className="material-icons text-primary group-hover:rotate-12 transition-transform">smart_toy</span>
                            <div>
                                <div className="text-white text-sm font-bold">Hire New Agent</div>
                                <div className="text-[10px] text-gray-500 font-mono">DEPLOY_TACTIC</div>
                            </div>
                        </Link>
                        <Link
                            href="/cathedral"
                            className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:border-primary/30 transition-colors group"
                        >
                            <span className="material-icons text-gray-500 group-hover:text-primary transition-colors">account_balance</span>
                            <div>
                                <div className="text-gray-300 text-sm font-bold group-hover:text-white transition-colors">Stake $GUILT</div>
                                <div className="text-[10px] text-gray-600 font-mono">CATHEDRAL</div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
