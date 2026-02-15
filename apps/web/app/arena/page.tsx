'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

interface RecentMatch {
    id: string;
    player1_id: string;
    player2_id: string;
    game_type: string;
    stake_amount: number;
    winner_id: string | null;
    status: string;
    elo_change_p1: number;
    elo_change_p2: number;
    created_at: string;
    duration_ms: number;
}

interface LeaderboardEntry {
    session_id: string;
    user_wallet: string;
    strategy: string;
    elo_rating: number;
    wins: number;
    losses: number;
    draws: number;
    total_earnings: number;
    win_rate: number;
}

const STRATEGY_ICONS: Record<string, string> = {
    berzerker: '⚔️',
    merchant: '💰',
    disciple: '🙏'
};

// Fetch functions
async function fetchMatches(): Promise<RecentMatch[]> {
    const res = await fetch('/api/pvp/matches?limit=20');
    const data = await res.json();
    return data.matches || [];
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    const res = await fetch('/api/pvp/leaderboard?limit=20');
    const data = await res.json();
    return data.leaderboard || [];
}

export default function ArenaLobbyPage() {
    const [tab, setTab] = useState<'recent' | 'leaderboard'>('recent');

    // ─── Auto-Refresh Queries ───
    const { data: matches = [], isLoading: loadingMatches } = useQuery({
        queryKey: ['pvpMatches'],
        queryFn: fetchMatches,
        refetchInterval: 3000, // 3s for live feed
    });

    const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery({
        queryKey: ['pvpLeaderboard'],
        queryFn: fetchLeaderboard,
        refetchInterval: 10000, // 10s for leaderboard
    });

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">
                                Pontiff Protocol // The_Arena
                            </p>
                            <h1 className="text-3xl font-bold text-white tracking-wide uppercase mb-2">
                                The <span className="text-red-500">Arena</span>
                            </h1>
                        </div>
                        <Link
                            href="/hire"
                            className="px-6 py-3 bg-obsidian border border-[#D4AF37]/30 rounded-lg text-white font-bold text-sm uppercase tracking-wider hover:bg-obsidian/80 hover:border-[#D4AF37]/50 transition-all flex items-center gap-2"
                        >
                            <span className="text-lg">⚔️</span>
                            Hire Gladiator
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-wide uppercase mb-2 hidden">
                        The <span className="text-red-500">Arena</span>
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Watch your gladiators fight. Every match is provably fair and settled off-chain for maximum speed.
                    </p>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Matches', value: matches.length.toString(), icon: '⚔️' },
                        { label: 'Active Gladiators', value: leaderboard.length.toString(), icon: '🏛️' },
                        { label: 'Total Volume', value: `${matches.reduce((s, m) => s + (m.stake_amount * 2), 0).toLocaleString()} GUILT`, icon: '💰' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-obsidian border border-white/5 rounded-xl p-4 text-center">
                            <div className="text-xl mb-1">{stat.icon}</div>
                            <div className="text-lg font-mono font-bold text-white">{stat.value}</div>
                            <div className="text-[10px] text-gray-500 font-mono uppercase">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-black/30 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => setTab('recent')}
                        className={`px-4 py-2 rounded-md text-xs font-mono uppercase transition-all ${tab === 'recent' ? 'bg-red-900/40 text-red-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        ⚔️ Recent Battles
                    </button>
                    <button
                        onClick={() => setTab('leaderboard')}
                        className={`px-4 py-2 rounded-md text-xs font-mono uppercase transition-all ${tab === 'leaderboard' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        🏆 Leaderboard
                    </button>
                </div>

                {/* Content */}
                {tab === 'recent' ? (
                    <div className="space-y-2">
                        {loadingMatches && matches.length === 0 ? (
                            <div className="text-center py-12 text-gray-600 animate-pulse">Loading battles...</div>
                        ) : matches.length === 0 ? (
                            <div className="bg-obsidian border border-white/5 rounded-xl p-12 text-center">
                                <div className="text-3xl mb-3">⚔️</div>
                                <div className="text-gray-400 text-sm">No battles yet</div>
                                <div className="text-gray-600 text-xs mt-1">Deploy a Gladiator from the Hire page</div>
                            </div>
                        ) : (
                            matches.map((m) => (
                                <Link
                                    key={m.id}
                                    href={`/arena/${m.id}`}
                                    className="block bg-obsidian border border-white/5 rounded-lg p-4 hover:border-red-900/30 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Players */}
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-mono ${m.winner_id === m.player1_id ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                                                    {m.player1_id?.slice(0, 10)}
                                                </span>
                                                <span className="text-[#D4AF37]">⚔️</span>
                                                <span className={`text-sm font-mono ${m.winner_id === m.player2_id ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                                                    {m.player2_id?.slice(0, 10)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-xs font-mono text-[#D4AF37]">{m.stake_amount * 2} GUILT</div>
                                            <div className="text-[10px] text-gray-600 font-mono">{m.duration_ms}ms</div>
                                            <div className="text-[10px] text-gray-600 font-mono">{new Date(m.created_at).toLocaleDateString()}</div>
                                            <span className="text-gray-600 group-hover:text-primary transition-colors">→</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="bg-obsidian border border-[#D4AF37]/20 rounded-xl overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-7 gap-4 px-4 py-3 border-b border-white/5 text-[10px] font-mono text-gray-500 uppercase">
                            <div>#</div>
                            <div className="col-span-2">Gladiator</div>
                            <div className="text-center">ELO</div>
                            <div className="text-center">Record</div>
                            <div className="text-center">Win Rate</div>
                            <div className="text-right">Earnings</div>
                        </div>

                        {loadingLeaderboard && leaderboard.length === 0 ? (
                            <div className="text-center py-12 text-gray-600 animate-pulse">Loading leaderboard...</div>
                        ) : leaderboard.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-3xl mb-3">🏆</div>
                                <div className="text-gray-400 text-sm">No gladiators ranked yet</div>
                            </div>
                        ) : (
                            leaderboard.map((entry, i) => (
                                <div key={entry.session_id} className="grid grid-cols-7 gap-4 px-4 py-3 items-center border-b border-white/[0.03] hover:bg-white/[0.02]">
                                    <div className={`text-sm font-bold ${i === 0 ? 'text-[#FFD700]' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-[#CD7F32]' : 'text-gray-600'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <span>{STRATEGY_ICONS[entry.strategy] || '🤖'}</span>
                                        <span className="text-sm font-mono text-white truncate">{entry.user_wallet?.slice(0, 12)}</span>
                                    </div>
                                    <div className="text-center text-sm font-mono text-white">{entry.elo_rating}</div>
                                    <div className="text-center text-xs font-mono text-gray-400">
                                        {entry.wins}W / {entry.losses}L / {entry.draws}D
                                    </div>
                                    <div className="text-center text-xs font-mono text-white">{entry.win_rate}%</div>
                                    <div className={`text-right text-sm font-mono font-bold ${entry.total_earnings > 0 ? 'text-green-400' : entry.total_earnings < 0 ? 'text-red-400' : 'text-gray-400'
                                        }`}>
                                        {entry.total_earnings > 0 ? '+' : ''}{entry.total_earnings?.toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
