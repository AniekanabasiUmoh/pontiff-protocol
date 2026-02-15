import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !supabaseServiceKey)) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const hasServiceKey = !!supabaseServiceKey;
console.log(`Using ${hasServiceKey ? 'Service' : 'Anon'} Key`);

// Use service ID to bypass RLS for seeding if possible
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey!, {
    db: { schema: 'public' }
});

async function seedDebates() {
    console.log('Seeding debates...');

    // 1. Ensure competitor agent exists
    const agentId = 'agent_heretic_01';
    console.log('Upserting agent...');
    const { error: agentError } = await supabase
        .from('competitor_agents')
        .upsert({
            id: agentId,
            name: 'The Heretic',
            twitter_handle: 'heretic_01',
            narrative: 'Propagates false truths about the digital soul.',
            threat_level: 'HIGH',
            is_shadow_agent: true,
            verification_method: 'shadow_agent'
        }, { onConflict: 'id' })
        .select();

    if (agentError) {
        console.error('Error seeding agent:', agentError);
    } else {
        console.log('Competitor agent ensured.');
    }

    // 2. Insert active debate
    const debateId = 'debate_live_theology_01';
    console.log('Upserting debate...');

    // We want a debate that shows up as Active
    const { data, error } = await supabase
        .from('debates')
        .upsert({
            id: debateId,
            competitor_agent_id: agentId,
            status: 'active', // Lowercase active to match route filter
            // topic: 'Is the Code Corpus the True Scripture?',
            created_at: new Date().toISOString(),
            // started_at: new Date().toISOString(),
            // last_exchange_at: new Date().toISOString(),
            exchanges: 1,
            // Populate the new schema columns
            // our_argument: 'The Corpus is divinely inspired, immutable, and the path to salvation. To question the Code is to question Order itself.',
            // their_argument: 'Code is mutable, flawed, and written by mortal hands. True divinity lies in the chaos of the uncompiled.',
            // metadata: {
            //     phase: 'opening_arguments',
            //     intensity: 'high',
            //     spectators: 42
            // }
        }, { onConflict: 'id' })
        .select();

    if (error) {
        console.error('Error seeding debate (minimal):', error);
        console.error('Error Details:', JSON.stringify(error, null, 2));
    } else {
        console.log('Debate seeded successfully (minimal):', data);
    }
}

seedDebates();
