-- =====================================================
-- COMPREHENSIVE FIX: All 7 Test Failures
-- Run this AFTER restarting server
-- =====================================================

-- Fix 1: Reset Judge Debate (currently shows "already judged")
UPDATE debates 
SET status = 'voting',  -- Reset to voting
    winner_wallet = NULL  -- Clear winner so test can judge
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Fix 2 & 3: Reset Tournament for Register + Start tests  
UPDATE tournaments
SET status = 'pending',  -- Allow registration
    current_participants = 0,  -- No participants (test will add them)
    start_date = NOW() + INTERVAL '1 hour'  -- Future start
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Clear existing registrations so tests can add fresh ones
DELETE FROM tournament_registrations 
WHERE tournament_id = '22222222-2222-2222-2222-222222222222';

-- Fix 4: Use existing bracket for Record Match test (from your query)
-- Update the test script to use ID: 97589801-32ab-411f-9115-435ebab5d2c3

-- Fix 5: Mint Debate NFT - ensure debate has winner
UPDATE debates
SET status = 'completed',
    winner_wallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
WHERE id = '33333333-3333-3333-3333-333333333333';

SELECT 'All fixes applied - restart server and update test script for Record Match ID' as result;
