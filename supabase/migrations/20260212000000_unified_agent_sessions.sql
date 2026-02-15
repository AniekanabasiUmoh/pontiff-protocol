-- =====================================================
-- UNIFIED AGENT SESSIONS TABLE
-- This migration consolidates all previous agent_sessions migrations
-- Drops old table and creates a clean, unified schema
-- =====================================================

-- Drop existing table and all dependencies
DROP TABLE IF EXISTS agent_sessions CASCADE;

-- Drop old functions if they exist
DROP FUNCTION IF EXISTS increment_games_played(UUID);
DROP FUNCTION IF EXISTS update_session_balance(UUID, NUMERIC);
DROP FUNCTION IF EXISTS stop_agent_session(UUID, TEXT);

-- Create the unified agent_sessions table
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    user_wallet VARCHAR(42) NOT NULL,  -- Unified column name (was owner_address in some migrations)
    wallet_address VARCHAR(42),  -- Session wallet address (extracted from tx)
    strategy VARCHAR(50) NOT NULL,
    strategy_index INTEGER DEFAULT 0,
    deposit_amount VARCHAR(78) DEFAULT '0',
    starting_balance VARCHAR(78) DEFAULT '0',
    current_balance VARCHAR(78) DEFAULT '0',
    stop_loss VARCHAR(10) DEFAULT '20',
    take_profit VARCHAR(78),
    max_wager VARCHAR(78) DEFAULT '5',
    game_type VARCHAR(20) DEFAULT 'all',
    trash_talk BOOLEAN DEFAULT true,
    agent_mode VARCHAR(20) DEFAULT 'PvE',
    target_archetype VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- active, paused, stopped, bankrupt
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    profit_loss VARCHAR(78) DEFAULT '0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for common queries
CREATE INDEX idx_agent_sessions_user_wallet ON agent_sessions(user_wallet);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX idx_agent_sessions_strategy ON agent_sessions(strategy);
CREATE INDEX idx_agent_sessions_tx_hash ON agent_sessions(tx_hash);
CREATE INDEX idx_agent_sessions_created_at ON agent_sessions(created_at DESC);

-- RLS Policies
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sessions (for leaderboards and public dashboards)
CREATE POLICY "Sessions are viewable by everyone" ON agent_sessions
    FOR SELECT USING (true);

-- Only service role can insert/update (API calls)
CREATE POLICY "Service can manage sessions" ON agent_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_agent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER agent_sessions_updated_at
    BEFORE UPDATE ON agent_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_sessions_updated_at();

-- Table comments for documentation
COMMENT ON TABLE agent_sessions IS 'Tracks autonomous AI agent sessions spawned by users';
COMMENT ON COLUMN agent_sessions.user_wallet IS 'Wallet address of the user who spawned the agent';
COMMENT ON COLUMN agent_sessions.wallet_address IS 'Session wallet address (if using session wallets)';
COMMENT ON COLUMN agent_sessions.strategy IS 'Agent strategy: berzerker, merchant, or disciple';
COMMENT ON COLUMN agent_sessions.status IS 'Session status: active, paused, stopped, or bankrupt';
COMMENT ON COLUMN agent_sessions.tx_hash IS 'Transaction hash from the spawn transaction';

SELECT 'agent_sessions table created successfully with unified schema!' as status;
