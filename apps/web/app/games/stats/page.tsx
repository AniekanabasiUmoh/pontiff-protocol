'use client';

import { useState, useEffect } from 'react';

interface GameStats {
    totalGames: number | string;
    pontiffWinRate: number | string;
    totalWagered: number | string;
    biggestPot: number | string;
    playerWinRate?: number | string;
    totalPlayers?: number | string;
    avgWager?: number | string;
    gamesLast24h?: number | string;
}

export default function StatsPage() {
    const [stats, setStats] = useState<GameStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/games/stats')
            .then(r => r.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const statCards = stats ? [
        {
            label: 'Total Matches',
            sublabel: 'All-time games played',
            value: stats.totalGames,
            icon: '⚔️',
            color: 'text-white',
            borderColor: 'border-primary/40',
            bgAccent: 'from-primary/10 to-transparent',
        },
        {
            label: 'Pontiff Win Rate',
            sublabel: 'The house always wins...',
            value: typeof stats.pontiffWinRate === 'number'
                ? `${stats.pontiffWinRate}%`
                : stats.pontiffWinRate,
            icon: '🔥',
            color: 'text-red-500',
            borderColor: 'border-red-900/30',
            bgAccent: 'from-red-900/10 to-transparent',
        },
        {
            label: 'Total Wagered',
            sublabel: 'Sacrificed to the altar',
            value: typeof stats.totalWagered === 'number'
                ? `${stats.totalWagered.toLocaleString()} MON`
                : `${stats.totalWagered} MON`,
            icon: '💰',
            color: 'text-primary',
            borderColor: 'border-primary/30',
            bgAccent: 'from-primary/5 to-transparent',
        },
        {
            label: 'Biggest Pot',
            sublabel: 'Largest single wager',
            value: stats.biggestPot,
            icon: '👑',
            color: 'text-green-400',
            borderColor: 'border-green-900/30',
            bgAccent: 'from-green-900/10 to-transparent',
        },
    ] : [];

    const secondaryCards = stats ? [
        { label: 'Active Players', value: stats.totalPlayers || '--', icon: '👥' },
        { label: 'Games (24h)', value: stats.gamesLast24h || '--', icon: '📊' },
        { label: 'Avg. Wager', value: stats.avgWager || '--', icon: '📈' },
        { label: 'Heretic Win Rate', value: stats.playerWinRate ? `${stats.playerWinRate}%` : '--', icon: '🎯' },
    ] : [];

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* ─── Header ─── */}
                <div className="border-b border-primary/20 pb-6">
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Analytics // Arena_Metrics</p>
                    <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                        Arena <span className="text-primary text-gold-glow">Analytics</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-mono mt-1">Global statistics from the Pontiff&apos;s sacred games.</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-40 bg-obsidian border border-gray-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : !stats ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                        <span className="text-5xl mb-4">📊</span>
                        <p className="font-mono text-sm">Failed to load statistics.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 text-xs font-mono text-primary border border-primary/30 rounded hover:bg-primary/10 transition-all"
                        >
                            [ RETRY ]
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ─── Primary Stats Grid ─── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {statCards.map((card, i) => (
                                <div
                                    key={i}
                                    className={`relative bg-obsidian border ${card.borderColor} rounded overflow-hidden group hover:border-primary/50 transition-all duration-300`}
                                >
                                    {/* Accent gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${card.bgAccent} opacity-50 pointer-events-none`} />

                                    {/* Corner decorations */}
                                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/40" />
                                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/40" />
                                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/40" />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/40" />

                                    <div className="relative z-10 p-8">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{card.label}</p>
                                                <p className="text-xs text-gray-600 font-mono">{card.sublabel}</p>
                                            </div>
                                            <span className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">{card.icon}</span>
                                        </div>
                                        <div className={`text-5xl font-bold font-mono tracking-tight ${card.color}`}>
                                            {card.value}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ─── Secondary Stats Strip ─── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {secondaryCards.map((card, i) => (
                                <div key={i} className="bg-obsidian border border-gray-800 rounded p-4 hover:border-primary/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm">{card.icon}</span>
                                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{card.label}</span>
                                    </div>
                                    <div className="text-xl font-bold font-mono text-white">{card.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* ─── System Status Strip ─── */}
                        <div className="flex items-center justify-between px-4 py-3 border border-primary/10 rounded bg-primary/5 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                            <div className="flex items-center gap-4">
                                <span>SYSTEM_STATUS: <span className="text-green-500">OPERATIONAL</span></span>
                                <span>RPC_LATENCY: <span className="text-primary">12ms</span></span>
                            </div>
                            <span>DATA_SYNCED: <span className="text-primary">{new Date().toLocaleTimeString()}</span></span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
