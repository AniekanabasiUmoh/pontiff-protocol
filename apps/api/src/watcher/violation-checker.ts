import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'

const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

// Contract instances
const guiltToken = new ethers.Contract(
    process.env.NEXT_PUBLIC_GUILT_ADDRESS!,
    require('../../contracts/artifacts/contracts/GuiltToken.sol/GuiltToken.json').abi,
    provider
)

const indulgenceNFT = new ethers.Contract(
    process.env.NEXT_PUBLIC_INDULGENCE_ADDRESS!,
    require('../../contracts/artifacts/contracts/Indulgence.sol/Indulgence.json').abi,
    provider
)

interface Violation {
    user: string
    nftTokenId: number
    absolutionTime: number
    transferAmount: bigint
    userBalance: bigint
    percentageSold: number
    gracePeriodsRemaining: number
    cumulativePercentage: number
    transferCount: number
}

// Track cumulative transfers per user within grace period
const transferCache = new Map<string, Array<{
    amount: bigint
    timestamp: number
    blockNumber: number
}>>()

export async function checkViolation(
    user: string,
    transferAmount: bigint,
    event: any
): Promise<Violation | null> {
    // 1. Get user's Indulgence NFT
    const nftData = await getUserIndulgence(user)
    if (!nftData) return null

    const { tokenId, absolutionTime } = nftData

    // 2. Check grace period (48 hours)
    const blockTimestamp = await getBlockTimestamp(event.log.blockNumber)
    const gracePeriodsEnd = absolutionTime + (48 * 60 * 60)

    if (blockTimestamp <= gracePeriodsEnd) {
        // Still in grace period, check amount

        // 3. Get user's balance at absolution time (baseline)
        const absolutionBlock = await getBlockNumberAtTimestamp(absolutionTime)
        const balanceAtAbsolution = await guiltToken.balanceOf(user, { blockTag: absolutionBlock })

        // 4. Track cumulative transfers
        const userKey = `${user}-${tokenId}`
        if (!transferCache.has(userKey)) {
            transferCache.set(userKey, [])
        }

        const transfers = transferCache.get(userKey)!
        transfers.push({
            amount: transferAmount,
            timestamp: blockTimestamp,
            blockNumber: event.log.blockNumber,
        })

        // 5. Calculate cumulative percentage using BigInt arithmetic
        const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0n)

        // Use basis points (10000 = 100%) for precision
        const cumulativeBasisPoints = (totalTransferred * 10000n) / balanceAtAbsolution
        const cumulativePercentage = Number(cumulativeBasisPoints) / 100

        // Individual transfer percentage
        const individualBasisPoints = (transferAmount * 10000n) / balanceAtAbsolution
        const individualPercentage = Number(individualBasisPoints) / 100

        // 6. Check if cumulative >10%
        if (cumulativeBasisPoints > 1000n) { // >10%
            const hoursRemaining = (gracePeriodsEnd - blockTimestamp) / 3600

            console.log(`🚨 VIOLATION DETECTED!`)
            console.log(`   User: ${user}`)
            console.log(`   This transfer: ${individualPercentage.toFixed(2)}% (${ethers.formatEther(transferAmount)} GUILT)`)
            console.log(`   Cumulative: ${cumulativePercentage.toFixed(2)}% (${ethers.formatEther(totalTransferred)} GUILT)`)
            console.log(`   Transfer count: ${transfers.length}`)
            console.log(`   Grace period: ${hoursRemaining.toFixed(1)} hours remaining`)

            // Save violation to database for audit trail
            await supabase.from('transfer_violations').insert({
                user,
                nft_token_id: tokenId,
                transfer_amount: transferAmount.toString(),
                cumulative_amount: totalTransferred.toString(),
                individual_percentage: individualPercentage,
                cumulative_percentage: cumulativePercentage,
                transfer_count: transfers.length,
                grace_period_remaining: hoursRemaining,
                block_number: event.log.blockNumber,
                timestamp: new Date(blockTimestamp * 1000).toISOString(),
            })

            return {
                user,
                nftTokenId: tokenId,
                absolutionTime,
                transferAmount,
                userBalance: balanceAtAbsolution,
                percentageSold: individualPercentage,
                gracePeriodsRemaining: hoursRemaining,
                cumulativePercentage,
                transferCount: transfers.length,
            }
        }

        // Log non-violation transfer for monitoring
        console.log(`📊 Transfer tracked: ${user} sold ${individualPercentage.toFixed(2)}% (cumulative: ${cumulativePercentage.toFixed(2)}%)`)
    } else {
        // Grace period expired, clear cache
        const userKey = `${user}-${tokenId}`
        transferCache.delete(userKey)
    }

    return null
}

async function getUserIndulgence(user: string): Promise<{ tokenId: number; absolutionTime: number } | null> {
    try {
        // Query Indulgence contract
        const balance = await indulgenceNFT.balanceOf(user)
        if (balance === 0n) return null

        // Get token ID (assuming user has only one)
        const tokenId = await indulgenceNFT.tokenOfOwnerByIndex(user, 0)

        // Get absolution time from metadata
        const metadata = await indulgenceNFT.getMetadata(tokenId)

        // Check if already revoked
        if (metadata.status === 2) { // Status.EXCOMMUNICATED
            return null
        }

        return {
            tokenId: Number(tokenId),
            absolutionTime: Number(metadata.absolutionTime),
        }
    } catch (error) {
        console.error('Error fetching Indulgence NFT:', error)
        return null
    }
}

async function getBlockTimestamp(blockNumber: number): Promise<number> {
    const block = await provider.getBlock(blockNumber)
    return block!.timestamp
}

async function getBlockNumberAtTimestamp(timestamp: number): Promise<number> {
    // Binary search to find block at timestamp (approximate)
    // For production, consider using a block indexer
    const currentBlock = await provider.getBlockNumber()
    const currentBlockData = await provider.getBlock(currentBlock)

    if (currentBlockData!.timestamp <= timestamp) {
        return currentBlock
    }

    // Simple approximation: assume 2 second block time
    const timeDiff = currentBlockData!.timestamp - timestamp
    const blockDiff = Math.floor(timeDiff / 2)

    return Math.max(0, currentBlock - blockDiff)
}

// Cleanup old cache entries periodically
setInterval(() => {
    const now = Math.floor(Date.now() / 1000)
    const entriesToDelete: string[] = []

    transferCache.forEach((transfers, key) => {
        const latestTransfer = transfers[transfers.length - 1]
        if (now - latestTransfer.timestamp > 48 * 60 * 60) {
            entriesToDelete.push(key)
        }
    })

    entriesToDelete.forEach(key => transferCache.delete(key))

    if (entriesToDelete.length > 0) {
        console.log(`🧹 Cleaned ${entriesToDelete.length} expired cache entries`)
    }
}, 60 * 60 * 1000) // Every hour
