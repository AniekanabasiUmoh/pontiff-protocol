-- Migration: Performance Indexes (Audit Remediation)

-- High-traffic queries optimization
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- World Events (Activity Feed)
CREATE INDEX IF NOT EXISTS idx_world_events_wallet ON world_events(agent_wallet);
CREATE INDEX IF NOT EXISTS idx_world_events_timestamp ON world_events(timestamp DESC);

-- Leaderboard (Rankings)
CREATE INDEX IF NOT EXISTS idx_leaderboard_category ON leaderboard_entries(category, score DESC);

-- Staking History
CREATE INDEX IF NOT EXISTS idx_staking_wallet ON staking_records(wallet_address);

-- Judas Protocol
CREATE INDEX IF NOT EXISTS idx_betrayal_epoch ON betrayal_events(epoch_number);
