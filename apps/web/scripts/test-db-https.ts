
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Testing Supabase HTTPS Connection...');

    const { count, error } = await supabase
        .from('leaderboard_entries')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('HTTPS Connection Failed:', error.message);
    } else {
        console.log(`HTTPS Connection Successful! Found ${count} leaderboard entries.`);
    }
}

main();
