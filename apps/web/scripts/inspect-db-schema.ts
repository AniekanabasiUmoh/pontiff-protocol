import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('Inspecting Database Schema via REST API...');
    const tables = ['agent_sessions', 'game_history', 'games', 'vatican_entrants'];
    let report = `Database Schema Report - ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
        console.log(`Fetching structure for table: ${table}`);
        report += `--- Table: ${table} ---\n`;

        // Fetch one row to infer structure since REST API doesn't standardly expose schema safely
        // But we can try to query information_schema if we have permissions?
        // Let's try information_schema first as it's cleaner.

        /* 
        NOTE: Supabase JS client doesn't support querying `information_schema` directly easily via `.from()` 
        unless it's exposed in the API. Usually it's not.
        So we will fetch a sample row and print its keys and types.
        */

        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            report += `Error fetching table ${table}: ${error.message}\n`;
        } else if (data && data.length > 0) {
            const sample = data[0];
            report += `Sample Row Keys & Types:\n`;
            Object.keys(sample).forEach(key => {
                const val = sample[key];
                const type = typeof val;
                report += `  - ${key}: ${type} (Example: ${val})\n`;
            });
        } else {
            report += `Table ${table} exists but is empty. Cannot infer schema from rows.\n`;
        }
        report += '\n';
    }

    // Also verify if RPC functions exist?
    // Hard to do via REST.

    fs.writeFileSync('schema_inspection.txt', report);
    console.log('Report saved to schema_inspection.txt');
}

inspectSchema();
