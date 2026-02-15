import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

async function inspect() {
    // Inspect specific wallet if possible, or latest
    const targetWalletPartial = "be0afc07"; // Agent ID prefix
    console.log(`Inspecting session ending in ${targetWalletPartial} or latest...`);

    // Fetch all recent and filter manually since we only have partial
    const { data, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);


    if (error) {
        console.error('Error fetching session:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No sessions found.');
        return;
    }

    const session = data.find(s => s.session_wallet && s.session_wallet.toLowerCase().endsWith(targetWalletPartial)) || data[0];

    if (session.session_wallet && !session.session_wallet.toLowerCase().endsWith(targetWalletPartial)) {
        console.log('⚠️ Warning: specific wallet not found, showing latest instead.');
    }
    console.log('Latest Session:', JSON.stringify({
        id: session.id,
        status: session.status,
        user_wallet: session.user_wallet,
        session_wallet: session.session_wallet,
        balance: session.current_balance,
        stop_loss: session.stop_loss,
        games_played: session.games_played,
        created_at: session.created_at
    }, null, 2));

    // Also check game_history for this session
    const { data: history, error: historyError } = await supabase
        .from('game_history')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(5);

    if (historyError) {
        console.error('Error fetching history:', historyError);
    } else {
        console.log(`Found ${history.length} games in history.`);
        history.forEach(h => {
            console.log(`- Game: ${h.game_type}, Result: ${h.result}, PnL: ${h.profit_loss}`);
        });
    }
}

inspect();
