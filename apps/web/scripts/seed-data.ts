
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🌱 Seeding Database via HTTPS...');

    // 1. Leaderboard (Sinners)
    const sinners = Array.from({ length: 10 }).map((_, i) => ({
        id: uuidv4(),
        walletAddress: `0xSinner${i}000000000000000000`, // Must be unique
        category: 'Sinner',
        score: 1000 - (i * 100),
        metadata: { title: 'Heretic' },
        lastUpdated: new Date().toISOString()
    }));

    // Upsert Sinners
    const { error: lbError } = await supabase
        .from('leaderboard_entries')
        .upsert(sinners, { onConflict: 'walletAddress' });

    if (lbError) console.error('Error seeding Leaderboard:', lbError);
    else console.log('✅ Seeded 10 Sinners to Leaderboard');

    // 2. Games
    const games = Array.from({ length: 5 }).map((_, i) => ({
        id: uuidv4(),
        player1: `0xPlayer${i}`,
        player2: 'ThePontiff',
        gameType: i % 2 === 0 ? 'RPS' : 'Poker',
        wager: '1000000000000000000', // 1 ETH
        status: 'active',
        createdAt: new Date().toISOString()
    }));

    const { error: gameError } = await supabase.from('games').insert(games);
    if (gameError) console.error('Error seeding Games:', gameError);
    else console.log('✅ Seeded 5 Active Games');

    // 3. Confessions
    const confessions = Array.from({ length: 20 }).map((_, i) => ({
        id: uuidv4(),
        walletAddress: `0xSinner${i}`,
        sins: ['Greed', 'Sloth'],
        roast: 'You are unworthy.',
        indulgencePrice: '500',
        status: 'Sinner',
        timestamp: new Date().toISOString()
    }));

    const { error: confError } = await supabase.from('confessions').insert(confessions);
    if (confError) console.error('Error seeding Confessions:', confError);
    else console.log('✅ Seeded 20 Confessions');

    // 4. World Events (Betrayal Stats)
    const events = [
        ...Array.from({ length: 15 }).map(() => ({ eventType: 'betray' })),
        ...Array.from({ length: 85 }).map(() => ({ eventType: 'stake' }))
    ].map(e => ({
        id: uuidv4(),
        agentWallet: `0xAgent${Math.floor(Math.random() * 100)}`,
        eventType: e.eventType,
        eventData: {},
        timestamp: new Date().toISOString()
    }));

    const { error: eventError } = await supabase.from('world_events').insert(events);
    if (eventError) console.error('Error seeding WorldEvents:', eventError);
    else console.log('✅ Seeded 100 WorldEvents');

    console.log('🌱 Seeding Complete!');
}

main();
