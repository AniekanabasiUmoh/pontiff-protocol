-- =====================================================
-- AGENT SESSIONS TABLE
-- Stores spawned agent session data
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    wallet_address VARCHAR(42),  -- Session wallet address (can be extracted from tx)
    strategy VARCHAR(50) NOT NULL,
    strategy_index INTEGER DEFAULT 0,
    deposit_amount VARCHAR(78) DEFAULT '0',
    stop_loss VARCHAR(10) DEFAULT '20',
    take_profit VARCHAR(78),
    max_wager VARCHAR(78) DEFAULT '5',
    game_type VARCHAR(20) DEFAULT 'all',
    trash_talk BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active', -- active, paused, stopped, bankrupt
    current_balance VARCHAR(78),
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    profit_loss VARCHAR(78) DEFAULT '0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_sessions_owner ON agent_sessions(owner_address);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_strategy ON agent_sessions(strategy);

-- RLS Policies
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sessions (for leaderboards)
CREATE POLICY "Sessions are viewable by everyone" ON agent_sessions
    FOR SELECT USING (true);

-- Only service role can insert/update (API calls)
CREATE POLICY "Service can manage sessions" ON agent_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_agent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_sessions_updated_at ON agent_sessions;
CREATE TRIGGER agent_sessions_updated_at
    BEFORE UPDATE ON agent_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_sessions_updated_at();

SELECT 'agent_sessions table created successfully!' as status;
