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

    // Fetch from information_schema
    // Note: Supabase exposes this via PostgREST if configured, but default setup might block it.
    // However, we can use an RPC function if one exists, OR just try to select from information_schema.columns
    // The previous script failed because it tried `client.from(table)` which only gets rows.

    // Attempt 1: Query information_schema.columns
    // This requires that the user has exposed this schema or we are using service role key (which we are).
    // Let's try to query it directly.

    try {
        const { data, error } = await supabase
            .from('information_schema.columns')
            .select('table_name, column_name, data_type, is_nullable, column_default')
            .in('table_name', tables)
            .order('table_name', { ascending: true });

        if (error) {
            console.error('Error querying information_schema:', error);
            report += `Error querying information_schema: ${error.message}\n`;
            report += `Falling back to row sampling...\n\n`;

            // Fallback: Infer from rows
            for (const table of tables) {
                console.log(`Fetching sample for table: ${table}`);
                const { data: rows, error: rowError } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (rowError) {
                    report += `Error fetching table ${table}: ${rowError.message}\n`;
                } else if (rows && rows.length > 0) {
                    const sample = rows[0];
                    report += `--- Table: ${table} (Inferred from sample) ---\n`;
                    Object.keys(sample).forEach(key => {
                        const val = sample[key];
                        const type = val === null ? 'unknown (null)' : typeof val;
                        report += `  - ${key}: ${type} (Example: ${val})\n`;
                    });
                } else {
                    report += `--- Table: ${table} ---\n`;
                    report += `Table exists but is empty. Cannot infer schema from rows.\n`;
                }
                report += '\n';
            }

        } else if (data) {
            console.log(`Successfully queried information_schema. Found ${data.length} columns.`);
            let currentTable = '';
            for (const col of data) {
                if (col.table_name !== currentTable) {
                    currentTable = col.table_name;
                    report += `--- Table: ${currentTable} ---\n`;
                }
                report += `  - ${col.column_name}: ${col.data_type} (Nullable: ${col.is_nullable}, Default: ${col.column_default})\n`;
            }
        }

    } catch (e) {
        console.error('Exception during schema inspection:', e);
        report += `Exception: ${e}\n`;
    }

    fs.writeFileSync('schema_inspection_v2.txt', report);
    console.log('Report saved to schema_inspection_v2.txt');
}

inspectSchema();
