import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !supabaseServiceKey)) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

// Prefer service key for inspection if available
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey!);

async function inspectSchema() {
    console.log('Inspecting debates table schema...');

    // 1. Try to fetch a single record to see the structure of returned data
    const { data, error } = await supabase
        .from('debates')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching debates:', error);
    } else {
        console.log('--- Sample Record ---');
        console.log(JSON.stringify(data, null, 2));
    }

    // 2. Try to query information_schema if possible (often requires higher privileges)
    /*
     * Note: information_schema access might be restricted for anon/service role depending on RLS.
     * We'll try to use a stored procedure or direct query if available, but standard client
     * doesn't support raw SQL easily without rpc.
     * So we generally rely on the returned data structure or error messages.
     */

    console.log('\n--- Inspection Complete ---');
}

inspectSchema();
