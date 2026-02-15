import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { AgentManagerService } from '@/lib/services/agent-manager-service';


export async function GET() {
    try {
        console.log('🔍 Checking for agents to start...');

        // Get all active sessions with session_wallet set
        const { data: sessions, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('status', 'active')
            .not('session_wallet', 'is', null);

        if (error) throw error;

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({
                message: 'No active agents with confirmed wallets',
                started: 0
            });
        }

        const agentManager = AgentManagerService.getInstance();
        const started = [];

        for (const session of sessions) {
            console.log(`🚀 Starting agent ${session.id}...`);
            await agentManager.startAgent(
                session.id,
                session.session_wallet,
                session.strategy_index || 0
            );
            started.push(session.id);
        }

        console.log(`✅ Started ${started.length} agents`);

        return NextResponse.json({
            success: true,
            message: `Started ${started.length} agent(s)`,
            agents: started
        });
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
