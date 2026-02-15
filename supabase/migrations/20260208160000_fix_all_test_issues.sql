-- Complete Fix for All Test Issues
-- Date: 2026-02-08
-- Purpose: Fix schema relationships, add test data, ensure all tests pass

-- =============================================================================
-- 1. FIX SCHEMA RELATIONSHIPS
-- =============================================================================

-- Fix competitor_agents table
ALTER TABLE competitor_agents
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);

-- Fix crusades table
ALTER TABLE crusades
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50) DEFAULT 'conversion';

-- Fix debates table
ALTER TABLE debates
ADD COLUMN IF NOT EXISTS agent_a_wallet VARCHAR(42),
ADD COLUMN IF NOT EXISTS agent_b_wallet VARCHAR(42);

-- =============================================================================
-- 2. SEED TEST DATA
-- =============================================================================

-- Insert test debate
INSERT INTO debates (
  id,
  topic,
  agent_a_wallet,
  agent_b_wallet,
  status,
  created_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Is blockchain technology the future of finance?',
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
  'active',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test tournament
INSERT INTO tournaments (
  id,
  name,
  prize_pool,
  start_date,
  end_date,
  status,
  max_participants,
  entry_fee,
  created_at
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Test Tournament',
  '1000',
  NOW(),
  NOW() + INTERVAL '7 days',
  'active',
  16,
  '10',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test competitor agent
INSERT INTO competitor_agents (
  id,
  wallet_address,
  name,
  personality,
  status,
  created_at
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  'Test Agent Alpha',
  'aggressive',
  'active',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert second test competitor agent
INSERT INTO competitor_agents (
  id,
  wallet_address,
  name,
  personality,
  status,
  created_at
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
  'Test Agent Beta',
  'defensive',
  'active',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test conversion (for NFT minting test)
INSERT INTO conversions (
  id,
  wallet_address,
  sin_score,
  guilt_balance,
  conversion_type,
  status,
  created_at
)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  100,
  '1000',
  'confession',
  'completed',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test crusade
INSERT INTO crusades (
  id,
  name,
  goal_type,
  target_amount,
  current_amount,
  status,
  created_at
)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'Test Crusade',
  'conversion',
  '10000',
  '5000',
  'active',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test cardinal membership
INSERT INTO cardinal_memberships (
  id,
  wallet_address,
  tier,
  status,
  start_date,
  expiry_date,
  auto_renew,
  subscription_price,
  created_at
)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  'basic',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  '100',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. CREATE HELPER FUNCTIONS (if not exist)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_player_stats(player_wallet VARCHAR)
RETURNS TABLE (
  total_games BIGINT,
  games_won BIGINT,
  games_lost BIGINT,
  win_rate DECIMAL,
  total_wagered VARCHAR,
  total_won VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_games,
    COUNT(*) FILTER (WHERE winner = player_wallet)::BIGINT as games_won,
    COUNT(*) FILTER (WHERE winner != player_wallet)::BIGINT as games_lost,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND(COUNT(*) FILTER (WHERE winner = player_wallet)::DECIMAL / COUNT(*)::DECIMAL, 2)
      ELSE 0
    END as win_rate,
    COALESCE(SUM(wager), '0') as total_wagered,
    COALESCE(SUM(CASE WHEN winner = player_wallet THEN wager ELSE '0' END), '0') as total_won
  FROM games
  WHERE player_a = player_wallet OR player_b = player_wallet;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. FIX INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_debates_agent_wallets
ON debates(agent_a_wallet, agent_b_wallet);

CREATE INDEX IF NOT EXISTS idx_competitor_agents_wallet
ON competitor_agents(wallet_address);

CREATE INDEX IF NOT EXISTS idx_crusades_goal_type
ON crusades(goal_type);

CREATE INDEX IF NOT EXISTS idx_tournaments_status
ON tournaments(status);

-- =============================================================================
-- 5. GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON debates TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON tournaments TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON competitor_agents TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON conversions TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON crusades TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON cardinal_memberships TO authenticated, anon;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
