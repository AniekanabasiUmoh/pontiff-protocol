-- FINAL FIX: Ensure all required test data exists
-- Run this in Supabase SQL Editor

-- 1. Re-seed Competitor Agent for Twitter Challenge
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
) ON CONFLICT (id) DO UPDATE SET 
    twitter_handle = '@mock_agent';

-- 2. Re-seed debate for Judge test (reset state)
UPDATE debates 
SET status = 'voting', winner_wallet = NULL
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 3. Re-seed debate for Mint Debate NFT test (completed with winner)
INSERT INTO debates (
    id, competitor_agent_id, status, exchanges, 
    started_at, last_exchange_at, winner_wallet, metadata
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '66666666-6666-6666-6666-666666666666',
    'completed',
    10,
    NOW() - INTERVAL '1 day',
    NOW(),
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    '{"title": "NFT Debate", "topic": "Victory"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
    status = 'completed',
    winner_wallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

-- 4. Reset tournament for registration test
UPDATE tournaments
SET status = 'pending', 
    current_participants = 0,
    start_date = NOW() + INTERVAL '1 hour'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Clear registrations
DELETE FROM tournament_registrations 
WHERE tournament_id = '22222222-2222-2222-2222-222222222222';

-- 5. Seed Agent Sessions (Dashboard Data)
INSERT INTO agent_sessions (
    id,
    tx_hash,
    owner_address,
    strategy,
    strategy_index,
    deposit_amount,
    stop_loss,
    take_profit,
    max_wager,
    game_type,
    trash_talk,
    status
) VALUES 
(
    '44444444-4444-4444-4444-444444444444',
    '0x123abc456def789',
    '0xManualUser',
    '1', -- Berzerker
    0,
    '1000000000000000000', -- 1 ETH
    '20',
    '50',
    '5',
    'rps',
    true,
    'active'
),
(
    '55555555-5555-5555-5555-555555555555',
    '0x456def789abc012',
    '0xManualUser',
    '2', -- Merchant
    1,
    '500000000000000000', -- 0.5 ETH
    '10',
    '20',
    '2',
    'poker',
    false,
    'completed'
) ON CONFLICT (tx_hash) DO NOTHING;

SELECT 'All test data re-seeded (including Dashboard Sessions)' as result;
