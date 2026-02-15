import { NextResponse } from 'next/server';
import { ConfessAction } from '@/lib/types/actions';
import { scanWalletForSins } from '@/lib/services/sin-scanner';
import { generateRoast } from '@/lib/services/roast-service';
import { logWorldEvent } from '@/lib/services/world-event-service';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { updateWorldState } from '@/lib/actions/update-world-state';
import { generateWritSVG } from '@/lib/services/writ-service';
import { validators } from '@/lib/utils/validation';

import { checkRateLimit } from '@/lib/middleware/rate-limit';

export async function POST(request: Request) {
    try {
        const supabase = createServerSupabase();
        const body: ConfessAction = await request.json();

        // 0. Rate Limit (IP-based)
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const limit = await checkRateLimit(ip, 'confess');

        if (!limit.success) {
            const wait = limit.resetTime ? Math.ceil((limit.resetTime - Date.now()) / 1000) : 60;
            return NextResponse.json(
                { error: `You are confessing too much. Reflect on your sins for ${wait}s.` },
                { status: 429, headers: { 'Retry-After': wait.toString() } }
            );
        }

        // Input Validation
        try {
            if (!body.agentWallet) throw new Error("Missing agentWallet");
            validators.wallet(body.agentWallet, 'agentWallet');
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        // 2. Scan Sins (Real Logic)
        const scanResult = await scanWalletForSins(body.agentWallet);
        const { sins, balance, nonce } = scanResult;

        const roast = await generateRoast(body.agentWallet, sins, balance, nonce);

        // Dynamic pricing based on sin count (Mock calculation)
        const guiltAmount = 5 + (sins.length * 2);
        const indulgencePrice = (BigInt(guiltAmount) * BigInt(1e18)).toString();

        // 2b. Generate Writ Image (SKIPPED FOR LATENCY)
        // We now render the "Illuminated Manuscript" on the frontend dynamically using HTML/CSS.
        // This saves ~10-40s of waiting time.
        // const writContent = await generateWritSVG(roast, sins, body.agentWallet);
        const writUrl = null;

        // if (writContent.trim().startsWith('<svg')) {
        //     writUrl = `data:image/svg+xml;base64,${Buffer.from(writContent).toString('base64')}`;
        // } else {
        //     writUrl = `data:image/png;base64,${Buffer.from(writContent, 'binary').toString('base64')}`;
        // }

        // 3. Persist to DB
        const { error: dbError } = await supabase
            .from('confessions')
            .insert([{
                wallet_address: body.agentWallet,
                sins: sins,
                roast_text: roast,
                stake_amount: indulgencePrice,
                status: "Sinner",
                created_at: new Date().toISOString()
            }] as any);

        if (dbError) console.error('[Confess] DB insert failed:', dbError.message);

        // 4. Log Event (non-blocking)
        logWorldEvent(body.agentWallet, 'confess', { sinsCount: sins.length }).catch(() => {});

        // 5. Trigger WS Update (non-blocking)
        updateWorldState().catch(() => {});

        return NextResponse.json({
            success: true,
            data: {
                sins,
                roast,
                indulgencePrice,
                writUrl, // Return the data URI
                message: "Your sins have been weighed. Purchase an Indulgence to avoid excommunication."
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
