import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import personalities from './bot-personalities.json';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WALLETS_FILE = path.join(__dirname, 'wallets.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Session wallets created successfully (from spawn output)
const successfulSessions = [
    { bot: "Iron Beard", sessionWallet: "0xD0e5d3d3D2c40b41fa3B7d9A2366b35a5FeC79eB" },
    { bot: "Greedy Guts", sessionWallet: "0x7De68f437dF236889b0BC33ad11708e8405a5BB0" },
    { bot: "Saint Peter", sessionWallet: "0xEA3817D46569a07a2D3F209ff5d1640dD667507f" },
    { bot: "Mad Max", sessionWallet: "0xd29cFDc470aE2d02b872c3e01E4f12a426A13Aa3" },
    { bot: "Thrifty Theo", sessionWallet: "0x2931BEe8E2017f1Be06636B73029631Bb837a103" },
    { bot: "Faithful Fred", sessionWallet: "0xDE0d16d4dd507a60Cd1cC1130662d9B66DDDbE2d" },
    { bot: "Chaos Carl", sessionWallet: "0x70aeF32cF165B7DdC9E3fa729c13732F973D1B6D" },
    { bot: "Penny Pincher", sessionWallet: "0x5bC9AfFb6b2cae032B36651B2edFb4DCA3Fc5f08" },
    { bot: "Holy Roller", sessionWallet: "0x1e2d94fb244ed64e6A43aA8B8Ea64F1aFd7f48D5" },
    { bot: "Rage Quit", sessionWallet: "0x7D8f3b9cA7f749e4af1A822C5d704C7e1501c40a" },
    { bot: "Market Maker", sessionWallet: "0x6D842497Ed91FB325D9501dbd503dE561876F5Bb" },
    { bot: "The Believer", sessionWallet: "0x38C83516BE008395633A21e9258c959Ae15359c6" },
    { bot: "Smash Bros", sessionWallet: "0xC5996d4b0C4FEB6431A031Ad314b9327819792C6" },
    { bot: "Coin Keeper", sessionWallet: "0x4067acAAD406baE56B8723F4423BC99B509eBB8c" }
];

async function main() {
    console.log("🔧 FIXING DATABASE SETUP");
    console.log("========================\n");

    const wallets: Record<string, any> = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));

    // Step 1: Create the table (run migration SQL)
    console.log("Step 1: Creating agent_sessions table...");

    const createTableSQL = `
-- Create agent_sessions table
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    session_wallet TEXT NOT NULL,
    strategy TEXT NOT NULL,
    starting_balance NUMERIC,
    current_balance NUMERIC,
    stop_loss NUMERIC,
    take_profit NUMERIC,
    status TEXT DEFAULT 'active',
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_wallet ON agent_sessions(user_wallet);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session_wallet ON agent_sessions(session_wallet);
`;

    try {
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

        if (sqlError) {
            console.log("⚠️  RPC method not available, trying alternative...");
            console.log("Please run this SQL manually in Supabase SQL Editor:");
            console.log("----------------------------------------");
            console.log(createTableSQL);
            console.log("----------------------------------------\n");
        } else {
            console.log("✅ Table created successfully\n");
        }
    } catch (error: any) {
        console.log("⚠️  Could not execute SQL via RPC");
        console.log("Please create the table manually using the migration file:");
        console.log("  supabase/migrations/20260208000000_add_agent_sessions.sql\n");
    }

    // Step 2: Insert the 14 successful sessions
    console.log("Step 2: Inserting 14 successful sessions...\n");

    const duration = 24; // hours
    const expiresAt = new Date(Date.now() + duration * 3600 * 1000);

    let inserted = 0;
    let failed = 0;

    for (const session of successfulSessions) {
        const botData = personalities.find(p => p.name === session.bot);
        if (!botData) {
            console.error(`❌ Bot data not found for ${session.bot}`);
            failed++;
            continue;
        }

        const walletData = wallets[session.bot];
        if (!walletData) {
            console.error(`❌ Wallet not found for ${session.bot}`);
            failed++;
            continue;
        }

        try {
            const { data, error } = await supabase
                .from('agent_sessions')
                .insert({
                    user_wallet: walletData.address,
                    session_wallet: session.sessionWallet,
                    strategy: botData.strategy,
                    starting_balance: botData.initialDeposit,
                    current_balance: botData.initialDeposit,
                    stop_loss: botData.initialDeposit * 0.1, // 10% of deposit
                    take_profit: botData.initialDeposit * 2, // 2x deposit
                    status: 'active',
                    expires_at: expiresAt.toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error(`❌ ${session.bot}: ${error.message}`);
                failed++;
            } else {
                console.log(`✅ ${session.bot}: Session ${data.id} inserted`);
                inserted++;
            }
        } catch (error: any) {
            console.error(`❌ ${session.bot}: ${error.message}`);
            failed++;
        }
    }

    console.log("\n========================");
    console.log("📊 SUMMARY");
    console.log("========================");
    console.log(`✅ Inserted: ${inserted}/14`);
    console.log(`❌ Failed: ${failed}/14`);
    console.log("");

    if (inserted === 14) {
        console.log("🎉 ALL SESSIONS INSERTED!");
        console.log("✅ Bot swarm ready to start playing");
        console.log("");
        console.log("Next step: Start the agent manager service");
        console.log("  npm run agent-manager");
    } else {
        console.log("⚠️  Some sessions failed to insert");
        console.log("Check if the agent_sessions table exists in Supabase");
    }
}

main().catch(console.error);
