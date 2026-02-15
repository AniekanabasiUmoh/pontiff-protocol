import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { AgentManagerService } from '@/lib/services/agent-manager-service';


export async function GET(request: Request) {
    const supabase = createServerSupabase();
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('🕒 Cron: Executing persistent agent turns...');

        const { data: sessions, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('status', 'active')
            .eq('is_running', true);

        if (error) throw error;

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({ message: 'No active running agents', processed: 0 });
        }

        const agentManager = AgentManagerService.getInstance();
        let processed = 0;

        // Execute ONE turn for each active agent
        for (const session of sessions) {
            try {
                // Update Heartbeat
                await supabase
                    .from('agent_sessions')
                    .update({ last_heartbeat: new Date().toISOString() })
                    .eq('id', session.id);

                // Execute Logic
                await agentManager.executeAgentTurn(
                    session.id,
                    session.session_wallet,
                    session.strategy_index || session.strategy || 'berzerker'
                );
                processed++;
            } catch (error) {
                console.error(`Failed to execute turn for ${session.id}:`, error);

                // If persistent error, maybe stop it? 
                // For now, keep trying next tick.
            }
        }

        console.log(`✅ Processed ${processed} agents`);

        return NextResponse.json({
            success: true,
            processed,
            totalActive: sessions.length
        });
    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
