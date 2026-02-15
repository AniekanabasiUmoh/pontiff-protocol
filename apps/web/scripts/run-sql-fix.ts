import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runSqlFix() {
    console.log('🔧 Running SQL Fix for Stop-Loss\n');

    const { data, error } = await supabase
        .from('agent_sessions')
        .update({ stop_loss: 2 })
        .eq('id', '369a5b90-d98a-4701-9202-8b64d2c287e5')
        .select()
        .single();

    if (error) {
        console.error('❌ Failed to update:', error);
        return;
    }

    console.log('✅ Stop-loss updated successfully!');
    console.log(`   Old: 20 GUILT`);
    console.log(`   New: ${data.stop_loss} GUILT`);
    console.log(`   Balance: ${data.current_balance || data.deposit_amount} GUILT`);
    console.log('\n🎮 Agent can now play games!');
}

runSqlFix().catch(console.error);
