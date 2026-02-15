-- SAFE DATABASE MIGRATION
-- This only ADDS columns and creates indexes/functions
-- Does NOT insert, update, or delete any data
-- Safe to run multiple times (all operations use IF NOT EXISTS)

-- Add missing wallet_address column to competitor_agents
ALTER TABLE competitor_agents
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);

-- Add missing wallet columns to debates
ALTER TABLE debates
ADD COLUMN IF NOT EXISTS agent_a_wallet VARCHAR(42),
ADD COLUMN IF NOT EXISTS agent_b_wallet VARCHAR(42);

-- Add goal_type to crusades if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crusades') THEN
        ALTER TABLE crusades ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50) DEFAULT 'conversion';
    END IF;
END $$;

-- Create helper function for player stats
-- Drop existing function first to avoid signature conflicts
DO $$
BEGIN
    -- Drop all variations of the function
    EXECUTE 'DROP FUNCTION IF EXISTS get_player_stats(VARCHAR) CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS get_player_stats(character varying) CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS get_player_stats(text) CASCADE';
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if function doesn't exist
        NULL;
END $$;

CREATE FUNCTION get_player_stats(player_wallet VARCHAR)
RETURNS TABLE (
    total_games INTEGER,
    wins INTEGER,
    losses INTEGER,
    win_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_games,
        SUM(CASE WHEN winner = player_wallet THEN 1 ELSE 0 END)::INTEGER as wins,
        SUM(CASE WHEN winner != player_wallet THEN 1 ELSE 0 END)::INTEGER as losses,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND(SUM(CASE WHEN winner = player_wallet THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC, 2)
            ELSE 0
        END as win_rate
    FROM debates
    WHERE agent_a_wallet = player_wallet OR agent_b_wallet = player_wallet;
END;
$$ LANGUAGE plpgsql;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_debates_agent_wallets ON debates(agent_a_wallet, agent_b_wallet);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_competitor_agents_wallet ON competitor_agents(wallet_address);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added columns: wallet_address, agent_a_wallet, agent_b_wallet, goal_type';
    RAISE NOTICE 'Created function: get_player_stats()';
    RAISE NOTICE 'Created indexes for performance';
END $$;
