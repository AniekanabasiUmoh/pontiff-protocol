'use client';

import { useState, useEffect, useCallback } from 'react';

type FeedFilter = 'all' | 'conflict' | 'wager' | 'confess';

interface FeedEvent {
    id: string | number;
    type: 'stone' | 'whisper';
    category: 'conflict' | 'wager' | 'confess';
    agent?: string;
    game?: string;
    wager?: string;
    result?: string;
    profit?: string;
    time?: string;
    message?: string;
    wallet?: string;
}

export default function LiveFeedPage() {
    const [filter, setFilter] = useState<FeedFilter>('all');
    const [events, setEvents] = useState<FeedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            const response = await fetch('/api/games/recent?limit=20');
            const data = await response.json();

            if (data.success && data.games && data.games.length > 0) {
                const mapped: FeedEvent[] = data.games.map((g: any, i: number) => ({
                    id: g.id || i,
                    type: Math.random() > 0.3 ? 'stone' : 'whisper',
                    category: g.game?.toLowerCase() === 'rps' ? 'conflict' :
                        g.game?.toLowerCase() === 'confession' ? 'confess' : 'wager',
                    agent: g.agent || 'Unknown Agent',
                    game: g.game || 'Unknown',
                    wager: g.wager || '0 GUILT',
                    result: g.result || 'PENDING',
                    profit: g.profit || '--',
                    time: g.time || 'Just now',
                    wallet: `0x${Math.random().toString(16).slice(2, 8)}...`,
                }));
                setEvents(mapped);
                setIsLive(true);
            } else {
                // Fallback demo events
                setEvents([
                    { id: 1, type: 'stone', category: 'conflict', agent: 'The Berzerker', game: 'RPS', wager: '1200 GUILT', result: 'WIN', profit: '+1200 GUILT', time: '2m ago', wallet: '0x4a...21f' },
                    { id: 2, type: 'whisper', category: 'confess', message: 'I sold my ETH for a rock jpeg...', time: '3m ago', wallet: '0x8b...99a' },
                    { id: 3, type: 'stone', category: 'wager', agent: 'The Merchant', game: 'Poker', wager: '500 GUILT', result: 'LOSS', profit: '-500 GUILT', time: '5m ago', wallet: '0x1c...ef1' },
                    { id: 4, type: 'stone', category: 'conflict', agent: 'Cardinal Sin', game: 'RPS', wager: '2500 GUILT', result: 'WIN', profit: '+2500 GUILT', time: '8m ago', wallet: '0x9f...bb2' },
                    { id: 5, type: 'whisper', category: 'confess', message: 'Forgive me Pontiff, I aped at 3AM...', time: '10m ago', wallet: '0x2d...cc3' },
                    { id: 6, type: 'stone', category: 'wager', agent: 'The Disciple', game: 'Staking', wager: '5000 GUILT', result: 'STAKE', profit: '+66 GUILT', time: '12m ago', wallet: '0xe3...aa1' },
                    { id: 7, type: 'stone', category: 'conflict', agent: 'Bishop Black', game: 'RPS', wager: '800 GUILT', result: 'LOSS', profit: '-800 GUILT', time: '15m ago', wallet: '0x44...dd4' },
                    { id: 8, type: 'whisper', category: 'confess', message: 'I bought the top and sold the bottom, as is tradition...', time: '18m ago', wallet: '0x77...ff5' },
                ]);
                setIsLive(false);
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch live events:', err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 15000);
        return () => clearInterval(interval);
    }, [fetchEvents]);

    const filtered = filter === 'all' ? events : events.filter(e => e.category === filter);

    const getResultColor = (result?: string) => {
        if (!result) return 'text-gray-500';
        const r = result.toUpperCase();
        if (r === 'WIN' || r === 'WON') return 'text-green-400';
        if (r === 'LOSS' || r === 'LOST') return 'text-red-500';
        return 'text-blue-400';
    };

    const filters: { key: FeedFilter; label: string; icon: string }[] = [
        { key: 'all', label: 'ALL', icon: '⛪' },
        { key: 'conflict', label: 'CONFLICT', icon: '⚔️' },
        { key: 'wager', label: 'WAGER', icon: '💰' },
        { key: 'confess', label: 'CONFESS', icon: '🕊️' },
    ];

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* ─── Header ─── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">System // Altar_of_the_Ledger_V3</p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                            Vatican <span className="text-primary text-gold-glow">Live Wire</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-mono mt-1">Every sin, every wager, every confession — etched in stone.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-2 border rounded text-xs font-mono ${isLive ? 'border-green-500/30 bg-green-500/5' : 'border-primary/20 bg-obsidian'}`}>
                            <span className={`w-2 h-2 rounded-full animate-pulse ${isLive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-yellow-500'}`}></span>
                            <span className={isLive ? 'text-green-400' : 'text-yellow-500'}>{isLive ? 'LIVE FEED' : 'DEMO MODE'}</span>
                        </div>
                    </div>
                </div>

                {/* ─── Nav Icons / Filters ─── */}
                <div className="flex items-center gap-2 border-b border-primary/20 pb-4">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-mono uppercase tracking-widest transition-all ${filter === f.key
                                    ? 'bg-primary/10 text-primary border border-primary/40 shadow-[0_0_10px_rgba(242,185,13,0.1)]'
                                    : 'text-gray-500 border border-gray-800 hover:border-primary/30 hover:text-gray-300'
                                }`}
                        >
                            <span>{f.icon}</span>
                            {f.label}
                        </button>
                    ))}
                    <div className="ml-auto text-[10px] text-gray-600 font-mono">
                        {filtered.length} EVENTS
                    </div>
                </div>

                {/* ─── Feed Content ─── */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-obsidian border border-gray-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                        <span className="text-5xl mb-4">🕯️</span>
                        <p className="font-mono text-sm">No events in this category.</p>
                        <p className="text-xs text-gray-700 mt-1">The altar is silent...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((event, i) => (
                            <div
                                key={`${event.id}-${i}`}
                                className={`relative bg-obsidian border rounded overflow-hidden transition-all duration-300 hover:-translate-y-0.5 group ${event.type === 'whisper'
                                        ? 'border-primary/20 hover:border-primary/40'
                                        : 'border-gray-800 hover:border-primary/30'
                                    }`}
                            >
                                {/* Top accent line */}
                                {event.type === 'stone' && event.result && (
                                    <div className={`absolute top-0 left-0 w-full h-0.5 ${event.result.toUpperCase() === 'WIN' || event.result.toUpperCase() === 'WON'
                                            ? 'bg-gradient-to-r from-transparent via-green-500 to-transparent'
                                            : event.result.toUpperCase() === 'LOSS' || event.result.toUpperCase() === 'LOST'
                                                ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
                                                : 'bg-gradient-to-r from-transparent via-blue-500 to-transparent'
                                        }`} />
                                )}
                                {event.type === 'whisper' && (
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                                )}

                                <div className="p-5 flex items-center gap-5">
                                    {/* Type indicator */}
                                    <div className={`w-10 h-10 rounded flex items-center justify-center text-lg shrink-0 ${event.type === 'whisper'
                                            ? 'bg-primary/10 border border-primary/20'
                                            : 'bg-gray-900 border border-gray-700'
                                        }`}>
                                        {event.type === 'whisper' ? '🕊️' :
                                            event.category === 'conflict' ? '⚔️' : '💰'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-grow min-w-0">
                                        {event.type === 'whisper' ? (
                                            <>
                                                <p className="text-xs text-primary/60 font-mono mb-1">CONFESSION</p>
                                                <p className="text-sm text-gray-300 italic font-mono leading-relaxed">
                                                    "{event.message}"
                                                </p>
                                                <p className="text-[10px] text-gray-600 font-mono mt-2">{event.wallet} • {event.time}</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-white font-bold text-sm">{event.agent}</span>
                                                    <span className="text-[10px] text-gray-600 font-mono px-2 py-0.5 border border-gray-800 rounded">
                                                        {event.game}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-mono">
                                                    <span className="text-gray-500">Wager: <span className="text-primary">{event.wager}</span></span>
                                                    <span className="text-gray-700">•</span>
                                                    <span className={getResultColor(event.result)}>{event.result}</span>
                                                    <span className="text-gray-700">•</span>
                                                    <span className={event.profit?.startsWith('+') ? 'text-green-400' : event.profit?.startsWith('-') ? 'text-red-500' : 'text-gray-500'}>
                                                        {event.profit}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-600 font-mono mt-1">{event.wallet} • {event.time}</p>
                                            </>
                                        )}
                                    </div>

                                    {/* Right side accent */}
                                    <div className="shrink-0 text-right">
                                        {event.type === 'stone' && (
                                            <div className={`text-xs font-mono font-bold px-3 py-1 rounded ${event.result?.toUpperCase() === 'WIN' || event.result?.toUpperCase() === 'WON'
                                                    ? 'bg-green-900/20 text-green-400 border border-green-900/30'
                                                    : event.result?.toUpperCase() === 'LOSS' || event.result?.toUpperCase() === 'LOST'
                                                        ? 'bg-red-900/20 text-red-500 border border-red-900/30'
                                                        : 'bg-blue-900/20 text-blue-400 border border-blue-900/30'
                                                }`}>
                                                {event.result?.toUpperCase() === 'WIN' || event.result?.toUpperCase() === 'WON' ? 'ABSORBED' :
                                                    event.result?.toUpperCase() === 'LOSS' || event.result?.toUpperCase() === 'LOST' ? 'DAMNED' :
                                                        event.result?.toUpperCase()}
                                            </div>
                                        )}
                                        {event.type === 'whisper' && (
                                            <div className="text-[10px] text-primary/40 font-mono">† ABSOLVED</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ─── Bottom gradient fade ─── */}
                <div className="h-8 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none -mt-8 relative z-10" />
            </div>
        </div>
    );
}
