import { NextRequest, NextResponse } from 'next/server';
import { agentManager } from '@/lib/services/agent-manager-service';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { validators } from '@/lib/utils/validation';

const STRATEGY_MAP: Record<number, string> = {
    0: 'berzerker',
    1: 'merchant',
    2: 'disciple'
};

export async function POST(request: NextRequest) {
    const supabase = createServerSupabase();
    try {
        const { sessionId, strategy } = await request.json();

        try {
            validators.uuid(sessionId, 'sessionId');
            if (strategy === undefined) throw new Error('Missing strategy');
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        const { data: session, error: fetchError } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (fetchError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const walletAddress = session.session_wallet;

        if (!walletAddress) {
            return NextResponse.json({
                success: false,
                message: 'Session wallet not confirmed in DB yet. Will auto-start via cron.',
                sessionId,
                willRetry: true
            }, { status: 202 });
        }

        if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
            return NextResponse.json({ error: 'Invalid session wallet address in database' }, { status: 500 });
        }

        const { error: updateError } = await supabase
            .from('agent_sessions')
            .update({ status: 'active' })
            .eq('id', sessionId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to activate session' }, { status: 500 });
        }

        const strategyName = STRATEGY_MAP[Number(strategy)] || 'berzerker';
        await agentManager.startAgent(sessionId, walletAddress, strategyName);

        return NextResponse.json({
            success: true,
            message: 'Agent started successfully',
            sessionId
        });
    } catch (error: any) {
        console.error('Failed to start agent:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to start agent' },
            { status: 500 }
        );
    }
}
