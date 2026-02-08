'use client';

import Link from 'next/link';
import { WalletConnect } from '../components/WalletConnect';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { StakingCathedralABI, GuiltTokenABI } from '../abis';

// Contract Addresses from environment variables
const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`;
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;

export default function CathedralPage() {
    const { address, isConnected } = useAccount();
    const [isMounted, setIsMounted] = useState(false);
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- Reads ---

    // 1. Get User's Shares (Balance of Staking Contract)
    const { data: shareBalance, refetch: refetchShares } = useReadContract({
        address: STAKING_ADDRESS,
        abi: StakingCathedralABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    // 2. Convert Shares to Assets (Real Staked GUILT Value)
    const { data: stakedBalance, refetch: refetchStakedBalance } = useReadContract({
        address: STAKING_ADDRESS,
        abi: StakingCathedralABI,
        functionName: 'convertToAssets',
        args: shareBalance ? [shareBalance] : undefined,
        query: { enabled: !!shareBalance },
    });

    // 3. User's GUILT Balance
    const { data: guiltBalance, refetch: refetchGuilt } = useReadContract({
        address: GUILT_ADDRESS,
        abi: GuiltTokenABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    // 4. Allowance Check
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_ADDRESS,
        abi: GuiltTokenABI,
        functionName: 'allowance',
        args: address ? [address, STAKING_ADDRESS] : undefined,
        query: { enabled: !!address, refetchInterval: 2000 },
    });

    // 5. User Info (Tier, Deposit Time, Rewards)
    const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
        address: STAKING_ADDRESS,
        abi: StakingCathedralABI,
        functionName: 'userInfo',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    // 6. Preview Shares for Withdraw (To ensure accuracy)
    const { data: previewShares } = useReadContract({
        address: STAKING_ADDRESS,
        abi: StakingCathedralABI,
        functionName: 'convertToShares',
        args: unstakeAmount ? [parseEther(unstakeAmount)] : undefined,
        query: { enabled: !!unstakeAmount && parseFloat(unstakeAmount) > 0 },
    });

    // 7. DIAGNOSTIC READS - Check Contract Configuration
    const { data: contractAsset } = useReadContract({
        address: STAKING_ADDRESS,
        abi: StakingCathedralABI,
        functionName: 'asset',
        query: { enabled: true },
    });

    const { data: isExempt } = useReadContract({
        address: GUILT_ADDRESS,
        abi: GuiltTokenABI,
        functionName: 'isTaxExempt',
        args: [STAKING_ADDRESS],
        query: { enabled: true },
    });

    const { data: stakingWalletAddress } = useReadContract({
        address: GUILT_ADDRESS,
        abi: GuiltTokenABI,
        functionName: 'stakingWallet',
        query: { enabled: true },
    });

    // --- Writes ---

    const { writeContract, data: txHash, isPending: isTxPending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Refresh data after transaction
    useEffect(() => {
        if (isConfirmed) {
            refetchShares();
            refetchGuilt();
            refetchAllowance();
            refetchStakedBalance();
            refetchUserInfo();
            setStakeAmount('');
            setUnstakeAmount('');
        }
    }, [isConfirmed, refetchShares, refetchGuilt, refetchAllowance, refetchStakedBalance, refetchUserInfo]);

    // Derived State
    const needsApproval = stakeAmount && allowance ? parseEther(stakeAmount) > allowance : true;
    const isPending = isTxPending || isConfirming;

    // Tier Logic (0: None, 1: Sinner, 2: Believer, 3: Saint - purely illustrative mapping based on contract logic)
    const userTier = userInfo ? Number(userInfo[2]) : 0;
    const tierNames = ["None", "Sinner", "Believer", "Saint", "Cardinal", "Pope"];
    const tierName = tierNames[userTier] || "Unknown";

    // Earned Calculation (Current Value - Deposited Principal)
    // Note: userInfo[0] is 'assets' which traditionally tracks principal or verified balance
    const principal = userInfo ? userInfo[0] : BigInt(0);
    const currentValue = stakedBalance || BigInt(0);
    const earned = currentValue > principal ? currentValue - principal : BigInt(0);

    // Handlers
    const handleApprove = () => {
        if (!stakeAmount) return;
        writeContract({
            address: GUILT_ADDRESS,
            abi: GuiltTokenABI,
            functionName: 'approve',
            args: [STAKING_ADDRESS, parseEther(stakeAmount)],
        });
    };

    const handleStake = () => {
        if (!stakeAmount) return;
        writeContract({
            address: STAKING_ADDRESS,
            abi: StakingCathedralABI,
            functionName: 'stake',
            args: [parseEther(stakeAmount)],
            gas: BigInt(10000000), // Safety override for Testnet
        });
    };

    const handleWithdraw = () => {
        if (!unstakeAmount) return;
        // If we have a preview, use it. Otherwise fallback to 1:1 assumption or raw amount using force
        // We use parseEther(unstakeAmount) as asset input to convertToShares, getting correct share amount to burn
        const sharesToBurn = previewShares || parseEther(unstakeAmount);

        writeContract({
            address: STAKING_ADDRESS,
            abi: StakingCathedralABI,
            functionName: 'withdraw',
            args: [sharesToBurn],
            gas: BigInt(10000000), // Safety override for Testnet
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

                {/* Cathedral Content */}
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-6xl font-cinzel font-bold text-red-500 mb-4 text-center">
                        The Cathedral
                    </h1>
                    <p className="text-xl text-zinc-400 text-center mb-12 font-light">
                        Stake $GUILT to earn rewards. Pay the tax. Absolve your sins.
                    </p>

                    {/* Staking Interface */}
                    <div className="bg-neutral-900/50 border border-red-900/30 rounded-lg p-8 relative overflow-hidden">
                        {/* Background Ornament */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <span className="text-9xl text-red-900 font-cinzel">†</span>
                        </div>

                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-2xl font-cinzel text-red-400">Staking Dashboard</h2>
                            {isMounted && address && (
                                <div className="text-right">
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Current Rank</p>
                                    <p className="text-xl font-bold text-amber-500 font-cinzel">{tierName}</p>
                                </div>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-black/50 p-4 rounded border border-red-900/20">
                                <p className="text-xs text-zinc-500 mb-1">Staked ($GUILT)</p>
                                <p className="text-2xl font-bold text-red-500">
                                    {isMounted && stakedBalance ? parseFloat(formatEther(stakedBalance)).toFixed(2) : '0.00'}
                                </p>
                            </div>
                            <div className="bg-black/50 p-4 rounded border border-red-900/20">
                                <p className="text-xs text-zinc-500 mb-1">Earned</p>
                                <p className="text-2xl font-bold text-green-500">
                                    {isMounted ? parseFloat(formatEther(earned)).toFixed(4) : '0.00'}
                                </p>
                            </div>
                            <div className="bg-black/50 p-4 rounded border border-red-900/20">
                                <p className="text-xs text-zinc-500 mb-1">Wallet Balance</p>
                                <p className="text-2xl font-bold text-zinc-300">
                                    {isMounted && guiltBalance ? parseFloat(formatEther(guiltBalance)).toFixed(2) : '0.00'}
                                </p>
                            </div>
                            <div className="bg-black/50 p-4 rounded border border-red-900/20">
                                <p className="text-xs text-zinc-500 mb-1">APY</p>
                                <p className="text-2xl font-bold text-amber-500">66.6%</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {isMounted && isConnected ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Stake / Approve Flow */}
                                <div className="border border-red-900/30 p-6 rounded bg-red-950/10 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="block text-sm text-red-400 font-bold">STAKE</label>
                                            <span className="text-xs text-red-400/60 cursor-pointer hover:text-red-300" onClick={() => setStakeAmount(guiltBalance ? formatEther(guiltBalance) : '0')}>
                                                Max: {guiltBalance ? parseFloat(formatEther(guiltBalance)).toFixed(2) : '0'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                className="bg-black border border-red-900/30 text-white px-4 py-3 rounded w-full focus:outline-none focus:border-red-500 text-lg"
                                                value={stakeAmount}
                                                onChange={(e) => setStakeAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={needsApproval ? handleApprove : handleStake}
                                        disabled={isPending || !stakeAmount || parseFloat(stakeAmount) <= 0}
                                        className={`w-full mt-4 font-bold py-4 px-6 rounded border transition-all uppercase tracking-widest ${needsApproval
                                            ? "bg-yellow-900/20 text-yellow-500 border-yellow-800 hover:bg-yellow-900/40"
                                            : "bg-red-600 hover:bg-red-700 text-black border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isPending ? (
                                            <span className="flex items-center justify-center gap-2 animate-pulse">
                                                Processing...
                                            </span>
                                        ) : needsApproval ? (
                                            `Approve`
                                        ) : (
                                            `Stake`
                                        )}
                                    </button>
                                </div>

                                {/* Unstake Flow */}
                                <div className="border border-zinc-800 p-6 rounded bg-zinc-950/30 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="block text-sm text-zinc-500 font-bold">UNSTAKE</label>
                                            <span className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400" onClick={() => setUnstakeAmount(stakedBalance ? formatEther(stakedBalance) : '0')}>
                                                Max: {stakedBalance ? parseFloat(formatEther(stakedBalance)).toFixed(2) : '0'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Amount ($GUILT)"
                                                className="bg-black border border-zinc-800 text-white px-4 py-3 rounded w-full focus:outline-none focus:border-zinc-600 text-lg"
                                                value={unstakeAmount}
                                                onChange={(e) => setUnstakeAmount(e.target.value)}
                                            />
                                        </div>
                                        {previewShares && (
                                            <p className="text-xs text-zinc-600 mt-1 font-mono">
                                                Burning {parseFloat(formatEther(previewShares)).toFixed(2)} Shares
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleWithdraw}
                                        disabled={isPending || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                                        className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-semibold py-4 px-6 rounded border border-zinc-800 transition-all disabled:opacity-50 uppercase tracking-widest"
                                    >
                                        {isPending ? "Withdrawing..." : "Withdraw"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-black/40 rounded border border-red-900/10">
                                <p className="text-red-500 animate-pulse font-mono text-lg mb-2">
                                    [ CONNECTION REQUIRED ]
                                </p>
                                <p className="text-zinc-600 text-sm">Connect your wallet to enter the Cathedral</p>
                                <div className="mt-8 pt-4 border-t border-zinc-800 text-xs text-zinc-600 font-mono text-center">
                                    DEBUG: Staking Contract {STAKING_ADDRESS}<br />
                                    DEBUG: Guilt Contract {GUILT_ADDRESS}<br />
                                    DEBUG: On-Chain Asset: {contractAsset ? contractAsset.toString() : 'Loading...'}<br />
                                    DEBUG: Staking Tax Exempt: {isExempt ? 'TRUE' : 'FALSE'}<br />
                                    DEBUG: Guilt Staking Wallet: {stakingWalletAddress}<br />
                                    DEBUG: Gas Limit Overridden to 10,000,000
                                </div>
                            </div>
                        )}

                        {isConfirmed && (
                            <div className="mt-4 p-4 bg-green-900/20 border border-green-900/50 text-green-400 text-center rounded animate-fade-in-up">
                                Transaction Confirmed! Your soul is one step closer to absolution.
                            </div>
                        )}
                        {writeError && (
                            <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 text-red-400 text-center rounded animate-fade-in-up text-xs font-mono">
                                Error: {writeError.message}
                            </div>
                        )}

                        <div className="mt-8 pt-4 border-t border-zinc-800 text-xs text-zinc-600 font-mono text-center">
                            DEBUG: Staking Contract {STAKING_ADDRESS}<br />
                            DEBUG: Guilt Contract {GUILT_ADDRESS}<br />
                            DEBUG: On-Chain Asset: {contractAsset ? contractAsset.toString() : 'Loading...'}<br />
                            DEBUG: Staking Tax Exempt (Bool): {isExempt ? 'TRUE' : 'FALSE'}<br />
                            DEBUG: Staking Tax Exempt (Raw): {String(isExempt)}<br />
                            DEBUG: Guilt Staking Wallet: {stakingWalletAddress ? stakingWalletAddress : 'UNDEFINED'}<br />
                            DEBUG: Gas Limit Overridden to 10,000,000
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
