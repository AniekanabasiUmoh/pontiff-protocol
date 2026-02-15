
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables manually since we might not have dotenv configured for scripts
const envFile = fs.readFileSync('apps/web/.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    console.log('Verifying schema compatibility for FIX_ROBUST.sql...');
    const report = [];

    // 1. Check Tournaments Table
    console.log('Checking "tournaments" table...');
    const { data: tournaments, error: tourError } = await supabase
        .from('tournaments')
        .select('*')
        .limit(1);

    if (tourError) {
        report.push(`[ERROR] Could not query 'tournaments': ${tourError.message}`);
    } else {
        const columns = tournaments.length > 0 ? Object.keys(tournaments[0]) : 'No rows found (cannot verify columns)';
        report.push(`[INFO] 'tournaments' columns accessible: ${JSON.stringify(columns)}`);

        // Check for specific columns used in FIX_ROBUST.sql
        const required = ['status', 'start_date', 'participants_count'];
        if (Array.isArray(columns)) {
            const missing = required.filter(c => !columns.includes(c));
            if (missing.length > 0) {
                report.push(`[CRITICAL] Missing columns in 'tournaments': ${missing.join(', ')}`);
            } else {
                report.push(`[PASS] All required 'tournaments' columns present.`);
            }
        }
    }

    // 2. Check Debates Table
    console.log('Checking "debates" table...');
    const { data: debates, error: debError } = await supabase
        .from('debates')
        .select('*')
        .limit(1);

    if (debError) {
        report.push(`[ERROR] Could not query 'debates': ${debError.message}`);
    } else {
        const columns = debates.length > 0 ? Object.keys(debates[0]) : 'No rows found (cannot verify columns)';
        report.push(`[INFO] 'debates' columns accessible: ${JSON.stringify(columns)}`);
        // Check for specific columns used in FIX_ROBUST.sql
        const required = ['winner_wallet', 'round', 'initiator_score'];
        if (Array.isArray(columns)) {
            const missing = required.filter(c => !columns.includes(c));
            if (missing.length > 0) {
                report.push(`[CRITICAL] Missing columns in 'debates': ${missing.join(', ')}`);
            } else {
                report.push(`[PASS] All required 'debates' columns present.`);
            }
        }
    }

    // 3. Check Tournament Participants Table if it exists
    console.log('Checking "tournament_participants" table...');
    const { data: parts, error: partError } = await supabase
        .from('tournament_participants')
        .select('*')
        .limit(1);

    if (partError) {
        report.push(`[WARN] Could not query 'tournament_participants': ${partError.message}`);
    } else {
        report.push(`[PASS] 'tournament_participants' table exists and is accessible.`);
    }

    // Write report
    const output = report.join('\n');
    fs.writeFileSync('schema_verification_output.txt', output);
    console.log('Verification complete. Output written to schema_verification_output.txt');
}

verifySchema();
