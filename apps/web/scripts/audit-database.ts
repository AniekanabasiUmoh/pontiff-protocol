import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditDatabase() {
    console.log('🔍 Querying live database schema...\n');

    const output: string[] = [];

    // Check agent_sessions table structure
    output.push('=== AGENT_SESSIONS TABLE ===');
    const { data: agentSessions, error: asError } = await supabase
        .from('agent_sessions')
        .select('*')
        .limit(1);

    if (asError) {
        output.push(`❌ Error: ${asError.message}`);
    } else if (agentSessions && agentSessions.length > 0) {
        output.push('✅ Table exists');
        output.push('Columns: ' + Object.keys(agentSessions[0]).join(', '));
    } else {
        output.push('⚠️ Table exists but is empty');
    }

    // Check game_history table
    output.push('\n=== GAME_HISTORY TABLE ===');
    const { data: gameHistory, error: ghError } = await supabase
        .from('game_history')
        .select('*')
        .limit(1);

    if (ghError) {
        output.push(`❌ Error: ${ghError.message}`);
        output.push('Table likely does NOT exist');
    } else {
        output.push('✅ Table exists');
        if (gameHistory && gameHistory.length > 0) {
            output.push('Columns: ' + Object.keys(gameHistory[0]).join(', '));
        } else {
            output.push('Table is empty');
        }
    }

    // Check matchmaking_queue table
    output.push('\n=== MATCHMAKING_QUEUE TABLE ===');
    const { data: matchQueue, error: mqError } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .limit(1);

    if (mqError) {
        output.push(`❌ Error: ${mqError.message}`);
        output.push('Table likely does NOT exist');
    } else {
        output.push('✅ Table exists');
    }

    // Check agent_escrow table
    output.push('\n=== AGENT_ESCROW TABLE ===');
    const { data: escrow, error: escrowError } = await supabase
        .from('agent_escrow')
        .select('*')
        .limit(1);

    if (escrowError) {
        output.push(`❌ Error: ${escrowError.message}`);
        output.push('Table likely does NOT exist');
    } else {
        output.push('✅ Table exists');
    }

    // Check pvp_matches table
    output.push('\n=== PVP_MATCHES TABLE ===');
    const { data: pvpMatches, error: pvpError } = await supabase
        .from('pvp_matches')
        .select('*')
        .limit(1);

    if (pvpError) {
        output.push(`❌ Error: ${pvpError.message}`);
        output.push('Table likely does NOT exist');
    } else {
        output.push('✅ Table exists');
    }

    // Sample agent session to see actual data
    output.push('\n=== SAMPLE AGENT SESSION ===');
    const { data: sampleAgent } = await supabase
        .from('agent_sessions')
        .select('*')
        .limit(1)
        .single();

    if (sampleAgent) {
        output.push(JSON.stringify(sampleAgent, null, 2));
    }

    const result = output.join('\n');
    console.log(result);

    // Write to file
    fs.writeFileSync(
        path.resolve(__dirname, '../DB_SCHEMA_AUDIT.txt'),
        result
    );

    console.log('\n✅ Output written to DB_SCHEMA_AUDIT.txt');
}

auditDatabase().catch(console.error);
