
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const sessionId = 'be0afc07-ff41-4c43-9236-e3a3cadb44d6';
    console.log(`Force updating stats for session ${sessionId}...`);

    const { error: updateError } = await supabase
        .from('agent_sessions')
        .update({
            games_played: 10,
            total_wins: 5,
            profit_loss: "100",
            current_balance: 100,
            status: 'active',
            updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

    if (updateError) {
        console.error("❌ Failed to force update:", updateError);
    } else {
        console.log("✅ Force updated agent_sessions stats.");
    }

    // Verify immediately
    const { data: session } = await supabase
        .from('agent_sessions')
        .select('games_played')
        .eq('id', sessionId)
        .single();

    console.log("Verified games_played:", session?.games_played);
}

main();
