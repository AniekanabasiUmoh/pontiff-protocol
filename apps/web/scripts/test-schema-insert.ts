
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🧪 Testing "pending_funding" status insertion...');

    const testId = uuidv4();

    // Attempt insert
    const { error } = await supabase.from('agent_sessions').insert({
        id: testId,
        user_wallet: '0xTestSchemaCheck',
        status: 'pending_funding',
        strategy: 'berzerker',
        current_balance: 0
    });

    if (error) {
        console.error('❌ Insert Failed:', error.message);
        console.log('⚠️ likely cause: status column is an enum and "pending_funding" is missing.');
    } else {
        console.log('✅ Insert Successful! "pending_funding" is valid.');

        // Cleanup
        await supabase.from('agent_sessions').delete().eq('id', testId);
        console.log('🧹 Test record cleaned up.');
    }
}

main();
