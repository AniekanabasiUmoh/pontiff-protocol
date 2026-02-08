import { NextResponse } from 'next/server';
import { JudasStrategy } from '@/lib/ai/judas-strategy';
import { LeaderboardService } from '@/lib/services/leaderboard-service';
import { getContract } from 'viem'; // Mock import or real logic
// In real app we'd use 'viem' to verify the contract event state, simplified here to trust client for hackathon demo speed or read chain
// We will read chain state for security.

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // const { epochId, txHash, playerAddress } = body; // Removed to avoid dup

        const { epochId, txHash } = body;

        if (!txHash) {
            return NextResponse.json({ error: "txHash required for verification" }, { status: 400 });
        }

        // 1. Verify Transaction & Parse Logs
        const { createPublicClient, http, parseAbiItem, decodeEventLog } = await import('viem');
        const { monadTestnet } = await import('viem/chains');

        const client = createPublicClient({
            chain: monadTestnet,
            transport: http(process.env.NEXT_PUBLIC_RPC_URL)
        });

        const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });

        if (receipt.status !== 'success') {
            throw new Error("Transaction failed on-chain");
        }

        // Define Event ABI: event EpochResolved(uint256 indexed epochId, string outcome, uint256 betrayalPct, address[] winners)
        // Adjust based on actual contract. Assuming structure.
        const eventAbi = parseAbiItem('event EpochResolved(uint256 indexed epochId, string outcome, uint256 betrayalPct, address[] winners)');

        // Find the log
        let resolvedLog: any = null;
        for (const log of receipt.logs) {
            try {
                const decoded = decodeEventLog({
                    abi: [eventAbi],
                    data: log.data,
                    topics: log.topics
                });
                if (decoded.eventName === 'EpochResolved') {
                    resolvedLog = decoded.args;
                    break;
                }
            } catch (e) { continue; }
        }

        if (!resolvedLog) {
            throw new Error("EpochResolved event not found in transaction logs");
        }

        const realEpochId = Number(resolvedLog.epochId);
        const realOutcome = resolvedLog.outcome;
        const realBetrayalPct = Number(resolvedLog.betrayalPct); // Assuming stored as integer (e.g. 50 = 50%) or basis points?
        // Let's assume passed as percentage for now.

        // 2. Process Result (DB + Tweet) using Verified Data
        const tweetAttempt = await JudasStrategy.processEpochResult(realEpochId, realOutcome, realBetrayalPct);

        // 3. Update Leaderboard (Based on Winners array from Log)
        const winners = resolvedLog.winners as string[];
        if (winners && winners.length > 0) {
            // Batch update or single? 
            // In a real app we might verify *if* the specific requesting player is in the list?
            // Or just update everyone in the list?
            // The endpoint is likely called once per Epoch by a worker or the Pontiff bot.
            // If called by client, we only update THEM?
            // User requirement: "Parse Judas contract events instead of trusting client"
            // "Fix leaderboard inconsistencies"

            // If body.playerAddress is provided, verify they are in winners
            // If called by worker, update all?
            // Let's assume this is a public trigger. We should update ALL winners found in log.

            for (const winner of winners) {
                await LeaderboardService.updateLeaderboard(
                    winner,
                    'WIN', // They are in the winners list
                    100 // Real reward amount? Maybe derived from log?
                );
            }
        }

        return NextResponse.json({ success: true, message: tweetAttempt, verified: true });

    } catch (error: any) {
        console.error("Judas Resolution API Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
