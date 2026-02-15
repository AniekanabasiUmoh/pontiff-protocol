
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing manual session insert...');

    const testSession = {
        tx_hash: '0x' + Math.random().toString(16).slice(2) + '00000000000000000000000000000000',
        user_wallet: '0x9f994707E36848a82e672d34aDB3194877dB8cc3'.toLowerCase(), // User's wallet from logs
        strategy: 'berzerker',
        strategy_index: 0,
        deposit_amount: '100',
        starting_balance: '100',
        current_balance: '100',
        status: 'active',
        created_at: new Date().toISOString(),
        agent_mode: 'PvE'
    };

    console.log('Inserting:', testSession);

    const { data, error } = await supabase
        .from('agent_sessions')
        .insert(testSession)
        .select()
        .single();

    if (error) {
        console.error('❌ Insert failed:', error);
    } else {
        console.log('✅ Insert successful:', data);
    }
}

testInsert().catch(console.error);
