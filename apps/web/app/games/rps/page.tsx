'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/db/supabase';
import { useToast } from '../../components/ui/Toast';
import BankModal from '../../../components/bank/BankModal';

const RITUAL_MOVES = [
    { id: 1, name: 'STONE', icon: '🪨', desc: 'The foundation of faith', color: 'from-amber-900/20 to-amber-800/5' },
    { id: 2, name: 'SCROLL', icon: '📜', desc: 'The word of the ledger', color: 'from-blue-900/20 to-blue-800/5' },
    { id: 3, name: 'DAGGER', icon: '🗡️', desc: 'The blade of heresy', color: 'from-red-900/20 to-red-800/5' },
];

export default function RPSPage() {
    const { address, isConnected } = useAccount();
    const { showToast } = useToast();

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'RESULT'>('IDLE');
    const [playerMove, setPlayerMove] = useState<number | null>(null);
    const [pontiffMove, setPontiffMove] = useState<number | null>(null);
    const [result, setResult] = useState<string>('');
    const [wager, setWager] = useState('100');
    const [gameHistory, setGameHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [casinoBalance, setCasinoBalance] = useState<number>(0);
    const [lastPayout, setLastPayout] = useState<number>(0);
    const [lastGameId, setLastGameId] = useState<string>('');
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankModalTab, setBankModalTab] = useState<'deposit' | 'withdraw'>('deposit');

    // Fetch casino balance
    useEffect(() => {
        if (!address) return;

        const fetchBalance = async () => {
            try {
                const res = await fetch(`/api/bank/balance?wallet=${address}`);
                const data = await res.json();
                if (data.success) {
                    setCasinoBalance(data.available);
                }
            } catch (err) {
                console.error('Failed to fetch balance:', err);
            }
        };

        fetchBalance();
        // Refresh every 10s
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [address, gameState]);

    // Fetch game history from database
    useEffect(() => {
        if (!address) {
            setGameHistory([]);
            setLoadingHistory(false);
            return;
        }

        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const { data, error } = await supabase
                    .from('games')
                    .select('*')
                    .eq('player1', address.toLowerCase())
                    .eq('game_type', 'RPS')
                    .eq('status', 'Completed')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (!error && data) {
                    setGameHistory(data);
                }
            } catch (err) {
                console.error('Failed to fetch game history:', err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [address, gameState]); // Refetch when gameState changes (after new game)

    // Calculate player stats from history
    const playerStats = useMemo(() => {
        const wins = gameHistory.filter(g => g.result?.outcome === 'WIN').length;
        const losses = gameHistory.filter(g => g.result?.outcome === 'LOSS').length;
        const draws = gameHistory.filter(g => g.result?.outcome === 'DRAW').length;

        // Calculate profit
        let totalProfit = 0;
        gameHistory.forEach(g => {
            const outcome = g.result?.outcome;
            const wager = parseFloat(g.wager || '0') / 1e18;
            if (outcome === 'WIN') {
                totalProfit += wager;
            } else if (outcome === 'LOSS') {
                totalProfit -= wager;
            }
        });

        // Calculate win streak
        let currentStreak = 0;
        let streakType: 'W' | 'L' | null = null;
        for (const game of gameHistory) {
            const outcome = game.result?.outcome;
            if (outcome === 'WIN') {
                if (streakType === 'W' || streakType === null) {
                    currentStreak++;
                    streakType = 'W';
                } else break;
            } else if (outcome === 'LOSS') {
                if (streakType === 'L' || streakType === null) {
                    currentStreak++;
                    streakType = 'L';
                } else break;
            } else {
                break;
            }
        }

        return { wins, losses, draws, profit: totalProfit, streak: { count: currentStreak, type: streakType } };
    }, [gameHistory]);

    // Helper to format time ago
    const formatTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return `${minutes}m ago`;
    };

    // Helper to get move name
    const getMoveName = (moveId: number) => {
        return RITUAL_MOVES.find(m => m.id === moveId)?.name || 'Unknown';
    };

    // ── CASINO PLAY: Instant, no wallet popups ──
    const handleCasinoPlay = async (moveId: number) => {
        if (!isConnected || !address) return;

        if (casinoBalance < parseFloat(wager)) {
            showToast("Insufficient Balance. Please Deposit.", "error");
            return;
        }

        setPlayerMove(moveId);
        setGameState('PLAYING');

        try {
            const res = await fetch('/api/games/rps/play-casino', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    playerMove: moveId,
                    wager: parseFloat(wager),
                }),
            });

            const data = await res.json();

            if (!data.success) {
                showToast(data.error || 'Game failed', 'error');
                setGameState('IDLE');
                return;
            }

            // Show result instantly
            setPontiffMove(data.pontiffMove);
            setResult(data.result);
            setLastPayout(data.payout);
            setLastGameId(data.gameId);
            setCasinoBalance(data.newBalance);
            setGameState('RESULT');

            if (data.result === 'WIN') showToast(`You won ${data.payout} $GUILT!`, 'success');
        } catch (e: any) {
            console.error('Casino play error:', e);
            showToast(e.message || "Failed to play", 'error');
            setGameState('IDLE');

            // Refresh balance in case debit happened
            const res = await fetch(`/api/bank/balance?wallet=${address}`);
            const data = await res.json();
            if (data.success) setCasinoBalance(data.available);
        }
    }


    const resetGame = () => {
        setGameState('IDLE');
        setPlayerMove(null);
        setPontiffMove(null);
        setResult('');
        setLastPayout(0);
        setLastGameId('');
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] flex flex-col">
            {/* ─── Arena Header ─── */}
            <div className="p-6 lg:p-8 border-b border-primary/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-6xl mx-auto">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">The Arena // Ritual_Combat</p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                            Rock Paper <span className="text-primary text-gold-glow">Heretic</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-6 text-xs font-mono">
                        <div className="text-gray-500">
                            RECORD: <span className="text-green-400">W{playerStats.wins}</span> / <span className="text-red-400">L{playerStats.losses}</span> / <span className="text-gray-400">D{playerStats.draws}</span>
                        </div>
                        <div className="text-gray-500">
                            STREAK: {playerStats.streak.count > 0 ? (
                                <span className={`font-bold ${playerStats.streak.type === 'W' ? 'text-primary' : 'text-red-400'}`}>
                                    {playerStats.streak.type === 'W' ? '🔥' : '❄️'} {playerStats.streak.count}{playerStats.streak.type}
                                </span>
                            ) : <span className="text-gray-600">None</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row">
                {/* ─── Main Arena ─── */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 relative">
                    {/* Ambient glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />

                    <div className="relative z-10 w-full max-w-3xl space-y-10">
                        {/* ── Pontiff Opponent ── */}
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-28 h-28 rounded-full bg-obsidian border-2 border-primary/30 flex items-center justify-center relative shadow-[0_0_40px_rgba(242,185,13,0.1)] group">
                                {/* Halo ring */}
                                <div className="absolute inset-[-8px] border border-primary/15 rounded-full animate-spin" style={{ animationDuration: '25s' }} />
                                <div className="absolute inset-[-16px] border border-primary/8 rounded-full animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />

                                {/* Pontiff Image (Always visible as base) */}
                                <div className="absolute inset-0 rounded-full overflow-hidden z-0">
                                    <img
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGSK7zfxpiDTgNGVZJO-fzRXQXIEVFmMT1NkVlsNDDj-_ziLk2ibDRA8OOIalNQdWN6maowg4dQhbGox2_rCFUr4Y9CnLRd8aSdoOWj2gMA5_vVGTTeNeLa_AbBnqFTBDRAOiEpNHMvz9ccRz4khbkK17aB0rbBZEphVr0RsJbSHytzwk92DP_4JuTGkOSOFyC6FNEJmiOZCl1JQlvMvrmXIMCe17jvxMY5XrJALeoBKIH21SdY-FJTJ1mHh6ITqLhu1NSttrE2pdB"
                                        alt="The Pontiff"
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                                        crossOrigin="anonymous"
                                    />
                                </div>

                                {/* Overlays for Game States */}
                                {gameState === 'RESULT' && pontiffMove ? (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 rounded-full backdrop-blur-[2px] animate-in fade-in zoom-in duration-300">
                                        <span className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                            {RITUAL_MOVES.find(m => m.id === pontiffMove)?.icon}
                                        </span>
                                    </div>
                                ) : gameState === 'PLAYING' ? (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-full backdrop-blur-[1px]">
                                        <span className="material-icons text-primary text-4xl animate-spin">hourglass_top</span>
                                    </div>
                                ) : null}
                            </div>
                            <div>
                                <h3 className="text-primary font-bold tracking-widest uppercase text-sm">The Pontiff</h3>
                                <p className="text-[10px] font-mono text-gray-600 uppercase">
                                    {gameState === 'IDLE' ? 'AWAITING CHALLENGE' :
                                        gameState === 'RESULT' ? (result === 'WIN' ? 'DEFEATED' : result === 'LOSS' ? 'VICTORIOUS' : 'STALEMATE') :
                                            'PROCESSING...'}
                                </p>
                            </div>
                        </div>

                        {/* ── Status Bar (when playing) ── */}
                        {gameState === 'PLAYING' && (
                            <div className="flex justify-center">
                                <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-obsidian border border-primary/20 text-primary">
                                    <span className="material-icons text-base animate-spin">hourglass_top</span>
                                    <span className="text-sm font-mono">The Pontiff contemplates...</span>
                                </div>
                            </div>
                        )}

                        {/* ── Result Display ── */}
                        {gameState === 'RESULT' && (
                            <div className="text-center space-y-4">
                                <div className={`text-5xl font-bold uppercase tracking-wider ${result === 'WIN' ? 'text-green-400 text-gold-glow' :
                                    result === 'LOSS' ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                    {result === 'WIN' ? '✦ HERESY PREVAILS' : result === 'LOSS' ? '✗ PURGED' : '◆ STALEMATE'}
                                </div>
                                <div className="flex justify-center gap-4 text-xs font-mono text-gray-500">
                                    <span>⚡ INSTANT</span>
                                    <span>WAGER: {wager} $GUILT</span>
                                    <span className={result === 'WIN' ? 'text-green-400' : result === 'LOSS' ? 'text-red-400' : 'text-gray-400'}>
                                        {result === 'WIN' ? `+${(lastPayout - parseFloat(wager)).toFixed(0)}` : result === 'LOSS' ? `-${wager}` : '±0'} $GUILT
                                    </span>
                                </div>
                                <button
                                    onClick={resetGame}
                                    className="gold-embossed text-background-dark font-bold uppercase tracking-widest px-8 py-3 rounded text-sm hover:scale-[1.02] transition-transform"
                                >
                                    PLAY AGAIN
                                </button>
                            </div>
                        )}

                        {/* ── VS Divider ── */}
                        {gameState === 'IDLE' && (
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/20" />
                                <span className="text-primary/40 text-xs font-mono tracking-[0.5em]">CHOOSE YOUR RITUAL</span>
                                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/20" />
                            </div>
                        )}

                        {/* ── Ritual Move Cards ── */}
                        <div className="grid grid-cols-3 gap-4 lg:gap-6">
                            {RITUAL_MOVES.map((move) => {
                                const isSelected = playerMove === move.id;
                                const isDisabled = gameState !== 'IDLE';
                                return (
                                    <button
                                        key={move.id}
                                        onClick={() => handleCasinoPlay(move.id)}
                                        disabled={isDisabled}
                                        className={`
                      relative flex flex-col items-center justify-center gap-3 p-6 lg:p-8 rounded-lg border-2 transition-all duration-300 group
                      ${isSelected
                                                ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(242,185,13,0.2)] scale-105'
                                                : isDisabled
                                                    ? 'border-gray-800 bg-obsidian opacity-40 cursor-not-allowed'
                                                    : 'border-primary/20 bg-obsidian hover:border-primary/60 hover:bg-primary/5 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(242,185,13,0.1)]'
                                            }
                    `}
                                    >
                                        {/* Background gradient */}
                                        <div className={`absolute inset-0 rounded-lg bg-gradient-to-b ${move.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                        {/* Corner marks */}
                                        <div className="absolute top-2 left-2 text-[8px] text-primary/30 font-mono">♱</div>
                                        <div className="absolute top-2 right-2 text-[8px] text-primary/30 font-mono">♱</div>

                                        <div className="relative z-10 text-center">
                                            <div className="text-5xl lg:text-6xl mb-3 group-hover:scale-110 transition-transform">{move.icon}</div>
                                            <div className="text-sm font-bold text-white uppercase tracking-widest">{move.name}</div>
                                            <div className="text-[9px] text-gray-600 font-mono mt-1 hidden lg:block">{move.desc}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Wager Panel ── */}
                        {gameState === 'IDLE' && (
                            <div className="bg-obsidian border border-primary/20 rounded-lg p-5 max-w-md mx-auto relative overflow-hidden min-h-[320px] flex flex-col justify-center">
                                {casinoBalance < 100 && (
                                    <div className="absolute inset-0 z-20 bg-obsidian/95 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
                                        <span className="text-4xl mb-2">🏛️</span>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Vault Empty</h3>
                                        <p className="text-xs text-gray-500 font-mono mb-4">You need at least 100 $GUILT to play.</p>
                                        <button
                                            onClick={() => { setBankModalTab('deposit'); setShowBankModal(true); }}
                                            className="bg-primary text-background-dark font-bold uppercase tracking-widest text-xs px-6 py-2 rounded hover:brightness-110 transition-all shadow-[0_0_15px_rgba(242,185,13,0.3)]"
                                        >
                                            Deposit Funds
                                        </button>
                                        <a href="/faucet" className="text-[10px] font-mono text-primary/50 hover:text-primary transition-colors mt-2">
                                            No tokens? Claim 3,000 free $GUILT →
                                        </a>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs font-mono text-gray-500 mb-2">
                                    <span className="uppercase tracking-widest">Wager Amount</span>
                                    <span>Casino Balance: <span className="text-primary">{(casinoBalance || 0).toFixed(0)} $GUILT</span></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-primary font-bold text-xl font-mono">$G</span>
                                    <input
                                        type="number"
                                        value={wager}
                                        onChange={(e) => setWager(e.target.value)}
                                        className="flex-1 bg-transparent text-right text-2xl font-bold text-white font-mono focus:ring-0 outline-none border-none"
                                        placeholder="0"
                                    />
                                    <div className="flex gap-1">
                                        {[{ label: 'HALF', val: Math.floor(casinoBalance / 2).toString() }, { label: 'MAX', val: Math.min(casinoBalance, 50000).toString() }].map(b => (
                                            <button
                                                key={b.label}
                                                onClick={() => setWager(b.val)}
                                                className="px-2 py-1 text-[10px] font-mono text-primary/60 border border-primary/20 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                                            >
                                                {b.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Right Sidebar: Match History ─── */}
                <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-primary/10 bg-obsidian/50 flex flex-col">
                    {/* Casino Balance Panel */}
                    <div className="p-4 border-b border-primary/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Casino Vault</span>
                            <span className="text-[10px] font-mono text-green-400">● LIVE</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-primary font-mono">{casinoBalance.toFixed(0)} <span className="text-sm text-primary/50">$GUILT</span></div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setBankModalTab('deposit'); setShowBankModal(true); }}
                                    className="text-[10px] font-mono uppercase font-bold text-primary hover:text-primary/80 border border-primary/30 bg-primary/10 px-2 py-1 rounded transition-colors"
                                >
                                    Top Up
                                </button>
                                <button
                                    onClick={() => { setBankModalTab('withdraw'); setShowBankModal(true); }}
                                    className="text-[10px] font-mono uppercase font-bold text-red-400 hover:text-red-300 border border-red-900/30 bg-red-900/10 px-2 py-1 rounded transition-colors"
                                >
                                    Withdraw
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-b border-primary/10">
                        <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">history</span>
                            Match History
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {loadingHistory ? (
                            <div className="text-center text-gray-600 text-xs py-4">Loading...</div>
                        ) : gameHistory.length === 0 ? (
                            <div className="text-center text-gray-600 text-xs py-4">No games played yet</div>
                        ) : (
                            gameHistory.slice(0, 10).map((game, i) => {
                                const outcome = game.result?.outcome || 'UNKNOWN';
                                const playerMoveId = game.result?.playerMove;
                                const pontiffMoveId = game.result?.pontiffMove;
                                const wagerEth = parseFloat(game.wager || '0') / 1e18;
                                const profitAmount = outcome === 'WIN' ? wagerEth : outcome === 'LOSS' ? -wagerEth : 0;
                                const formattedProfit = profitAmount > 0 ? `+${profitAmount.toFixed(0)}` : profitAmount < 0 ? profitAmount.toFixed(0) : '0';

                                return (
                                    <div
                                        key={game.id}
                                        className={`p-3 rounded border transition-colors cursor-pointer group ${outcome === 'WIN' ? 'border-green-900/30 hover:border-green-800/50 bg-green-900/5' :
                                            outcome === 'LOSS' ? 'border-red-900/30 hover:border-red-800/50 bg-red-900/5' :
                                                'border-gray-800 hover:border-gray-700 bg-transparent'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-[10px] font-mono font-bold ${outcome === 'WIN' ? 'text-green-400' :
                                                outcome === 'LOSS' ? 'text-red-400' : 'text-gray-500'
                                                }`}>{outcome}</span>
                                            <span className="text-[10px] text-gray-600 font-mono">{formatTimeAgo(game.created_at)}</span>
                                        </div>
                                        <div className="text-[11px] text-gray-500 font-mono">
                                            {getMoveName(playerMoveId)} vs {getMoveName(pontiffMoveId)}
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] text-gray-600 font-mono">{game.play_mode === 'casino' ? '⚡ Casino' : 'ThePontiff'}</span>
                                            <span className={`text-xs font-mono font-bold ${formattedProfit.startsWith('+') ? 'text-green-400' :
                                                formattedProfit.startsWith('-') ? 'text-red-400' : 'text-gray-500'
                                                }`}>{formattedProfit}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Stats summary */}
                    <div className="p-4 border-t border-primary/10 bg-obsidian">
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <div className="text-lg font-bold text-green-400 font-mono">{playerStats.wins}</div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">Wins</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-red-400 font-mono">{playerStats.losses}</div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">Losses</div>
                            </div>
                            <div>
                                <div className={`text-lg font-bold font-mono ${playerStats.profit > 0 ? 'text-primary' :
                                    playerStats.profit < 0 ? 'text-red-400' : 'text-gray-400'
                                    }`}>{playerStats.profit > 0 ? '+' : ''}{playerStats.profit.toFixed(0)}</div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">Profit</div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <BankModal isOpen={showBankModal} onClose={() => setShowBankModal(false)} initialTab={bankModalTab} />
        </div>
    );
}
