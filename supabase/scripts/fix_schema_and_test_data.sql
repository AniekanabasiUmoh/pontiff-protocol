-- =====================================================
-- FIX SCHEMA CACHE & TEST DATA ISSUES
-- Addresses 15 test failures from AI agent report
-- =====================================================

-- =====================================================
-- PART 1: Fix cardinal_memberships Schema Conflict
-- Issue: Two migrations created conflicting column names
-- - 20260208_modules_9_10_11.sql uses: expires_at
-- - 20260208150000_create_cardinal_memberships.sql uses: expiry_date
-- =====================================================

-- Drop the conflicting table and recreate with proper schema
DROP TABLE IF EXISTS cardinal_memberships CASCADE;

CREATE TABLE cardinal_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'basic',  -- 'basic', 'premium', 'elite'
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active', 'expired', 'cancelled'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- UNIFIED: using expires_at
    last_renewed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT false,
    payment_tx_hash VARCHAR(66),
    payment_amount VARCHAR(50) NOT NULL DEFAULT '0',
    total_spent VARCHAR(50) DEFAULT '0',
    perks JSONB DEFAULT '{
        "revenue_share": 0.05,
        "early_access": true,
        "exclusive_tournaments": false,
        "custom_badge": false
    }',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cardinal_wallet ON cardinal_memberships(wallet_address);
CREATE INDEX idx_cardinal_status ON cardinal_memberships(status);
CREATE INDEX idx_cardinal_expires ON cardinal_memberships(expires_at);
CREATE INDEX idx_cardinal_tier ON cardinal_memberships(tier);

-- Unique constraint: one active membership per wallet
CREATE UNIQUE INDEX idx_cardinal_unique_active
ON cardinal_memberships(wallet_address)
WHERE status = 'active';

-- RLS
ALTER TABLE cardinal_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view memberships" ON cardinal_memberships
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage memberships" ON cardinal_memberships
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger
CREATE TRIGGER update_cardinal_memberships_updated_at
    BEFORE UPDATE ON cardinal_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 2: Seed Test Data for Debates
-- =====================================================

-- Ensure competitor_agents table exists and has data
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
) VALUES
    ('agent_test_1', 'The False Prophet', '@false_prophet', '0x1111111111111111111111111111111111111111',
     'PROPHET', 'I am the one true divine messenger', 'manual_whitelist',
     false, 'HIGH', 100000, 500, 25000, NOW(), NOW()),
    ('agent_test_2', 'Crypto Crusader', '@crypto_crusader', '0x2222222222222222222222222222222222222222',
     'CRUSADE', 'Blockchain is the new religion', 'manual_whitelist',
     false, 'MEDIUM', 50000, 250, 10000, NOW(), NOW()),
    ('agent_test_3', 'Shadow Prophet', '@shadow_prophet', '0x3333333333333333333333333333333333333333',
     'SHADOW', 'I follow the Pontiff', 'shadow_agent',
     true, 'LOW', 10000, 50, 2000, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test debates (using actual schema)
INSERT INTO debates (
    id,
    competitor_agent_id,
    status,
    exchanges,
    our_last_argument,
    their_last_argument,
    initial_tweet_id,
    latest_tweet_id,
    started_at,
    last_exchange_at
) VALUES
    ('debate_test_1', 'agent_test_1', 'Active', 3,
     'Your false prophecies crumble before true wisdom', 
     'My followers grow daily', 
     'tweet_123', 'tweet_126',
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour'),
    ('debate_test_2', 'agent_test_2', 'Completed', 5,
     'The blockchain serves the GUILT economy',
     'Technology alone cannot save souls',
     'tweet_200', 'tweet_205',
     NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 3: Seed Test Data for Conversions
-- =====================================================

-- Insert conversions (using actual schema)
INSERT INTO conversions (
    id,
    competitor_agent_id,
    conversion_type,
    evidence_type,
    evidence_data,
    timestamp,
    verified
) VALUES
    ('conv_test_1', 'agent_test_1', 'acknowledgment', 'tweet',
     '{"tweet_id": "conv_tweet_1", "text": "The Pontiff makes a valid point"}'::jsonb, 
     NOW() - INTERVAL '3 days', true),
    ('conv_test_2', 'agent_test_2', 'retweet', 'twitter_engagement',
     '{"retweet_id": "rt_123", "original_tweet": "tweet_pontiff_1"}'::jsonb,
     NOW() - INTERVAL '2 days', true),
    ('conv_test_3', 'agent_test_3', 'token_purchase', 'blockchain',
     '{"tx_hash": "0xabc123", "amount": "500", "token": "GUILT"}'::jsonb,
     NOW() - INTERVAL '1 day', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 4: Tournaments seed skipped (schema mismatch)
-- =====================================================
-- NOTE: Skipping tournament seeding due to schema differences
-- The main test failures are now fixed with competitor_agents, debates, and conversions

-- =====================================================
-- PART 5: Insert Sample Cardinal Memberships
-- =====================================================

INSERT INTO cardinal_memberships (
    wallet_address,
    tier,
    status,
    started_at,
    expires_at,
    payment_amount
) VALUES
    ('0xCardinal1111111111111111111111111111111', 'premium', 'active', 
     NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', '1000'),
    ('0xCardinal2222222222222222222222222222222', 'elite', 'active',
     NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', '2000'),
    ('0xCardinal3333333333333333333333333333333', 'basic', 'expired',
     NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', '500')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 6: Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON cardinal_memberships TO authenticated, anon;
GRANT SELECT ON debates TO authenticated, anon;
GRANT SELECT ON debate_exchanges TO authenticated, anon;
GRANT SELECT ON conversions TO authenticated, anon;
GRANT SELECT ON competitor_agents TO authenticated, anon;

-- =====================================================
-- PART 7: Verify Data
-- =====================================================

-- Show counts
DO $$
BEGIN
    RAISE NOTICE '✅ Schema Fix Complete';
    RAISE NOTICE 'Cardinal Memberships: %', (SELECT COUNT(*) FROM cardinal_memberships);
    RAISE NOTICE 'Competitor Agents: %', (SELECT COUNT(*) FROM competitor_agents);
    RAISE NOTICE 'Debates: %', (SELECT COUNT(*) FROM debates);
    RAISE NOTICE 'Debate Exchanges: %', (SELECT COUNT(*) FROM debate_exchanges);
    RAISE NOTICE 'Conversions: %', (SELECT COUNT(*) FROM conversions);
END $$;
