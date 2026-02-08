import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function migrate() {
    console.log("Starting Direct Migration...");

    // Force Direct Connection (Port 5432) for Schema Changes
    const dbUrl = process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(':6543', ':5432')
        : '';

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false } // Required for Supabase/AWS
    });

    try {
        await client.connect();
        console.log("Connected to DB.");

        const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260207173500_add_roast_and_sins.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Executing SQL from ${sqlPath}:`);
        console.log(sql);

        await client.query(sql);
        console.log("✅ Migration applied successfully.");

    } catch (err: any) {
        console.error("❌ Migration Failed:", err.message);
    } finally {
        await client.end();
    }
}

migrate();
