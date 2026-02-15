'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { StakingCathedralABI, GuiltTokenABI } from '../abis';
import { supabase } from '@/lib/db/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { StatSkeleton, Skeleton } from '@/app/components/ui/Skeleton';

const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;

interface StakingRecord {
    wallet_address: string;
    amount: string;
    timestamp: string;
}

export default function CathedralPage() {
    const { address, isConnected } = useAccount();
    const [isMounted, setIsMounted] = useState(false);
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [sliderValue, setSliderValue] = useState(50);
    const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
    const [lastAction, setLastAction] = useState<'approve' | 'stake' | 'unstake' | null>(null);
    const { showToast } = useToast();

    // Real Data State
    const [recentStakes, setRecentStakes] = useState<StakingRecord[]>([]);
    const [uniqueStakers, setUniqueStakers] = useState<number>(0);
    const [isLoadingStakes, setIsLoadingStakes] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        fetchCathedralData();
    }, []);

    const fetchCathedralData = async () => {
        try {
            setIsLoadingStakes(true);
            // Fetch recent stakes for Hall of Saints
            const { data: stakes, error } = await supabase
                .from('staking_records')
                .select('wallet_address, amount, timestamp')
                .eq('action', 'STAKE')
                .order('timestamp', { ascending: false })
                .limit(10);

            if (stakes) {
                setRecentStakes(stakes);
            }

            // Estimate unique stakers (approximate count)
            const { count } = await supabase
                .from('staking_records')
                .select('wallet_address', { count: 'exact', head: true });

            // This is total transactions, not unique users, but it's a start for "Activity"
            setUniqueStakers(count || 0);

        } catch (e) {
            console.error('Error fetching cathedral data:', e);
            // Non-critical error, maybe don't toast unless it breaks UX
        } finally {
            setIsLoadingStakes(false);
        }
    };

    // ── Contract Reads ──
    const { data: shareBalance, refetch: refetchShares, isLoading: isLoadingShares } = useReadContract({
        address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'balanceOf',
        args: address ? [address] : undefined, query: { enabled: !!address },
    });
    const { data: stakedBalance, refetch: refetchStakedBalance, isLoading: isLoadingStakedBalance } = useReadContract({
        address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'convertToAssets',
        args: shareBalance ? [shareBalance] : undefined, query: { enabled: !!shareBalance },
    });
    const { data: guiltBalance, refetch: refetchGuilt, isLoading: isLoadingGuilt } = useReadContract({
        address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'balanceOf',
        args: address ? [address] : undefined, query: { enabled: !!address },
    });
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'allowance',
        args: address ? [address, STAKING_ADDRESS] : undefined, query: { enabled: !!address, refetchInterval: 2000 },
    });

    // Global Vault Stats
    const { data: totalAssets, isLoading: isLoadingAssets } = useReadContract({
        address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'totalAssets',
    });
    const { data: totalSupply, isLoading: isLoadingSupply } = useReadContract({
        address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'totalSupply',
    });

    const { data: previewShares } = useReadContract({
        address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'convertToShares',
        args: unstakeAmount ? [parseEther(unstakeAmount)] : undefined,
        query: { enabled: !!unstakeAmount && parseFloat(unstakeAmount) > 0 },
    });

    // ── Contract Writes ──
    const { writeContract, data: txHash, isPending: isTxPending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    useEffect(() => {
        if (isConfirmed) {
            refetchShares(); refetchGuilt(); refetchAllowance(); refetchStakedBalance(); fetchCathedralData();
            if (lastAction === 'approve') {
                showToast('Approval confirmed', 'info', 'Now click Consecrate to stake.');
            } else if (lastAction === 'stake') {
                setStakeAmount('');
                showToast('Sacrifice Accepted.', 'success', 'Your GUILT has been staked.');
            } else if (lastAction === 'unstake') {
                setUnstakeAmount('');
                showToast('Withdrawal complete.', 'success', 'Your GUILT has been returned.');
            }
        }
    }, [isConfirmed, lastAction, refetchShares, refetchGuilt, refetchAllowance, refetchStakedBalance, showToast]);

    useEffect(() => {
        if (writeError) {
            showToast('Transaction Failed', 'error', writeError.message.split('\n')[0]);
        }
    }, [writeError, showToast]);


    // Derived
    const needsApproval = !stakeAmount || allowance === undefined ? true : parseEther(stakeAmount) > allowance;
    const isPending = isTxPending || isConfirming;

    // APY Calculation: This is hard without history. 
    // We can infer "Share Price" = totalAssets / totalSupply.
    const sharePrice = totalAssets && totalSupply && totalSupply > BigInt(0)
        ? Number(formatEther(totalAssets)) / Number(formatEther(totalSupply))
        : 1.0;

    const displaySharePrice = sharePrice.toFixed(4);

    const handleApprove = () => {
        if (!stakeAmount) return;
        setLastAction('approve');
        writeContract({ address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'approve', args: [STAKING_ADDRESS, parseEther(stakeAmount)] });
    };
    const handleStake = () => {
        if (!stakeAmount) return;
        setLastAction('stake');
        writeContract({ address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'stake', args: [parseEther(stakeAmount)], gas: BigInt(500000) });
    };
    const handleWithdraw = () => {
        if (!unstakeAmount) return;
        setLastAction('unstake');
        const sharesToBurn = previewShares || parseEther(unstakeAmount);
        writeContract({ address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'withdraw', args: [sharesToBurn], gas: BigInt(500000) });
    };

    const handleSlider = (val: number) => {
        setSliderValue(val);
        if (guiltBalance) {
            const amount = (BigInt(val) * guiltBalance) / BigInt(100);
            setStakeAmount(formatEther(amount));
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* ─── Header ─── */}
                <div>
                    <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Treasury // Organ_Ledger_V2</p>
                    <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                        The <span className="text-primary text-gold-glow">Cathedral</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-mono mt-1">Altar of Consecration — Stake $GUILT to earn divine yield</p>
                </div>

                {/* ─── 3-Column Layout ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ── Left Column: User Metrics ── */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Stats Cards */}
                        <div className="bg-obsidian rounded-lg border border-primary/10 p-5 space-y-5">
                            <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                <span className="material-icons text-primary text-sm">person</span>
                                Your Metrics
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-1">Available Balance</div>
                                    <div className="text-2xl font-bold font-mono text-white">
                                        {!isMounted || isLoadingGuilt ? (
                                            <Skeleton className="h-8 w-1/2" />
                                        ) : (
                                            guiltBalance !== undefined ? parseFloat(formatEther(guiltBalance)).toFixed(2) : '0.00'
                                        )}
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-mono">$GUILT</div>
                                </div>

                                <div className="h-px bg-primary/10" />

                                <div>
                                    <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-1">Staked Assets</div>
                                    <div className="text-2xl font-bold font-mono text-primary">
                                        {!isMounted || isLoadingStakedBalance ? (
                                            <Skeleton className="h-8 w-1/2" />
                                        ) : (
                                            stakedBalance !== undefined ? parseFloat(formatEther(stakedBalance)).toFixed(2) : '0.00'
                                        )}
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-mono">$GUILT locked</div>
                                </div>
                            </div>
                        </div>

                        {/* APY / Share Price */}
                        <div className="bg-obsidian rounded-lg border border-primary/20 p-5 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                            <div className="relative z-10">
                                <div className="text-[10px] text-primary/60 font-mono uppercase tracking-widest mb-1">Share Price</div>
                                <div className="text-4xl font-bold font-mono text-primary text-gold-glow">
                                    {!isMounted || isLoadingAssets || isLoadingSupply ? (
                                        <div className="flex justify-center"><Skeleton className="h-10 w-3/4" /></div>
                                    ) : (
                                        displaySharePrice
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1 font-mono">1 sGUILT = {displaySharePrice} GUILT</div>

                                <div className="mt-4 flex justify-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                        <span className="text-[10px] text-primary/60 font-mono">YIELD:</span>
                                        <span className="text-xs text-primary font-bold">Variable (Compound)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Center Column: Sacrifice Portal ── */}
                    <div className="lg:col-span-5">
                        <div className="bg-obsidian rounded-lg border border-primary/20 overflow-hidden shadow-[0_0_40px_-10px_rgba(242,185,13,0.1)]">
                            {/* Tabs */}
                            <div className="flex border-b border-primary/10">
                                {(['stake', 'unstake'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest font-bold transition-colors ${activeTab === tab ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {tab === 'stake' ? '⬆ CONSECRATE' : '⬇ WITHDRAW'}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 space-y-6">
                                {activeTab === 'stake' ? (
                                    <>
                                        {/* Amount Input */}
                                        <div>
                                            <div className="flex justify-between text-xs font-mono mb-2">
                                                <span className="text-gray-500 uppercase tracking-widest">Sacrifice Amount</span>
                                                <span className="text-primary/60 cursor-pointer hover:text-primary"
                                                    onClick={() => guiltBalance && setStakeAmount(formatEther(guiltBalance))}>
                                                    MAX
                                                </span>
                                            </div>
                                            <div className="bg-background-dark border border-primary/20 rounded-lg p-4 flex items-center gap-3">
                                                <span className="text-primary font-bold text-xl font-mono">$G</span>
                                                <input
                                                    type="number"
                                                    value={stakeAmount}
                                                    onChange={(e) => setStakeAmount(e.target.value)}
                                                    className="flex-1 bg-transparent text-right text-2xl font-bold text-white font-mono focus:ring-0 outline-none border-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        {/* Slider */}
                                        <div>
                                            <input
                                                type="range" min={0} max={100} value={sliderValue}
                                                onChange={(e) => handleSlider(Number(e.target.value))}
                                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                            <div className="flex justify-between text-[10px] font-mono text-gray-600 mt-1">
                                                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                                            </div>
                                        </div>

                                        {/* Yield Status */}
                                        <div className="bg-green-900/10 border border-green-900/20 rounded-lg p-4 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 font-mono">Yield Status</span>
                                                <span className="text-green-400 font-bold font-mono text-xs">
                                                    ACCRUES AUTOMATICALLY (sGUILT VALUE INCREASES)
                                                </span>
                                            </div>
                                        </div>

                                        {/* CTA */}
                                        <button
                                            onClick={needsApproval ? handleApprove : handleStake}
                                            disabled={isPending || !stakeAmount || parseFloat(stakeAmount) <= 0}
                                            className={`w-full py-4 rounded-lg font-bold uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-3 group ${needsApproval
                                                ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                                                : 'gold-embossed text-background-dark hover:scale-[1.01]'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <span className="material-icons text-lg">{needsApproval ? 'lock_open' : 'local_fire_department'}</span>
                                            {isPending ? 'Processing...' : needsApproval ? 'APPROVE $GUILT (Step 1/2)' : 'CONSECRATE SACRIFICE (Step 2/2)'}
                                        </button>

                                        <div className="text-center text-[10px] text-gray-500 font-mono">
                                            No lock period. Withdraw anytime. Unstaking burns sGUILT shares.
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Unstake */}
                                        <div>
                                            <div className="flex justify-between text-xs font-mono mb-2">
                                                <span className="text-gray-500 uppercase tracking-widest">Withdraw Amount</span>
                                                <span className="text-primary/60 cursor-pointer hover:text-primary"
                                                    onClick={() => stakedBalance && setUnstakeAmount(formatEther(stakedBalance))}>
                                                    MAX
                                                </span>
                                            </div>
                                            <div className="bg-background-dark border border-gray-800 rounded-lg p-4 flex items-center gap-3">
                                                <span className="text-gray-500 font-bold text-xl font-mono">$G</span>
                                                <input
                                                    type="number"
                                                    value={unstakeAmount}
                                                    onChange={(e) => setUnstakeAmount(e.target.value)}
                                                    className="flex-1 bg-transparent text-right text-2xl font-bold text-white font-mono focus:ring-0 outline-none border-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {previewShares && (
                                                <p className="text-[10px] text-gray-600 mt-2 font-mono">
                                                    Burning ~{parseFloat(formatEther(previewShares)).toFixed(2)} sGUILT shares
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleWithdraw}
                                            disabled={isPending || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                                            className="w-full py-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 font-bold uppercase tracking-[0.2em] text-sm hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                            <span className="material-icons text-lg">arrow_downward</span>
                                            {isPending ? 'Withdrawing...' : 'WITHDRAW'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ─── Ecosystem Links ─── */}
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <a href="/judas" className="bg-obsidian border border-primary/20 rounded-lg p-4 hover:border-primary/50 transition-all group group-hover:bg-primary/5">
                                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1 group-hover:text-primary">Judas Protocol</div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    Enter the Protocol <span className="material-icons text-xs transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                                <div className="text-[10px] text-gray-600 mt-2">Use sGUILT to earn more</div>
                            </a>
                            <a href="/indulgences" className="bg-obsidian border border-primary/20 rounded-lg p-4 hover:border-primary/50 transition-all group group-hover:bg-primary/5">
                                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1 group-hover:text-primary">Indulgences</div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    Buy Absolution <span className="material-icons text-xs transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                                <div className="text-[10px] text-gray-600 mt-2">Burn GUILT for salvation</div>
                            </a>
                        </div>
                    </div>

                    {/* ── Right Column: Hall of Saints ── */}
                    <div className="lg:col-span-4">
                        <div className="bg-obsidian rounded-lg border border-primary/10 overflow-hidden h-full flex flex-col">
                            <div className="p-4 border-b border-primary/10 flex justify-between items-center">
                                <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                    <span className="material-icons text-primary text-sm">history_edu</span>
                                    Recent Sacrifices
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {isLoadingStakes ? (
                                    <div className="p-3 space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-3">
                                                <Skeleton className="h-10 w-full rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ) : recentStakes.length === 0 ? (
                                    <div className="text-center py-10 text-gray-600 text-xs font-mono">
                                        No recent sacrifices.<br />Be the first to consecrate.
                                    </div>
                                ) : (recentStakes.map((entry, i) => (
                                    <div
                                        key={i}
                                        className="p-3 rounded border border-gray-800 hover:border-primary/20 transition-colors bg-background-dark"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-gray-400">
                                                    {entry.wallet_address.substring(0, 6)}...{entry.wallet_address.substring(38)}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-600 font-mono">{formatTimeAgo(entry.timestamp)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-mono font-bold text-white">{parseFloat(entry.amount).toLocaleString()} $GUILT</span>
                                            <span className="text-[10px] text-primary/60 font-mono">STAKE</span>
                                        </div>
                                    </div>
                                )))}
                            </div>

                            {/* Total Stats */}
                            <div className="p-4 border-t border-primary/10 bg-obsidian">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-primary font-mono">
                                            {!isMounted || isLoadingAssets ? (
                                                <Skeleton className="h-6 w-1/2 mx-auto" />
                                            ) : (
                                                totalAssets ? parseFloat(formatEther(totalAssets)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'
                                            )}
                                        </div>
                                        <div className="text-[9px] text-gray-600 font-mono uppercase">Total Staked</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white font-mono">
                                            {!isMounted || isLoadingStakes ? (
                                                <Skeleton className="h-6 w-1/2 mx-auto" />
                                            ) : (
                                                uniqueStakers > 0 ? uniqueStakers : '—'
                                            )}
                                        </div>
                                        <div className="text-[9px] text-gray-600 font-mono uppercase">Total Transactions</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
