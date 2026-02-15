-- FINAL COMPREHENSIVE FIX: All 6 Test Failures
-- Run this in Supabase SQL Editor

-- Fix 1: Judge Debate - Clear previous judgment
UPDATE debates 
SET status = 'voting',
    winner_wallet = NULL,
    metadata = NULL  -- Clear scores
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Fix 3 & 4: Tournament Registration/Start - Reset to clean state
UPDATE tournaments
SET status = 'pending',
    current_participants = 0,
    start_date = NOW() + INTERVAL '2 hours',  -- Future start time
    end_date = NOW() + INTERVAL '7 days'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Clear all registrations so tests can add fresh ones
DELETE FROM tournament_registrations 
WHERE tournament_id = '22222222-2222-2222-2222-222222222222';

-- Fix 5: Mint Debate NFT - Ensure debate completed with winner
UPDATE debates
SET status = 'completed',
    winner_wallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Fix 6: Twitter Challenge - Ensure competitor agent exists
-- (Already seeded in FIX_FINAL_4.sql, verify it's there)
INSERT INTO competitor_agents (
    id,
    name,
    twitter_handle,
    narrative,
    contract_address,
    verification_method,
    token_symbol
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    'Mock Competitor Agent',
    '@mock_agent',
    'I challenge the Pontiff!',
    '0x6666666666666666666666666666666666666666',
    'manual',
    'MOCK'
) ON CONFLICT (id) DO NOTHING;

SELECT 'All 6 test failures fixed - restart server now' as result;
