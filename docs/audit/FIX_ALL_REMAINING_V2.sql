-- Complete Fix for All Remaining Test Failures (v2)
-- Run this in your Supabase SQL editor

-- ============================================================================
-- 1. FIX CARDINAL MEMBERSHIPS COLUMN
-- ============================================================================

-- The code expects 'expiresAt' but database has 'expiry_date'
DO $$
BEGIN
    -- Check if expiresAt column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cardinal_memberships' AND column_name = 'expiresAt'
    ) THEN
        -- Add the column
        ALTER TABLE cardinal_memberships ADD COLUMN expiresAt TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Copy data from expiry_date
    UPDATE cardinal_memberships SET expiresAt = expiry_date WHERE expiresAt IS NULL;
END $$;

-- ============================================================================
-- 2. FIX CRUSADE START_TIME ISSUE
-- ============================================================================

-- Ensure start_time has default value
UPDATE crusades
SET start_time = NOW()
WHERE start_time IS NULL;

-- ============================================================================
-- 3. ADD TEST DATA FOR DEBATES
-- ============================================================================

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
    'mock_id',
    'Test Tournament Mock ID',
    '100',
    '10000',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '8 days',
    'pending',
    16,
    2,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    status = 'pending',
    current_participants = 2;

-- ============================================================================
-- 6. CREATE BOT_SESSIONS TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bot_sessions (
    id TEXT PRIMARY KEY,
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
-- 8. CREATE TOURNAMENT_REGISTRATIONS TABLE (for start tournament)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    seed_number INTEGER,
    entry_paid VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, wallet_address)
);

-- Add test registrations for mock_id tournament
INSERT INTO tournament_registrations (
    tournament_id,
    wallet_address,
    seed_number,
    entry_paid
) VALUES
    ('mock_id', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 1, '100'),
    ('mock_id', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 2, '100')
ON CONFLICT (tournament_id, wallet_address) DO NOTHING;

-- Enable RLS
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read tournament_registrations" ON tournament_registrations;
CREATE POLICY "Public read tournament_registrations" ON tournament_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write tournament_registrations" ON tournament_registrations;
CREATE POLICY "Service role write tournament_registrations" ON tournament_registrations FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 9. CREATE TOURNAMENT_BRACKETS TABLE (for bracket display)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_brackets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
    bracket_number INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    player1_wallet VARCHAR(42),
    player2_wallet VARCHAR(42),
    winner_wallet VARCHAR(42),
    status VARCHAR(50) DEFAULT 'pending',
    match_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tournament_brackets ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read tournament_brackets" ON tournament_brackets;
CREATE POLICY "Public read tournament_brackets" ON tournament_brackets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write tournament_brackets" ON tournament_brackets;
CREATE POLICY "Service role write tournament_brackets" ON tournament_brackets FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON bot_sessions TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON tournament_registrations TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON tournament_brackets TO authenticated, anon;

-- ============================================================================
-- DONE
-- ============================================================================

SELECT 'All fixes and test data applied successfully!' as status;
SELECT 'Tables created: bot_sessions, tournament_registrations, tournament_brackets' as info;
SELECT 'Test data added for: debates, conversions, tournaments, cardinal memberships, bot sessions' as info;
