import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AgentManagerService } from '../lib/services/agent-manager-service';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function startAllAgents() {
    console.log('🚀 Starting all active agents...\n');

    // Get all active sessions
    const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('status', 'active');

    if (error) {
        console.error('❌ Error fetching sessions:', error);
        return;
    }

    if (!sessions || sessions.length === 0) {
        console.log('⚠️ No active sessions found');
        console.log('\n💡 To spawn an agent, visit: http://localhost:3000/hire');
        return;
    }

    console.log(`📋 Found ${sessions.length} active session(s):\n`);

    const agentManager = AgentManagerService.getInstance();

    for (const session of sessions) {
        console.log(`  🤖 Agent ID: ${session.id}`);
        console.log(`     Strategy: ${session.strategy}`);
        console.log(`     Balance: ${session.current_balance} GUILT`);
        console.log(`     Session Wallet: ${session.session_wallet}`);
        console.log('');

        // Start the agent
        await agentManager.startAgent(
            session.id,
            session.session_wallet,
            session.strategy_index || 0
        );
    }

    console.log('✅ All agents started!');
    console.log('\n🔄 Agents will now play games every 30-60 seconds');
    console.log('📊 Check your dashboard: http://localhost:3000/dashboard');
    console.log('\n🛑 Press Ctrl+C to stop\n');

    // Keep process alive
    process.stdin.resume();
}

start AllAgents().catch(console.error);
