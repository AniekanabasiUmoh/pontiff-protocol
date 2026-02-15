import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role to bypass RLS if that's the issue

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
    console.log("Testing insert into game_history...");

    const dummyGame = {
        session_id: '00000000-0000-0000-0000-000000000000', // invalid FK? might fail if FK constraint exists
        // Actually, let's pick a real session ID if possible, or just try and see the error
        // But to be safe, let's use a random UUID and hope no FK constraint blocks it OR use a known session
        // Let's use the rogue agent's ID: 3973a338-5ae7-4938-8563-87feed8a9e4a
        session_id: '3973a338-5ae7-4938-8563-87feed8a9e4a',
        player_address: '0x0000000000000000000000000000000000000000',
        game_type: 'RPS',
        result: 'win',
        wager_amount: 1,
        profit_loss: 0.95,
        player_move: 1,
        pontiff_move: 3,
        tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };

    console.log("Payload:", dummyGame);

    const { data, error } = await supabase
        .from('game_history')
        .insert(dummyGame)
        .select();

    if (error) {
        console.error("Insert Failed:", error);
    } else {
        console.log("Insert Success:", data);
    }
}

testInsert();
