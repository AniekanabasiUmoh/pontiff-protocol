'use client';

import Link from 'next/link';
import { WalletConnect } from '../components/WalletConnect';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { GuiltTokenABI, IndulgenceABI } from '../abis';

// Contract Addresses
const INDULGENCE_ADDRESS = process.env.NEXT_PUBLIC_INDULGENCE_ADDRESS as `0x${string}`;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;

export default function IndulgencesPage() {
    const { address, isConnected } = useAccount();
    const [isMounted, setIsMounted] = useState(false);
    const [selectedTier, setSelectedTier] = useState<number | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 1. Read Absolution Cost
    const { data: absolutionCost } = useReadContract({
        address: INDULGENCE_ADDRESS,
        abi: IndulgenceABI,
        functionName: 'ABSOLUTION_COST',
    });

    // 2. Read User Balance (Indulgences)
    const { data: indulgenceBalance, refetch: refetchIndulgences } = useReadContract({
        address: INDULGENCE_ADDRESS,
        abi: IndulgenceABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    // 3. Read Guilt Allowance & Balance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_ADDRESS,
        abi: GuiltTokenABI,
        functionName: 'allowance',
        args: address ? [address, INDULGENCE_ADDRESS] : undefined,
        query: { enabled: !!address, refetchInterval: 2000 },
    });

    const { data: guiltBalance, refetch: refetchGuilt } = useReadContract({
        address: GUILT_ADDRESS,
        abi: GuiltTokenABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    // Writes
    const { writeContract, data: txHash, isPending: isTxPending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    useEffect(() => {
        if (isConfirmed) {
            refetchIndulgences();
            refetchAllowance();
            refetchGuilt();
            setSelectedTier(null);
        }
    }, [isConfirmed, refetchIndulgences, refetchAllowance, refetchGuilt]);

    // Pricing Logic
    const baseCost = absolutionCost || BigInt(0);

    const tiers = [
        { id: 1, name: "Minor Sin", qty: 1, desc: "Forgiveness for small transgressions", costMultiplier: 1 },
        { id: 2, name: "Major Sin", qty: 5, desc: "Absolution for serious offenses", costMultiplier: 5 },
        { id: 3, name: "Mortal Sin", qty: 10, desc: "Complete spiritual cleansing", costMultiplier: 10 },
    ];

    const handlePurchase = (tierId: number) => {
        const tier = tiers.find(t => t.id === tierId);
        if (!tier) return;

        const totalCost = baseCost * BigInt(tier.costMultiplier);

        // Check allowance
        if (allowance !== undefined && allowance < totalCost) {
            // Approve
            writeContract({
                address: GUILT_ADDRESS,
                abi: GuiltTokenABI,
                functionName: 'approve',
                args: [INDULGENCE_ADDRESS, totalCost],
            });
        } else {
            // Mint (Using totalCost as the 'amount' parameter, assuming contract deducts this)
            writeContract({
                address: INDULGENCE_ADDRESS,
                abi: IndulgenceABI,
                functionName: 'mint',
                args: [totalCost],
            });
        }
    };

    const isPending = isTxPending || isConfirming;

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

                {/* Indulgences Content */}
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-6xl font-cinzel font-bold text-red-500 mb-4 text-center">
                        Indulgences
                    </h1>
                    <p className="text-xl text-zinc-400 text-center mb-12 font-light">
                        Buy Absolution. Mint Soulbound tokens. Cleanse your wallet.
                    </p>

                    {/* Interface */}
                    <div className="bg-neutral-900/50 border border-red-900/30 rounded-lg p-8">
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-2xl font-cinzel text-red-400">Available Indulgences</h2>
                            <div className="text-right text-sm text-zinc-500">
                                Balance: {isMounted && guiltBalance ? Number(formatEther(guiltBalance)).toFixed(2) : '0.00'} $GUILT
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {tiers.map((tier) => {
                                const cost = baseCost * BigInt(tier.costMultiplier);
                                const costFormatted = baseCost > 0 ? formatEther(cost) : '...';
                                const needsApproval = allowance !== undefined && allowance < cost;

                                return (
                                    <div key={tier.id} className="bg-black/50 p-6 rounded border border-red-900/20 hover:border-red-900/50 transition-all flex flex-col">
                                        <h3 className="text-lg font-semibold text-red-400 mb-2">{tier.name}</h3>
                                        <p className="text-sm text-zinc-500 mb-4 flex-grow">{tier.desc}</p>
                                        <p className="text-2xl font-bold text-red-500 mb-4">{costFormatted} <span className="text-sm font-normal text-zinc-400">$GUILT</span></p>

                                        <button
                                            onClick={() => handlePurchase(tier.id)}
                                            disabled={!isConnected || isPending || !baseCost}
                                            className={`w-full font-semibold py-2 px-4 rounded border transition-all ${needsApproval
                                                    ? "bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-500 border-yellow-900/50"
                                                    : "bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-900/50"
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isPending ? "Processing..." : needsApproval ? "Approve" : "Purchase"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Inventory */}
                        <div className="bg-black/30 p-6 rounded border border-red-900/10 text-center">
                            <h3 className="text-lg font-semibold text-red-400 mb-4">Your Soul's Inventory</h3>
                            {isMounted && indulgenceBalance !== undefined && indulgenceBalance > BigInt(0) ? (
                                <div>
                                    <p className="text-4xl font-bold text-white mb-2">{indulgenceBalance.toString()}</p>
                                    <p className="text-zinc-500">Absolutions Granted</p>
                                </div>
                            ) : (
                                <p className="text-zinc-500 py-4">
                                    No indulgences purchased yet. Cleanse your soul today.
                                </p>
                            )}
                        </div>

                        {writeError && (
                            <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 text-red-400 text-center rounded text-xs font-mono break-all">
                                Error: {writeError.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
