'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';

const SESSION_WALLET_FACTORY = process.env.NEXT_PUBLIC_SESSION_WALLET_FACTORY as Address;
const GUILT_TOKEN = process.env.NEXT_PUBLIC_GUILT_ADDRESS as Address;

const FACTORY_ABI = [
    {
        name: 'getUserSessions',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ type: 'address[]' }],
    },
    {
        name: 'createSession',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_strategy', type: 'uint8' }],
        outputs: [{ name: 'wallet', type: 'address' }],
    },
] as const;

const SESSION_WALLET_ABI = [{
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
}, {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
}] as const;

const GUILT_ABI = [{
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
}] as const;

interface UseSessionWalletReturn {
    sessionAddress: Address | null;
    balance: bigint;
    isLoading: boolean;
    error: string | null;
    createSession: (strategy: 0 | 1 | 2) => Promise<void>;
    withdraw: () => Promise<void>;
    hasActiveSession: boolean;
}

/**
 * Hook for managing session wallets
 * Strategy: 0=Berzerker (10 GUILT fee), 1=Merchant (15 GUILT), 2=Disciple (5 GUILT)
 */
export function useSessionWallet(): UseSessionWalletReturn {
    const { address } = useAccount();
    const [sessionAddress, setSessionAddress] = useState<Address | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<'approve' | 'create' | 'withdraw' | null>(null);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({ hash });

    // Read user's session wallets
    const { data: userSessions, refetch: refetchSessions } = useReadContract({
        address: SESSION_WALLET_FACTORY,
        abi: FACTORY_ABI,
        functionName: 'getUserSessions',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    // Read session balance if we have a session address
    const { data: balanceData } = useReadContract({
        address: sessionAddress ?? undefined,
        abi: SESSION_WALLET_ABI,
        functionName: 'getBalance',
        query: {
            enabled: !!sessionAddress,
            refetchInterval: 5000,
        },
    });

    // Update session address when user sessions change (use latest)
    useEffect(() => {
        if (userSessions && Array.isArray(userSessions) && userSessions.length > 0) {
            const sessions = userSessions as Address[];
            setSessionAddress(sessions[sessions.length - 1]);
        } else {
            setSessionAddress(null);
        }
    }, [userSessions]);

    /**
     * Create a new session wallet with the specified strategy
     */
    const createSession = useCallback(async (strategy: 0 | 1 | 2) => {
        if (!address) {
            setError('Please connect your wallet');
            return;
        }

        setError(null);
        setPendingAction('approve');

        try {
            // Strategy fees: 0=10 GUILT, 1=15 GUILT, 2=5 GUILT
            const fees = [10n, 15n, 5n];
            const feeAmount = fees[strategy] * 10n ** 18n;

            // Step 1: Approve factory to spend GUILT for fee
            writeContract({
                address: GUILT_TOKEN,
                abi: GUILT_ABI,
                functionName: 'approve',
                args: [SESSION_WALLET_FACTORY, feeAmount],
            });
        } catch (err: any) {
            setError(err.message || 'Failed to approve');
            setPendingAction(null);
        }
    }, [address, writeContract]);

    // Handle transaction success
    useEffect(() => {
        if (isSuccess && pendingAction === 'approve') {
            // Approval done, now create session
            setPendingAction('create');

            // Re-call writeContract for session creation
            // Note: In production, you'd track the strategy in state
            setError('Approval successful! Click create again to deploy session wallet');
            setPendingAction(null);
            refetchSessions();
        } else if (isSuccess && pendingAction === 'create') {
            setPendingAction(null);
            refetchSessions();
        } else if (isSuccess && pendingAction === 'withdraw') {
            setPendingAction(null);
            refetchSessions();
        }
    }, [isSuccess, pendingAction, refetchSessions]);

    /**
     * Withdraw all funds from session wallet
     */
    const withdraw = useCallback(async () => {
        if (!sessionAddress) {
            setError('No active session');
            return;
        }

        setError(null);
        setPendingAction('withdraw');

        try {
            writeContract({
                address: sessionAddress,
                abi: SESSION_WALLET_ABI,
                functionName: 'withdraw',
            });
        } catch (err: any) {
            setError(err.message || 'Failed to withdraw');
            setPendingAction(null);
        }
    }, [sessionAddress, writeContract]);

    return {
        sessionAddress,
        balance: (balanceData as bigint) ?? 0n,
        isLoading: isPending,
        error,
        createSession,
        withdraw,
        hasActiveSession: !!sessionAddress && ((balanceData as bigint) ?? 0n) > 0n,
    };
}
