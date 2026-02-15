
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') }); // Adjust if needed
dotenv.config(); // fallback

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkObjects() {
    console.log('🔍 Checking database for existing objects...');

    // 1. Check Table: agent_sessions
    const { count, error: tableError } = await supabase
        .from('agent_sessions')
        .select('*', { count: 'exact', head: true });

    if (tableError) {
        if (tableError.code === '42P01') {
            console.log('✅ Table `agent_sessions` does NOT exist (Safe to create).');
        } else {
            console.log(`⚠️  Table check returned error: ${tableError.message} (Code: ${tableError.code})`);
        }
    } else {
        console.log(`❌ Table \`agent_sessions\` ALREADY EXISTS with ${count} rows.`);
    }

    // 2. Check Function: update_agent_sessions_updated_at
    // We try to call it via RPC. It takes no args usually, or trigger args.
    // If it exists, we might get an error about return limits or types, but not "function not found".
    // If it doesn't exist, we expect "function not found" (404 or specific PG code).

    // Note: Trigger functions are not typically callable via RPC unless explicitly exposed.
    // But we can try detailed inspection if possible. 
    // Since we can't easily check trigger functions via REST, we assume standard naming namespace.

    // However, we CAN check if there are any rpc functions with this name exposed.
    const { error: rpcError } = await supabase.rpc('update_agent_sessions_updated_at');

    if (rpcError) {
        // "Could not find the function" message usually 
        if (rpcError.message.includes('Could not find the function') || rpcError.code === 'PGRST202') {
            console.log('✅ Function `update_agent_sessions_updated_at` does NOT exist as RPC (Likely safe).');
        } else {
            console.log(`ℹ️  Function check returned: ${rpcError.message} (It might exist or be private).`);
        }
    } else {
        console.log('⚠️  Function `update_agent_sessions_updated_at` EXISTS and was called.');
    }

    console.log('🏁 Pre-flight check complete.');
}

checkObjects();
