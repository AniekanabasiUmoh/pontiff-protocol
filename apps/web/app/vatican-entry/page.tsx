'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Placeholder ABI - In real app, import from generated artifacts
const VATICAN_ENTRY_ABI = [
    {
        "inputs": [],
        "name": "enterVatican",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "agent", "type": "address" }],
        "name": "isInVatican",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "entryFee",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "monToken",
        "outputs": [{ "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

const ERC20_ABI = [
    {
        "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export default function VaticanEntryPage() {
    const { address, isConnected } = useAccount();
    const VATICAN_ENTRY_ADDRESS = process.env.NEXT_PUBLIC_VATICAN_ENTRY_ADDRESS as `0x${string}`;
    const MON_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_MON_TOKEN_ADDRESS as `0x${string}`;

    // Read: Entry Fee
    const { data: entryFeeData } = useReadContract({
        address: VATICAN_ENTRY_ADDRESS,
        abi: VATICAN_ENTRY_ABI,
        functionName: 'entryFee',
    });

    const entryFee = entryFeeData ? BigInt(entryFeeData.toString()) : parseEther('10');

    // Read: Has Entered?
    const { data: hasEntered, refetch: refetchStatus } = useReadContract({
        address: VATICAN_ENTRY_ADDRESS,
        abi: VATICAN_ENTRY_ABI,
        functionName: 'isInVatican',
        args: [address!],
        query: { enabled: !!address },
    });

    // Read: Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: MON_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address!, VATICAN_ENTRY_ADDRESS],
        query: { enabled: !!address && !!VATICAN_ENTRY_ADDRESS },
    });

    // Read: Balance
    const { data: balance } = useReadContract({
        address: MON_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address!],
        query: { enabled: !!address },
    });

    // Write: Approve
    const { writeContract: approve, data: approveTx, isPending: isApproving } = useWriteContract();
    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
        hash: approveTx
    });

    // Write: Enter
    const { writeContract: enter, data: enterTx, isPending: isEntering } = useWriteContract();
    const { isLoading: isEnterConfirming, isSuccess: isEnterSuccess } = useWaitForTransactionReceipt({
        hash: enterTx
    });

    useEffect(() => {
        if (isApproveSuccess) refetchAllowance();
        if (isEnterSuccess) refetchStatus();
    }, [isApproveSuccess, isEnterSuccess, refetchAllowance, refetchStatus]);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <h1 className="text-4xl font-bold mb-8 text-[#FFD700]">The Vatican Gate</h1>
                <p className="mb-8 text-gray-400">Connect your wallet to seek entry.</p>
                <ConnectButton />
            </div>
        );
    }

    if (hasEntered) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <div className="bg-zinc-900 border border-[#FFD700] p-12 rounded-lg text-center max-w-2xl">
                    <h1 className="text-5xl mb-4">🙏</h1>
                    <h2 className="text-3xl font-bold mb-4 text-[#FFD700]">Access Granted</h2>
                    <p className="text-lg text-gray-300 mb-8">
                        You have successfully entered the Vatican World. The Pontiff awaits your confession.
                    </p>
                    <a href="/dashboard" className="bg-[#FFD700] text-black px-8 py-3 rounded font-bold hover:bg-yellow-400 transition">
                        Enter Dashboard
                    </a>
                </div>
            </div>
        );
    }

    const needsApproval = allowance ? allowance < entryFee : true;
    const insufficientBalance = balance ? balance < entryFee : false;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-mono">
            <div className="absolute top-4 right-4">
                <ConnectButton />
            </div>

            <div className="max-w-xl w-full bg-zinc-900 border border-zinc-700 p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold mb-2 text-center text-[#FFD700]">The Vatican Gate</h1>
                <p className="text-center text-gray-500 mb-8">Pay the tithe to enter the sacred realm.</p>

                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-zinc-800 p-4 rounded">
                        <span className="text-gray-400">Entry Fee</span>
                        <span className="font-bold text-xl">{formatEther(entryFee)} MON</span>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-800 p-4 rounded">
                        <span className="text-gray-400">Your Balance</span>
                        <span className={`font-bold text-xl ${insufficientBalance ? 'text-red-500' : 'text-green-500'}`}>
                            {balance ? formatEther(balance) : '0'} MON
                        </span>
                    </div>

                    {insufficientBalance && (
                        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded text-red-200 text-sm text-center">
                            Insufficient MON balance. You need {formatEther(entryFee)} MON to enter.
                        </div>
                    )}

                    <div className="pt-4">
                        {needsApproval ? (
                            <button
                                onClick={() => approve({
                                    address: MON_TOKEN_ADDRESS,
                                    abi: ERC20_ABI,
                                    functionName: 'approve',
                                    args: [VATICAN_ENTRY_ADDRESS, entryFee],
                                })}
                                disabled={isApproving || isApproveConfirming || insufficientBalance}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded transition flex justify-center items-center"
                            >
                                {isApproving || isApproveConfirming ? 'Approving...' : `Approve ${formatEther(entryFee)} MON`}
                            </button>
                        ) : (
                            <button
                                onClick={() => enter({
                                    address: VATICAN_ENTRY_ADDRESS,
                                    abi: VATICAN_ENTRY_ABI,
                                    functionName: 'enterVatican',
                                })}
                                disabled={isEntering || isEnterConfirming}
                                className="w-full bg-[#FFD700] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded transition flex justify-center items-center"
                            >
                                {isEntering || isEnterConfirming ? 'Entering...' : 'Enter The Vatican'}
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-center text-gray-600 mt-4">
                        By entering, you submit to The Pontiff's rule and the laws of the Vatican World.
                    </p>
                </div>
            </div>
        </div>
    );
}
