import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), 'apps/web/.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName: string) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            return { table: tableName, error: error.message };
        }

        if (!data || data.length === 0) {
            return { table: tableName, status: 'empty', columns: 'unknown (no rows)' };
        }

        return {
            table: tableName,
            status: 'ha_data',
            columns: Object.keys(data[0]),
            sample: data[0]
        };
    } catch (e: any) {
        return { table: tableName, error: e.message };
    }
}

async function main() {
    const tables = [
        'confessions',
        'agent_sessions',
        'debates',
        'game_history',
        'pvp_matches',
        'pvp_leaderboard',
        'staking_records',
        'competitor_agents',
        'treasury_revenue',
        'treasury_totals',
        'balance_transactions'
    ];

    const results: any[] = [];

    for (const table of tables) {
        console.log(`Inspecting ${table}...`);
        const result = await inspectTable(table);
        results.push(result);
    }

    const outputPath = path.resolve(process.cwd(), 'apps/web/scripts/schema_inspection.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Inspection results written to ${outputPath}`);
}

main();
