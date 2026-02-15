import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem, decodeEventLog } from 'viem';
import { monadTestnet } from 'viem/chains';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { JudasStrategy } from '@/lib/ai/judas-strategy';
import { JudasProtocolABI } from '@/app/abis';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://monad-testnet.g.alchemy.com/v2/demo';

const JUDAS_ADDRESS = process.env.NEXT_PUBLIC_JUDAS_ADDRESS as `0x${string}`;

export async function POST(request: Request) {
    const supabase = createServerSupabase();
    try {
        const body = await request.json();
        const { epochId, txHash } = body;

        if (!txHash) {
            return NextResponse.json({ error: "txHash required for verification" }, { status: 400 });
        }

        const client = createPublicClient({
            chain: monadTestnet,
            transport: http(RPC_URL)
        });

        const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });

        if (receipt.status !== 'success') {
            throw new Error("Transaction failed on-chain");
        }

        // Event: event EpochResolved(uint256 indexed id, uint256 betrayalPct, string outcome);
        const eventAbi = parseAbiItem('event EpochResolved(uint256 indexed id, uint256 betrayalPct, string outcome)');

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


        const realEpochId = Number(resolvedLog.id);
        const realOutcome = resolvedLog.outcome;
        const realBetrayalPct = Number(resolvedLog.betrayalPct);

        // Fetch tournament state from contract
        let tournamentId = 0;
        let roundNumber = 0;
        try {
            const tournamentState = await client.readContract({
                address: JUDAS_ADDRESS,
                abi: JudasProtocolABI,
                functionName: 'getTournamentState',
            }) as readonly [bigint, bigint, bigint];
            tournamentId = Number(tournamentState[0]);
            roundNumber = Number(tournamentState[1]);
        } catch (e) {
            console.error('Failed to fetch tournament state:', e);
        }

        // 1. Insert into DB (upsert to avoid duplicates)
        const { error: dbError } = await supabase.from('judas_epochs').upsert({
            epoch_id: realEpochId,
            tournament_id: tournamentId,
            round_number: roundNumber,
            betrayal_pct: realBetrayalPct,
            outcome: realOutcome,
            tx_hash: txHash
        }, { onConflict: 'epoch_id' });

        if (dbError) {
            console.error("Failed to insert judas_epoch:", dbError);
        }

        // 2. Process Strategy (Tweet/Log)
        await JudasStrategy.processEpochResult(realEpochId, realOutcome, realBetrayalPct);

        return NextResponse.json({
            success: true,
            message: "Epoch resolved successfully verified on-chain",
            data: {
                epochId: realEpochId,
                outcome: realOutcome,
                betrayalPct: realBetrayalPct
            }
        });

    } catch (error: any) {
        console.error("Judas Resolution API Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
