
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    const outputFile = path.join(process.cwd(), 'migration_verification_output.txt');
    let output = 'Schema Verification Report\n==========================\n';

    console.log('Verifying agent_sessions table...');
    output += 'Checking table: agent_sessions\n';

    // 1. Check if table exists by selecting a known column (id)
    const { data: tableCheck, error: tableError } = await supabase
        .from('agent_sessions')
        .select('id')
        .limit(1);

    if (tableError) {
        output += `❌ Error accessing agent_sessions: ${tableError.message}\n`;
        output += `details: ${tableError.details}\n`;
        output += `hint: ${tableError.hint}\n`;
        output += `code: ${tableError.code}\n`;
    } else {
        output += '✅ Table agent_sessions exists and is accessible.\n';

        // 2. Check if active_game_state column exists
        console.log('Checking for active_game_state column...');
        const { data: colCheck, error: colError } = await supabase
            .from('agent_sessions')
            .select('active_game_state')
            .limit(1);

        if (colError) {
            // We EXPECT an error if the column doesn't exist yet
            output += `ℹ️ Column check result: ${colError.message}\n`;
            if (colError.code === 'PGRST301' || colError.message.includes('does not exist')) {
                output += '✅ Column active_game_state does NOT exist. Migration is safe to apply.\n';
            } else {
                output += `⚠️ Unexpected error checking column: ${colError.code} - ${colError.message}\n`;
            }
        } else {
            output += '⚠️ Column active_game_state ALREADY EXISTS.\n';
            output += 'Migration might fail or be redundant.\n';
        }
    }

    // 3. Dump current structure sample if possible (using empty select to get error with hints or just * to see keys)
    const { data: sampleData, error: sampleError } = await supabase
        .from('agent_sessions')
        .select('*')
        .limit(1);

    if (sampleData && sampleData.length > 0) {
        output += '\nCurrent Columns in agent_sessions (from sample row):\n';
        output += Object.keys(sampleData[0]).join(', ') + '\n';
    }

    fs.writeFileSync(outputFile, output);
    console.log(`Verification complete. Output written to ${outputFile}`);
}

verifySchema();
