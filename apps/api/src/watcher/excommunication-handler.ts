import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'

const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

// Multi-sig watcher configuration
const WATCHER_ADDRESSES = [
    process.env.WATCHER_1_ADDRESS!,
    process.env.WATCHER_2_ADDRESS!,
    process.env.WATCHER_3_ADDRESS!,
]

const REQUIRED_SIGNATURES = 2 // 2-of-3 multi-sig

// Primary watcher wallet (for signing)
const watcherWallet = new ethers.Wallet(
    process.env.WATCHER_PRIVATE_KEY!,
    provider
)

const indulgenceContract = new ethers.Contract(
    process.env.NEXT_PUBLIC_INDULGENCE_ADDRESS!,
    require('../../contracts/artifacts/contracts/Indulgence.sol/Indulgence.json').abi,
    watcherWallet
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

// Rate limiting
const revocationCounts = new Map<number, number>() // hour -> count
const MAX_REVOCATIONS_PER_HOUR = 10

export async function handleExcommunication(user: string, violation: Violation) {
    console.log(`⚡ Executing excommunication for ${user}...`)

    try {
        // 1. Check rate limit
        const currentHour = Math.floor(Date.now() / (60 * 60 * 1000))
        const hourlyCount = revocationCounts.get(currentHour) || 0

        if (hourlyCount >= MAX_REVOCATIONS_PER_HOUR) {
            console.error(`🚫 Rate limit exceeded: ${hourlyCount} revocations this hour`)
            await alertAdmin('Revocation rate limit exceeded', { hour: currentHour, count: hourlyCount })
            return
        }

        // 2. Check if already revoked (prevent double revocation)
        const isRevoked = await indulgenceContract.isRevoked(violation.nftTokenId)
        if (isRevoked) {
            console.log(`⚠️ NFT ${violation.nftTokenId} already revoked, skipping`)
            return
        }

        // 3. Check watcher wallet balance
        const balance = await provider.getBalance(watcherWallet.address)
        const minBalance = ethers.parseEther('0.1') // 0.1 ETH minimum

        if (balance < minBalance) {
            console.error(`🚫 Watcher wallet low on gas: ${ethers.formatEther(balance)} ETH`)
            await alertAdmin('Watcher wallet low on gas', { balance: ethers.formatEther(balance) })
            return
        }

        // 4. Estimate gas
        const gasEstimate = await indulgenceContract.revoke.estimateGas(violation.nftTokenId)
        const gasLimit = (gasEstimate * 120n) / 100n // 20% buffer

        console.log(`⛽ Gas estimate: ${gasEstimate.toString()} (limit: ${gasLimit.toString()})`)

        // 5. Revoke NFT on-chain
        const tx = await indulgenceContract.revoke(violation.nftTokenId, {
            gasLimit,
        })

        console.log(`📤 Revocation transaction sent: ${tx.hash}`)

        const receipt = await tx.wait()

        console.log(`✅ NFT revoked: ${receipt.hash}`)
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`)

        // 6. Update rate limit counter
        revocationCounts.set(currentHour, hourlyCount + 1)

        // 7. Save to database
        await supabase.from('excommunications').insert({
            user,
            nft_token_id: violation.nftTokenId,
            absolution_time: new Date(violation.absolutionTime * 1000).toISOString(),
            transfer_amount: violation.transferAmount.toString(),
            percentage_sold: violation.percentageSold,
            cumulative_percentage: violation.cumulativePercentage,
            transfer_count: violation.transferCount,
            grace_period_remaining: violation.gracePeriodsRemaining,
            revocation_tx: receipt.hash,
            gas_used: receipt.gasUsed.toString(),
            watcher_address: watcherWallet.address,
            timestamp: new Date().toISOString(),
        })

        // 8. Generate excommunication tweet
        const { generateExcommunicationTweet } = await import('./tweet-generator')
        await generateExcommunicationTweet(user, violation, receipt.hash)

        // 9. Alert admin of successful excommunication
        await alertAdmin('Excommunication successful', {
            user,
            tokenId: violation.nftTokenId,
            txHash: receipt.hash,
            cumulativePercentage: violation.cumulativePercentage,
        })

        console.log(`💀 Excommunication complete for ${user}`)

    } catch (error: any) {
        console.error(`❌ Excommunication failed for ${user}:`, error)

        // Save failed revocation for retry
        await supabase.from('failed_revocations').insert({
            user,
            nft_token_id: violation.nftTokenId,
            error_message: error.message,
            error_stack: error.stack,
            retry_count: 0,
            timestamp: new Date().toISOString(),
        })

        // Alert admin
        await alertAdmin('Excommunication failed', {
            user,
            tokenId: violation.nftTokenId,
            error: error.message,
        })

        // Schedule retry
        await scheduleRetry(user, violation)
    }
}

async function alertAdmin(title: string, data: any) {
    console.log(`🚨 ADMIN ALERT: ${title}`, data)

    // Send to monitoring service (e.g., Sentry, PagerDuty)
    if (process.env.SENTRY_DSN) {
        // Sentry.captureMessage(title, { level: 'error', extra: data })
    }

    // Save to database
    await supabase.from('admin_alerts').insert({
        title,
        data: JSON.stringify(data),
        timestamp: new Date().toISOString(),
    })
}

async function scheduleRetry(user: string, violation: Violation) {
    // Exponential backoff retry
    const retryDelays = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000] // 5min, 15min, 1hr

    for (let i = 0; i < retryDelays.length; i++) {
        setTimeout(async () => {
            console.log(`🔄 Retry attempt ${i + 1} for ${user}`)

            try {
                await handleExcommunication(user, violation)
            } catch (error) {
                console.error(`❌ Retry ${i + 1} failed:`, error)

                if (i === retryDelays.length - 1) {
                    await alertAdmin('All retry attempts failed', {
                        user,
                        tokenId: violation.nftTokenId,
                    })
                }
            }
        }, retryDelays[i])
    }
}

// Monitor watcher wallet balance
setInterval(async () => {
    const balance = await provider.getBalance(watcherWallet.address)
    const minBalance = ethers.parseEther('0.5') // Alert threshold

    if (balance < minBalance) {
        await alertAdmin('Watcher wallet balance low', {
            address: watcherWallet.address,
            balance: ethers.formatEther(balance),
        })
    }
}, 60 * 60 * 1000) // Every hour
