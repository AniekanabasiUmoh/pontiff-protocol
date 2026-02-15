-- MINIMAL SAFE DATABASE MIGRATION
-- This only ADDS columns and creates indexes
-- Does NOT create functions, insert, update, or delete any data
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

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_debates_agent_wallets ON debates(agent_a_wallet, agent_b_wallet);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_competitor_agents_wallet ON competitor_agents(wallet_address);

-- Display success message
SELECT 'Migration completed successfully!' as message;
SELECT 'Added columns: wallet_address, agent_a_wallet, agent_b_wallet, goal_type' as info;
SELECT 'Created indexes for performance' as info;
