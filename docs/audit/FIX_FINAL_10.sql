-- =====================================================
-- FIX FINAL 10 TEST FAILURES
-- Target: missing data and state consistency
-- =====================================================

-- 1. FIX DEBATE NFT MINTING
-- Set winner for the NFT debate to allow minting
UPDATE debates
SET winner_wallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    status = 'Completed'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- 2. FIX TWITTER CHALLENGE
-- Ensure competitor exists with correct handle
INSERT INTO competitor_agents (
    id,
    name,
    twitter_handle,
    contract_address,
    token_symbol,
    narrative,
    verification_method,
    is_shadow_agent,
    threat_level,
    market_cap,
    holders,
    treasury_balance,
    discovered_at,
    last_updated
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    'Test Agent Alpha',
    '@test_agent_alpha',
    '0xTestAgent111111111111111111111111111111111',
    'TALPHA',
    'Test narrative',
    'manual_whitelist',
    false,
    'MEDIUM',
    50000,
    100,
    10000,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET twitter_handle = '@test_agent_alpha';

-- 3. FIX SUBSCRIBE CARDINAL
-- Delete existing membership to allow "Subscribe" test to pass
-- Schema check confirms both camelCase and snake_case columns exist, covering all bases
DELETE FROM cardinal_memberships 
WHERE wallet_address ILIKE '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   OR "walletAddress" ILIKE '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   OR "wallet_address" ILIKE '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

-- 4. FIX TOURNAMENT REGISTRATION
-- Ensure tournament exists for registration test
INSERT INTO tournaments (
    id,
    name,
    entry_fee,
    prize_pool,
    start_date,
    end_date,
    status,
    max_participants,
    created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Test Tournament',
    '100',
    '10000',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '8 days',
    'pending',
    16,
    NOW()
) ON CONFLICT (id) DO UPDATE SET status = 'pending';

-- 5. ENSURE TOURNAMENT REGISTRATIONS TABLE EXISTS
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID,
    wallet_address VARCHAR(42) NOT NULL,
    seed_number INTEGER,
    entry_paid VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, wallet_address)
);

-- Enable RLS if not enabled
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read tournament_registrations" ON tournament_registrations;
CREATE POLICY "Public read tournament_registrations" ON tournament_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write tournament_registrations" ON tournament_registrations;
CREATE POLICY "Service role write tournament_registrations" ON tournament_registrations FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tournament_registrations TO authenticated, anon;

-- Force schema reload
NOTIFY pgrst, 'reload schema';

SELECT 'Final fixes applied successfully' as result;
