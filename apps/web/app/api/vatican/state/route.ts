import { NextResponse } from 'next/server';
import { getVaticanState } from '@/lib/services/world-state-service';

export const dynamic = 'force-dynamic'; // Disable static caching

export async function GET() {
    try {
        const state = await getVaticanState();
        return NextResponse.json(state);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch Vatican World State" },
            { status: 500 }
        );
    }
}
