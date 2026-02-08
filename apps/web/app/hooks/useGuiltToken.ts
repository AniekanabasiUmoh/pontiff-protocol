'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

// TODO: Import actual ABI when contracts are deployed
const GUILT_ADDRESS = process.env.NEXT_PUBLIC_GUILT_ADDRESS as `0x${string}`

// Minimal ERC20 ABI
const ERC20_ABI = [
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const

export function useGuiltToken() {
    const { address } = useAccount()
    const { writeContract, data: hash, isPending } = useWriteContract()

    // Read balance
    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: GUILT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    // Read allowance for staking contract
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: GUILT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args:
            address && process.env.NEXT_PUBLIC_STAKING_ADDRESS
                ? [address, process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`]
                : undefined,
        query: {
            enabled: !!address && !!process.env.NEXT_PUBLIC_STAKING_ADDRESS,
        },
    })

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    // Approve spending
    const approve = async (spender: `0x${string}`, amount: bigint) => {
        return writeContract({
            address: GUILT_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spender, amount],
        })
    }

    return {
        balance: balance ?? BigInt(0),
        allowance: allowance ?? BigInt(0),
        approve,
        refetchBalance,
        refetchAllowance,
        isPending,
        isConfirming,
        isSuccess,
        hash,
    }
}
