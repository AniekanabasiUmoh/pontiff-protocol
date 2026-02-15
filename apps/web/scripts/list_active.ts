
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    console.log("Listing active sessions...");
    const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('status', 'active');

    if (sessions) {
        sessions.forEach(s => {
            console.log(`Session ${s.id} | Balance: ${s.current_balance} | Games: ${s.games_played} | Created: ${s.created_at}`);
        });
    }
}

main();
