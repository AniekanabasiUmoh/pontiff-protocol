'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { StakingCathedralABI, GuiltTokenABI } from '../abis';

const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;

const DURATIONS = [
    { label: '7 Days', value: 7, multiplier: '1x' },
    { label: '30 Days', value: 30, multiplier: '2.5x' },
    { label: '90 Days', value: 90, multiplier: '5x' },
    { label: '365 Days', value: 365, multiplier: '12x' },
];

const SAINTS_FEED = [
    { address: '0x71C...9A2', amount: '50,000', duration: '365d', time: '2m ago', whale: false },
    { address: '0xB2...CC4', amount: '250,000', duration: '90d', time: '5m ago', whale: true },
    { address: '0xK1...GOD', amount: '10,000', duration: '30d', time: '12m ago', whale: false },
    { address: '0x88...1FA', amount: '100,000', duration: '365d', time: '18m ago', whale: true },
    { address: '0xDr4...g0n', amount: '5,000', duration: '7d', time: '25m ago', whale: false },
    { address: '0xA1...F44', amount: '75,000', duration: '90d', time: '33m ago', whale: false },
];

export default function CathedralPage() {
    const { address, isConnected } = useAccount();
    const [isMounted, setIsMounted] = useState(false);
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [sliderValue, setSliderValue] = useState(50);
    const [selectedDuration, setSelectedDuration] = useState(30);
    const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');

    useEffect(() => { setIsMounted(true); }, []);

    // ── Contract Reads ──
    const { data: shareBalance, refetch: refetchShares } = useReadContract({
        address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'balanceOf',
        args: address ? [address] : undefined, query: { enabled: !!address },
    });
    const { data: stakedBalance, refetch: refetchStakedBalance } = useReadContract({
        address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'convertToAssets',
        args: shareBalance ? [shareBalance] : undefined, query: { enabled: !!shareBalance },
    });
    const { data: guiltBalance, refetch: refetchGuilt } = useReadContract({
        address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'balanceOf',
        args: address ? [address] : undefined, query: { enabled: !!address },
    });
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'allowance',
        args: address ? [address, STAKING_ADDRESS] : undefined, query: { enabled: !!address, refetchInterval: 2000 },
    });
    const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
        address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'userInfo',
        args: address ? [address] : undefined, query: { enabled: !!address },
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
            refetchShares(); refetchGuilt(); refetchAllowance(); refetchStakedBalance(); refetchUserInfo();
            setStakeAmount(''); setUnstakeAmount('');
        }
    }, [isConfirmed, refetchShares, refetchGuilt, refetchAllowance, refetchStakedBalance, refetchUserInfo]);

    // Derived
    const needsApproval = stakeAmount && allowance ? parseEther(stakeAmount) > allowance : true;
    const isPending = isTxPending || isConfirming;
    const userTier = userInfo ? Number(userInfo[2]) : 0;
    const tierNames = ['None', 'Sinner', 'Believer', 'Saint', 'Cardinal', 'Pope'];
    const tierName = tierNames[userTier] || 'Unknown';
    const principal = userInfo ? userInfo[0] : BigInt(0);
    const currentValue = stakedBalance || BigInt(0);
    const earned = currentValue > principal ? currentValue - principal : BigInt(0);

    const handleApprove = () => {
        if (!stakeAmount) return;
        writeContract({ address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'approve', args: [STAKING_ADDRESS, parseEther(stakeAmount)] });
    };
    const handleStake = () => {
        if (!stakeAmount) return;
        writeContract({ address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'stake', args: [parseEther(stakeAmount)], gas: BigInt(10000000) });
    };
    const handleWithdraw = () => {
        if (!unstakeAmount) return;
        const sharesToBurn = previewShares || parseEther(unstakeAmount);
        writeContract({ address: STAKING_ADDRESS, abi: StakingCathedralABI, functionName: 'withdraw', args: [sharesToBurn], gas: BigInt(10000000) });
    };

    const handleSlider = (val: number) => {
        setSliderValue(val);
        if (guiltBalance) {
            const amount = (BigInt(val) * guiltBalance) / BigInt(100);
            setStakeAmount(formatEther(amount));
        }
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
                                        {isMounted && guiltBalance ? parseFloat(formatEther(guiltBalance)).toFixed(2) : '0.00'}
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-mono">$GUILT</div>
                                </div>

                                <div className="h-px bg-primary/10" />

                                <div>
                                    <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-1">Staked Assets</div>
                                    <div className="text-2xl font-bold font-mono text-primary">
                                        {isMounted && stakedBalance ? parseFloat(formatEther(stakedBalance)).toFixed(2) : '0.00'}
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-mono">$GUILT locked</div>
                                </div>

                                <div className="h-px bg-primary/10" />

                                <div>
                                    <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-1">Accrued Yield</div>
                                    <div className="text-2xl font-bold font-mono text-green-400">
                                        +{isMounted ? parseFloat(formatEther(earned)).toFixed(4) : '0.00'}
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-mono">$GUILT earned</div>
                                </div>
                            </div>
                        </div>

                        {/* APY + Tier */}
                        <div className="bg-obsidian rounded-lg border border-primary/20 p-5 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                            <div className="relative z-10">
                                <div className="text-[10px] text-primary/60 font-mono uppercase tracking-widest mb-1">Current APY</div>
                                <div className="text-5xl font-bold font-mono text-primary text-gold-glow">66.6%</div>
                                <div className="mt-4 flex justify-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                        <span className="text-[10px] text-primary/60 font-mono">RANK:</span>
                                        <span className="text-xs text-primary font-bold">{isMounted ? tierName : '—'}</span>
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

                                        {/* Penance Duration */}
                                        <div>
                                            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Penance Duration</div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {DURATIONS.map((d) => (
                                                    <button
                                                        key={d.value}
                                                        onClick={() => setSelectedDuration(d.value)}
                                                        className={`py-3 rounded-lg border text-center transition-all ${selectedDuration === d.value
                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                : 'border-gray-800 text-gray-500 hover:border-primary/30'
                                                            }`}
                                                    >
                                                        <div className="text-xs font-bold">{d.label}</div>
                                                        <div className="text-[10px] font-mono text-primary/60">{d.multiplier}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Estimated Yield */}
                                        <div className="bg-green-900/10 border border-green-900/20 rounded-lg p-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 font-mono">Estimated Yield</span>
                                                <span className="text-green-400 font-bold font-mono text-lg">
                                                    +{stakeAmount ? (parseFloat(stakeAmount) * 0.666 * (selectedDuration / 365)).toFixed(2) : '0.00'} $GUILT
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
                                            {isPending ? 'Processing...' : needsApproval ? 'APPROVE $GUILT' : 'CONSECRATE SACRIFICE'}
                                        </button>
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
                                                    Burning {parseFloat(formatEther(previewShares)).toFixed(2)} shares
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

                                {/* Status Messages */}
                                {isConfirmed && (
                                    <div className="p-3 bg-green-900/20 border border-green-900/30 rounded-lg text-green-400 text-center text-xs font-mono">
                                        ✓ Transaction confirmed. Your soul is one step closer to absolution.
                                    </div>
                                )}
                                {writeError && (
                                    <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400 text-center text-xs font-mono">
                                        ✗ {writeError.message}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column: Hall of Saints ── */}
                    <div className="lg:col-span-4">
                        <div className="bg-obsidian rounded-lg border border-primary/10 overflow-hidden h-full flex flex-col">
                            <div className="p-4 border-b border-primary/10 flex justify-between items-center">
                                <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                    <span className="material-icons text-primary text-sm">history_edu</span>
                                    Hall of Saints
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {SAINTS_FEED.map((entry, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded border transition-colors ${entry.whale
                                                ? 'bg-primary/5 border-primary/20 shadow-[0_0_10px_rgba(242,185,13,0.05)]'
                                                : 'border-gray-800 hover:border-primary/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                {entry.whale && <span className="text-[10px] bg-primary/20 text-primary px-1 rounded font-bold">🐋</span>}
                                                <span className="text-xs font-mono text-gray-400">{entry.address}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-600 font-mono">{entry.time}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-mono font-bold text-white">{entry.amount} $GUILT</span>
                                            <span className="text-[10px] text-primary/60 font-mono">{entry.duration}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total Stats */}
                            <div className="p-4 border-t border-primary/10 bg-obsidian">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-primary font-mono">42.1M</div>
                                        <div className="text-[9px] text-gray-600 font-mono uppercase">Total Staked</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white font-mono">3,412</div>
                                        <div className="text-[9px] text-gray-600 font-mono uppercase">Active Stakers</div>
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
