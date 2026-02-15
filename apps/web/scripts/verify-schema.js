
const path = require('path');
const fs = require('fs');

// Load env vars
const envPath = path.resolve(process.cwd(), '../../.env');
console.log(`Loading env from: ${envPath}`);
require('dotenv').config({ path: envPath });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifySchema() {
    console.log('🔍 Verifying database schema...');

    const tablesToCheck = ['agent_sessions', 'pvp_matches', 'matchmaking_queue'];
    const results = {};

    for (const table of tablesToCheck) {
        console.log(`Checking table: ${table}`);

        // 1. Check existence
        const { count, error: existError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (existError) {
            if (existError.code === '42P01') {
                results[table] = { exists: false, status: 'Missing' };
                console.log(`  ❌ Table ${table} does NOT exist.`);
            } else {
                results[table] = { exists: false, error: existError.message, code: existError.code };
                console.log(`  ⚠️ Error checking ${table}: ${existError.message}`);
            }
        } else {
            results[table] = { exists: true, rowCount: count, status: 'Exists' };
            console.log(`  ✅ Table ${table} exists with ${count} rows.`);

            // 2. Check specific columns if table exists
            const columnsToCheck = {
                'agent_sessions': ['agent_mode'],
                'pvp_matches': ['player1_id', 'game_type', 'winner_id'],
                'matchmaking_queue': ['agent_id', 'stake_range_min']
            };

            if (columnsToCheck[table]) {
                const resultsCols = {};
                for (const col of columnsToCheck[table]) {
                    const { error: colError } = await supabase
                        .from(table)
                        .select(col)
                        .limit(1);

                    if (colError) {
                        resultsCols[col] = 'Missing';
                        console.log(`  ❌ Column '${col}' in ${table} is MISSING or inaccessible.`);
                    } else {
                        resultsCols[col] = 'Present';
                        console.log(`  ✅ Column '${col}' in ${table} is PRESENT.`);
                    }
                }
                results[table].columns = resultsCols;
            }
        }
    }

    const reportPath = path.join(__dirname, '../schema_verification_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Report written to ${reportPath}`);
}

verifySchema();
