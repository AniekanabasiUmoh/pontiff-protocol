-- =====================================================
-- FIX FINAL 4 TEST FAILURES (SCHEMA VERIFIED v3)
-- Target: Revenue Analytics, Debates, Matches, Tournaments
-- =====================================================

-- 1. FIX JUDGE DEBATE (404 Error)
-- Ensure specific debate exists in 'Voting' state so it can be judged
-- Column corrections based on schema check:
-- - competitor_id -> competitor_agent_id
-- - title, topic -> metadata
-- - round -> removed
-- - created_at, updated_at -> started_at, last_exchange_at
-- - exchanges -> integer
INSERT INTO debates (
    id,
    competitor_agent_id,
    status,
    exchanges,
    started_at,
    last_exchange_at,
    winner_wallet,
    metadata
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666666',
    'Voting',
    5,
    NOW(),
    NOW(),
    NULL,
    '{"title": "Test Debate", "topic": "Is code law?"}'::jsonb
) ON CONFLICT (id) DO UPDATE 
    SET status = 'Voting', 
        winner_wallet = NULL,
        exchanges = 5;

-- 2. FIX REGISTER TOURNAMENT (400/404 Error)
-- MUST INSERT TOURNAMENT *BEFORE* REFERENCING IT IN MATCHES
-- Logic requires status = 'pending' for both Register and Start endpoints.
-- Start endpoint also requires >= 2 participants.
-- We seed the tournament as 'pending' and add 1 registration so the test adding the 2nd one allows 'Start' to succeed.
INSERT INTO tournaments (
    id,
    name,
    entry_fee,
    prize_pool,
    start_date,
    end_date,
    status,
    max_participants,
    created_at,
    current_participants
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Immediate Tournament',
    '100',
    '10000',
    NOW() + INTERVAL '1 hour',
    NOW() + INTERVAL '7 days',
    'pending', -- MUST be pending for registration/start
    16,
    NOW(),
    1 -- Pre-seeded participant
) ON CONFLICT (id) DO UPDATE 
    SET status = 'pending',
        start_date = NOW() + INTERVAL '1 hour',
        current_participants = 1;

-- Seed 1 participant so test adding 2nd makes it 2 for Start
-- Corrected columns based on schema dump v3 (removed agent_name, etc.)
INSERT INTO tournament_registrations (
    tournament_id,
    wallet_address,
    entry_paid,
    seed_number
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '0x0000000000000000000000000000000000000000', -- Dummy address
    '100',
    1
) ON CONFLICT DO NOTHING;

-- 3. FIX GET RESULTS & RECORD MATCH (404 Error)
-- NOW safe to insert match/bracket referencing tournament '2222...'
-- CRITICAL: Use tournament_brackets (not matches) - API queries this table
-- CRITICAL: id must be UUID type, not string
INSERT INTO tournament_brackets (
    id,
    tournament_id,
    bracket_number,
    round_number,
    player1_wallet,
    player2_wallet,
    winner_wallet,
    status
) VALUES (
    '55555555-5555-5555-5555-555555555555', -- Valid UUID for Record Match test
    '22222222-2222-2222-2222-222222222222',
    1,
    1, -- Round 1 = Finals
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    '0x0000000000000000000000000000000000000000',
    NULL, -- Test will set winner via Record Match API
    'pending'
) ON CONFLICT (id) DO UPDATE SET 
    status = 'pending', 
    winner_wallet = NULL,
    player1_wallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

-- Also keep Get Results match (different ID)
INSERT INTO tournament_brackets (
    id,
    tournament_id,
    bracket_number,
    round_number,
    player1_wallet,
    player2_wallet,
    winner_wallet,
    status
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    2,
    1,
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    '0x0000000000000000000000000000000000000000',
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', -- Winner set for Get Results
    'completed'
) ON CONFLICT (id) DO UPDATE SET 
    status = 'completed',
    winner_wallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

-- 4. FIX NFT MINT & TWITTER TESTS (404/400 Errors)
-- Seed Competitor Agent for Twitter Challenge Test (Test #17)
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

-- Seed Debate for NFT Mint Test (Test #16)
INSERT INTO debates (
    id,
    competitor_agent_id,
    status,
    exchanges,
    started_at,
    last_exchange_at,
    winner_wallet,
    metadata
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '66666666-6666-6666-6666-666666666666',
    'Completed', -- Must be completed to mint NFT
    10,
    NOW() - INTERVAL '1 day',
    NOW(),
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', -- Winner is our wallet
    '{"title": "NFT Mint Debate", "topic": "Digital Indulgence"}'::jsonb
) ON CONFLICT (id) DO UPDATE 
    SET status = 'Completed',
        winner_wallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

-- 5. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';

SELECT 'Final 4 + NFT/Twitter fixes applied (Ordered & Verified)' as result;
