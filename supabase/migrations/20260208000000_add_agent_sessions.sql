-- Create agent_sessions table
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    session_wallet TEXT NOT NULL,
    strategy TEXT NOT NULL, -- 'berzerker', 'merchant', 'disciple'
    starting_balance NUMERIC,
    current_balance NUMERIC,
    stop_loss NUMERIC,
    take_profit NUMERIC,
    status TEXT DEFAULT 'active', -- 'active', 'stopped', 'expired'
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_wallet ON agent_sessions(user_wallet);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session_wallet ON agent_sessions(session_wallet);
