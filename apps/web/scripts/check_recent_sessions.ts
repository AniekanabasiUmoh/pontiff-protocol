import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecentSessions() {
    console.log('🔍 Checking recent agent sessions...\n');

    const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`Found ${sessions.length} recent session(s):\n`);

    sessions.forEach((session, idx) => {
        console.log(`${idx + 1}. Session ID: ${session.id}`);
        console.log(`   User Wallet: ${session.user_wallet}`);
        console.log(`   Strategy: ${session.strategy}`);
        console.log(`   Deposit: ${session.deposit_amount || session.starting_balance}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   TX Hash: ${session.tx_hash || 'N/A'}`);
        console.log(`   Created: ${new Date(session.created_at).toLocaleString()}`);
        console.log('');
    });
}

checkRecentSessions();
