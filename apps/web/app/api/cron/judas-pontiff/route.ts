
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { createPublicClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import { JudasProtocolABI } from '@/app/abis';
import { JudasStrategy } from '@/lib/ai/judas-strategy';

export const dynamic = 'force-dynamic';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://monad-testnet.g.alchemy.com/v2/demo';
const JUDAS_ADDRESS = process.env.NEXT_PUBLIC_JUDAS_ADDRESS as `0x${string}`;

export async function GET(req: NextRequest) {
    // 1. Verify Cron Secret (skip check if CRON_SECRET not configured)
    if (process.env.CRON_SECRET) {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    const supabase = createServerSupabase();
    try {
        // 2. Initial Checks
        const client = createPublicClient({
            chain: monadTestnet,
            transport: http(RPC_URL)
        });

        // Read Game State
        const gameState = await client.readContract({
            address: JUDAS_ADDRESS,
            abi: JudasProtocolABI,
            functionName: 'getGameState'
        }) as any;

        const epochId = Number(gameState[0]);
        const endTime = Number(gameState[1]) * 1000;
        const isResolved = gameState[4] as boolean;

        // If epoch is already resolved, skip
        if (isResolved) {
            return NextResponse.json({ skipped: true, reason: "Epoch already resolved" });
        }

        // If epoch has ended but not resolved, auto-resolve it
        if (Date.now() > endTime) {
            const resolveResult = await JudasStrategy.resolveExpiredEpoch(epochId);
            return NextResponse.json({ resolved: true, result: resolveResult });
        }

        // 3. Check DB for participation
        const { data: participation } = await supabase
            .from('judas_pontiff_log')
            .select('*')
            .eq('epoch_id', epochId)
            .single();

        if (participation) {
            return NextResponse.json({ skipped: true, reason: "Already participated in this epoch", action: (participation as any).action });
        }

        // 4. Act
        const result = await JudasStrategy.autoStakePontiff(epochId);

        if (result.success && result.txHash) {
            // Log to DB
            await supabase.from('judas_pontiff_log').insert({
                epoch_id: epochId,
                action: result.action,
                tx_hash: result.txHash
            } as any);
        }

        return NextResponse.json({ processed: true, result });

    } catch (error: any) {
        console.error("Judas Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
