-- =====================================================
-- Module 12-15 Database Migration
-- Confession System, Treasury, Bots, Frontend Features
-- =====================================================

-- Module 12: Confession System
-- =====================================================

-- Confessions table (if not exists)
CREATE TABLE IF NOT EXISTS confessions (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    confession_type VARCHAR(50) DEFAULT 'penance_stake',
    stake_amount VARCHAR(50),
    sin_reduction INTEGER DEFAULT 0,
    previous_sin_score INTEGER DEFAULT 0,
    new_sin_score INTEGER DEFAULT 0,
    transaction_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending',
    nft_minted BOOLEAN DEFAULT FALSE,
    nft_token_id INTEGER,
    nft_mint_tx VARCHAR(66),
    nft_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for idempotency)
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS confession_type VARCHAR(50) DEFAULT 'penance_stake';
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS stake_amount VARCHAR(50);
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS sin_reduction INTEGER DEFAULT 0;
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS previous_sin_score INTEGER DEFAULT 0;
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS new_sin_score INTEGER DEFAULT 0;
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66);
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS nft_minted BOOLEAN DEFAULT FALSE;
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS nft_token_id INTEGER;
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS nft_mint_tx VARCHAR(66);
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS nft_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_confessions_wallet ON confessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_confessions_status ON confessions(status);
CREATE INDEX IF NOT EXISTS idx_confessions_created ON confessions(created_at DESC);

-- Add sin_score and last_confession_at to users table (if not exists)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS sin_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_confession_at TIMESTAMP WITH TIME ZONE;

