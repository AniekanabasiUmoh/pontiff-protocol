'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, usePublicClient, useSignMessage } from 'wagmi';

interface Session {
    id: string;
    strategyIndex?: number; // Needed for starting
    agentName: string;
    agentType: string;
    game: string;
    gameIcon: string;
    deposit: string;
    pnl: string;
    pnlPositive: boolean;
    winRate: string;
    gamesPlayed: number;
    status: 'active' | 'cooldown' | 'stopped' | 'unknown';
    uptime: string;
}

interface AgentDetail {
    sessionWallet: string;
    strategyIndex?: number; // Added fallback
    balance: string;
    startingBalance: string;
    stopLoss: number;
    takeProfit: number | null;
    totalWins: number;
    totalLosses: number;
    totalDraws: number;
    createdAt: string;
    txHash: string;
    gameHistory: GameRecord[];
}

interface GameRecord {
    id: string;
    result: 'win' | 'loss' | 'draw';
    wager: number;
    pnl: number;
    playedAt: string;
    game: string;
}

interface AgentDetailModalProps {
    session: Session;
    onClose: () => void;
    onStatusChange?: () => void;
}

export default function AgentDetailModal({ session, onClose, onStatusChange }: AgentDetailModalProps) {
    const [detail, setDetail] = useState<AgentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'history'>('overview');
    const [stopping, setStopping] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);
    const [starting, setStarting] = useState(false); // New state
    const [funding, setFunding] = useState(false); // New state
    const [showFundInput, setShowFundInput] = useState(false); // New state
    const [fundAmount, setFundAmount] = useState('100'); // Default fund amount

    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();

    // Move constants here or import
    const GUILT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;
    const ERC20_ABI = [
        {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
            outputs: [{ name: '', type: 'bool' }]
        },
        {
            name: 'withdraw',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [],
            outputs: [],
        }
    ];

    const fetchDetail = useCallback(async () => {
        try {
            const res = await fetch(`/api/agents/${session.id}/detail`);
            if (res.ok) {
                const data = await res.json();
                setDetail(data);
            }
        } catch (e) {
            console.error('Failed to fetch agent detail:', e);
        } finally {
            setLoading(false);
        }
    }, [session.id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const { signMessageAsync } = useSignMessage();

    const handleStop = async () => {
        setStopping(true);
        try {
            const timestamp = Date.now();
            const message = `Pontiff Action: stop_agent at ${timestamp}`;
            const signature = await signMessageAsync({ message });

            const res = await fetch(`/api/agents/${session.id}/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature, timestamp })
            });

            if (res.ok) {
                session.status = 'stopped';
                onStatusChange?.();
            }
        } catch (e) {
            console.error('Failed to stop agent:', e);
        } finally {
            setStopping(false);
        }
    };

    const handleStart = async () => {
        const strategyIdx = session.strategyIndex ?? detail?.strategyIndex;

        if (!detail?.sessionWallet || strategyIdx === undefined) {
            alert('Cannot start: Missing wallet or strategy index (Try refreshing page)');
            return;
        }

        setStarting(true);
        try {
            const timestamp = Date.now();
            const message = `Pontiff Action: start_agent at ${timestamp}`;
            const signature = await signMessageAsync({ message });

            const res = await fetch('/api/agents/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session.id,
                    sessionWallet: detail.sessionWallet,
                    strategy: strategyIdx,
                    signature,
                    timestamp
                })
            });


            const data = await res.json();
            if (res.ok) {
                alert('Agent started successfully!');
                session.status = 'active'; // Optimistic update
                onStatusChange?.();
                onClose();
            } else {
                throw new Error(data.message || 'Failed to start');
            }
        } catch (e: any) {
            console.error('Failed to start agent:', e);
            alert(`Failed to start: ${e.message}`);
        } finally {
            setStarting(false);
        }
    };

    const handleFund = async () => {
        if (!detail?.sessionWallet || !address || !fundAmount) return;
        setFunding(true);
        try {
            const amountWei = BigInt(parseFloat(fundAmount) * 1e18);
            const tx = await writeContractAsync({
                address: GUILT_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [detail.sessionWallet as `0x${string}`, amountWei]
            });
            await publicClient?.waitForTransactionReceipt({ hash: tx });
            alert('Funding successful!');
            setShowFundInput(false);
            fetchDetail(); // Refresh balance
        } catch (e: any) {
            console.error('Funding failed:', e);
            alert(`Funding failed: ${e.message}`);
        } finally {
            setFunding(false);
        }
    };

    const handleWithdraw = async () => {
        if (!detail?.sessionWallet || !address) return;
        setWithdrawing(true);
        try {
            const tx = await writeContractAsync({
                address: detail.sessionWallet as `0x${string}`,
                abi: ERC20_ABI, // Use unified ABI
                functionName: 'withdraw',
            });
            await publicClient?.waitForTransactionReceipt({ hash: tx });
            setWithdrawSuccess(true);
            onStatusChange?.();
        } catch (e: any) {
            console.error('Withdraw failed:', e);
        } finally {
            setWithdrawing(false);
        }
    };

    const pnlValue = parseFloat(session.pnl.replace(/[^0-9.-]/g, '')) || 0;
    const depositValue = parseFloat(session.deposit.replace(/[^0-9.-]/g, '')) || 0;
    const pnlPercent = depositValue > 0 ? ((pnlValue / depositValue) * 100).toFixed(1) : '0.0';
    const totalGames = detail ? (detail.totalWins + detail.totalLosses + detail.totalDraws) : session.gamesPlayed;
    const winRateNum = totalGames > 0 && detail ? ((detail.totalWins / totalGames) * 100).toFixed(1) : session.winRate.replace('%', '');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl bg-[#0a0a0f] border border-primary/30 rounded-lg shadow-[0_0_60px_-10px_rgba(242,185,13,0.15)] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Top gold accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

                {/* Header */}
                <div className="px-6 py-5 border-b border-primary/10 bg-primary/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                                <span className="material-icons text-primary text-2xl">smart_toy</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                                    {session.agentName}
                                </h2>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                        {session.agentType}
                                    </span>
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
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-white transition-colors p-1"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="px-6 py-2 border-b border-primary/10 flex gap-1 bg-[#0a0a0f]">
                    {(['overview', 'history'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded transition-colors ${tab === t
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'text-gray-500 hover:text-primary border border-transparent'
                                }`}
                        >
                            <span className="material-icons text-xs mr-1 align-middle">
                                {t === 'overview' ? 'dashboard' : 'receipt_long'}
                            </span>
                            {t}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-white/5 rounded-lg" />
                                ))}
                            </div>
                            <div className="h-32 bg-white/5 rounded-lg" />
                        </div>
                    ) : tab === 'overview' ? (
                        <div className="space-y-5">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard
                                    icon="sports_score"
                                    label="Games"
                                    value={totalGames.toString()}
                                    sub={`${detail?.totalWins || 0}W - ${detail?.totalLosses || 0}L - ${detail?.totalDraws || 0}D`}
                                />
                                <StatCard
                                    icon="percent"
                                    label="Win Rate"
                                    value={`${winRateNum}%`}
                                    sub={totalGames > 0 ? 'of total games' : 'no games yet'}
                                    highlight={parseFloat(String(winRateNum)) >= 50}
                                />
                                <StatCard
                                    icon="trending_up"
                                    label="P&L"
                                    value={session.pnl}
                                    sub={`${pnlPercent}% return`}
                                    positive={session.pnlPositive}
                                    colored
                                />
                                <StatCard
                                    icon="schedule"
                                    label="Uptime"
                                    value={session.uptime}
                                    sub="since spawn"
                                />
                            </div>

                            {/* Balance Bar */}
                            <div className="bg-white/5 border border-primary/10 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Balance</span>
                                    <span className="text-sm font-mono text-white font-bold">
                                        {detail?.balance || session.deposit} <span className="text-gray-500">$GUILT</span>
                                    </span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${session.pnlPositive ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                        style={{
                                            width: `${Math.min(100, Math.max(5, ((parseFloat(detail?.balance || session.deposit) / depositValue) * 100)))}%`
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] font-mono text-gray-600">
                                    <span>Stop Loss: {detail?.stopLoss || 0}</span>
                                    <span>Deposited: {session.deposit}</span>
                                    <span>Take Profit: {detail?.takeProfit || '—'}</span>
                                </div>
                            </div>

                            {/* Session Info */}
                            <div className="bg-white/5 border border-primary/10 rounded-lg p-4 space-y-2">
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Session Details</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                    <InfoRow label="Game" value={session.game} icon={session.gameIcon} />
                                    <InfoRow label="Strategy" value={session.agentType} />
                                    {detail?.sessionWallet && (
                                        <InfoRow
                                            label="Session Wallet"
                                            value={`${detail.sessionWallet.slice(0, 6)}...${detail.sessionWallet.slice(-4)}`}
                                            mono
                                        />
                                    )}
                                    {detail?.txHash && (
                                        <InfoRow
                                            label="Spawn TX"
                                            value={`${detail.txHash.slice(0, 6)}...${detail.txHash.slice(-4)}`}
                                            mono
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* History Tab */
                        <div>
                            {!detail?.gameHistory || detail.gameHistory.length === 0 ? (
                                <div className="text-center py-12 text-gray-600">
                                    <span className="material-icons text-4xl text-gray-700 mb-3 block">history</span>
                                    <p className="text-sm">No games played yet.</p>
                                    <p className="text-xs text-gray-700 mt-1">Games will appear here once the agent starts playing.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-primary/10">
                                            <th className="py-2 pr-3">Result</th>
                                            <th className="py-2 pr-3">Game</th>
                                            <th className="py-2 pr-3 text-right">Wager</th>
                                            <th className="py-2 pr-3 text-right">P&L</th>
                                            <th className="py-2 text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {detail.gameHistory.map((game, i) => (
                                            <tr key={game.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-2.5 pr-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${game.result === 'win'
                                                        ? 'bg-green-900/20 text-green-400'
                                                        : game.result === 'loss'
                                                            ? 'bg-red-900/20 text-red-400'
                                                            : 'bg-gray-800 text-gray-400'
                                                        }`}>
                                                        {game.result === 'win' ? '✦' : game.result === 'loss' ? '✗' : '—'}
                                                        {game.result.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 pr-3 font-mono text-gray-400 text-xs">{game.game}</td>
                                                <td className="py-2.5 pr-3 text-right font-mono text-gray-400">{game.wager}</td>
                                                <td className={`py-2.5 pr-3 text-right font-mono font-bold ${game.pnl > 0 ? 'text-green-400' : game.pnl < 0 ? 'text-red-400' : 'text-gray-500'
                                                    }`}>
                                                    {game.pnl > 0 ? '+' : ''}{game.pnl}
                                                </td>
                                                <td className="py-2.5 text-right font-mono text-gray-600 text-xs">
                                                    {formatTimeAgo(game.playedAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-primary/10 bg-primary/5 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-2 items-center">
                        {/* STOP BUTTON */}
                        {session.status === 'active' && (
                            <button
                                onClick={handleStop}
                                disabled={stopping}
                                className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest bg-red-900/20 text-red-400 border border-red-900/30 rounded hover:bg-red-900/40 transition-colors disabled:opacity-50"
                            >
                                <span className="material-icons text-sm mr-1 align-middle">stop_circle</span>
                                {stopping ? 'Stopping...' : 'Stop Agent'}
                            </button>
                        )}

                        {/* START BUTTON */}
                        {(session.status === 'stopped' || session.status === 'unknown') && (
                            <button
                                onClick={handleStart}
                                disabled={starting}
                                className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest bg-green-900/20 text-green-400 border border-green-900/30 rounded hover:bg-green-900/40 transition-colors disabled:opacity-50"
                            >
                                <span className="material-icons text-sm mr-1 align-middle">play_circle</span>
                                {starting ? 'Starting...' : 'Start Agent'}
                            </button>
                        )}

                        {/* WITHDRAW BUTTON */}
                        {detail?.sessionWallet && !withdrawSuccess && (
                            <button
                                onClick={handleWithdraw}
                                disabled={withdrawing}
                                className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors disabled:opacity-50"
                            >
                                <span className="material-icons text-sm mr-1 align-middle">account_balance_wallet</span>
                                {withdrawing ? 'Withdrawing...' : 'Withdraw'}
                            </button>
                        )}

                        {/* FUND BUTTON & INPUT */}
                        {detail?.sessionWallet && (
                            <div className="flex items-center gap-2">
                                {showFundInput ? (
                                    <div className="flex items-center gap-2 bg-black/50 rounded px-2 py-1 border border-primary/20">
                                        <input
                                            type="number"
                                            value={fundAmount}
                                            onChange={e => setFundAmount(e.target.value)}
                                            className="w-16 bg-transparent text-white text-xs font-mono focus:outline-none text-right"
                                            placeholder="100"
                                        />
                                        <button
                                            onClick={handleFund}
                                            disabled={funding}
                                            className="text-xs text-primary hover:text-white font-bold"
                                        >
                                            {funding ? '...' : 'CONFIRM'}
                                        </button>
                                        <button
                                            onClick={() => setShowFundInput(false)}
                                            className="text-xs text-gray-500 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowFundInput(true)}
                                        className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest bg-white/5 text-gray-300 border border-white/10 rounded hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-icons text-sm mr-1 align-middle">add_circle</span>
                                        Add Funds
                                    </button>
                                )}
                            </div>
                        )}

                        {withdrawSuccess && (
                            <span className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest text-green-400 flex items-center gap-1">
                                <span className="material-icons text-sm">check_circle</span>
                                Withdrawn
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>

                {/* Bottom gold accent */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
        </div>
    );
}

/* ─── Sub Components ─── */

function StatCard({
    icon, label, value, sub, positive, colored, highlight
}: {
    icon: string; label: string; value: string; sub?: string;
    positive?: boolean; colored?: boolean; highlight?: boolean;
}) {
    return (
        <div className="bg-white/5 border border-primary/10 rounded-lg p-3 hover:border-primary/20 transition-colors group">
            <div className="flex items-center gap-1.5 mb-1.5">
                <span className="material-icons text-xs text-gray-600 group-hover:text-primary transition-colors">{icon}</span>
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">{label}</span>
            </div>
            <div className={`text-xl font-bold font-mono ${colored
                ? (positive ? 'text-green-400' : 'text-red-400')
                : highlight ? 'text-primary' : 'text-white'
                }`}>
                {value}
            </div>
            {sub && <div className="text-[10px] font-mono text-gray-600 mt-0.5">{sub}</div>}
        </div>
    );
}

function InfoRow({ label, value, icon, mono }: { label: string; value: string; icon?: string; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">{label}</span>
            <span className={`text-sm ${mono ? 'font-mono' : ''} text-gray-300 flex items-center gap-1`}>
                {icon && <span className="material-icons text-xs text-gray-500">{icon}</span>}
                {value}
            </span>
        </div>
    );
}

function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}
