'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

// TODO: Import actual ABI when contracts are deployed
const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS as `0x${string}`

// Minimal Staking ABI (ERC4626-like)
const STAKING_ABI = [
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalAssets',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'assets', type: 'uint256' },
            { name: 'receiver', type: 'address' },
        ],
        name: 'deposit',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'assets', type: 'uint256' },
            { name: 'receiver', type: 'address' },
            { name: 'owner', type: 'address' },
        ],
        name: 'withdraw',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const

export function useStaking() {
    const { address } = useAccount()
    const { writeContract, data: hash, isPending } = useWriteContract()

    // Read staked balance
    const { data: stakedBalance, refetch: refetchStakedBalance } = useReadContract({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    // Read total staked
    const { data: totalStaked, refetch: refetchTotalStaked } = useReadContract({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'totalAssets',
    })

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    // Deposit
    const deposit = async (amount: bigint, receiver: `0x${string}`) => {
        return writeContract({
            address: STAKING_ADDRESS,
            abi: STAKING_ABI,
            functionName: 'deposit',
            args: [amount, receiver],
        })
    }

    // Withdraw
    const withdraw = async (amount: bigint, receiver: `0x${string}`, owner: `0x${string}`) => {
        return writeContract({
            address: STAKING_ADDRESS,
            abi: STAKING_ABI,
            functionName: 'withdraw',
            args: [amount, receiver, owner],
        })
    }

    return {
        stakedBalance: stakedBalance ?? BigInt(0),
        totalStaked: totalStaked ?? BigInt(0),
        deposit,
        withdraw,
        refetchStakedBalance,
        refetchTotalStaked,
        isPending,
        isConfirming,
        isSuccess,
        hash,
    }
}