-- Roast tweets table
CREATE TABLE IF NOT EXISTS roast_tweets (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    tweet_text TEXT NOT NULL,
    sin_score INTEGER,
    posted BOOLEAN DEFAULT FALSE,
    mock_mode BOOLEAN DEFAULT TRUE,
    twitter_tweet_id VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE roast_tweets ADD COLUMN IF NOT EXISTS sin_score INTEGER;
ALTER TABLE roast_tweets ADD COLUMN IF NOT EXISTS posted BOOLEAN DEFAULT FALSE;
ALTER TABLE roast_tweets ADD COLUMN IF NOT EXISTS mock_mode BOOLEAN DEFAULT TRUE;
ALTER TABLE roast_tweets ADD COLUMN IF NOT EXISTS twitter_tweet_id VARCHAR(100);
ALTER TABLE roast_tweets ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_roast_tweets_wallet ON roast_tweets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_roast_tweets_posted ON roast_tweets(posted);
CREATE INDEX IF NOT EXISTS idx_roast_tweets_created ON roast_tweets(created_at DESC);

-- Module 13: Treasury & Revenue Tracking
-- =====================================================

-- Treasury revenue table
CREATE TABLE IF NOT EXISTS treasury_revenue (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL, -- 'rps', 'poker', 'judas', 'debate', etc.
    amount VARCHAR(50) NOT NULL,
    transaction_hash VARCHAR(66),
    distributed BOOLEAN DEFAULT FALSE,
    distributed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE treasury_revenue ADD COLUMN IF NOT EXISTS distributed BOOLEAN DEFAULT FALSE;
ALTER TABLE treasury_revenue ADD COLUMN IF NOT EXISTS distributed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_treasury_revenue_source ON treasury_revenue(source);
CREATE INDEX IF NOT EXISTS idx_treasury_revenue_distributed ON treasury_revenue(distributed);
CREATE INDEX IF NOT EXISTS idx_treasury_revenue_created ON treasury_revenue(created_at DESC);

-- Revenue distribution records
CREATE TABLE IF NOT EXISTS revenue_distributions (
    id BIGSERIAL PRIMARY KEY,
    total_amount VARCHAR(50) NOT NULL,
    staking_amount VARCHAR(50) NOT NULL,
    team_amount VARCHAR(50) NOT NULL,
    ops_amount VARCHAR(50) NOT NULL,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE revenue_distributions ADD COLUMN IF NOT EXISTS total_amount VARCHAR(50) NOT NULL;
ALTER TABLE revenue_distributions ADD COLUMN IF NOT EXISTS staking_amount VARCHAR(50) NOT NULL;
ALTER TABLE revenue_distributions ADD COLUMN IF NOT EXISTS team_amount VARCHAR(50) NOT NULL;
ALTER TABLE revenue_distributions ADD COLUMN IF NOT EXISTS ops_amount VARCHAR(50) NOT NULL;
ALTER TABLE revenue_distributions ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66);

CREATE INDEX IF NOT EXISTS idx_revenue_distributions_created ON revenue_distributions(created_at DESC);

-- Module 14: Bot Activity Tracking
-- =====================================================

-- Bot sessions table (for example bots and user-deployed bots)
CREATE TABLE IF NOT EXISTS bot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_type VARCHAR(50) NOT NULL, -- 'rps', 'poker', 'custom'
    wallet_address VARCHAR(42) NOT NULL,
    strategy VARCHAR(50), -- 'random', 'counter', 'pattern', 'conservative', 'aggressive'
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    total_wagered VARCHAR(50) DEFAULT '0',
    total_profit VARCHAR(50) DEFAULT '0',
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'stopped', 'error'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE,
    last_game_at TIMESTAMP WITH TIME ZONE
);

-- Add columns if they don't exist
ALTER TABLE bot_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE bot_sessions ADD COLUMN IF NOT EXISTS total_wagered VARCHAR(50) DEFAULT '0';
ALTER TABLE bot_sessions ADD COLUMN IF NOT EXISTS total_profit VARCHAR(50) DEFAULT '0';
ALTER TABLE bot_sessions ADD COLUMN IF NOT EXISTS last_game_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_bot_sessions_wallet ON bot_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_status ON bot_sessions(status);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_type ON bot_sessions(bot_type);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_started ON bot_sessions(started_at DESC);

-- Module 15: Frontend Interaction Tracking
-- =====================================================

-- User preferences table (for sound, animations, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    sound_volume DECIMAL(3,2) DEFAULT 0.5,
    animations_enabled BOOLEAN DEFAULT TRUE,
    theme VARCHAR(20) DEFAULT 'dark',
    show_confetti BOOLEAN DEFAULT TRUE,
    auto_play_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS sound_volume DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS animations_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_preferences_wallet ON user_preferences(wallet_address);

-- Analytics: Game result animations viewed
CREATE TABLE IF NOT EXISTS animation_views (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42),
    animation_type VARCHAR(50) NOT NULL, -- 'win', 'loss', 'draw', 'confetti'
    game_id BIGINT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE animation_views ADD COLUMN IF NOT EXISTS animation_type VARCHAR(50) NOT NULL;
ALTER TABLE animation_views ADD COLUMN IF NOT EXISTS game_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_animation_views_wallet ON animation_views(wallet_address);
CREATE INDEX IF NOT EXISTS idx_animation_views_type ON animation_views(animation_type);
CREATE INDEX IF NOT EXISTS idx_animation_views_created ON animation_views(viewed_at DESC);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get total treasury revenue
CREATE OR REPLACE FUNCTION get_total_treasury_revenue()
RETURNS TABLE (
    total_revenue NUMERIC,
    distributed NUMERIC,
    pending NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(CAST(amount AS NUMERIC)) as total_revenue,
        SUM(CASE WHEN distributed = TRUE THEN CAST(amount AS NUMERIC) ELSE 0 END) as distributed,
        SUM(CASE WHEN distributed = FALSE THEN CAST(amount AS NUMERIC) ELSE 0 END) as pending
    FROM treasury_revenue;
END;
$$ LANGUAGE plpgsql;

-- Function: Get bot statistics
CREATE OR REPLACE FUNCTION get_bot_statistics(bot_type_filter VARCHAR DEFAULT NULL)
RETURNS TABLE (
    bot_type VARCHAR,
    total_sessions BIGINT,
    active_sessions BIGINT,
    total_games BIGINT,
    total_wins BIGINT,
    total_losses BIGINT,
    avg_win_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bs.bot_type,
        COUNT(*)::BIGINT as total_sessions,
        COUNT(*) FILTER (WHERE bs.status = 'active')::BIGINT as active_sessions,
        SUM(bs.games_played)::BIGINT as total_games,
        SUM(bs.wins)::BIGINT as total_wins,
        SUM(bs.losses)::BIGINT as total_losses,
        CASE
            WHEN SUM(bs.games_played) > 0 THEN
                (SUM(bs.wins)::DECIMAL / SUM(bs.games_played)::DECIMAL * 100)
            ELSE 0
        END as avg_win_rate
    FROM bot_sessions bs
    WHERE (bot_type_filter IS NULL OR bs.bot_type = bot_type_filter)
    GROUP BY bs.bot_type;
END;
$$ LANGUAGE plpgsql;

-- Function: Get confession statistics
CREATE OR REPLACE FUNCTION get_confession_statistics()
RETURNS TABLE (
    total_confessions BIGINT,
    total_stake_amount NUMERIC,
    total_sin_reduction BIGINT,
    nfts_minted BIGINT,
    avg_sin_reduction DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_confessions,
        COALESCE(SUM(CAST(stake_amount AS NUMERIC)), 0) as total_stake_amount,
        COALESCE(SUM(sin_reduction), 0)::BIGINT as total_sin_reduction,
        COUNT(*) FILTER (WHERE nft_minted = TRUE)::BIGINT as nfts_minted,
        COALESCE(AVG(sin_reduction), 0) as avg_sin_reduction
    FROM confessions;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Analytics Views
-- =====================================================

-- View: Daily confession activity
CREATE OR REPLACE VIEW daily_confession_activity AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_confessions,
    COALESCE(SUM(CAST(stake_amount AS NUMERIC)), 0) as total_staked,
    COALESCE(SUM(sin_reduction), 0) as total_sin_reduction,
    COUNT(*) FILTER (WHERE nft_minted = TRUE) as nfts_minted
FROM confessions
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View: Bot performance leaderboard
CREATE OR REPLACE VIEW bot_performance_leaderboard AS
SELECT
    wallet_address,
    bot_type,
    strategy,
    games_played,
    wins,
    losses,
    draws,
    CASE WHEN games_played > 0 THEN (wins::DECIMAL / games_played::DECIMAL * 100) ELSE 0 END as win_rate,
    CAST(total_profit AS NUMERIC) as total_profit,
    CASE
        WHEN CAST(total_wagered AS NUMERIC) > 0 THEN
            (CAST(total_profit AS NUMERIC) / CAST(total_wagered AS NUMERIC) * 100)
        ELSE 0
    END as roi_percent
FROM bot_sessions
WHERE games_played > 0
ORDER BY CAST(total_profit AS NUMERIC) DESC
LIMIT 100;

-- View: Treasury revenue breakdown
CREATE OR REPLACE VIEW treasury_revenue_breakdown AS
SELECT
    source,
    COUNT(*) as transaction_count,
    SUM(CAST(amount AS NUMERIC)) as total_amount,
    AVG(CAST(amount AS NUMERIC)) as avg_amount,
    MAX(CAST(amount AS NUMERIC)) as max_amount,
    COUNT(*) FILTER (WHERE distributed = TRUE) as distributed_count,
    SUM(CASE WHEN distributed = TRUE THEN CAST(amount AS NUMERIC) ELSE 0 END) as distributed_amount
FROM treasury_revenue
GROUP BY source
ORDER BY total_amount DESC;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE animation_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow read access to authenticated users
CREATE POLICY "Allow read access to confessions" ON confessions FOR SELECT USING (TRUE);
CREATE POLICY "Allow insert confessions" ON confessions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow update own confessions" ON confessions FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Allow read bot sessions" ON bot_sessions FOR SELECT USING (TRUE);
CREATE POLICY "Allow insert bot sessions" ON bot_sessions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow update own bot sessions" ON bot_sessions FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Allow read user preferences" ON user_preferences FOR SELECT USING (TRUE);
CREATE POLICY "Allow insert user preferences" ON user_preferences FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow update own preferences" ON user_preferences FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Admin-only policies for treasury
CREATE POLICY "Allow admin read treasury" ON treasury_revenue FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

CREATE POLICY "Allow admin read distributions" ON revenue_distributions FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

-- =====================================================
-- Triggers
-- =====================================================

-- Trigger: Update updated_at on confessions
CREATE OR REPLACE FUNCTION update_confession_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_confessions_timestamp
BEFORE UPDATE ON confessions
FOR EACH ROW
EXECUTE FUNCTION update_confession_timestamp();

-- Trigger: Update user preferences timestamp
CREATE TRIGGER update_user_preferences_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_confession_timestamp();

-- =====================================================
-- Initial Data / Seed
-- =====================================================

-- Seed default user preferences for existing users (optional)
INSERT INTO user_preferences (wallet_address, sound_enabled, animations_enabled)
SELECT DISTINCT wallet_address, TRUE, TRUE
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences WHERE user_preferences.wallet_address = users.wallet_address
)
ON CONFLICT (wallet_address) DO NOTHING;

-- =====================================================
-- Migration Complete
-- =====================================================

COMMENT ON TABLE confessions IS 'Module 12: User confessions and penance stakes';
COMMENT ON TABLE roast_tweets IS 'Module 12: Public roast tweets for sinners';
COMMENT ON TABLE treasury_revenue IS 'Module 13: Treasury revenue tracking';
COMMENT ON TABLE revenue_distributions IS 'Module 13: Revenue distribution records';
COMMENT ON TABLE bot_sessions IS 'Module 14: Bot session tracking';
COMMENT ON TABLE user_preferences IS 'Module 15: User UI/UX preferences';
COMMENT ON TABLE animation_views IS 'Module 15: Frontend animation analytics';
