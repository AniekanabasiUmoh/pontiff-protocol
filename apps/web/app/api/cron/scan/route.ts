import { NextRequest, NextResponse } from 'next/server';
import { scanForEntrantsAndDebate } from '@/lib/services/agent-scanner';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
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
