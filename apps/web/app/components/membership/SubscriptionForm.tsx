'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ERC20_ABI } from '@/lib/abi/ERC20';
import { useToast } from '../ui/Toast';

// Treasury address where fees are sent
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`; // Using Staking as Treasury for now
const GUILT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`;

interface SubscriptionFormProps {
    onSuccess: () => void;
    currentStatus?: 'active' | 'expired' | 'none';
    currentExpiry?: string;
}

export function SubscriptionForm({ onSuccess, currentStatus, currentExpiry }: SubscriptionFormProps) {
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address });
    const { showToast } = useToast();

    // Hardcoded for MVP
    const PRICE = 1000;
    const priceWei = parseEther(PRICE.toString());

    // ==========================================
    // APPROVE
    // ==========================================
    const {
        data: approvalHash,
        writeContract: writeApproval,
        isPending: isApprovalPending,
        isSuccess: isApprovalSuccess
    } = useWriteContract();

    // ==========================================
    // TRANSFER (PAYMENT)
    // ==========================================
    const {
        data: transferHash,
        writeContract: writeTransfer,
        isPending: isTransferPending
    } = useWriteContract();

    const {
        isLoading: isTransferConfirming,
        isSuccess: isTransferSuccess
    } = useWaitForTransactionReceipt({ hash: transferHash });

    // ==========================================
    // ALLOWANCE CHECK
    // ==========================================
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: address ? [address, TREASURY_ADDRESS] : undefined,
    });

    const hasAllowance = allowance ? (allowance as bigint) >= priceWei : false;

    // ==========================================
    // STATE SYNC
    // ==========================================
    const [step, setStep] = useState<'IDLE' | 'APPROVING' | 'PAYING' | 'CONFIRMING' | 'SUCCESS'>('IDLE');
    const [processed, setProcessed] = useState(false);

    useEffect(() => {
        if (isApprovalSuccess) {
            refetchAllowance();
            setStep('IDLE'); // Ready to pay
        }
    }, [isApprovalSuccess, refetchAllowance]);

    useEffect(() => {
        if (isTransferSuccess && transferHash && !processed) {
            setProcessed(true);
            setStep('CONFIRMING');

            // Validate on backend
            fetch('/api/cardinal/renew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: address,
                    txHash: transferHash
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setStep('SUCCESS');
                        onSuccess();
                    } else {
                        alert('Payment successful but backend update failed. Please contact support.');
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Backend error. Transaction ID: ' + transferHash);
                });
        }
    }, [isTransferSuccess, transferHash, processed, address, onSuccess, showToast]);


    // ==========================================
    // HANDLERS
    // ==========================================
    const handleApprove = () => {
        if (!writeApproval) return;
        setStep('APPROVING');
        try {
            writeApproval({
                address: GUILT_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [TREASURY_ADDRESS, priceWei]
            });
        } catch (e) {
            console.error(e);
            setStep('IDLE');
        }
    };

    const handlePay = () => {
        if (!writeTransfer) return;
        setStep('PAYING');
        try {
            writeTransfer({
                address: GUILT_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [TREASURY_ADDRESS, priceWei] // Helper to transfer tokens
            });
        } catch (e) {
            console.error(e);
            setStep('IDLE');
        }
    };

    if (!isConnected) {
        return <div className="text-center text-red-400 p-4">Please connect your wallet to subscribe.</div>;
    }

    const hasBalance = balance && Number(balance.formatted) >= PRICE;
    if (!hasBalance) {
        return <div className="text-center text-red-400 p-4">Insufficient Balance (Need {PRICE} GUILT)</div>;
    }

    if (step === 'SUCCESS') {
        return (
            <div className="bg-green-900/30 border border-green-500 rounded p-6 text-center animate-fade-in">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Membership Active!</h3>
                <p className="text-neutral-400 text-sm">Welcome to the Cardinalate.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {step === 'APPROVING' && (
                <div className="text-center text-yellow-500 animate-pulse">Confirm Approval in Wallet...</div>
            )}
            {step === 'PAYING' && (
                <div className="text-center text-yellow-500 animate-pulse">Confirm Payment in Wallet...</div>
            )}
            {isTransferConfirming && (
                <div className="text-center text-blue-500 animate-pulse">Waiting for network confirmation...</div>
            )}

            <button
                onClick={hasAllowance ? handlePay : handleApprove}
                disabled={step !== 'IDLE' || isTransferConfirming}
                className="w-full py-4 bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white font-bold rounded font-cinzel shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {step !== 'IDLE' || isTransferConfirming ? 'PROCESSING...' :
                    hasAllowance ? 'PAY 1,000 GUILT' : 'APPROVE GUILT'}
            </button>

            <p className="text-xs text-center text-neutral-500">
                1 Month Subscription • Cancel Anytime
            </p>
        </div>
    );
}
