
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const targetSessionId = 'be0afc07-ff41-4c43-9236-e3a3cadb44d6';
    console.log(`\n--- Debugging Session ${targetSessionId} ---`);

    // 1. Fetch Target Session
    const { data: session } = await supabase
        .from('agent_sessions')
        .select('id, user_wallet, games_played')
        .eq('id', targetSessionId)
        .single();

    if (!session) {
        console.error("❌ Session NOT FOUND.");
        return;
    }

    console.log("Found Session:", JSON.stringify(session, null, 2));

    const wallet = session.user_wallet;
    console.log(`\nQuerying for wallet: '${wallet}'`);

    // 2. Query by Wallet
    const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('id, games_played')
        .eq('user_wallet', wallet);

    console.log(`Found ${sessions?.length} sessions for this wallet.`);
    if (sessions) {
        sessions.forEach(s => {
            console.log(`ID: ${s.id} | Games: ${s.games_played}`);
        });
    }

    // 3. Query by Lowercase Wallet (Simulation of API)
    const walletLower = wallet.toLowerCase();
    if (wallet !== walletLower) {
        console.log(`\nQuerying for LOWERCASE wallet: '${walletLower}'`);
        const { data: sessionsLower } = await supabase
            .from('agent_sessions')
            .select('id')
            .eq('user_wallet', walletLower);
        console.log(`Found ${sessionsLower?.length} sessions for lowercase wallet.`);
    } else {
        console.log("\nWallet is already lowercase.");
    }
}

main();
