
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log("Inspecting specific stats for latest session...");

    const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('id, user_wallet, session_wallet, games_played, total_wins, profit_loss, current_balance, status')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!sessions || sessions.length === 0) {
        console.log("No sessions found.");
        return;
    }

    const s = sessions[0];
    console.log("Session ID:", s.id);
    console.log("Session Wallet:", s.session_wallet);
    console.log("User Wallet:", s.user_wallet);
    console.log("Status:", s.status);
    console.log("Games Played:", s.games_played);
    console.log("Total Wins:", s.total_wins);
    console.log("Profit Loss:", s.profit_loss);
    console.log("Balance:", s.current_balance);
    const { count } = await supabase
        .from('game_history')
        .select('*', { count: 'exact', head: true });

    console.log("Game History Count:", count);
}

main();
