'use client'

import { useCallback, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { JudasProtocolABI } from '@/app/abis'

const JUDAS_ADDRESS = process.env.NEXT_PUBLIC_JUDAS_ADDRESS as `0x${string}`
const JUDAS_ABI = JudasProtocolABI

export function useJudasProtocol() {
    const { address } = useAccount()
    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()

    const [fallbackEndTime] = useState(Date.now() + 24 * 60 * 60 * 1000)

    const { data: gameState, refetch: refetchGameState } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'getGameState',
    })

    const { data: userPosition, refetch: refetchUserPosition } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'getUserPosition',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    const { data: tournamentState, refetch: refetchTournamentState } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'getTournamentState',
    })

    const { data: reputation, refetch: refetchReputation } = useReadContract({
        address: JUDAS_ADDRESS,
        abi: JUDAS_ABI,
        functionName: 'getReputation',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const deposit = useCallback(async (amount: bigint) => {
        return writeContract({
            address: JUDAS_ADDRESS,
            abi: JUDAS_ABI,
            functionName: 'deposit',
            args: [amount]
        })
    }, [writeContract])

    const signalBetrayal = useCallback(async () => {
        return writeContract({
            address: JUDAS_ADDRESS,
            abi: JUDAS_ABI,
            functionName: 'signalBetrayal',
        })
    }, [writeContract])

    const resolveEpoch = useCallback(async () => {
        return writeContract({
            address: JUDAS_ADDRESS,
            abi: JUDAS_ABI,
            functionName: 'resolveEpoch',
        })
    }, [writeContract])

    const withdraw = useCallback(async (amount: bigint) => {
        return writeContract({
            address: JUDAS_ADDRESS,
            abi: JUDAS_ABI,
            functionName: 'withdraw',
            args: [amount]
        })
    }, [writeContract])

    const claimRewards = useCallback(async (upToEpoch: bigint) => {
        return writeContract({
            address: JUDAS_ADDRESS,
            abi: JUDAS_ABI,
            functionName: 'claimRewards',
            args: [upToEpoch]
        })
    }, [writeContract])

    const recordJudasOutcome = useCallback(async (actionType: 'STAKE' | 'BETRAY' | 'WITHDRAW', amount: number, txHash: string) => {
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
    }, [address, tournamentState])

    return {
        epochId: gameState ? Number(gameState[0]) : 0,
        epochEndTime: gameState ? Number(gameState[1]) * 1000 : fallbackEndTime,
        totalLoyal: gameState ? gameState[2] : BigInt(0),
        totalBetrayed: gameState ? gameState[3] : BigInt(0),
        isResolved: gameState ? gameState[4] : false,
        betrayalPct: gameState ? Number(gameState[5]) : 0,

        userStaked: userPosition ? userPosition[0] : BigInt(0),
        isBetrayer: userPosition ? userPosition[1] : false,
        lastEpochInteracted: userPosition ? Number(userPosition[2]) : 0,

        tournamentId: tournamentState ? Number(tournamentState[0]) : 1,
        currentRound: tournamentState ? Number(tournamentState[1]) : 1,
        maxRounds: tournamentState ? Number(tournamentState[2]) : 5,

        reputation: {
            loyal: reputation ? Number(reputation[0]) : 0,
            betrayed: reputation ? Number(reputation[1]) : 0,
        },

        deposit,
        signalBetrayal,
        withdraw,
        resolveEpoch,
        claimRewards,
        recordJudasOutcome,

        refetchGameState,
        refetchUserPosition,
        refetchTournamentState,
        refetchReputation,

        isPending,
        isConfirming,
        isSuccess,
        hash,
        writeError,
    }
}
