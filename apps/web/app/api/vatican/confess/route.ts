import { NextResponse } from 'next/server';
import { validateAction } from '@/lib/middleware/validate-action';
import { ConfessAction } from '@/lib/types/actions';
import { scanWalletForSins } from '@/lib/services/sin-scanner';
import { generateRoast } from '@/lib/services/roast-service';
import { logWorldEvent } from '@/lib/services/world-event-service';
import { supabase } from '@/lib/db/supabase';
import { updateWorldState } from '@/lib/actions/update-world-state';

export async function POST(request: Request) {
    try {
        const body: ConfessAction = await request.json();

        // 1. Validate
        await validateAction(body);

        // 2. Scan Sins (Real Logic)
        const sins = await scanWalletForSins(body.agentWallet);
        const roast = await generateRoast(body.agentWallet, sins);

        // Dynamic pricing based on sin count (Mock calculation)
        const guiltAmount = 5 + (sins.length * 2);
        const indulgencePrice = (BigInt(guiltAmount) * BigInt(1e18)).toString();

        // 3. Persist to DB
        const { error: dbError } = await supabase
            .from('confessions')
            .insert([{
                walletAddress: body.agentWallet,
                sins: sins,
                roast: roast,
                indulgencePrice: indulgencePrice,
                status: "Sinner",
                timestamp: new Date().toISOString()
            }]);

        if (dbError) throw new Error(dbError.message);

        // 4. Log Event
        await logWorldEvent(body.agentWallet, 'confess', { sinsCount: sins.length });

        // 5. Trigger WS Update
        await updateWorldState();

        return NextResponse.json({
            success: true,
            data: {
                sins,
                roast,
                indulgencePrice,
                message: "Your sins have been weighed. Purchase an Indulgence to avoid excommunication."
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
