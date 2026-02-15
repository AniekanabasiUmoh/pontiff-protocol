
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables manually
const envFile = fs.readFileSync('apps/web/.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFixes() {
    console.log('Applying FIX_ROBUST logic (Reuse Tourn + Reuse Debate)...');

    // CONSTANTS
    const TOURNAMENT_ID = 'ad745983-f809-4cf3-8122-18c971489a06'; // Reuse existing
    const REUSED_DEBATE_ID = '578d9aa2-e73e-4f78-8f56-c5f799dc04fe'; // Reuse Index 19

    // 1. Reset Reused Debate for Minting Test
    console.log(`1. Updating Debate ${REUSED_DEBATE_ID}...`);
    const { error: debateError } = await supabase
        .from('debates')
        .update({
            status: 'completed',
            winner_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            // nft_token_id: null, // Column missing from schema cache, ignored
            topic: 'Robust Reuse Debate'
        })
        .eq('id', REUSED_DEBATE_ID);

    if (debateError) console.error('Error updating debate:', debateError);
    else {
        // Verify the update took effect
        const { data: verifyDebate } = await supabase
            .from('debates')
            .select('id, status, winner_wallet')
            .eq('id', REUSED_DEBATE_ID)
            .single();
        console.log('Debate Verification:', JSON.stringify(verifyDebate, null, 2));
    }

    // 2. Fix Start Tournament
    console.log(`2. Updating Tournament ${TOURNAMENT_ID}...`);

    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 2); // 2 hours from now

    // UPDATE existing tournament
    const { data: tournaments, error: tourError } = await supabase
        .from('tournaments')
        .update({
            status: 'pending',
            current_participants: 2,
            start_date: startDate.toISOString(),
            max_participants: 16,
            name: 'Robust Reuse Tournament',
            tournament_type: 'mock',
            entry_fee: '1000000000000000000',
            prize_pool: '2000000000000000000'
        })
        .eq('id', TOURNAMENT_ID)
        .select();

    if (tourError) console.error('Error updating tournaments:', tourError);
    else console.log(`Updated tournament. Rows: ${tournaments?.length || 0}`);

    // Clear old registrations
    console.log('3. clearing old registrations...');
    await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', TOURNAMENT_ID);

    // Insert new registrations
    console.log('4. Seeding valid registrations...');
    const { error: regError } = await supabase
        .from('tournament_registrations')
        .insert([
            {
                tournament_id: TOURNAMENT_ID,
                wallet_address: '0x1111111111111111111111111111111111111111',
                entry_paid: '10',
                seed_number: 1
            },
            {
                tournament_id: TOURNAMENT_ID,
                wallet_address: '0x2222222222222222222222222222222222222222',
                entry_paid: '10',
                seed_number: 2
            }
        ]);

    if (regError) console.error('Error seeding registrations:', regError);

    // 4. Fix Judge Debate
    console.log('5. Resetting Judge Debate state...');
    const { error: judgeError } = await supabase
        .from('debates')
        .update({
            status: 'voting',
            winner_wallet: null,
            metadata: null
        })
        .eq('id', '11111111-1111-1111-1111-111111111111');

    if (judgeError) console.error('Error resetting judge debate:', judgeError);

    console.log('Fixes applied successfully.');
}

applyFixes();
