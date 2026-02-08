-- Module 5: Session Wallet System - Agent Sessions Table
-- Track autonomous AI agent sessions playing on behalf of users

CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    session_wallet TEXT NOT NULL UNIQUE,
    strategy TEXT NOT NULL CHECK (strategy IN ('berzerker', 'merchant', 'disciple')),
    starting_balance NUMERIC NOT NULL,
    current_balance NUMERIC NOT NULL,
    stop_loss NUMERIC NOT NULL,
    take_profit NUMERIC,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'expired', 'completed')),
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_game_at TIMESTAMP WITH TIME ZONE,
    stop_reason TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_wallet ON agent_sessions(user_wallet);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session_wallet ON agent_sessions(session_wallet);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_expires_at ON agent_sessions(expires_at);

-- Function to increment games played counter
CREATE OR REPLACE FUNCTION increment_games_played(session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agent_sessions
  SET
    games_played = games_played + 1,
    last_game_at = NOW()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update session balance
CREATE OR REPLACE FUNCTION update_session_balance(
  session_id UUID,
  new_balance NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE agent_sessions
  SET
    current_balance = new_balance,
    games_played = games_played + 1,
    last_game_at = NOW()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to stop a session
CREATE OR REPLACE FUNCTION stop_agent_session(
  session_id UUID,
  reason TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE agent_sessions
  SET
    status = 'stopped',
    stop_reason = reason
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Comment documentation
COMMENT ON TABLE agent_sessions IS 'Tracks autonomous AI agent sessions that play games on behalf of users';
COMMENT ON COLUMN agent_sessions.strategy IS 'Agent strategy: berzerker (high risk), merchant (medium risk), disciple (low risk/staking)';
COMMENT ON COLUMN agent_sessions.status IS 'Session status: active (running), stopped (manual/auto stop), expired (time limit), completed (take profit reached)';
COMMENT ON COLUMN agent_sessions.stop_loss IS 'Minimum balance threshold - agent stops if balance drops below this';
COMMENT ON COLUMN agent_sessions.take_profit IS 'Optional profit target - agent stops if balance reaches this';
