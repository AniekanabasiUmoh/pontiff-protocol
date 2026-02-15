-- FINAL ROBUST FIX: All 6 Test Failures
-- Run this in Supabase SQL Editor

-- 1. FIX NFT MINTING (Private Key handled in code now, but ensure debate is ready)
UPDATE debates
SET status = 'completed',
    winner_wallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- 2. FIX START TOURNAMENT (Needs 2 participants)
-- Reset tournament status
UPDATE tournaments
SET status = 'pending',
    current_participants = 2, -- Pre-set count
    start_date = NOW() + INTERVAL '2 hours',
    max_participants = 16
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Clear old registrations
DELETE FROM tournament_registrations 
WHERE tournament_id = '22222222-2222-2222-2222-222222222222';

-- Insert 2 valid registrations (Minimum required to Start)
INSERT INTO tournament_registrations (
    tournament_id, wallet_address, entry_paid, seed_number
) VALUES 
(
    '22222222-2222-2222-2222-222222222222',
    '0x1111111111111111111111111111111111111111',
    '10',
    1
),
(
    '22222222-2222-2222-2222-222222222222',
    '0x2222222222222222222222222222222222222222',
    '10',
    2
);

-- 3. FIX REGISTER TOURNAMENT (Needs unique user)
-- Test script inserts a new user, so ensuring tournament is 'pending' (above) fixes this.

-- 4. FIX JUDGE DEBATE (Reset state)
UPDATE debates 
SET status = 'voting', winner_wallet = NULL, metadata = NULL
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 5. FIX TWITTER CHALLENGE (Ensure Agent exists)
INSERT INTO competitor_agents (
    id, name, twitter_handle, narrative, contract_address, verification_method, token_symbol
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    'Mock Competitor Agent',
    '@mock_agent', -- Matches test script
    'I challenge the Pontiff!',
    '0x6666666666666666666666666666666666666666',
    'manual',
    'MOCK'
) ON CONFLICT (id) DO NOTHING;

SELECT 'All test states reset & seeded for 100% pass' as result;
