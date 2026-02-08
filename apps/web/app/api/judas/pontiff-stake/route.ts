import { NextResponse } from 'next/server';
import { JudasStrategy } from '@/lib/ai/judas-strategy';

/**
 * API endpoint to trigger Pontiff's automatic participation in a Judas epoch.
 * This can be called when a new epoch starts or manually for demo purposes.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { epochId } = body;

        if (!epochId) {
            return NextResponse.json({ error: "Epoch ID required" }, { status: 400 });
        }

        // Trigger Pontiff auto-stake
        const result = await JudasStrategy.autoStakePontiff(epochId);

        return NextResponse.json({
            success: result.success,
            action: result.action,
            message: `The Pontiff has ${result.action === 'BETRAY' ? 'signaled betrayal' : 'remained loyal'} for Epoch ${epochId}.`
        });

    } catch (error: any) {
        console.error("Pontiff Auto-Stake Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
