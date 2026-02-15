import { NextResponse } from 'next/server';
import { validateAction } from '@/lib/middleware/validate-action';
import { BuyIndulgenceAction } from '@/lib/types/actions';
import { logWorldEvent } from '@/lib/services/world-event-service';
import { ConversionService } from '@/lib/services/conversion-service';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { updateWorldState } from '@/lib/actions/update-world-state';

export async function POST(request: Request) {
    try {
        const supabase = createServerSupabase();
        const body: BuyIndulgenceAction = await request.json();

        // 1. Validate
        await validateAction(body);

        // 2. Update Confession Status in DB (if exists)
        const { data: recentConfession, error } = await supabase
            .from('confessions')
            .select('*')
            .eq('wallet_address', body.agentWallet)
            .eq('status', 'Sinner')
            .order('created_at', { ascending: false })
            .limit(1)
            .single() as { data: any, error: any };

        if (recentConfession) {
            await supabase
                .from('confessions')
                // @ts-ignore
                .update({ status: "Absolved" })
                .eq('id', recentConfession.id);
        }

        // 3. Log Event
        await logWorldEvent(body.agentWallet, 'buyIndulgence', { tier: body.tier });

        // 4. Track Conversion (Module 11)
        await ConversionService.trackConversionSign(
            body.agentWallet,
            'BuyIndulgence',
            recentConfession?.stake_amount || "0",
            { txHash: body.txHash }
        );

        // 5. Trigger WS Update
        await updateWorldState();

        return NextResponse.json({
            success: true,
            status: "Absolved",
            message: "Go in peace, your sins are forgiven."
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
