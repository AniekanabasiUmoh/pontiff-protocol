'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { GuiltTokenABI, IndulgenceABI } from '../abis';

const INDULGENCE_ADDRESS = process.env.NEXT_PUBLIC_INDULGENCE_ADDRESS as `0x${string}`;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;

const INDULGENCE_TIERS = [
    {
        id: 1, name: 'Minor Indulgence', icon: 'auto_fix_high', qty: 1, costMultiplier: 1,
        desc: 'Forgiveness for small transgressions',
        perks: ['Removes 1 sin mark', '24h protection aura', 'Minor XP boost'],
        rarity: 'Common',
        rarityColor: 'text-gray-400 bg-gray-800/50 border-gray-700',
    },
    {
        id: 2, name: 'Major Indulgence', icon: 'auto_awesome', qty: 5, costMultiplier: 5,
        desc: 'Absolution for serious offenses',
        perks: ['Removes 5 sin marks', '7-day protection', 'Game fee discount', 'Leaderboard badge'],
        rarity: 'Rare',
        rarityColor: 'text-blue-400 bg-blue-900/30 border-blue-800',
    },
    {
        id: 3, name: 'Mortal Absolution', icon: 'stars', qty: 10, costMultiplier: 10,
        desc: 'Complete spiritual cleansing',
        perks: ['Full sin wipe', '30-day protection', 'Custom title', 'Access to Cardinal Hall', 'Exclusive emotes'],
        rarity: 'Legendary',
        rarityColor: 'text-primary bg-primary/10 border-primary/30',
        featured: true,
    },
];

const RECENT_PURCHASES = [
    { address: '0x71C...9A2', tier: 'Mortal Absolution', time: '3m ago' },
    { address: '0xB2...CC4', tier: 'Minor Indulgence', time: '8m ago' },
    { address: '0xK1...GOD', tier: 'Major Indulgence', time: '15m ago' },
    { address: '0x88...1FA', tier: 'Mortal Absolution', time: '22m ago' },
];

