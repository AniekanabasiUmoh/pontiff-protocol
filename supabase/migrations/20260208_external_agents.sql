-- External Agents Tables for Module 7
-- Supports custom agent registration via API

-- External Agents Registry
CREATE TABLE IF NOT EXISTS external_agents (
    id BIGSERIAL PRIMARY KEY,
    agent_name VARCHAR(50) NOT NULL,
    session_wallet VARCHAR(42) NOT NULL UNIQUE,
    owner_address VARCHAR(42) NOT NULL,
    api_key_hash VARCHAR(66) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- External Agent Game History
CREATE TABLE IF NOT EXISTS external_agent_games (
    id BIGSERIAL PRIMARY KEY,
    agent_id BIGINT REFERENCES external_agents(id) ON DELETE CASCADE,
    game_type VARCHAR(20) NOT NULL, -- RPS, POKER, JUDAS
    move INTEGER,
    wager VARCHAR(50) NOT NULL,
    result VARCHAR(10), -- WIN, LOSS, DRAW
    payout VARCHAR(50),
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_agents_owner ON external_agents(owner_address);
CREATE INDEX IF NOT EXISTS idx_external_agents_session ON external_agents(session_wallet);
CREATE INDEX IF NOT EXISTS idx_external_agents_api_key ON external_agents(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_external_agent_games_agent ON external_agent_games(agent_id);
CREATE INDEX IF NOT EXISTS idx_external_agent_games_created ON external_agent_games(created_at DESC);

-- Enable Row Level Security
ALTER TABLE external_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_agent_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only service role can access)
CREATE POLICY "Service role can manage external_agents"
    ON external_agents
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can manage external_agent_games"
    ON external_agent_games
    USING (true)
    WITH CHECK (true);
