'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

interface RoundResult {
    round: number;
    p1Move: number;
    p2Move: number;
    p1MoveName: string;
    p2MoveName: string;
    winner: 'p1' | 'p2' | 'draw';
    timestamp: number;
}

interface MatchDetail {
    id: string;
    player1_id: string;
    player2_id: string;
    game_type: string;
    stake_amount: number;
    winner_id: string | null;
    status: string;
    round_data: RoundResult[];
    best_of: number;
    house_fee: number;
    duration_ms: number;
    elo_change_p1: number;
    elo_change_p2: number;
    server_seed: string;
    client_seed_1: string;
    client_seed_2: string;
    created_at: string;
    settled_at: string;
    potSize: number;
    winnerPayout: number;
    isLive: boolean;
    isCompleted: boolean;
}

const MOVE_EMOJI: Record<string, string> = {
    Rock: '🪨',
    Paper: '📄',
    Scissors: '✂️'
};

const RESULT_LABELS: Record<string, { label: string; color: string }> = {
    p1: { label: 'PLAYER 1 WINS', color: 'text-green-400' },
    p2: { label: 'PLAYER 2 WINS', color: 'text-green-400' },
    draw: { label: 'DRAW', color: 'text-yellow-400' }
};

export default function ArenaMatchPage() {
    const params = useParams();
    const matchId = params?.matchId as string;

    const [match, setMatch] = useState<MatchDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [revealedRound, setRevealedRound] = useState(0);
    const [showSeeds, setShowSeeds] = useState(false);

    useEffect(() => {
        if (!matchId) return;

        const fetchMatch = async () => {
            try {
                const res = await fetch(`/api/arena/${matchId}`);
                const data = await res.json();
                if (data.match) {
                    setMatch(data.match);
                } else {
                    setError(data.error || 'Match not found');
                }
            } catch (e) {
                setError('Failed to load match');
            } finally {
                setLoading(false);
            }
        };

        fetchMatch();
        // Poll if match is live
        const interval = setInterval(fetchMatch, 3000);
        return () => clearInterval(interval);
    }, [matchId]);

    // Auto-reveal rounds one by one for replay effect
    useEffect(() => {
        if (!match?.round_data?.length) return;
        if (revealedRound >= match.round_data.length) return;

        const timer = setTimeout(() => {
            setRevealedRound(prev => prev + 1);
        }, 1200);
        return () => clearTimeout(timer);
    }, [revealedRound, match]);

    const p1Score = useMemo(() => {
        if (!match?.round_data) return 0;
        return match.round_data.filter(r => r.winner === 'p1').length;
    }, [match]);

    const p2Score = useMemo(() => {
        if (!match?.round_data) return 0;
        return match.round_data.filter(r => r.winner === 'p2').length;
    }, [match]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-pulse">⚔️</div>
                    <div className="text-primary font-mono text-sm animate-pulse">Loading arena...</div>
                </div>
            </div>
        );
    }

    if (error || !match) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">💀</div>
                    <div className="text-red-400 font-mono text-sm">{error || 'Match not found'}</div>
                    <a href="/hire" className="mt-4 inline-block text-xs text-primary hover:underline">← Back to Hire</a>
                </div>
            </div>
        );
    }

    const overallWinner = match.winner_id === match.player1_id
        ? 'p1' : match.winner_id === match.player2_id
            ? 'p2' : 'draw';

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">
                        Arena // Match_{matchId?.slice(0, 8)}
                    </p>
                    <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                        {match.isLive && (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                        {match.isLive ? 'LIVE BATTLE' : 'MATCH REPLAY'}
                    </h1>
                    <p className="text-xs text-gray-500">{match.game_type} • Best of {match.best_of} • {new Date(match.created_at).toLocaleString()}</p>
                </div>

                {/* Scoreboard */}
                <div className="bg-obsidian border border-[#D4AF37]/20 rounded-xl overflow-hidden mb-8">
                    <div className="grid grid-cols-3 items-center p-6">
                        {/* Player 1 */}
                        <div className={`text-center ${overallWinner === 'p1' ? 'scale-105' : overallWinner === 'p2' ? 'opacity-60' : ''} transition-all`}>
                            <div className="text-3xl mb-2">⚔️</div>
                            <div className="text-sm font-mono text-white truncate">{match.player1_id?.slice(0, 12)}</div>
                            <div className="text-[10px] text-gray-500 mt-1">
                                ELO: {match.elo_change_p1 > 0 ? '+' : ''}{match.elo_change_p1}
                            </div>
                            {overallWinner === 'p1' && <div className="text-[#FFD700] text-xs mt-1 font-bold">👑 WINNER</div>}
                        </div>

                        {/* Score */}
                        <div className="text-center">
                            <div className="text-4xl font-bold font-mono text-white">
                                <span className={overallWinner === 'p1' ? 'text-green-400' : ''}>{p1Score}</span>
                                <span className="text-gray-600 mx-2">:</span>
                                <span className={overallWinner === 'p2' ? 'text-green-400' : ''}>{p2Score}</span>
                            </div>
                            <div className="text-[10px] text-[#D4AF37] font-mono mt-1 uppercase">
                                Pot: {match.potSize} GUILT
                            </div>
                        </div>

                        {/* Player 2 */}
                        <div className={`text-center ${overallWinner === 'p2' ? 'scale-105' : overallWinner === 'p1' ? 'opacity-60' : ''} transition-all`}>
                            <div className="text-3xl mb-2">🛡️</div>
                            <div className="text-sm font-mono text-white truncate">{match.player2_id?.slice(0, 12)}</div>
                            <div className="text-[10px] text-gray-500 mt-1">
                                ELO: {match.elo_change_p2 > 0 ? '+' : ''}{match.elo_change_p2}
                            </div>
                            {overallWinner === 'p2' && <div className="text-[#FFD700] text-xs mt-1 font-bold">👑 WINNER</div>}
                        </div>
                    </div>

                    {/* Settlement info */}
                    {match.isCompleted && (
                        <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between bg-black/20">
                            <div className="text-[10px] font-mono text-gray-500">
                                Duration: {match.duration_ms}ms • House Fee: {match.house_fee?.toFixed(2)} GUILT
                            </div>
                            <div className="text-[10px] font-mono text-green-400">
                                Winner Payout: {match.winnerPayout?.toFixed(2)} GUILT
                            </div>
                        </div>
                    )}
                </div>

                {/* Rounds */}
                <div className="space-y-3 mb-8">
                    <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Rounds</h3>
                    {match.round_data?.map((round, i) => {
                        const revealed = i < revealedRound;
                        const result = RESULT_LABELS[round.winner] || RESULT_LABELS.draw;

                        return (
                            <div
                                key={round.round}
                                className={`bg-obsidian border rounded-lg p-4 transition-all duration-500 ${revealed
                                        ? 'border-white/10 opacity-100 translate-y-0'
                                        : 'border-transparent opacity-0 translate-y-4'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-mono text-gray-600 uppercase">Round {round.round}</div>
                                    <div className={`text-[10px] font-mono font-bold ${result.color}`}>{result.label}</div>
                                </div>
                                <div className="flex items-center justify-center gap-8 mt-3">
                                    <div className={`text-center ${round.winner === 'p1' ? 'scale-110' : 'opacity-60'} transition-all`}>
                                        <div className="text-3xl">{revealed ? (MOVE_EMOJI[round.p1MoveName] || '❓') : '❓'}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">{revealed ? round.p1MoveName : '???'}</div>
                                    </div>
                                    <div className="text-gray-600 text-lg">VS</div>
                                    <div className={`text-center ${round.winner === 'p2' ? 'scale-110' : 'opacity-60'} transition-all`}>
                                        <div className="text-3xl">{revealed ? (MOVE_EMOJI[round.p2MoveName] || '❓') : '❓'}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">{revealed ? round.p2MoveName : '???'}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Provably Fair Seeds */}
                <div className="bg-obsidian border border-white/5 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowSeeds(!showSeeds)}
                        className="w-full p-4 flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <span>🔐</span> Provably Fair Verification
                        </span>
                        <span className={`transition-transform ${showSeeds ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {showSeeds && (
                        <div className="px-4 pb-4 space-y-2 text-xs font-mono">
                            <div>
                                <span className="text-gray-500">Server Seed: </span>
                                <span className="text-white break-all">{match.server_seed || 'Not yet revealed'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Client Seed 1: </span>
                                <span className="text-white break-all">{match.client_seed_1}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Client Seed 2: </span>
                                <span className="text-white break-all">{match.client_seed_2}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Share replay */}
                {match.isCompleted && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                            }}
                            className="text-xs font-mono text-gray-500 hover:text-primary transition-colors px-4 py-2 border border-gray-800 rounded-lg hover:border-primary/30"
                        >
                            📋 Copy Replay Link
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
