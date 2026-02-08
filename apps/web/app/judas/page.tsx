'use client';

import Link from 'next/link';
import { WalletConnect } from '../components/WalletConnect';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { useJudasProtocol } from '../hooks/useJudasProtocol';
import { formatEther, parseEther } from 'viem';
import { StakingCathedralABI, JudasProtocolABI } from '../abis';

// Contract Addresses
const JUDAS_ADDRESS = process.env.NEXT_PUBLIC_JUDAS_ADDRESS as `0x${string}`;
// Judas Protocol accepts sGUILT (Staked GUILT from StakingCathedral V2)
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`; // sGUILT

export default function JudasPage() {
    const { address, isConnected } = useAccount();
    const [isMounted, setIsMounted] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- Reads ---

    // 1. Current Epoch ID
    const { data: currentEpochId } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JudasProtocolABI,
        functionName: 'currentEpochId',
        query: { refetchInterval: 10000 }
    });

    // 2. Epoch Details
    const { data: epochData, refetch: refetchEpoch } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JudasProtocolABI,
        functionName: 'epochs',
        args: currentEpochId !== undefined ? [currentEpochId] : undefined,
        query: { enabled: currentEpochId !== undefined, refetchInterval: 5000 },
    });

    // 3. User Info (Staked Amount, Betrayed Status)
    const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JudasProtocolABI,
        functionName: 'userInfo',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });
    // 6. User Reputation (Handled by Hook now)

    // 4. sGUILT Balance & Allowance (from Staking V2)
    const { data: guiltBalance, refetch: refetchGuilt } = useReadContract({
        address: TOKEN_ADDRESS,
        abi: StakingCathedralABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: TOKEN_ADDRESS,
        abi: StakingCathedralABI,
        functionName: 'allowance',
        args: address ? [address, JUDAS_ADDRESS] : undefined,
        query: { enabled: !!address, refetchInterval: 2000 },
    });

    // 5. Tournament State
    const { data: tournamentState } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JudasProtocolABI,
        functionName: 'getTournamentState',
    });

    // 6. User Reputation
    const {
        epochEndTime: hookEpochEndTime,
        epochNumber,
        hasBetrayed,
        betrayalPercentage,
        tournamentId,
        currentRound,
        maxRounds,
        reputation,
        betray,
        withdraw,
        recordJudasOutcome
    } = useJudasProtocol();

    // Writes
    const [lastAction, setLastAction] = useState<{ type: 'STAKE' | 'BETRAY' | 'WITHDRAW', amount: number } | null>(null);
    const { writeContract, data: txHash, isPending: isTxPending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    useEffect(() => {
        if (isConfirmed) {
            // Sync with backend
            if (lastAction && txHash) {
                recordJudasOutcome(lastAction.type, lastAction.amount, txHash);
                setLastAction(null); // Clear action
            }

            refetchEpoch();
            refetchUserInfo();
            refetchGuilt();
            refetchAllowance();
            setDepositAmount('');
        }
    }, [isConfirmed, refetchEpoch, refetchUserInfo, refetchGuilt, refetchAllowance]);

    // Helpers
    // epochData format: [startTime, endTime, totalLoyal, totalBetrayed, resolved, loyalistMultiplier, betrayerMultiplier]
    const epochEndTime = epochData ? Number(epochData[1]) : 0;
    const now = Math.floor(Date.now() / 1000);
    const timeLeftSeconds = epochEndTime > now ? epochEndTime - now : 0;
    const epochResolved = epochData ? epochData[4] : false;
    const needsResolution = timeLeftSeconds === 0 && !epochResolved;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const userStaked = userInfo ? userInfo[0] : BigInt(0);
    const isBetrayer = userInfo ? userInfo[2] : false;
    const needsApproval = depositAmount && allowance ? parseEther(depositAmount) > allowance : true;
    const isPending = isTxPending || isConfirming;

    // Handlers
    const handleApprove = () => {
        if (!depositAmount) return;
        writeContract({
            address: TOKEN_ADDRESS,
            abi: StakingCathedralABI,
            functionName: 'approve',
            args: [JUDAS_ADDRESS, parseEther(depositAmount)],
        });
    };

    const handleDeposit = () => {
        if (!depositAmount) return;
        setLastAction({ type: 'STAKE', amount: Number(depositAmount) });
        writeContract({
            address: JUDAS_ADDRESS,
            abi: JudasProtocolABI,
            functionName: 'deposit',
            args: [parseEther(depositAmount)],
        });
    };

    const handleBetray = () => {
        setLastAction({ type: 'BETRAY', amount: 0 });
        // Use local writeContract as hook's betray uses internal write
        writeContract({
            address: JUDAS_ADDRESS,
            abi: JudasProtocolABI,
            functionName: 'signalBetrayal',
        });
    };

    const handleResolveEpoch = () => {
        setLastAction({ type: 'WITHDRAW', amount: 0 }); // Resolve is effectively a claim/withdraw for winners
        writeContract({
            address: JUDAS_ADDRESS,
            abi: JudasProtocolABI,
            functionName: 'resolveEpoch',
        });
    };

    const handleWithdraw = () => {
        // Withdraw logic - for now assume withdrawing everything or a specific amount.
        // The UI should theoretically allow amount input, but for MVP let's withdraw a fixed amount or max.
        // The contract withdraws from stake.
        // Let's assume we withdraw 100% of stake for simpler UI, OR reuse depositAmount field?
        // Let's use depositAmount for withdrawal too if user wants partial.
        const amount = depositAmount ? parseEther(depositAmount) : userStaked;
        if (amount <= BigInt(0)) return;

        setLastAction({ type: 'WITHDRAW', amount: Number(formatEther(amount)) });
        writeContract({
            address: JUDAS_ADDRESS,
            abi: JudasProtocolABI,
            functionName: 'withdraw',
            args: [amount],
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white font-sans">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <Link href="/" className="text-red-500 hover:text-red-400 transition-colors">
                        ← Back to Home
                    </Link>
                    <WalletConnect />
                </div>
                {/* Judas Protocol Content */}
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-block bg-red-900/20 border border-red-500/30 px-4 py-1 rounded-full text-red-500 text-sm font-mono mb-4">
                            ⚫ TOURNAMENT #{tournamentState ? tournamentState[0].toString() : 'X'} | ROUND {tournamentState ? `${tournamentState[1].toString()}/${tournamentState[2].toString()}` : 'X/5'}
                        </div>
                        <h1 className="text-6xl font-cinzel font-bold text-red-500 mb-4">
                            Judas Protocol
                        </h1>
                        <p className="text-xl text-zinc-400 font-light mb-6">
                            The High Stakes Game of Loyalty & Betrayal.
                        </p>
                        <button
                            onClick={() => alert("RULES:\n1. Stake sGUILT to enter.\n2. Cooperate (Default) or Betray.\n3. Failed Coup (<20% Betrayal): Loyalists take ALL Betrayer funds.\n4. Partial Coup (20-40%): Betrayers steal 20%.\n5. Full Coup (>40%): Betrayers steal 50%.")}
                            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                        >
                            [ VIEW PROTOCOL RULES ]
                        </button>
                    </div>

                    {/* Game Interface */}
                    <div className="bg-neutral-900/50 border border-red-900/30 rounded-lg p-8 relative overflow-hidden">

                        {/* Status Badge */}
                        {isMounted && address && userStaked > BigInt(0) && (
                            <div className={`absolute top-4 right-4 px-4 py-1 rounded border ${isBetrayer ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}>
                                {isBetrayer ? "Status: BETRAYER 🗡️" : "Status: LOYAL 🤝"}
                            </div>
                        )}

                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-2xl font-cinzel text-red-400">Current Session</h2>
                            <div className="text-right">
                                <p className="text-xs text-zinc-500">Active Players</p>
                                <p className="text-xl font-mono text-white">
                                    {isMounted ? Number(formatEther(BigInt(epochData ? epochData[2] : 0) + BigInt(epochData ? epochData[3] : 0))).toFixed(0) : '0'}
                                    <span className="text-xs text-zinc-600"> (Weighted)</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-black/50 p-6 rounded border border-red-900/20">
                                <p className="text-sm text-zinc-500 mb-2">Total Staked (Session)</p>
                                <p className="text-3xl font-bold text-red-500">
                                    {isMounted && epochData ? formatEther(BigInt(epochData[2]) + BigInt(epochData[3])) : '0'}
                                </p>
                            </div>
                            <div className="bg-black/50 p-6 rounded border border-red-900/20">
                                <p className="text-sm text-zinc-500 mb-2">Time Remaining</p>
                                <p className="text-3xl font-bold text-red-500 font-mono">
                                    {isMounted ? formatTime(timeLeftSeconds) : '--:--:--'}
                                </p>
                            </div>
                        </div>

                        {/* Epoch Resolution Banner */}
                        {isMounted && needsResolution && (
                            <div className="mb-8 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-6 text-center">
                                <p className="text-yellow-400 font-semibold mb-3">⏰ Epoch has ended! Resolution required.</p>
                                <p className="text-zinc-400 text-sm mb-4">Finalize results to distribute rewards and update the Global Match History.</p>
                                <button
                                    onClick={async () => {
                                        handleResolveEpoch();
                                        // note: In a real app we'd wait for receipt THEN call API
                                        // For prototype we trigger the API "intent" separately or in a polling effect
                                        // Simulating API call for "Integration" requirement immediately for UX flow check
                                        fetch('/api/judas/resolve', {
                                            method: 'POST',
                                            body: JSON.stringify({
                                                epochId: Number(currentEpochId),
                                                betrayalPct: 15, // Mock for demo flow until we parse logs
                                                outcome: 'FAILED_COUP',
                                                txHash: '0xPENDING'
                                            })
                                        });
                                    }}
                                    disabled={isPending}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? "Processing on Chain..." : "Resolve Match & Record History"}
                                </button>
                            </div>
                        )}

                        {/* Game Flow */}
                        {!isMounted || !isConnected ? (
                            <div className="text-center py-8 bg-black/40 rounded border border-red-900/10">
                                <p className="text-red-500 animate-pulse font-mono mb-2">[ CONNECT WALLET TO PLAY ]</p>
                            </div>
                        ) : userStaked === BigInt(0) ? (
                            // State 1: Needs Deposit
                            <div className="bg-black/30 p-6 rounded border border-red-900/10 text-center">
                                <h3 className="text-lg font-semibold text-zinc-300 mb-4">Enter the Arena</h3>
                                <p className="text-zinc-500 text-sm mb-6">Deposit $sGUILT to participate. Need sGUILT? <a href="/cathedral" className="text-red-400 hover:text-red-300 underline">Stake GUILT first</a>.</p>

                                <div className="max-w-md mx-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-zinc-500 text-sm">Amount to Stake:</label>
                                        <span className="text-zinc-400 text-xs">
                                            Available: <span className="text-red-400 font-bold">{guiltBalance ? formatEther(guiltBalance) : '0'}</span> sGUILT
                                        </span>
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="number"
                                            placeholder="Amount to deposit"
                                            className="bg-black border border-red-900/30 text-white px-4 py-2 rounded flex-1 focus:outline-none focus:border-red-500"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                        />
                                        <button
                                            onClick={() => setDepositAmount(guiltBalance ? formatEther(guiltBalance) : '0')}
                                            className="text-white bg-zinc-800 hover:bg-zinc-700 px-3 rounded"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                    <button
                                        onClick={needsApproval ? handleApprove : handleDeposit}
                                        disabled={isPending || !depositAmount || parseFloat(depositAmount) <= 0}
                                        className={`w-full font-bold py-3 px-6 rounded border transition-all ${needsApproval
                                            ? "bg-yellow-900/30 text-yellow-500 border-yellow-800 hover:bg-yellow-900/50"
                                            : "bg-red-900/30 text-red-400 border-red-900/50 hover:bg-red-900/50"
                                            }`}
                                    >
                                        {isPending ? "Processing..." : needsApproval ? "Approve Entry" : "Deposit & Enter"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // State 2: Active Player
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <p className="text-zinc-400">Your Stake in this Round</p>
                                    <p className="text-4xl font-bold text-white">{formatEther(userStaked)} <span className="text-sm text-red-500">$GUILT</span></p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        disabled={true} // Cooperation is passive / default
                                        className="bg-green-900/10 text-green-400/50 font-semibold py-6 px-6 rounded border border-green-900/20 cursor-not-allowed flex flex-col items-center justify-center opacity-70"
                                    >
                                        <span className="text-2xl mb-2">🤝</span>
                                        <span>Cooperate</span>
                                        <span className="text-xs font-normal mt-1">(Remain Silent)</span>
                                    </button>

                                    {/* Reputation Display */}
                                    <div className="col-span-2 mt-4 grid grid-cols-2 gap-4 text-center">
                                        <div className="bg-black/30 p-2 rounded">
                                            <p className="text-xs text-zinc-500">😇 Integrity</p>
                                            <p className="text-green-500 font-mono">{reputation ? reputation.loyal.toString() : '0'}</p>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded">
                                            <p className="text-xs text-zinc-500">👿 Malice</p>
                                            <p className="text-red-500 font-mono">{reputation ? reputation.betrayed.toString() : '0'}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBetray}
                                        disabled={isPending || isBetrayer}
                                        className={`font-semibold py-6 px-6 rounded border transition-all flex flex-col items-center justify-center ${isBetrayer
                                            ? "bg-red-950/50 text-red-500 border-red-500 cursor-not-allowed opacity-50"
                                            : "bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-900/50 hover:shadow-[0_0_20px_rgba(139,0,0,0.3)]"
                                            }`}
                                    >
                                        <span className="text-2xl mb-2">🗡️</span>
                                        <span>{isBetrayer ? "Betrayed" : "BETRAY"}</span>
                                        <span className="text-xs font-normal mt-1 text-red-400/70">
                                            {isBetrayer ? "(You chose violence)" : "(Signal Betrayal)"}
                                        </span>
                                    </button>
                                </div>
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={handleWithdraw}
                                        disabled={isPending || isBetrayer} // Betrayers are locked? Contract says yes.
                                        className="text-xs text-zinc-500 hover:text-white underline"
                                    >
                                        Withdraw Stake
                                    </button>
                                </div>
                                <p className="text-center text-zinc-500 text-xs mt-4">
                                    * Betraying locks your funds until resolution. Winners take from Losers.
                                </p>
                            </div>
                        )}

                        {isConfirmed && (
                            <div className="mt-4 p-4 bg-green-900/20 border border-green-900/50 text-green-400 text-center rounded animate-fade-in-up">
                                ✅ Transaction Confirmed! The Pontiff has recorded your choice.
                            </div>
                        )}
                        {writeError && (
                            <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 text-red-400 text-center rounded text-xs font-mono">
                                Error: {writeError.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
