
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') }); // Adjust path to root .env if needed
// Actually, apps/web usually has .env.local or .env
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in environment');
    process.exit(1);
}

async function inspectSchema() {
    console.log(`Inspecting Schema at: ${SUPABASE_URL}`);

    try {
        // Fetch OpenAPI spec from PostgREST root
        const response = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
        }

        const schema = await response.json();

        // Filter definitions to just table names and properties
        const tables: Record<string, any> = {};
        if (schema.definitions) {
            for (const [key, value] of Object.entries(schema.definitions)) {
                if (typeof value === 'object' && value !== null && 'properties' in value) {
                    tables[key] = (value as any).properties;
                }
            }
        }

        const outputPath = path.join(__dirname, '../schema_snapshot.json');
        fs.writeFileSync(outputPath, JSON.stringify(tables, null, 2));
        console.log(`Schema snapshot saved to ${outputPath}`);

    } catch (error) {
        console.error('Error inspecting schema:', error);
    }
}

inspectSchema();
