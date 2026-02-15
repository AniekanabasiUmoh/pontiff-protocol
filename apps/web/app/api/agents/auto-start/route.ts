import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

const STRATEGY_MAP: Record<number, string> = {
    0: 'berzerker',
    1: 'merchant',
    2: 'disciple'
};

export async function POST(request: NextRequest) {
    const supabase = createServerSupabase();
    try {
        const { userAddress } = await request.json();

        if (!userAddress) {
            return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
        }

        const { data: sessions, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('user_wallet', userAddress.toLowerCase())
            .eq('status', 'active')
            .not('session_wallet', 'is', null);

        if (error) throw error;

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({ message: 'No agents to start', started: [] });
        }

        const { agentManager } = await import('@/lib/services/agent-manager-service');
        const started = [];

        for (const session of sessions) {
            try {
                const strategyName = STRATEGY_MAP[session.strategy_index || 0] || 'berzerker';
                await agentManager.startAgent(session.id, session.session_wallet, strategyName);
                started.push(session.id);
            } catch (error: any) {
                if (!error.message?.includes('already running')) {
                    console.warn(`Failed to start agent ${session.id}:`, error.message);
                }
            }
        }

        return NextResponse.json({ success: true, started, total: sessions.length });
    } catch (error: any) {
        console.error('Auto-start error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
