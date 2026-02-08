'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

// TODO: Import actual ABI when contracts are deployed
const JUDAS_ADDRESS = process.env.NEXT_PUBLIC_JUDAS_ADDRESS as `0x${string}`

// Minimal Judas Protocol ABI
const JUDAS_ABI = [
    {
        inputs: [],
        name: 'currentEpochEnd',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'hasBetrayed',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getBetrayalPercentage',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'betray',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'currentEpoch',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getTournamentState',
        outputs: [
            { name: 'tournamentId', type: 'uint256' },
            { name: 'round', type: 'uint256' },
            { name: 'maxRounds', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getReputation',
        outputs: [
            { name: 'loyal', type: 'uint32' },
            { name: 'betrayed', type: 'uint32' }
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'amount', type: 'uint256' }],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    }
] as const

export function useJudasProtocol() {
    const { address } = useAccount()
    const { writeContract, data: hash, isPending } = useWriteContract()

    // Read epoch end time
    const { data: epochEndTime, refetch: refetchEpochEnd } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'currentEpochEnd',
    })

    // Read current epoch number
    const { data: epochNumber, refetch: refetchEpochNumber } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'currentEpoch',
    })

    // Check if user has betrayed
    const { data: hasBetrayed, refetch: refetchHasBetrayed } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'hasBetrayed',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    // Get betrayal percentage
    const { data: betrayalPercentage, refetch: refetchBetrayalPercentage } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'getBetrayalPercentage',
    })

    // Get Tournament State
    const { data: tournamentState, refetch: refetchTournamentState } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'getTournamentState',
    })

    // Get Reputation
    const { data: reputation, refetch: refetchReputation } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'getReputation',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    // Betray faith
    const betray = async () => {
        return writeContract({
            address: JUDAS_ADDRESS,
            abi: JUDAS_ABI,
            functionName: 'betray',
        })
    }

    // Withdraw funds (and claim rewards)
    const withdraw = async (amount: bigint) => {
        return writeContract({
            address: JUDAS_ADDRESS,
            abi: JUDAS_ABI,
            functionName: 'withdraw',
            args: [amount]
        })
    }

    // Record outcome to DB
    const recordJudasOutcome = async (actionType: 'STAKE' | 'BETRAY' | 'WITHDRAW', amount: number, txHash: string) => {
        try {
            await fetch('/api/games/judas/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerAddress: address,
                    actionType,
                    amount,
                    transactionHash: txHash,
                    roundId: tournamentState ? Number(tournamentState[1]) : 0,
                    tournamentId: tournamentState ? Number(tournamentState[0]) : 0
                })
            })
        } catch (e) {
            console.error("Failed to record Judas outcome:", e)
        }
    }

    return {
        epochEndTime: epochEndTime ? Number(epochEndTime) * 1000 : Date.now() + 24 * 60 * 60 * 1000, // Convert to ms
        epochNumber: epochNumber ? Number(epochNumber) : 0,
        hasBetrayed: hasBetrayed ?? false,
        betrayalPercentage: betrayalPercentage ? Number(betrayalPercentage) : 0,
        tournamentId: tournamentState ? Number(tournamentState[0]) : 1,
        currentRound: tournamentState ? Number(tournamentState[1]) : 1,
        maxRounds: tournamentState ? Number(tournamentState[2]) : 5,
        reputation: {
            loyal: reputation ? Number(reputation[0]) : 0,
            betrayed: reputation ? Number(reputation[1]) : 0,
        },
        betray,
        withdraw,
        recordJudasOutcome,
        refetchEpochEnd,
        refetchEpochNumber,
        refetchHasBetrayed,
        refetchBetrayalPercentage,
        refetchTournamentState,
        refetchReputation,
        isPending,
        isConfirming,
        isSuccess,
        hash,
    }
}
