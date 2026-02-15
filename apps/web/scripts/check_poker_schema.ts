
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking schema for table: poker_hands...');

    // 1. Check if table exists and get columns
    const { data: columns, error } = await supabase
        .rpc('get_schema_info', { table_name: 'poker_hands' }); // Try RPC first if it exists? No, generic query is better.

    // Alternative: Query standard supabase-js .from() ... wait, we can't query info_schema easily with js client unless raw sql or rpc.
    // We can try to just select * from poker_hands limit 0 to see if it errors or just check general existence.

    // Better: Use the established pattern if any? 
    // Let's try to just SELECT * from information_schema.columns where table_name = 'poker_hands'
    // But supabase-js client restricts access to system tables usually.

    // Workaround: We will interpret the error from a failed select or assume we can't easily see schema without psql.
    // BUT the user specifically said "query Supabase REST API to get actual database schema".
    // Maybe they imply using the PostgREST introspection endpoint? 
    // `GET /` on the API URL usually returns the OpenAPI spec.

    // Let's try to fetch the OpenAPI spec from the Supabase REST URL.
    try {
        const restUrl = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;
        console.log('Fetching OpenAPI spec from: ' + supabaseUrl);
        const response = await fetch(restUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
        }
        const schema = await response.json();

        const pokerTable = schema.definitions && schema.definitions['poker_hands'];

        let output = '';
        if (pokerTable) {
            output += "Table 'poker_hands' EXISTS.\n";
            output += "Columns:\n";
            for (const prop in pokerTable.properties) {
                output += ` - ${prop}: ${pokerTable.properties[prop].type} (${pokerTable.properties[prop].format || ''})\n`;
            }
        } else {
            output += "Table 'poker_hands' does NOT exist in the exposed API schema.\n";
            // It might exist but not be exposed, or truly not exist.
        }

        console.log(output);
        fs.writeFileSync('schema_debug_output.txt', output);

    } catch (e: any) {
        console.error('Error fetching schema:', e);
        fs.writeFileSync('schema_debug_output.txt', `Error: ${e.message}`);
    }
}

checkSchema();
