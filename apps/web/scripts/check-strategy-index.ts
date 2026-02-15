import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Recent Sessions:');
    sessions.forEach(s => {
        console.log(`ID: ${s.id}`);
        console.log(`Wallet: ${s.session_wallet}`);
        console.log(`Strategy: ${s.strategy}`); // String
        console.log(`Index: ${s.strategy_index}`); // Number?
        console.log('---');
    });
}

check();
