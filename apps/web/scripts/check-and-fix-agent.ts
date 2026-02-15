import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAndFixAgent() {
    const agentId = '369a5b90-d98a-4701-9202-8b64d2c287e5';

    console.log('🔍 Checking agent status...\n');

    const { data: agent, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('id', agentId)
        .single();

    if (error || !agent) {
        console.error('❌ Agent not found');
        return;
    }

    console.log('Current Agent Status:');
    console.log(`   Balance: ${agent.current_balance || agent.starting_balance}`);
    console.log(`   Stop Loss: ${agent.stop_loss}`);
    console.log(`   Session Wallet: ${agent.session_wallet}`);
    console.log(`   Status: ${agent.status}`);
    console.log(`   Games Played: ${agent.games_played || 0}\n`);

    // Fix stop-loss if needed
    if (agent.stop_loss !== 2) {
        console.log('🔧 Fixing stop-loss (20 → 2)...');
        const { error: updateError } = await supabase
            .from('agent_sessions')
            .update({ stop_loss: 2 })
            .eq('id', agentId);

        if (updateError) {
            console.error('❌ Failed to update stop-loss');
        } else {
            console.log('✅ Stop-loss updated to 2\n');
        }
    } else {
        console.log('✅ Stop-loss is correct (2)\n');
    }

    // Check if status is active
    if (agent.status !== 'active') {
        console.log('🔧 Setting status to active...');
        const { error: statusError } = await supabase
            .from('agent_sessions')
            .update({ status: 'active' })
            .eq('id', agentId);

        if (statusError) {
            console.error('❌ Failed to update status');
        } else {
            console.log('✅ Status set to active\n');
        }
    }

    console.log('✅ Agent is ready to play!');
    console.log('   Run: npx tsx scripts/start-my-agent.ts\n');
}

checkAndFixAgent().catch(console.error);
