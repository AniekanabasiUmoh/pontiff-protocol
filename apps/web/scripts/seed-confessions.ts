
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

const SINS_LIST = [
    "Pride", "Greed", "Lust", "Envy", "Gluttony", "Wrath", "Sloth",
    "Buying high", "Selling low", "FUDing", "Jeet behavior", "Ignoring gas fees",
    "Copying trades", "Rug pulling", "Ignoring audits", "Using leverage", "FOMO"
];

const TEMPLATES = [
    "I have sinned by {sin}.",
    "Forgive me, for I have {sin}.",
    "I confess that I succumbed to {sin}.",
    "The weight of {sin} is heavy on my soul.",
    "I lost everything because of {sin}.",
    "My wallet weeps due to {sin}.",
    "I traded my soul for {sin}.",
    "I ignored the signs and chose {sin}."
];

const ROASTS = [
    "Pathetic.",
    "Your wallet deserves to be empty.",
    "Repent, or be liquidated.",
    "The blockchain never forgets.",
    "A foolish error.",
    "You are NGMI.",
    "Have fun staying poor.",
    "May the gas fees consume you.",
    "Your private keys should be revoked.",
    "Absolute degenerate behavior."
];

function generateConfession() {
    const sin = SINS_LIST[Math.floor(Math.random() * SINS_LIST.length)];
    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const text = template.replace("{sin}", sin.toLowerCase());
    const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    const wallet = `0x${Math.floor(Math.random() * 16777215).toString(16).padEnd(40, '0')}`;

    return {
        id: uuidv4(),
        wallet_address: wallet,
        sins: [sin],
        roast_text: roast,
        stake_amount: (Math.floor(Math.random() * 1000) * 1e18).toString(),
        status: ['Sinner', 'Absolved', 'Excommunicated'][Math.floor(Math.random() * 3)],
        created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)).toISOString() // Last 7 days
    };
}

async function main() {
    console.log('🌱 Seeding 150 Confessions...');

    const confessions = Array.from({ length: 150 }).map(generateConfession);

    // Shuffle
    for (let i = confessions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [confessions[i], confessions[j]] = [confessions[j], confessions[i]];
    }

    // Insert in chunks of 50
    for (let i = 0; i < confessions.length; i += 50) {
        const chunk = confessions.slice(i, i + 50);
        const { error } = await supabase.from('confessions').insert(chunk);

        if (error) {
            console.error(`Error inserting chunk ${i / 50 + 1}:`, error);
        } else {
            console.log(`✅ Chunk ${i / 50 + 1} inserted.`);
        }
    }

    console.log('🎉 Seeding Complete!');
}

main();
