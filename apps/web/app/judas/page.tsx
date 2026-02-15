
'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { useJudasProtocol } from '../hooks/useJudasProtocol';
import { formatEther, parseEther } from 'viem';
import { StakingCathedralABI } from '../abis';

const JUDAS_ADDRESS = process.env.NEXT_PUBLIC_JUDAS_ADDRESS as `0x${string}`;
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`;

export default function JudasPage() {
    const { address, isConnected } = useAccount();
    const [isMounted, setIsMounted] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [showBetrayConfirm, setShowBetrayConfirm] = useState(false); // Modal state
    const [isResolving, setIsResolving] = useState(false); // Local resolving state

    const [now, setNow] = useState(Math.floor(Date.now() / 1000));

    useEffect(() => {
        setIsMounted(true);
        const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
        return () => clearInterval(interval);
    }, []);

    // ── Contract Reads (External to Judas) ──
    const { data: guiltBalance, refetch: refetchGuilt } = useReadContract({
        address: TOKEN_ADDRESS, abi: StakingCathedralABI, functionName: 'balanceOf',
        args: address ? [address] : undefined, query: { enabled: !!address },
    });
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: TOKEN_ADDRESS, abi: StakingCathedralABI, functionName: 'allowance',
        args: address ? [address, JUDAS_ADDRESS] : undefined, query: { enabled: !!address, refetchInterval: 2000 },
    });

    // ── Hook Data ──
    const {
        epochId, epochEndTime, totalLoyal, totalBetrayed, isResolved, betrayalPct,
        userStaked, isBetrayer, lastEpochInteracted,
        tournamentId, currentRound, maxRounds,
        reputation,
        deposit, signalBetrayal, withdraw, resolveEpoch, claimRewards, recordJudasOutcome,
        refetchGameState, refetchUserPosition, refetchTournamentState, refetchReputation,
        isPending: isHookPending, isConfirming, isSuccess: isConfirmed, hash: txHash, writeError
    } = useJudasProtocol();

    // ── Local Tx State Management ──
    const [lastAction, setLastAction] = useState<{ type: 'STAKE' | 'BETRAY' | 'WITHDRAW' | 'RESOLVE' | 'CLAIM'; amount: number } | null>(null);
    const { writeContract, isPending: isApprovePending } = useWriteContract();

    useEffect(() => {
        if (isConfirmed && txHash && lastAction) {
            if (lastAction.type === 'RESOLVE') {
                // Call verification API
                fetch('/api/judas/resolve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ epochId: Number(epochId), txHash }),
                }).then(res => res.json()).then(() => {
                    setIsResolving(false);
                }).catch(err => {
                    console.error("Resolve logging failed", err);
                    setIsResolving(false);
                });
            } else {
                // Record other outcomes
                recordJudasOutcome(lastAction.type as any, lastAction.amount, txHash);
            }
            setLastAction(null);
            // Refresh all data
            refetchGameState(); refetchUserPosition(); refetchGuilt(); refetchAllowance(); refetchTournamentState(); refetchReputation();
            setDepositAmount('');
            setShowBetrayConfirm(false); // Ensure modal closed
        }
    }, [isConfirmed, txHash, lastAction, recordJudasOutcome, refetchGameState, refetchUserPosition, refetchGuilt, refetchAllowance, refetchTournamentState, refetchReputation, epochId]);

    // Helpers
    const epochEndTimeSeconds = Math.floor(epochEndTime / 1000);
    const timeLeftSeconds = epochEndTimeSeconds > now ? epochEndTimeSeconds - now : 0;
    const needsResolution = timeLeftSeconds === 0 && !isResolved && !isResolving;
    const totalPool = totalLoyal + totalBetrayed;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const needsApproval = depositAmount && allowance ? parseEther(depositAmount) > allowance : true;
    const isPending = isHookPending || isConfirming || isApprovePending || isResolving;

    const getErrorMessage = (err: Error) => {
        if (!err) return null;
        if (err.message.includes('Betrayers locked'))
            return 'You cannot withdraw while you are a betrayer. Wait for epoch resolution.';
        if (err.message.includes('Call resolveEpoch'))
            return 'Epoch has ended. Resolve it first before taking action.';
        if (err.message.includes('insufficient allowance'))
            return 'Approval required. Click Approve first.';
        if (err.message.includes('User rejected'))
            return 'Transaction rejected by user.';
        return err.message.length > 100 ? 'Transaction failed. Check console.' : err.message;
    };

    const handleApprove = () => {
        if (!depositAmount) return;
        writeContract({ address: TOKEN_ADDRESS, abi: StakingCathedralABI, functionName: 'approve', args: [JUDAS_ADDRESS, parseEther(depositAmount)] });
    };

    const handleDeposit = () => {
        if (!depositAmount) return;
        setLastAction({ type: 'STAKE', amount: Number(depositAmount) });
        deposit(parseEther(depositAmount));
    };

    const handleBetrayClick = () => {
        setShowBetrayConfirm(true);
    };

    const confirmBetrayal = () => {
        setLastAction({ type: 'BETRAY', amount: 0 });
        signalBetrayal();
        setShowBetrayConfirm(false);
    };

    const handleResolveEpoch = () => {
        setLastAction({ type: 'RESOLVE', amount: 0 });
        setIsResolving(true);
        resolveEpoch();
    };

    const handleWithdraw = () => {
        const amount = depositAmount ? parseEther(depositAmount) : userStaked;
        if (amount <= BigInt(0)) return;
        setLastAction({ type: 'WITHDRAW', amount: Number(formatEther(amount)) });
        withdraw(amount);
    };

    const handleClaimRewards = () => {
        if (Number(lastEpochInteracted) < Number(epochId) - 1) {
            setLastAction({ type: 'CLAIM', amount: 0 });
            claimRewards(BigInt(epochId) - BigInt(1));
        }
    }

    const hasPendingRewards = Number(lastEpochInteracted) > 0 && Number(lastEpochInteracted) < Number(epochId) - 1;

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8 relative">
            {/* ─── Betrayal Modal ─── */}
            {showBetrayConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-obsidian border-2 border-red-600 rounded-lg max-w-md w-full p-6 shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <span className="material-icons text-red-500 text-6xl">warning_amber</span>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Signal Betrayal</h2>

                            <div className="space-y-2 text-sm text-gray-300">
                                <p className="font-bold text-red-400">⚠️ This action is IRREVERSIBLE for this epoch.</p>
                                <p>You are choosing to defect from the Loyalists.</p>
                                <div className="bg-red-900/20 p-3 rounded border border-red-900/30 text-xs text-left space-y-1">
                                    <p>• If Betrayal &lt; 20%: You lose ALL your stake.</p>
                                    <p>• If 20% &le; Betrayal &lt; 40%: You steal 20% of Loyal funds.</p>
                                    <p>• If Betrayal &ge; 40%: You steal 50% of Loyal funds.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full pt-4">
                                <button
                                    onClick={() => setShowBetrayConfirm(false)}
                                    className="px-4 py-3 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase text-xs tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmBetrayal}
                                    className="px-4 py-3 rounded bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                                >
                                    Confirm Betrayal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`max-w-[1400px] mx-auto space-y-6 ${showBetrayConfirm ? 'blur-sm' : ''}`}>

                {/* ─── Header ─── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase">
                                TOURNAMENT #{tournamentId} — ROUND {currentRound} OF {maxRounds}
                            </p>
                            <div className="flex gap-1">
                                {Array.from({ length: maxRounds }).map((_, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full ${i < currentRound ? 'bg-primary' : 'bg-gray-800 border border-gray-700'}`} />
                                ))}
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                            Judas <span className="text-primary text-gold-glow">Protocol</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-mono mt-1">
                            {currentRound >= maxRounds ? "Final Round! Complete to resolve tournament." : "Complete 5 rounds to close this tournament"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                        <div className="bg-obsidian border border-primary/20 rounded px-3 py-2">
                            <span className="text-gray-500">EPOCH:</span> <span className="text-primary font-bold">{isMounted ? epochId.toString() : '—'}</span>
                        </div>
                        <div className={`bg-obsidian border rounded px-3 py-2 ${timeLeftSeconds > 0 ? 'border-green-900/30' : 'border-red-900/30'}`}>
                            <span className="text-gray-500">TIME LEFT:</span> <span className={`font-bold font-mono ${timeLeftSeconds > 0 ? 'text-green-400' : 'text-red-400'}`}>{isMounted ? formatTime(timeLeftSeconds) : '--:--:--'}</span>
                        </div>
                    </div>
                </div>

                {/* ─── Resolution Banner ─── */}
                {isMounted && needsResolution && (
                    <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg p-5">
                        <div className="flex items-center gap-3">
                            <span className="material-icons text-primary text-xl">hourglass_bottom</span>
                            <div>
                                <div className="text-white text-sm font-bold">Epoch Complete — Click to Resolve & Start Next Round</div>
                                <div className="text-xs text-gray-500">Anyone can trigger this. One tx, free on testnet. Unlocks deposits for everyone.</div>
                            </div>
                        </div>
                        <button
                            onClick={handleResolveEpoch}
                            disabled={isPending}
                            className="gold-embossed text-background-dark font-bold uppercase tracking-widest px-6 py-3 rounded text-xs disabled:opacity-50"
                        >
                            {isPending ? 'Processing...' : 'RESOLVE EPOCH'}
                        </button>
                    </div>
                )}

                {/* ─── Main Grid ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ── Left: Pool Stats ── */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Pool Overview */}
                        <div className="bg-obsidian rounded-lg border border-primary/10 p-5 space-y-5">
                            <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                <span className="material-icons text-primary text-sm">analytics</span>
                                Pool Overview
                            </h3>

                            <div className="text-center py-4">
                                <div className="text-[10px] text-gray-600 font-mono mb-1">TOTAL POOL</div>
                                <div className="text-4xl font-bold font-mono text-white">
                                    {isMounted && totalPool > BigInt(0) ? parseFloat(formatEther(totalPool)).toFixed(0) : '0'}
                                </div>
                                <div className="text-[10px] text-gray-600 font-mono">$sGUILT</div>
                            </div>

                            {/* Loyalty vs Betrayal Bar */}
                            <div>
                                <div className="flex justify-between text-[10px] font-mono mb-2">
                                    <span className="text-green-400">🤝 LOYAL {100 - betrayalPct}%</span>
                                    <span className="text-red-400">🗡️ BETRAYED {betrayalPct}%</span>
                                </div>
                                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all" style={{ width: `${100 - betrayalPct}%` }} />
                                    <div className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all" style={{ width: `${betrayalPct}%` }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-900/10 border border-green-900/20 rounded-lg p-3 text-center">
                                    <div className="text-xl font-bold text-green-400 font-mono">
                                        {isMounted ? parseFloat(formatEther(totalLoyal)).toFixed(0) : '0'}
                                    </div>
                                    <div className="text-[9px] text-gray-600 font-mono">LOYAL POOL</div>
                                </div>
                                <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-3 text-center">
                                    <div className="text-xl font-bold text-red-400 font-mono">
                                        {isMounted ? parseFloat(formatEther(totalBetrayed)).toFixed(0) : '0'}
                                    </div>
                                    <div className="text-[9px] text-gray-600 font-mono">BETRAYER POOL</div>
                                </div>
                            </div>
                        </div>

                        {/* Your Reputation */}
                        <div className="bg-obsidian rounded-lg border border-primary/10 p-5">
                            <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2 mb-4">
                                <span className="material-icons text-primary text-sm">shield</span>
                                Your Reputation
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="bg-green-900/10 border border-green-900/20 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-green-400 font-mono">{reputation ? reputation.loyal.toString() : '0'}</div>
                                    <div className="text-[9px] text-gray-600 font-mono">😇 INTEGRITY</div>
                                </div>
                                <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-red-400 font-mono">{reputation ? reputation.betrayed.toString() : '0'}</div>
                                    <div className="text-[9px] text-gray-600 font-mono">👿 MALICE</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Center: Action Zone ── */}
                    <div className="lg:col-span-8">
                        <div className="bg-obsidian rounded-lg border border-primary/20 overflow-hidden shadow-[0_0_40px_-10px_rgba(242,185,13,0.1)]">
                            {!isMounted || !isConnected ? (
                                <div className="p-16 text-center">
                                    <span className="material-icons text-primary/20 text-6xl mb-4 block">lock</span>
                                    <p className="text-gray-500 font-mono text-sm">Connect wallet to enter the Judas Protocol</p>
                                </div>
                            ) : userStaked === BigInt(0) && !isBetrayer ? (
                                /* ── Entry State ── */
                                <div className="p-8 space-y-6">
                                    <div className="text-center">
                                        <span className="material-icons text-primary text-5xl mb-4 block">login</span>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">Enter the Arena</h3>
                                        <p className="text-xs text-gray-500 mb-2">
                                            Deposit $sGUILT to participate. Need sGUILT?{' '}
                                            <a href="/cathedral" className="text-primary hover:underline">Stake GUILT first →</a>
                                        </p>
                                    </div>

                                    <div className="max-w-md mx-auto space-y-4">
                                        <div className="flex justify-between text-xs font-mono mb-1">
                                            <span className="text-gray-500 uppercase tracking-widest">Stake Amount</span>
                                            <span className="text-primary/60 cursor-pointer hover:text-primary"
                                                onClick={() => guiltBalance && setDepositAmount(formatEther(guiltBalance))}>
                                                MAX: <span className="text-primary">{guiltBalance ? parseFloat(formatEther(guiltBalance)).toFixed(0) : '0'}</span> sGUILT
                                            </span>
                                        </div>
                                        <div className="bg-background-dark border border-primary/20 rounded-lg p-4 flex items-center gap-3">
                                            <span className="text-primary font-bold text-xl font-mono">$s</span>
                                            <input
                                                type="number"
                                                value={depositAmount}
                                                onChange={(e) => setDepositAmount(e.target.value)}
                                                className="flex-1 bg-transparent text-right text-2xl font-bold text-white font-mono focus:ring-0 outline-none border-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {needsResolution ? (
                                            <div className="w-full py-4 rounded-lg bg-amber-900/20 border border-amber-800/40 text-center space-y-1">
                                                <p className="text-amber-400 text-xs font-mono font-bold">⚠ Epoch expired</p>
                                                <p className="text-gray-500 text-[10px] font-mono">Scroll up and click <span className="text-primary">RESOLVE EPOCH</span> to start the next round — then deposit.</p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={needsApproval ? handleApprove : handleDeposit}
                                                disabled={isPending || !depositAmount || parseFloat(depositAmount) <= 0}
                                                className={`w-full py-4 rounded-lg font-bold uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-3 ${needsApproval
                                                    ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                                                    : 'gold-embossed text-background-dark hover:scale-[1.01]'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                <span className="material-icons text-lg">{needsApproval ? 'lock_open' : 'login'}</span>
                                                {isPending ? 'Processing...' : needsApproval ? 'APPROVE $sGUILT' : 'DEPOSIT & ENTER'}
                                            </button>
                                        )}
                                    </div>

                                    {hasPendingRewards && (
                                        <div className="text-center max-w-md mx-auto mt-4 pt-4 border-t border-primary/10">
                                            <p className="text-xs text-primary mb-2">You have unclaimed rewards from previous epochs</p>
                                            <button
                                                onClick={handleClaimRewards}
                                                disabled={isPending}
                                                className="text-xs uppercase bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded font-bold"
                                            >
                                                Claim Rewards
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* ── Active Player State ── */
                                <div className="p-8 space-y-8">
                                    {/* Status and Stake */}
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${isBetrayer ? 'bg-red-900/30 border border-red-800' : 'bg-green-900/30 border border-green-800'
                                                }`}>
                                                {isBetrayer ? '🗡️' : '🤝'}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold ${isBetrayer ? 'text-red-400' : 'text-green-400'}`}>
                                                    {isBetrayer ? 'STATUS: BETRAYER' : 'STATUS: LOYAL'}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono">Epoch {epochId.toString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-center md:text-right">
                                            <div className="text-[10px] text-gray-600 font-mono">YOUR STAKE</div>
                                            <div className="text-3xl font-bold text-white font-mono">{formatEther(userStaked)}</div>
                                            <div className="text-[10px] text-gray-600 font-mono">$sGUILT</div>
                                        </div>
                                    </div>

                                    {/* Choice Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Cooperate (Passive) */}
                                        <div className="bg-green-900/5 border border-green-900/20 rounded-lg p-6 text-center opacity-70">
                                            <div className="w-16 h-16 rounded-full bg-green-900/20 border border-green-900/30 flex items-center justify-center text-4xl mx-auto mb-4">🤝</div>
                                            <h4 className="text-green-400 font-bold uppercase tracking-widest text-sm mb-2">Cooperate</h4>
                                            <p className="text-[11px] text-gray-600 mb-3">Remain silent. Default action.</p>
                                            <div className="text-[10px] text-green-400/50 font-mono border-t border-green-900/20 pt-2 mt-2">
                                                If coup fails → You win betrayer funds<br />
                                                If coup succeeds → You lose a portion
                                            </div>
                                        </div>

                                        {/* Betray */}
                                        <button
                                            onClick={handleBetrayClick}
                                            disabled={isPending || isBetrayer}
                                            className={`bg-red-900/5 border rounded-lg p-6 text-center transition-all disabled:cursor-not-allowed ${isBetrayer
                                                ? 'border-red-500/50 opacity-60'
                                                : 'border-red-900/20 hover:border-red-700 hover:bg-red-900/10 hover:shadow-[0_0_30px_rgba(139,0,0,0.15)]'
                                                }`}
                                        >
                                            <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-4xl mx-auto mb-4 ${isBetrayer ? 'bg-red-900/40 border-red-700' : 'bg-red-900/20 border-red-900/30'
                                                }`}>🗡️</div>
                                            <h4 className="text-red-400 font-bold uppercase tracking-widest text-sm mb-2">
                                                {isBetrayer ? 'BETRAYED' : 'BETRAY'}
                                            </h4>
                                            <p className="text-[11px] text-gray-600 mb-3">
                                                {isBetrayer ? 'You chose violence.' : 'Signal betrayal. Irreversible.'}
                                            </p>
                                            <div className="text-[10px] text-red-400/50 font-mono border-t border-red-900/20 pt-2 mt-2">
                                                If coup fails → You lose everything<br />
                                                If coup succeeds → You steal from loyal
                                            </div>
                                        </button>
                                    </div>

                                    {/* Actions Row */}
                                    <div className="flex justify-center gap-4">
                                        {!isBetrayer && (
                                            <button
                                                onClick={handleWithdraw}
                                                disabled={isPending}
                                                className="text-xs text-gray-500 hover:text-white font-mono underline disabled:opacity-50"
                                            >
                                                Withdraw Stake (exit epoch)
                                            </button>
                                        )}

                                        {hasPendingRewards && (
                                            <button
                                                onClick={handleClaimRewards}
                                                disabled={isPending}
                                                className="text-xs text-primary hover:text-white font-mono underline disabled:opacity-50"
                                            >
                                                Claim Pending Rewards
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tx Feedback */}
                            {isConfirmed && (
                                <div className="p-3 mx-8 mb-8 bg-green-900/20 border border-green-900/30 rounded-lg text-green-400 text-center text-xs font-mono">
                                    ✓ Transaction confirmed.
                                </div>
                            )}
                            {writeError && (
                                <div className="p-3 mx-8 mb-8 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400 text-center text-xs font-mono">
                                    ✗ {getErrorMessage(writeError)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── History Section ─── */}
                <EpochHistory />
            </div>
        </div>
    );
}

function EpochHistory() {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/judas/history')
            .then(res => res.json())
            .then(data => {
                if (data.history) setHistory(data.history);
            })
            .catch(console.error);
    }, []);

    if (!history.length) return null;

    return (
        <div className="bg-obsidian rounded-lg border border-primary/10 p-6 overflow-hidden">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2 mb-6">
                <span className="material-icons text-primary text-sm">history</span>
                Recent Epochs
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] text-gray-500 font-mono border-b border-primary/10">
                            <th className="p-3">EPOCH</th>
                            <th className="p-3">TOURNAMENT</th>
                            <th className="p-3">ROUND</th>
                            <th className="p-3 text-right">LOYAL POOL</th>
                            <th className="p-3 text-right">BETRAYAL %</th>
                            <th className="p-3 text-center">OUTCOME</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-mono">
                        {history.map((epoch) => (
                            <tr key={epoch.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                                <td className="p-3 text-primary">#{epoch.epoch_id}</td>
                                <td className="p-3">#{epoch.tournament_id}</td>
                                <td className="p-3">{epoch.round_number}</td>
                                <td className="p-3 text-right text-gray-300">{(Number(epoch.total_loyal) / 1e18).toFixed(0)}</td>
                                <td className="p-3 text-right">
                                    <span className={Number(epoch.betrayal_pct) > 40 ? 'text-red-400' : Number(epoch.betrayal_pct) > 20 ? 'text-amber-400' : 'text-green-400'}>
                                        {Number(epoch.betrayal_pct).toFixed(1)}%
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${epoch.outcome === 'FAILED_COUP' ? 'bg-green-900/20 text-green-400' :
                                        epoch.outcome === 'PARTIAL_COUP' ? 'bg-amber-900/20 text-amber-400' :
                                            'bg-red-900/20 text-red-400'
                                        }`}>
                                        {epoch.outcome.replace('_', ' ')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
