
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

async function checkSessions() {
    console.log('Checking recent agent sessions...');

    const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching sessions:', error);
        return;
    }

    if (sessions && sessions.length > 0) {
        console.log(`Found ${sessions.length} sessions:`);
        sessions.forEach(s => {
            console.log(`- ID: ${s.id}`);
            console.log(`  Created: ${s.created_at}`);
            console.log(`  User Wallet: ${s.user_wallet}`);
            console.log(`  Strategy: ${s.strategy}`);
            console.log(`  Status: ${s.status}`);
            console.log('---');
        });
    } else {
        console.log('No sessions found in the database.');
    }
}

checkSessions().catch(console.error);
