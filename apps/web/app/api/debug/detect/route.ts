import { NextResponse } from 'next/server';
import { ConversionDetector } from '@/lib/services/conversion-detector';
import { scanForReplies } from '@/lib/services/agent-scanner';

export async function POST(request: Request) {
    try {
        // Run both scanners
        await ConversionDetector.scanForAcknowledgements();
        await ConversionDetector.scanBlockchainForGuilt();
        await scanForReplies(); // Auto-reply check

        return NextResponse.json({ success: true, message: "Detection Cycle Complete" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
