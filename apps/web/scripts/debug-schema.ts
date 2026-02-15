import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- Inspecting Tables ---');
    // Unfortunately, Supabase JS client doesn't let us query information_schema easily due to permissions usually.
    // But let's try RPC or just list known tables.

    // Actually, we can just try to select from 'games' and 'Game' and see which one works.

    const tablesToCheck = ['games', 'Game', 'crusades', 'Crusade', 'user_balances'];
    const results: any = {};

    for (const table of tablesToCheck) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        results[table] = { exists: !error, error: error?.message };
    }

    console.log(JSON.stringify(results, null, 2));

    // Also check column names for 'user_balances' if it exists
    if (results['user_balances'].exists) {
        console.log('--- Checking user_balances columns ---');
        const { data, error } = await supabase.from('user_balances').select('*').limit(1);
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Table empty, cannot infer columns from data.');
        }
    }
}

inspectSchema();
