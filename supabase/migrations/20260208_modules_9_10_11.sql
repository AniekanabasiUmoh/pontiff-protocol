-- Module 9, 10, 11: Debate Judging, NFT Minting, Cardinal Membership, WebSockets
-- Migration for Modules 9-11

-- =============================================
-- MODULE 9: AI Debate Judging & Scoring
-- =============================================

-- Add judging columns to debates table
ALTER TABLE debates
ADD COLUMN IF NOT EXISTS winner VARCHAR(20),
ADD COLUMN IF NOT EXISTS pontiff_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS competitor_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS judge_reasoning TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_debates_winner ON debates(winner);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debates_completed_at ON debates(completed_at);

-- =============================================
-- MODULE 10: Indulgence NFT Minting
-- =============================================

-- Add NFT tracking to conversions table
ALTER TABLE conversions
ADD COLUMN IF NOT EXISTS nft_minted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nft_token_id INTEGER,
ADD COLUMN IF NOT EXISTS nft_tx_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS nft_minted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS nft_severity INTEGER DEFAULT 0; -- 0=Minor, 1=Mortal, 2=Cardinal, 3=Unforgivable

-- Create index for NFT queries
CREATE INDEX IF NOT EXISTS idx_conversions_nft_minted ON conversions(nft_minted);
CREATE INDEX IF NOT EXISTS idx_conversions_token_id ON conversions(nft_token_id);

-- =============================================
-- MODULE 10: Cardinal Membership
-- =============================================

-- Create Cardinal Memberships table
CREATE TABLE IF NOT EXISTS cardinal_memberships (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_renewed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    payment_tx_hash VARCHAR(66),
    payment_amount VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Cardinal Membership
CREATE INDEX IF NOT EXISTS idx_cardinal_wallet ON cardinal_memberships(wallet_address);
CREATE INDEX IF NOT EXISTS idx_cardinal_status ON cardinal_memberships(status);
CREATE INDEX IF NOT EXISTS idx_cardinal_expires ON cardinal_memberships(expires_at);

-- RLS Policies for Cardinal Memberships
ALTER TABLE cardinal_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view memberships" ON cardinal_memberships
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage memberships" ON cardinal_memberships
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- MODULE 11: WebSocket Event Tracking
-- =============================================

-- Create live_events table for WebSocket broadcasts
CREATE TABLE IF NOT EXISTS live_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'game_complete', 'debate_result', 'conversion', 'leaderboard_update'
    event_data JSONB NOT NULL,
    broadcast_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ttl INTEGER DEFAULT 300 -- Time to live in seconds (5 minutes default)
);

-- Index for event queries
CREATE INDEX IF NOT EXISTS idx_live_events_type ON live_events(event_type);
CREATE INDEX IF NOT EXISTS idx_live_events_broadcast_at ON live_events(broadcast_at);

-- Auto-cleanup old events (keep last 1 hour only)
CREATE OR REPLACE FUNCTION cleanup_old_live_events()
RETURNS void AS $$
BEGIN
    DELETE FROM live_events
    WHERE broadcast_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- GAME HISTORY UPDATES
-- =============================================

-- Add debate game type to game_history
ALTER TABLE game_history
ADD COLUMN IF NOT EXISTS metadata JSONB; -- Store additional game-specific data

-- Update game_type enum if it exists as enum
-- If game_type is VARCHAR, this is already flexible

-- =============================================
-- ANALYTICS VIEWS
-- =============================================

-- View for Cardinal Members analytics
CREATE OR REPLACE VIEW cardinal_analytics AS
SELECT
    DATE_TRUNC('day', started_at) as date,
    COUNT(*) as new_members,
    SUM(CAST(payment_amount AS NUMERIC)) as revenue,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_members,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_members
FROM cardinal_memberships
GROUP BY DATE_TRUNC('day', started_at)
ORDER BY date DESC;

-- View for NFT minting stats
CREATE OR REPLACE VIEW nft_minting_stats AS
SELECT
    DATE_TRUNC('day', nft_minted_at) as date,
    nft_severity,
    COUNT(*) as minted_count
FROM conversions
WHERE nft_minted = true
GROUP BY DATE_TRUNC('day', nft_minted_at), nft_severity
ORDER BY date DESC;

-- View for debate results
CREATE OR REPLACE VIEW debate_results AS
SELECT
    DATE_TRUNC('day', completed_at) as date,
    winner,
    COUNT(*) as debate_count,
    AVG(pontiff_score) as avg_pontiff_score,
    AVG(competitor_score) as avg_competitor_score
FROM debates
WHERE status = 'Completed'
GROUP BY DATE_TRUNC('day', completed_at), winner
ORDER BY date DESC;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if address is Cardinal member
CREATE OR REPLACE FUNCTION is_cardinal_member(wallet_addr VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    is_member BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM cardinal_memberships
        WHERE wallet_address = LOWER(wallet_addr)
        AND status = 'active'
        AND expires_at > NOW()
    ) INTO is_member;

    RETURN is_member;
END;
$$ LANGUAGE plpgsql;

-- Function to get Cardinal house edge reduction
CREATE OR REPLACE FUNCTION get_house_edge_reduction(wallet_addr VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
    reduction NUMERIC;
BEGIN
    IF is_cardinal_member(wallet_addr) THEN
        RETURN 2.0; -- 2% reduction for Cardinals
    ELSE
        RETURN 0.0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cardinal_memberships_updated_at
    BEFORE UPDATE ON cardinal_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE cardinal_memberships IS 'Module 10: Premium Cardinal membership subscriptions (1000 GUILT/month)';
COMMENT ON TABLE live_events IS 'Module 11: Real-time events for WebSocket broadcasting';
COMMENT ON COLUMN conversions.nft_minted IS 'Module 10: Tracks if Indulgence NFT was minted for this conversion';
COMMENT ON COLUMN debates.winner IS 'Module 9: Winner of judged debate (pontiff or competitor)';
COMMENT ON FUNCTION is_cardinal_member IS 'Module 10: Check if wallet has active Cardinal membership';
