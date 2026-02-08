import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabase } from '../lib/db/supabase';

async function inspectTable() {
    console.log("Inspecting 'confessions' table...");
    try {
        const { data, error } = await supabase
            .from('confessions')
            .select('*')
            .limit(1);

        if (error) {
            console.error("Query Error:", JSON.stringify(error, null, 2));
        } else {
            if (data && data.length > 0) {
                console.log("Success. Keys:", Object.keys(data[0]));
            } else {
                console.log("Success. Table exists but is empty. Cannot determine keys from data.");
                // Try inserting a dummy row to fail on missing column if needed, or just rely on error
            }
        }
    } catch (e: any) {
        console.error("Exception:", e.message);
    }
}

inspectTable().catch(e => console.error("Unhandled:", e));
