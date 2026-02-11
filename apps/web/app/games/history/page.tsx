'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';

interface GameHistoryItem {
    id: string;
    gameType: string;
    player1: string;
    winner: string;
    wager: string;
    createdAt?: string;
    result?: any;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<GameHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');

    const formatGame = (game: any): GameHistoryItem => {
        let winner = 'Unknown';
        if (game.game_type === 'RPS') {
            const outcome = game.result?.outcome;
            winner = outcome === 'WIN' ? 'Player' : outcome === 'LOSS' ? 'ThePontiff' : 'Draw';
        } else if (game.game_type === 'JUDAS') {
            const action = game.result?.action;
            winner = action === 'BETRAY' ? 'Betrayal' : action === 'STAKE' ? 'Staked' : 'Withdrawn';
        } else if (game.result?.winner) {
            winner = game.result.winner;
        }

        return {
            id: game.id,
            gameType: game.game_type || game.gameType || 'Unknown',
            player1: game.player1 || 'Unknown',
            winner,
            wager: game.wager || '0',
            createdAt: game.created_at,
            result: game.result
        };
    };

    useEffect(() => {
        // Initial Fetch
        fetch('/api/games/history')
            .then(res => res.json())
            .then(data => {
                const games = (data.history || []).map(formatGame);
                setHistory(games);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        // Real-time Subscription
        const channel = supabase
            .channel('public:games')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'games' },
                (payload) => {
                    console.log('New game received:', payload.new);
                    const newGame = formatGame(payload.new);
                    setHistory(prev => [newGame, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getOutcomeStyle = (winner: string) => {
        if (winner === 'Player') return { label: 'HERETIC VICTORY', color: 'text-green-400', bg: 'bg-green-900/20 border-green-900/30', icon: '⚔️' };
        if (winner === 'ThePontiff') return { label: 'PONTIFF VICTORY', color: 'text-red-500', bg: 'bg-red-900/20 border-red-900/30', icon: '🔥' };
        if (winner === 'Betrayal') return { label: 'BETRAYED', color: 'text-red-600', bg: 'bg-red-950/20 border-red-900/30', icon: '🗡️' };
        if (winner === 'Staked') return { label: 'STAKED', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-900/30', icon: '🔒' };
        if (winner === 'Withdrawn') return { label: 'WITHDRAWN', color: 'text-green-400', bg: 'bg-green-900/20 border-green-900/30', icon: '💰' };
        if (winner === 'Draw') return { label: 'DRAW', color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700', icon: '⚖️' };
        return { label: winner.toUpperCase(), color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700', icon: '📜' };
    };

    const getGameIcon = (type: string) => {
        if (type === 'RPS') return '✊';
        if (type === 'Poker') return '🃏';
        if (type === 'JUDAS') return '🗡️';
        return '📜';
    };

    const filtered = filterType === 'all' ? history : history.filter(g => g.gameType === filterType);
    const gameTypes = ['all', ...Array.from(new Set(history.map(g => g.gameType)))];

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* ─── Header ─── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/20 pb-6">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Archive // The_Chronicles</p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                            The <span className="text-primary text-gold-glow">Chronicles</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-mono mt-1">Every challenge against the Pontiff is recorded in the sacred ledger.</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                        <div className="bg-obsidian border border-primary/20 rounded px-3 py-2">
                            <span className="text-gray-500">Total Records:</span> <span className="text-primary font-bold">{history.length}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-obsidian border border-gray-800 rounded px-3 py-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-green-400">LIVE SYNC</span>
                        </div>
                    </div>
                </div>

                {/* ─── Filters ─── */}
                <div className="flex items-center gap-2">
                    {gameTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded text-xs font-mono uppercase tracking-widest transition-all ${filterType === type
                                    ? 'bg-primary/10 text-primary border border-primary/40'
                                    : 'text-gray-500 border border-gray-800 hover:border-primary/30 hover:text-gray-300'
                                }`}
                        >
                            {type === 'all' ? '⛪ ALL' : `${getGameIcon(type)} ${type}`}
                        </button>
                    ))}
                </div>

                {/* ─── Table ─── */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-16 bg-obsidian border border-gray-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                        <span className="text-5xl mb-4">📜</span>
                        <p className="font-mono text-sm">The pages of history are blank...</p>
                        <p className="text-xs text-gray-700 mt-1">No records found for this filter.</p>
                    </div>
                ) : (
                    <div className="rounded border border-primary/20 overflow-hidden bg-obsidian/50">
                        {/* Table Head */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-primary/10 bg-primary/5 text-[10px] font-mono text-primary/60 uppercase tracking-widest">
                            <div className="col-span-1">Type</div>
                            <div className="col-span-3">Protocol</div>
                            <div className="col-span-3">Challenger</div>
                            <div className="col-span-2 text-right">Wager</div>
                            <div className="col-span-2 text-right">Outcome</div>
                            <div className="col-span-1 text-right">Time</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-800/50">
                            {filtered.map((game, i) => {
                                const outcome = getOutcomeStyle(game.winner);
                                return (
                                    <div
                                        key={game.id || i}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-primary/5 transition-colors group"
                                    >
                                        <div className="col-span-1 text-xl">
                                            {getGameIcon(game.gameType)}
                                        </div>
                                        <div className="col-span-3">
                                            <span className="text-white font-bold text-sm group-hover:text-primary transition-colors">{game.gameType} Protocol</span>
                                        </div>
                                        <div className="col-span-3">
                                            <span className="text-xs text-gray-400 font-mono">
                                                {game.player1 ? `${game.player1.slice(0, 6)}...${game.player1.slice(-4)}` : 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <span className="text-primary font-mono text-sm">{game.wager} GUILT</span>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${outcome.bg} ${outcome.color}`}>
                                                {outcome.label}
                                            </span>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <span className="text-[10px] text-gray-600 font-mono">
                                                {game.createdAt ? new Date(game.createdAt).toLocaleTimeString() : '--'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-primary/10 bg-black/40 flex items-center justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                            <span>Showing {filtered.length} of {history.length} records</span>
                            <span>REAL-TIME SYNC ACTIVE</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
