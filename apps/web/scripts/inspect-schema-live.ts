
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🔍 Inspecting Live Schema...');

    // We can query postgres information_schema via a custom RPC if it exists, 
    // OR we can try to select * from tables with limit 0 to see columns if RPC isn't option.
    // BUT the best way without RPC is often just using the JS client to see what it returns,
    // OR assuming we can run a SQL query if the user runs it.

    // However, the user said "query Supabase REST API".
    // We can't query information_schema directly via REST API unless we exposed it.

    // Alternative: Try to fetch one row from key tables and print keys.
    // Also, we can use the `rpc` method if there's a function to run SQL (likely not for security).

    // Let's try to infer from a `select` call which returns error if column missing,
    // or just inspect the returned object keys if it works.

    const tables = ['agent_sessions', 'game_history', 'pvp_matches', 'matchmaking_queue'];
    const report: any = {};

    for (const table of tables) {
        console.log(`Checking ${table}...`);
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            report[table] = { status: 'ERROR', error: error.message };
        } else if (data && data.length > 0) {
            report[table] = { status: 'EXISTS', columns: Object.keys(data[0]) };
        } else {
            // Table exists but empty, insert dummy to check columns? No, dangerous.
            // If data is empty array, table exists.
            report[table] = { status: 'EMPTY_BUT_EXISTS' };
        }
    }

    // Write to file
    fs.writeFileSync('live_schema_report.json', JSON.stringify(report, null, 2));
    console.log('✅ Report written to live_schema_report.json');
}

main();
