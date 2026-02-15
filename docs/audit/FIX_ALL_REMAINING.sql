-- Complete Fix for All Remaining Test Failures
-- Run this in your Supabase SQL editor

-- ============================================================================
-- 1. FIX CARDINAL MEMBERSHIPS COLUMN
-- ============================================================================

-- The code expects 'expiresAt' but database has 'expiry_date'
-- Add expiresAt as an alias/view column
DO $$
BEGIN
    -- Check if expiresAt column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cardinal_memberships' AND column_name = 'expiresAt'
    ) THEN
        -- Add the column
        ALTER TABLE cardinal_memberships ADD COLUMN expiresAt TIMESTAMP WITH TIME ZONE;
        -- Copy data from expiry_date
        UPDATE cardinal_memberships SET expiresAt = expiry_date WHERE expiresAt IS NULL;
    END IF;
END $$;

-- ============================================================================
-- 2. FIX CRUSADE START_TIME ISSUE
-- ============================================================================

-- The code was using 'startTime' but we changed it to 'start_time'
-- Ensure start_time exists and has data
UPDATE crusades
SET start_time = created_at
WHERE start_time IS NULL AND created_at IS NOT NULL;

-- ============================================================================
-- 3. ADD TEST DATA FOR DEBATES
-- ============================================================================

-- Insert test debate with known ID
INSERT INTO debates (
    id,
    competitor_agent_id,
    tweet_id,
    our_argument,
    their_argument,
    status,
    exchanges,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'test_tweet_123',
    'The Pontiff argues for virtue and moral clarity.',
    'The heretic claims moral relativism.',
    'Active',
    3,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    exchanges = EXCLUDED.exchanges;

-- ============================================================================
-- 4. ADD TEST DATA FOR CONVERSIONS (for NFT minting)
-- ============================================================================

INSERT INTO conversions (
    id,
    competitor_agent_id,
    type,
    amount,
    timestamp
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    NULL,
    'Full',
    '1000',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    type = EXCLUDED.type,
    amount = EXCLUDED.amount;

-- ============================================================================
-- 5. ADD TEST DATA FOR TOURNAMENTS
-- ============================================================================

-- Create a test tournament with known ID
INSERT INTO tournaments (
    id,
    name,
    entry_fee,
    prize_pool,
    start_date,
    end_date,
    status,
    max_participants,
    current_participants,
    created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Test Tournament Alpha',
    '100',
    '10000',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '8 days',
    'pending',
    16,
    0,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    current_participants = EXCLUDED.current_participants;

-- Create an active tournament
INSERT INTO tournaments (
    id,
    name,
    entry_fee,
    prize_pool,
    start_date,
    end_date,
    status,
    max_participants,
    current_participants,
    bracket_data,
    created_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Test Tournament Beta - Active',
    '50',
    '5000',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '7 days',
    'active',
    8,
    4,
    '{"rounds": [{"matches": [{"player1": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "player2": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"}]}]}',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    bracket_data = EXCLUDED.bracket_data;

-- ============================================================================
-- 6. CREATE BOT_SESSIONS TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bot_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_wallet VARCHAR(42) NOT NULL,
    agent_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    strategy VARCHAR(100),
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    total_wagered VARCHAR(100) DEFAULT '0',
    total_won VARCHAR(100) DEFAULT '0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add test bot session
INSERT INTO bot_sessions (
    id,
    session_wallet,
    agent_id,
    status,
    strategy,
    games_played,
    games_won,
    created_at
) VALUES (
    'test-agent-session-123',
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    'agent-alpha-001',
    'active',
    'aggressive',
    42,
    28,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    games_played = EXCLUDED.games_played;

-- Enable RLS
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

-- Create public read policy
DROP POLICY IF EXISTS "Public read bot_sessions" ON bot_sessions;
CREATE POLICY "Public read bot_sessions" ON bot_sessions FOR SELECT USING (true);

-- Create service role write policy
DROP POLICY IF EXISTS "Service role write bot_sessions" ON bot_sessions;
CREATE POLICY "Service role write bot_sessions" ON bot_sessions FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. ADD ACTIVE CARDINAL MEMBERSHIP FOR TESTING
-- ============================================================================

INSERT INTO cardinal_memberships (
    id,
    wallet_address,
    tier,
    status,
    start_date,
    expiry_date,
    expiresAt,
    auto_renew,
    subscription_price,
    created_at
) VALUES (
    '77777777-7777-7777-7777-777777777777',
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    'gold',
    'active',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '25 days',
    NOW() + INTERVAL '25 days',
    true,
    '1000',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    expiry_date = NOW() + INTERVAL '25 days',
    expiresAt = NOW() + INTERVAL '25 days';

-- ============================================================================
-- 8. CREATE TOURNAMENT_MATCHES TABLE FOR MATCH RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    player1_wallet VARCHAR(42),
    player2_wallet VARCHAR(42),
    winner_wallet VARCHAR(42),
    status VARCHAR(50) DEFAULT 'pending',
    played_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add test match
INSERT INTO tournament_matches (
    id,
    tournament_id,
    round_number,
    match_number,
    player1_wallet,
    player2_wallet,
    status,
    created_at
) VALUES (
    'match-001',
    '33333333-3333-3333-3333-333333333333',
    1,
    1,
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    'pending',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    status = 'pending';

-- Enable RLS
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read tournament_matches" ON tournament_matches;
CREATE POLICY "Public read tournament_matches" ON tournament_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write tournament_matches" ON tournament_matches;
CREATE POLICY "Service role write tournament_matches" ON tournament_matches FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 9. CREATE TOURNAMENT_PARTICIPANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    entry_paid VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    eliminated BOOLEAN DEFAULT false,
    UNIQUE(tournament_id, wallet_address)
);

-- Add test participants
INSERT INTO tournament_participants (
    tournament_id,
    wallet_address,
    entry_paid,
    eliminated
) VALUES
    ('33333333-3333-3333-3333-333333333333', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', '50', false),
    ('33333333-3333-3333-3333-333333333333', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', '50', false)
ON CONFLICT (tournament_id, wallet_address) DO NOTHING;

-- Enable RLS
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read tournament_participants" ON tournament_participants;
CREATE POLICY "Public read tournament_participants" ON tournament_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write tournament_participants" ON tournament_participants;
CREATE POLICY "Service role write tournament_participants" ON tournament_participants FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON bot_sessions TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON tournament_matches TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON tournament_participants TO authenticated, anon;

-- ============================================================================
-- DONE
-- ============================================================================

SELECT 'All fixes and test data applied successfully!' as status;
SELECT 'Tables created: bot_sessions, tournament_matches, tournament_participants' as info;
SELECT 'Test data added for: debates, conversions, tournaments, cardinal memberships, bot sessions' as info;
