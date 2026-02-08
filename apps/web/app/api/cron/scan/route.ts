import { NextResponse } from 'next/server';
import { scanForEntrantsAndDebate } from '@/lib/services/agent-scanner';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // optional: verify Authorization header for cron security

        const results = await scanForEntrantsAndDebate();

        return NextResponse.json({
            success: true,
            scanned: results.length,
            details: results
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
