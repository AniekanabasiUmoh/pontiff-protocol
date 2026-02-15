
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log("Updating stop_loss to 0 for latest session...");

    const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('id, current_balance, stop_loss')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !sessions || sessions.length === 0) {
        console.error("Failed to fetch session", error);
        return;
    }

    const session = sessions[0];
    console.log(`Found session ${session.id}. Balance: ${session.current_balance}, Stop Loss: ${session.stop_loss}`);

    const { error: updateError } = await supabase
        .from('agent_sessions')
        .update({ stop_loss: 0 })
        .eq('id', session.id);

    if (updateError) {
        console.error("Failed to update stop_loss", updateError);
    } else {
        console.log("✅ Successfully updated stop_loss to 0.");
    }
}

main();
