
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixApiData() {
    console.log('Fixing API data for tests...');

    // 1. Ensure Conversion exists for Mint NFT test
    const conversionId = '55555555-5555-5555-5555-555555555555';
    const testWallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

    // Check if conversion exists
    const { data: conversion, error: fetchError } = await supabase
        .from('conversions')
        .select('*')
        .eq('id', conversionId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking conversion:', fetchError);
    }

    if (!conversion) {
        console.log('Creating missing conversion record...');
        // We need a valid competitor_agent_id. Let's find one or create a dummy one.
        // For now, let's try to find any existing agent
        const { data: agents } = await supabase.from('competitor_agents').select('id').limit(1);

        let agentId = agents && agents.length > 0 ? agents[0].id : null;

        if (!agentId) {
            console.log('No agents found. Creating a dummy agent...');
            const { data: newAgent, error: agentError } = await supabase
                .from('competitor_agents')
                .insert({
                    name: 'Dummy Agent',
                    personality: 'Neutral',
                    client: 'twitter',
                    model: 'gpt-4',
                    status: 'active',
                    wallet_address: '0x1234567890123456789012345678901234567890'
                })
                .select()
                .single();

            if (agentError) {
                console.error('Failed to create dummy agent:', agentError);
                // Fallback UUID if insert fails (unlikely in test env but possible)
                agentId = '00000000-0000-0000-0000-000000000001';
            } else {
                agentId = newAgent.id;
            }
        }

        const { error: insertError } = await supabase.from('conversions').upsert({
            id: conversionId,
            competitor_agent_id: agentId,
            type: 'voluntary',
            status: 'pending',
            amount: '100', // mocked amount
            recipient: testWallet,
            nft_minted: false
        });

        if (insertError) {
            console.error('Failed to insert conversion:', insertError);
        } else {
            console.log('Conversion record created/updated.');
        }
    } else {
        // Ensure it is not minted
        if (conversion.nft_minted) {
            console.log('Resetting NFT minted status for conversion...');
            const { error: updateError } = await supabase
                .from('conversions')
                .update({ nft_minted: false, nft_token_id: null, nft_tx_hash: null })
                .eq('id', conversionId);

            if (updateError) console.error('Failed to reset conversion:', updateError);
            else console.log('Conversion reset.');
        }
    }

    // 2. Fix Debate Winner for Mint Debate NFT test
    const debateId = '578d9aa2-e73e-4f78-8f56-c5f799dc04fe'; // ID from test script line 206
    // Wait, looking at test-api.ps1 line 206: $DebateId = "578d9aa2-e73e-4f78-8f56-c5f799dc04fe"

    // Check if debate exists
    const { data: debate, error: debateError } = await supabase
        .from('debates')
        .select('*')
        .eq('id', debateId)
        .single();

    if (debateError && debateError.code !== 'PGRST116') {
        console.error('Error checking debate:', debateError);
    }

    if (!debate) {
        console.log('Creating missing debate record...');
        const { error: insertDebateError } = await supabase.from('debates').insert({
            id: debateId,
            topic: 'Test Debate Topic',
            status: 'completed',
            winner_wallet: testWallet,
            // Add other required fields if any. Assuming defaults or nullable
            initiator_id: '00000000-0000-0000-0000-000000000000', // invalid but maybe works for test
            opponent_id: '00000000-0000-0000-0000-000000000000',
            rounds: 1
        });
        if (insertDebateError) console.error('Failed to insert debate:', insertDebateError);
        else console.log('Debate record created.');

    } else {
        // Update winner if missing
        if (debate.winner_wallet !== testWallet) {
            console.log(`Updating debate winner to ${testWallet}...`);
            const { error: updateDebateError } = await supabase
                .from('debates')
                .update({
                    winner_wallet: testWallet,
                    status: 'completed'
                })
                .eq('id', debateId);
            if (updateDebateError) console.error('Failed to update debate winner:', updateDebateError);
            else console.log('Debate winner updated.');
        }

        // Reset NFT status if already minted
        if (debate.nft_token_id) {
            console.log('Resetting NFT minted status for debate...');
            const { error: resetDebateError } = await supabase
                .from('debates')
                .update({ nft_token_id: null, nft_minted_at: null })
                .eq('id', debateId);

            if (resetDebateError) console.error('Failed to reset debate NFT:', resetDebateError);
            else console.log('Debate NFT status reset.');
        }
    }

    console.log('Fix script completed.');
}

fixApiData().catch(console.error);
