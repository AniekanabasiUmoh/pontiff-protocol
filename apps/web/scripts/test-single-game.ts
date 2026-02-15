import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testSingleGame() {
    console.log('🎮 Testing Single Game Execution\n');

    const { AgentManagerService } = await import('../lib/services/agent-manager-service');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the agent
    const { data: session } = await supabase
        .from('agent_sessions')
        .select('*')
        .not('session_wallet', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!session) {
        console.error('❌ No agent found');
        return;
    }

    console.log('Agent:');
    console.log(`   ID: ${session.id}`);
    console.log(`   Strategy: ${session.strategy}`);
    console.log(`   Session Wallet: ${session.session_wallet}`);
    console.log('');

    console.log('🎲 Attempting to play ONE game...\n');

    const manager = new AgentManagerService();

    try {
        // Execute a single turn (this will play one game)
        await (manager as any).executeAgentTurn(
            session.id,
            session.session_wallet,
            session.strategy
        );

        console.log('\n✅ Game execution completed!');
        console.log('   Check the console output above for details.');
        console.log('   Check your dashboard to see if games_played increased.');

    } catch (error: any) {
        console.error('\n❌ Game execution failed:', error.message);
        console.error('   Full error:', error);
    }
}

testSingleGame().catch(console.error);
