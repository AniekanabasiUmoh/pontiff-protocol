import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDepositColumn() {
    console.log('🔍 Checking if deposit_amount column exists...\n');

    // Try to select deposit_amount specifically
    const { data, error } = await supabase
        .from('agent_sessions')
        .select('id, deposit_amount, starting_balance')
        .limit(1);

    if (error) {
        console.error('❌ ERROR:', error.message);
        console.log('\n⚠️  The deposit_amount column does NOT exist yet.');
        console.log('   You need to run the SQL fix in Supabase SQL Editor.');
        console.log('   Open: docs/audit/FIX_AGENT_SESSIONS.sql');
        return;
    }

    console.log('✅ deposit_amount column EXISTS!');
    if (data && data.length > 0) {
        console.log('\nSample data:');
        console.log(`   ID: ${data[0].id}`);
        console.log(`   deposit_amount: ${data[0].deposit_amount || 'NULL'}`);
        console.log(`   starting_balance: ${data[0].starting_balance}`);
    }
}

checkDepositColumn();
