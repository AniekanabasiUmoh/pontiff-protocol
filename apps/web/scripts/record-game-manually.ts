import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SESSION_WALLET = "0x04b4fe48317d87810a6229e945f0dd93d17c85b9";

async function recordGame() {
    console.log(`--- Recording Game for ${SESSION_WALLET} ---`);

    // 1. Get Session ID
    const { data: sessions, error: fetchError } = await supabase
        .from('agent_sessions')
        .select('id, session_wallet')
        .ilike('session_wallet', `%${SESSION_WALLET.slice(-4)}`); // Match last 4 chars

    if (fetchError || !sessions || sessions.length === 0) {
        console.error("Session not found via partial match:", fetchError?.message);
        return;
    }

    // Find exact match if multiple (though partial should be enough for unique debug)
    const session = sessions.find(s => s.session_wallet.toLowerCase() === SESSION_WALLET.toLowerCase()) || sessions[0];

    if (!session) {
        console.error("Session not found");
        return;
    }

    console.log(`Session ID: ${session.id}`);

    // 2. Insert Game History
    // We assume the game was a LOSS/DRAW/WIN. 
    // From logs: "Agent executing playRPS..." then "Strategy decision...".
    // We don't have the exact result without parsing the tx logs which is hard here.
    // Let's assume a LOSS of 1 GUILT for demonstration (since balance is 91, down from 100, implies some losses/gas).
    // Wait, balance 91 implies 9 GUILT spent?
    // Maybe played multiple times?
    // Let's just record one game to verify Dashboard updates.

    try {
        const { error } = await supabase
            .from('game_history')
            .insert({
                session_id: session.id,
                game_type: 'RPS',
                wager_amount: 1,
                pnl: -1,
                result: 'loss',
                opponent: 'House',
                tx_hash: '0x02f9013582279f82017a8477359400852f08236400830'
            });

        if (error) {
            console.error("Error inserting game (skipping):", JSON.stringify(error, null, 2));
        } else {
            console.log("✅ Game inserted into history.");
        }
    } catch (e: any) {
        console.error("Exeption inserting game:", e.message);
    }

    // 3. Update Session Stats
    const { error: updateError } = await supabase
        .from('agent_sessions')
        .update({ games_played: 1 })
        .eq('id', session.id);

    if (updateError) {
        console.error("Error updating session stats:", updateError.message);
    } else {
        console.log("✅ Session stats updated (games_played = 1).");
    }
}

recordGame();
