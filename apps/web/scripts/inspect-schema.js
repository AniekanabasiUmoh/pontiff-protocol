const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Mock env loading since we are running via node directly in a messy environment potentially
// But we can try to read .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
} catch (e) {
    console.log("Could not load .env.local");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectSchema() {
    console.log("Inspecting 'confessions' table...");

    // Check if table exists by selecting 1
    const { data: confessionsData, error: confessionsError } = await supabase
        .from('confessions')
    const tablesToCheck = ['agent_sessions'];

    const report = { tables: {} };

    for (const table of tablesToCheck) {
        console.log(`Inspecting '${table}' table...`);
        // Try to fetch one row to see columns
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.error(`Error fetching ${table}:`, error);
            report.tables[table] = { exists: false, error: error.message };
        } else {
            if (data && data.length > 0) {
                console.log(`Columns for ${table}:`, Object.keys(data[0]));
                report.tables[table] = { exists: true, columns: Object.keys(data[0]), sample: data[0] };
            } else {
                console.log(`${table} exists but is empty.`);
                // Try to insert a dummy row to fail and see columns in error? No, that's risky.
                // Just report empty.
                report.tables[table] = { exists: true, empty: true };
            }
        }
    }

    console.log('Writing report to schema_report.json');
    fs.writeFileSync('schema_report.json', JSON.stringify(report, null, 2));
}

inspectSchema();
