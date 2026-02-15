-- =====================================================
-- Fix Database Schema Relationships
-- Resolves Supabase schema cache relationship errors
-- =====================================================

-- 1. Fix competitor_agents - add missing wallet_address column
ALTER TABLE competitor_agents
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);

-- Add index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_competitor_agents_wallet ON competitor_agents(wallet_address);

-- 2. Ensure conversions table has wallet_address column
ALTER TABLE conversions
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);

-- 3. Fix crusades table - ensure goal_type column exists (snake_case)
ALTER TABLE crusades
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50);

-- If goalType exists (camelCase), copy data and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'crusades' AND column_name = 'goalType'
    ) THEN
        UPDATE crusades SET goal_type = "goalType" WHERE goal_type IS NULL;
        ALTER TABLE crusades DROP COLUMN IF EXISTS "goalType";
    END IF;
END $$;

-- Set default value for existing null goal_type entries
UPDATE crusades SET goal_type = 'Conversion' WHERE goal_type IS NULL;

-- 4. Fix debates table - ensure proper agent references
ALTER TABLE debates
ADD COLUMN IF NOT EXISTS agent_a_wallet VARCHAR(42),
ADD COLUMN IF NOT EXISTS agent_b_wallet VARCHAR(42),
ADD COLUMN IF NOT EXISTS agent_a_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS agent_b_name VARCHAR(255);

-- Create indexes for debate queries
CREATE INDEX IF NOT EXISTS idx_debates_agent_a ON debates(agent_a_wallet);
CREATE INDEX IF NOT EXISTS idx_debates_agent_b ON debates(agent_b_wallet);

-- 5. Add helper function to get competitor by wallet
CREATE OR REPLACE FUNCTION get_competitor_by_wallet(wallet VARCHAR)
RETURNS TABLE (
    id UUID,
    handle VARCHAR,
    name VARCHAR,
    threat_level VARCHAR,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ca.id,
        ca.handle,
        ca.name,
        ca.threat_level,
        ca.status
    FROM competitor_agents ca
    WHERE ca.wallet_address = wallet
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 6. Add RPC function for player stats (if not exists)
CREATE OR REPLACE FUNCTION get_player_stats(player_wallet VARCHAR)
RETURNS TABLE (
    total_games BIGINT,
    games_won BIGINT,
    games_lost BIGINT,
    win_rate NUMERIC,
    total_wagered VARCHAR,
    total_won VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_games,
        COUNT(*) FILTER (WHERE g.winner = player_wallet) as games_won,
        COUNT(*) FILTER (WHERE g.winner != player_wallet AND g.winner IS NOT NULL) as games_lost,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND(COUNT(*) FILTER (WHERE g.winner = player_wallet)::NUMERIC / COUNT(*)::NUMERIC * 100, 2)
            ELSE 0
        END as win_rate,
        COALESCE(SUM(CAST(g.wager AS NUMERIC)), 0)::VARCHAR as total_wagered,
        COALESCE(SUM(CAST(g.wager AS NUMERIC)) FILTER (WHERE g.winner = player_wallet), 0)::VARCHAR as total_won
    FROM games g
    WHERE g.player1 = player_wallet OR g.player2 = player_wallet;
END;
$$ LANGUAGE plpgsql;

-- 7. Ensure users table exists with required columns
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    guilt_balance VARCHAR(50) DEFAULT '0',
    sin_score INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE,
    last_confession_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS guilt_balance VARCHAR(50) DEFAULT '0',
ADD COLUMN IF NOT EXISTS sin_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_confession_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_sin_score ON users(sin_score DESC);

-- 8. Add missing columns to confessions table
ALTER TABLE confessions
ADD COLUMN IF NOT EXISTS roast_text TEXT,
ADD COLUMN IF NOT EXISTS opt_in_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tweeted BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE competitor_agents IS 'Competing AI agents tracked by the system';
COMMENT ON TABLE conversions IS 'Agent conversion events';
COMMENT ON TABLE crusades IS 'Vatican crusades against competitor agents';
COMMENT ON TABLE debates IS 'Twitter debate challenges between agents';
