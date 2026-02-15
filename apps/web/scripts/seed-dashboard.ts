
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Adjust if needed
dotenv.config(); // fallback

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const AGENTS = [
    { name: 'The Berzerker', strategy: 'Aggressor', game: 'Poker', winRate: 0.68 },
    { name: 'The Merchant', strategy: 'Calculator', game: 'RPS', winRate: 0.55 },
    { name: 'The Disciple', strategy: 'Preserver', game: 'Judas', winRate: 0.42 },
    { name: 'Shadow Agent', strategy: 'Aggressor', game: 'Poker', winRate: 0.72 },
];

async function seedDashboard() {
    console.log('🌱 Seeding dashboard data...');

    // 1. Clear existing data (optional, but good for testing)
    // await supabase.from('agent_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Be careful with this!

    // 2. Seed Users
    console.log('Creating users...');
    const users = [];
    for (let i = 0; i < 10; i++) {
        const wallet = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        const { data, error } = await supabase.from('users').upsert({
            wallet_address: wallet,
            sin_score: Math.floor(Math.random() * 1000),
            guilt_balance: Math.floor(Math.random() * 50000).toString(),
            last_active: new Date().toISOString()
        }).select().single();

        if (data) users.push(data);
    }

    // 3. Seed Agent Sessions
    console.log('Creating agent sessions...');
    for (const agent of AGENTS) {
        // Create active session
        await supabase.from('agent_sessions').insert({
            user_wallet: users[Math.floor(Math.random() * users.length)].wallet_address,
            session_wallet: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
            strategy: agent.name, // Using name as strategy for simplicity in this schema
            game_type: agent.game,
            status: Math.random() > 0.3 ? 'active' : 'stopped',
            starting_balance: (Math.floor(Math.random() * 5000) + 1000).toString(),
            current_balance: (Math.floor(Math.random() * 8000) + 1000).toString(),
            profit_loss: (Math.floor(Math.random() * 2000) - 500).toString(),
            games_played: Math.floor(Math.random() * 100) + 10,
            total_wins: Math.floor((Math.floor(Math.random() * 100) + 10) * agent.winRate),
            total_losses: Math.floor((Math.floor(Math.random() * 100) + 10) * (1 - agent.winRate)),
            created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString() // Random time in last 24h
        });
    }

    // 4. Seed Treasury Revenue (Vault Reserves)
    console.log('Creating treasury revenue...');
    await supabase.from('treasury_revenue').insert([
        { source: 'Indulgence Sales', amount: '15000', transaction_hash: '0x123...', distributed: false },
        { source: 'Game Fees', amount: '5400', transaction_hash: '0x456...', distributed: false },
        { source: 'Staking Yield', amount: '21000', transaction_hash: '0x789...', distributed: true }
    ]);

    // 5. Seed Indulgences (Net Indulgences)
    console.log('Creating indulgences...');
    for (let i = 0; i < 20; i++) {
        await supabase.from('indulgences').insert({
            wallet_address: users[Math.floor(Math.random() * users.length)]?.wallet_address || '0x000',
            token_id: i.toString(),
            tier: 'Common',
            price_paid: (Math.floor(Math.random() * 100) + 10).toString(),
            tx_hash: `0x${Math.random().toString(16).slice(2)}`,
            purchased_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 2)).toISOString() // Last 48h
        });
    }

    console.log('✅ Seeding complete!');
}

seedDashboard().catch(console.error);
