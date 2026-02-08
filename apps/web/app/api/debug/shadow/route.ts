import { NextResponse } from 'next/server';
import { ShadowHeretic } from '@/lib/agents/shadow-heretic';
import { ShadowProphet } from '@/lib/agents/shadow-prophet';

export async function POST(request: Request) {
    try {
        const { agent } = await request.json();

        if (agent === 'heretic') {
            // Run in background (fire and forget for API speed, but in Vercel serverless you should await)
            // For demo safety, we await
            await ShadowHeretic.runCycle();
            return NextResponse.json({ success: true, message: "Heretic Cycle Complete" });
        }

        if (agent === 'prophet') {
            await ShadowProphet.runCycle();
            return NextResponse.json({ success: true, message: "Prophet Cycle Complete" });
        }

        return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
