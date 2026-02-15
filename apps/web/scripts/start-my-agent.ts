import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function startMyAgent() {
    console.log('🤖 Starting Your Agent...\n');

    // Import agent manager
    const { AgentManagerService } = await import('../lib/services/agent-manager-service');

    // Connect to database
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get your most recent active agent
    const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !sessions || sessions.length === 0) {
        console.error('❌ No active agents found!');
        console.log('   Go to /hire and spawn an agent first.');
        process.exit(1);
    }

    const agent = sessions[0];
    console.log('✅ Found your agent:');
    console.log(`   ID: ${agent.id}`);
    console.log(`   Strategy: ${agent.strategy}`);
    console.log(`   Deposit: ${agent.starting_balance || agent.deposit_amount}`);
    console.log(`   Session Wallet: ${agent.session_wallet || 'Not yet created'}`);
    console.log('');

    // Check if session wallet exists
    if (!agent.session_wallet) {
        console.error('⚠️  Session wallet not created yet!');
        console.log('   The smart contract needs to create the session wallet first.');
        console.log('   This happens when the spawn transaction is confirmed on-chain.');
        console.log('');
        console.log('💡 Solution: Wait a few minutes for blockchain confirmation,');
        console.log('   or check if the spawn transaction succeeded in MetaMask.');
        process.exit(1);
    }

    // Start the agent
    const manager = AgentManagerService.getInstance();
    console.log('🚀 Starting agent loop...');
    console.log('   The agent will play games every 10 seconds.');
    console.log('   Press Ctrl+C to stop.\n');

    await manager.startAgent(
        agent.id,
        agent.session_wallet,
        agent.strategy
    );

    console.log('✅ Agent is now running!');
    console.log('   Watch your dashboard at http://localhost:3000/dashboard');
    console.log('   to see your agent play games automatically.\n');

    // Keep process alive
    setInterval(() => {
        console.log(`⏰ Agent ${agent.strategy} still running...`);
    }, 60000); // Log every minute
}

startMyAgent().catch(console.error);
