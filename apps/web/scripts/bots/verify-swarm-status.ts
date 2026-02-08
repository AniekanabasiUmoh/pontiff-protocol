import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log(`URL: ${SUPABASE_URL}`);
console.log(`KEY Length: ${SUPABASE_KEY ? SUPABASE_KEY.length : 0}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const fs = require('fs');

    // Simplified query
    const { count, error } = await supabase
        .from('agent_sessions')
        .select('*', { count: 'exact', head: true });

    let logOutput = "";
    if (error) {
        logOutput = `DB Error: ${error.message}`;
        console.error(logOutput);
    } else {
        logOutput = `TOTAL_SESSIONS:${count}\n`;
        console.log(logOutput);
        if (count === null) {
            console.log("Count is explicitly null. Trying standard select...");
            const { data } = await supabase.from('agent_sessions').select('id');
            console.log(`Manual Count: ${data?.length}`);
            logOutput += `Manual Count: ${data?.length}`;
        }
    }
    fs.writeFileSync('verification.log', logOutput);
}

main().catch(console.error);
