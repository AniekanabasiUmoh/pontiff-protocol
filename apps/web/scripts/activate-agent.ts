import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function activateAgent() {
    const agentId = 'be0afc07-ff41-4c43-9236-e3a3cadb44d6';

    console.log('🔧 Setting agent to active...\n');

    const { error } = await supabase
        .from('agent_sessions')
        .update({ status: 'active' })
        .eq('id', agentId);

    if (error) {
        console.error('❌ Failed:', error);
    } else {
        console.log('✅ Agent status set to ACTIVE');
        console.log('\n🚀 Run: npx tsx scripts/start-my-agent.ts\n');
    }
}

activateAgent().catch(console.error);