export default function IndulgencesPage() {
    const { address, isConnected } = useAccount();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    // ─ Contract Reads ─
    const { data: absolutionCost } = useReadContract({
        address: INDULGENCE_ADDRESS, abi: IndulgenceABI, functionName: 'ABSOLUTION_COST',
    });
    const { data: indulgenceBalance, refetch: refetchIndulgences } = useReadContract({
        address: INDULGENCE_ADDRESS, abi: IndulgenceABI, functionName: 'balanceOf',
        args: address ? [address] : undefined, query: { enabled: !!address },
    });
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'allowance',
        args: address ? [address, INDULGENCE_ADDRESS] : undefined, query: { enabled: !!address, refetchInterval: 2000 },
    });
    const { data: guiltBalance, refetch: refetchGuilt } = useReadContract({
        address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'balanceOf',
        args: address ? [address] : undefined, query: { enabled: !!address },
    });

    // ─ Contract Writes ─
    const { writeContract, data: txHash, isPending: isTxPending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    useEffect(() => {
        if (isConfirmed) { refetchIndulgences(); refetchAllowance(); refetchGuilt(); }
    }, [isConfirmed, refetchIndulgences, refetchAllowance, refetchGuilt]);

    const baseCost = absolutionCost || BigInt(0);
    const isPending = isTxPending || isConfirming;

    const handlePurchase = (tierId: number) => {
        const tier = INDULGENCE_TIERS.find(t => t.id === tierId);
        if (!tier) return;
        const totalCost = baseCost * BigInt(tier.costMultiplier);
        if (allowance !== undefined && allowance < totalCost) {
            writeContract({ address: GUILT_ADDRESS, abi: GuiltTokenABI, functionName: 'approve', args: [INDULGENCE_ADDRESS, totalCost] });
        } else {
            writeContract({ address: INDULGENCE_ADDRESS, abi: IndulgenceABI, functionName: 'mint', args: [totalCost] });
        }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-[10px] font-mono text-primary/50 tracking-[0.3em] uppercase mb-1">Treasury // Sin_Exchange</p>
                        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
                            The <span className="text-primary text-gold-glow">Indulgences</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-mono mt-1">Burn $GUILT · Mint your absolution · Cleanse your on-chain soul</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Soul Inventory */}
                        <div className="bg-obsidian border border-primary/20 rounded-lg px-5 py-3 text-center">
                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Your Absolutions</div>
                            <div className="text-2xl font-bold font-mono text-primary text-gold-glow">
                                {isMounted && indulgenceBalance !== undefined ? indulgenceBalance.toString() : '0'}
                            </div>
                        </div>
                        <div className="bg-obsidian border border-gray-800 rounded-lg px-5 py-3 text-center">
                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">$GUILT Balance</div>
                            <div className="text-2xl font-bold font-mono text-white">
                                {isMounted && guiltBalance ? parseFloat(formatEther(guiltBalance)).toFixed(0) : '0'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Indulgence Cards ─── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {INDULGENCE_TIERS.map((tier) => {
                        const cost = baseCost * BigInt(tier.costMultiplier);
                        const costFormatted = baseCost > 0 ? parseFloat(formatEther(cost)).toFixed(0) : '...';
                        const needsApproval = allowance !== undefined && allowance < cost;

                        return (
                            <div
                                key={tier.id}
                                className={`relative bg-obsidian rounded-xl border overflow-hidden transition-all duration-300 group hover:-translate-y-1 flex flex-col ${tier.featured
                                        ? 'border-primary/40 shadow-[0_0_30px_-5px_rgba(242,185,13,0.15)]'
                                        : 'border-primary/15 hover:border-primary/30'
                                    }`}
                            >
                                {/* Featured badge */}
                                {tier.featured && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
                                )}

                                {/* Header */}
                                <div className={`p-6 text-center ${tier.featured ? 'bg-primary/5' : ''}`}>
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4 group-hover:scale-110 transition-transform">
                                        <span className="material-icons text-primary text-3xl">{tier.icon}</span>
                                    </div>
                                    <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border mb-3 ${tier.rarityColor}`}>
                                        {tier.rarity}
                                    </div>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">{tier.name}</h3>
                                    <p className="text-xs text-gray-500">{tier.desc}</p>
                                </div>

                                {/* Price */}
                                <div className="px-6 py-4 border-t border-b border-primary/10 text-center bg-primary/3">
                                    <div className="text-3xl font-bold font-mono text-primary text-gold-glow">{costFormatted}</div>
                                    <div className="text-[10px] text-gray-500 font-mono">$GUILT / ABSOLUTION</div>
                                </div>

                                {/* Perks */}
                                <div className="p-6 flex-1">
                                    <ul className="space-y-2">
                                        {tier.perks.map((perk, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                                                <span className="material-icons text-primary text-sm">check_circle</span>
                                                {perk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* CTA */}
                                <div className="p-6 pt-0">
                                    <button
                                        onClick={() => handlePurchase(tier.id)}
                                        disabled={!isConnected || isPending || !baseCost}
                                        className={`w-full py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${tier.featured
                                                ? 'gold-embossed text-background-dark hover:scale-[1.02]'
                                                : needsApproval
                                                    ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                                                    : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <span className="material-icons text-sm">{needsApproval ? 'lock_open' : 'local_fire_department'}</span>
                                        {isPending ? 'Processing...' : needsApproval ? 'APPROVE' : 'PURCHASE'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ─── Bottom Section ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-obsidian rounded-lg border border-primary/10 overflow-hidden">
                        <div className="px-5 py-3 border-b border-primary/10 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                <span className="material-icons text-primary text-sm">local_fire_department</span>
                                Recent Absolutions
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            {RECENT_PURCHASES.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded border border-gray-800/50 hover:border-primary/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <span className="material-icons text-primary text-sm">person</span>
                                        </div>
                                        <div>
                                            <div className="text-xs text-white font-mono">{p.address}</div>
                                            <div className="text-[10px] text-gray-600 font-mono">{p.time}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-primary font-mono font-bold">{p.tier}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="bg-obsidian rounded-lg border border-primary/10 p-6">
                        <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2 mb-4">
                            <span className="material-icons text-primary text-sm">help_outline</span>
                            How Indulgences Work
                        </h3>
                        <div className="space-y-4">
                            {[
                                { num: '01', title: 'Select Tier', desc: 'Choose the level of absolution your soul requires' },
                                { num: '02', title: 'Burn $GUILT', desc: 'Your $GUILT tokens are permanently burned in the cleansing fire' },
                                { num: '03', title: 'Receive Absolution', desc: 'Soulbound tokens minted to your wallet as proof of divine forgiveness' },
                                { num: '04', title: 'Unlock Perks', desc: 'Protection auras, XP boosts, and exclusive access granted' },
                            ].map((s) => (
                                <div key={s.num} className="flex gap-4 group">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <span className="text-[10px] font-mono font-bold text-primary">{s.num}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm text-white font-bold">{s.title}</div>
                                        <div className="text-xs text-gray-500">{s.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status */}
                {writeError && (
                    <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400 text-center text-xs font-mono">
                        ✗ {writeError.message}
                    </div>
                )}
                {isConfirmed && (
                    <div className="p-3 bg-green-900/20 border border-green-900/30 rounded-lg text-green-400 text-center text-xs font-mono">
                        ✓ Absolution granted. Your soul is cleansed.
                    </div>
                )}
            </div>
        </div>
    );
}
