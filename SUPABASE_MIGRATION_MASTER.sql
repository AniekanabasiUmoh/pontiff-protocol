-- ============================================================
-- THE PONTIFF - COMPLETE SUPABASE MIGRATION
-- ============================================================
-- This is the MASTER migration file containing all database
-- changes required for production deployment.
--
-- RUN THIS ON YOUR SUPABASE PROJECT IN ORDER:
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run
-- ============================================================

-- ============================================================
-- PART 1: CORE SCHEMA (Base Tables)
-- ============================================================

-- Cleanup old Prisma tables if they exist
DROP TABLE IF EXISTS "VaticanEntrant" CASCADE;
DROP TABLE IF EXISTS "Crusade" CASCADE;
DROP TABLE IF EXISTS "CompetitorAgent" CASCADE;
DROP TABLE IF EXISTS "Debate" CASCADE;
DROP TABLE IF EXISTS "Conversion" CASCADE;
DROP TABLE IF EXISTS "Leaderboard" CASCADE;
DROP TABLE IF EXISTS "Game" CASCADE;
DROP TABLE IF EXISTS "Confession" CASCADE;
DROP TABLE IF EXISTS "WorldEvent" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 1. VaticanEntrants
CREATE TABLE IF NOT EXISTS vatican_entrants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mon_paid TEXT NOT NULL
);

-- 2. CompetitorAgents
CREATE TABLE IF NOT EXISTS competitor_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    name TEXT,
    token_symbol TEXT,
    contract_address TEXT,
    status TEXT NOT NULL,
    threat_level TEXT NOT NULL DEFAULT 'Low',
    is_shadow BOOLEAN NOT NULL DEFAULT false,
    guilt_paid TEXT NOT NULL DEFAULT '0',
    market_cap TEXT NOT NULL DEFAULT '0',
    holders INTEGER NOT NULL DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 3. Crusades
CREATE TABLE IF NOT EXISTS crusades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_agent_id UUID REFERENCES competitor_agents(id) ON DELETE SET NULL,
    target_agent_handle TEXT,
    goal_type TEXT NOT NULL,
    status TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    participants JSONB,
    description TEXT
);

-- 4. Debates
CREATE TABLE IF NOT EXISTS debates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competitor_agent_id UUID REFERENCES competitor_agents(id) ON DELETE CASCADE,
    tweet_id TEXT NOT NULL,
    our_argument TEXT NOT NULL,
    their_argument TEXT,
    status TEXT NOT NULL,
    exchanges INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Conversions
CREATE TABLE IF NOT EXISTS conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competitor_agent_id UUID REFERENCES competitor_agents(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount TEXT,
    evidence JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    evidence_timestamp TIMESTAMP WITH TIME ZONE,
    signal_type TEXT,
    signal_data JSONB
);

-- 6. LeaderboardEntries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    category TEXT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    metadata JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_address, category)
);

-- 7. Games
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    game_type TEXT NOT NULL,
    wager TEXT NOT NULL,
    status TEXT NOT NULL,
    winner TEXT,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    game_data JSONB,
    commit_hash TEXT,
    reveal_salt TEXT,
    fairness_proof JSONB
);

-- 8. WorldEvents
CREATE TABLE IF NOT EXISTS world_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_wallet TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Indulgences
CREATE TABLE IF NOT EXISTS indulgences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    token_id TEXT,
    tier TEXT NOT NULL,
    price_paid TEXT NOT NULL,
    tx_hash TEXT,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. StakingRecords
CREATE TABLE IF NOT EXISTS staking_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    action TEXT NOT NULL,
    tx_hash TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. BetrayalEvents
CREATE TABLE IF NOT EXISTS betrayal_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epoch_number INTEGER NOT NULL,
    traitor_address TEXT NOT NULL,
    stake_slashed TEXT,
    outcome TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PART 2: AUTHENTICATION TABLES (SIWE)
-- ============================================================

-- Drop and recreate Auth Sessions table
DROP TABLE IF EXISTS auth_sessions CASCADE;
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    chain_id INTEGER NOT NULL,
    nonce TEXT NOT NULL,
    signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate Auth Nonces table
DROP TABLE IF EXISTS auth_nonces CASCADE;
CREATE TABLE auth_nonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nonce TEXT NOT NULL UNIQUE,
    wallet_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ============================================================
-- PART 3: GAME-SPECIFIC TABLES
-- ============================================================

-- RPS Move History
CREATE TABLE IF NOT EXISTS rps_move_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_address TEXT NOT NULL,
    move TEXT NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poker Hands
CREATE TABLE IF NOT EXISTS poker_hands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_address TEXT NOT NULL,
    hand_cards JSONB NOT NULL,
    community_cards JSONB,
    hand_strength INTEGER,
    hand_name TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poker Betting Rounds
CREATE TABLE IF NOT EXISTS poker_betting_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    round_type TEXT NOT NULL,
    player_action TEXT NOT NULL,
    amount TEXT,
    pot_size TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PART 4: JUDAS PROTOCOL TABLES
-- ============================================================

-- Judas Epochs
CREATE TABLE IF NOT EXISTS judas_epochs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epoch_number INTEGER NOT NULL UNIQUE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_loyal TEXT NOT NULL DEFAULT '0',
    total_betrayed TEXT NOT NULL DEFAULT '0',
    betrayal_percentage DOUBLE PRECISION,
    outcome TEXT,
    loyalist_multiplier TEXT,
    betrayer_multiplier TEXT,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Judas User Positions
CREATE TABLE IF NOT EXISTS judas_user_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    epoch_number INTEGER NOT NULL REFERENCES judas_epochs(epoch_number),
    staked_amount TEXT NOT NULL,
    is_betrayer BOOLEAN NOT NULL DEFAULT false,
    final_payout TEXT,
    claimed BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_address, epoch_number)
);

-- ============================================================
-- PART 5: AGENT DETECTION & CRUSADE TABLES
-- ============================================================

-- Detected Agents
CREATE TABLE IF NOT EXISTS detected_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    twitter_handle TEXT NOT NULL UNIQUE,
    display_name TEXT,
    contract_address TEXT,
    token_symbol TEXT,
    detection_method TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    threat_assessment JSONB,
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crusade Participants
CREATE TABLE IF NOT EXISTS crusade_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crusade_id UUID REFERENCES crusades(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    contribution_type TEXT,
    contribution_value TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crusade_id, wallet_address)
);

-- Crusade Milestones
CREATE TABLE IF NOT EXISTS crusade_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crusade_id UUID REFERENCES crusades(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL,
    description TEXT,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PART 6: DASHBOARD & WEBSOCKET TABLES
-- ============================================================

-- Dashboard Metrics Cache
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_key TEXT NOT NULL UNIQUE,
    metric_value JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WebSocket Events Queue
CREATE TABLE IF NOT EXISTS websocket_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    broadcast_to TEXT[],
    processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PART 7: INDEXES FOR PERFORMANCE
-- ============================================================

-- Auth indexes
CREATE INDEX IF NOT EXISTS idx_sessions_wallet ON auth_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_nonces_nonce ON auth_nonces(nonce);
CREATE INDEX IF NOT EXISTS idx_nonces_expires ON auth_nonces(expires_at);

-- Game indexes
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_type ON games(game_type);

-- RPS indexes
CREATE INDEX IF NOT EXISTS idx_rps_player ON rps_move_history(player_address);
CREATE INDEX IF NOT EXISTS idx_rps_timestamp ON rps_move_history(timestamp DESC);

-- Poker indexes
CREATE INDEX IF NOT EXISTS idx_poker_hands_game ON poker_hands(game_id);
CREATE INDEX IF NOT EXISTS idx_poker_betting_game ON poker_betting_rounds(game_id);

-- Judas indexes
CREATE INDEX IF NOT EXISTS idx_judas_epochs_number ON judas_epochs(epoch_number);
CREATE INDEX IF NOT EXISTS idx_judas_positions_wallet ON judas_user_positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_judas_positions_epoch ON judas_user_positions(epoch_number);

-- Agent detection indexes
CREATE INDEX IF NOT EXISTS idx_detected_agents_handle ON detected_agents(twitter_handle);

-- Crusade indexes
CREATE INDEX IF NOT EXISTS idx_crusade_participants_crusade ON crusade_participants(crusade_id);
CREATE INDEX IF NOT EXISTS idx_crusade_participants_wallet ON crusade_participants(wallet_address);

-- WebSocket indexes
CREATE INDEX IF NOT EXISTS idx_websocket_events_processed ON websocket_events(processed, created_at);

-- Leaderboard indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_category ON leaderboard_entries(category, score DESC);

-- ============================================================
-- PART 8: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE vatican_entrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crusades ENABLE ROW LEVEL SECURITY;
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE indulgences ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE betrayal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE rps_move_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_betting_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE judas_epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE judas_user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crusade_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE crusade_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE websocket_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 9: PUBLIC READ POLICIES (Transparency)
-- ============================================================

-- Drop existing read policies first to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read vatican_entrants" ON vatican_entrants;
    DROP POLICY IF EXISTS "Public read competitor_agents" ON competitor_agents;
    DROP POLICY IF EXISTS "Public read crusades" ON crusades;
    DROP POLICY IF EXISTS "Public read debates" ON debates;
    DROP POLICY IF EXISTS "Public read conversions" ON conversions;
    DROP POLICY IF EXISTS "Public read leaderboard_entries" ON leaderboard_entries;
    DROP POLICY IF EXISTS "Public read games" ON games;
    DROP POLICY IF EXISTS "Public read world_events" ON world_events;
    DROP POLICY IF EXISTS "Public read indulgences" ON indulgences;
    DROP POLICY IF EXISTS "Public read staking_records" ON staking_records;
    DROP POLICY IF EXISTS "Public read betrayal_events" ON betrayal_events;
    DROP POLICY IF EXISTS "Public read rps_move_history" ON rps_move_history;
    DROP POLICY IF EXISTS "Public read poker_hands" ON poker_hands;
    DROP POLICY IF EXISTS "Public read poker_betting_rounds" ON poker_betting_rounds;
    DROP POLICY IF EXISTS "Public read judas_epochs" ON judas_epochs;
    DROP POLICY IF EXISTS "Public read judas_user_positions" ON judas_user_positions;
    DROP POLICY IF EXISTS "Public read detected_agents" ON detected_agents;
    DROP POLICY IF EXISTS "Public read crusade_participants" ON crusade_participants;
    DROP POLICY IF EXISTS "Public read crusade_milestones" ON crusade_milestones;
    DROP POLICY IF EXISTS "Public read dashboard_metrics" ON dashboard_metrics;
    DROP POLICY IF EXISTS "Public read websocket_events" ON websocket_events;
    DROP POLICY IF EXISTS "Users read own sessions" ON auth_sessions;
END $$;

-- Create read policies
CREATE POLICY "Public read vatican_entrants" ON vatican_entrants FOR SELECT USING (true);
CREATE POLICY "Public read competitor_agents" ON competitor_agents FOR SELECT USING (true);
CREATE POLICY "Public read crusades" ON crusades FOR SELECT USING (true);
CREATE POLICY "Public read debates" ON debates FOR SELECT USING (true);
CREATE POLICY "Public read conversions" ON conversions FOR SELECT USING (true);
CREATE POLICY "Public read leaderboard_entries" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Public read games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read world_events" ON world_events FOR SELECT USING (true);
CREATE POLICY "Public read indulgences" ON indulgences FOR SELECT USING (true);
CREATE POLICY "Public read staking_records" ON staking_records FOR SELECT USING (true);
CREATE POLICY "Public read betrayal_events" ON betrayal_events FOR SELECT USING (true);
CREATE POLICY "Public read rps_move_history" ON rps_move_history FOR SELECT USING (true);
CREATE POLICY "Public read poker_hands" ON poker_hands FOR SELECT USING (true);
CREATE POLICY "Public read poker_betting_rounds" ON poker_betting_rounds FOR SELECT USING (true);
CREATE POLICY "Public read judas_epochs" ON judas_epochs FOR SELECT USING (true);
CREATE POLICY "Public read judas_user_positions" ON judas_user_positions FOR SELECT USING (true);
CREATE POLICY "Public read detected_agents" ON detected_agents FOR SELECT USING (true);
CREATE POLICY "Public read crusade_participants" ON crusade_participants FOR SELECT USING (true);
CREATE POLICY "Public read crusade_milestones" ON crusade_milestones FOR SELECT USING (true);
CREATE POLICY "Public read dashboard_metrics" ON dashboard_metrics FOR SELECT USING (true);
CREATE POLICY "Public read websocket_events" ON websocket_events FOR SELECT USING (true);

-- Auth policies (users can read their own sessions)
CREATE POLICY "Users read own sessions" ON auth_sessions FOR SELECT USING (auth.uid()::text = wallet_address);

-- ============================================================
-- PART 10: SERVICE ROLE WRITE POLICIES
-- ============================================================

-- Drop existing write policies first
DO $$
BEGIN
    DROP POLICY IF EXISTS "Service role write vatican_entrants" ON vatican_entrants;
    DROP POLICY IF EXISTS "Service role write competitor_agents" ON competitor_agents;
    DROP POLICY IF EXISTS "Service role write crusades" ON crusades;
    DROP POLICY IF EXISTS "Service role write debates" ON debates;
    DROP POLICY IF EXISTS "Service role write conversions" ON conversions;
    DROP POLICY IF EXISTS "Service role write leaderboard_entries" ON leaderboard_entries;
    DROP POLICY IF EXISTS "Service role write games" ON games;
    DROP POLICY IF EXISTS "Service role write world_events" ON world_events;
    DROP POLICY IF EXISTS "Service role write indulgences" ON indulgences;
    DROP POLICY IF EXISTS "Service role write staking_records" ON staking_records;
    DROP POLICY IF EXISTS "Service role write betrayal_events" ON betrayal_events;
    DROP POLICY IF EXISTS "Service role write auth_sessions" ON auth_sessions;
    DROP POLICY IF EXISTS "Service role write auth_nonces" ON auth_nonces;
    DROP POLICY IF EXISTS "Service role write rps_move_history" ON rps_move_history;
    DROP POLICY IF EXISTS "Service role write poker_hands" ON poker_hands;
    DROP POLICY IF EXISTS "Service role write poker_betting_rounds" ON poker_betting_rounds;
    DROP POLICY IF EXISTS "Service role write judas_epochs" ON judas_epochs;
    DROP POLICY IF EXISTS "Service role write judas_user_positions" ON judas_user_positions;
    DROP POLICY IF EXISTS "Service role write detected_agents" ON detected_agents;
    DROP POLICY IF EXISTS "Service role write crusade_participants" ON crusade_participants;
    DROP POLICY IF EXISTS "Service role write crusade_milestones" ON crusade_milestones;
    DROP POLICY IF EXISTS "Service role write dashboard_metrics" ON dashboard_metrics;
    DROP POLICY IF EXISTS "Service role write websocket_events" ON websocket_events;
END $$;

-- Create write policies
CREATE POLICY "Service role write vatican_entrants" ON vatican_entrants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write competitor_agents" ON competitor_agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write crusades" ON crusades FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write debates" ON debates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write conversions" ON conversions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write leaderboard_entries" ON leaderboard_entries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write games" ON games FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write world_events" ON world_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write indulgences" ON indulgences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write staking_records" ON staking_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write betrayal_events" ON betrayal_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write auth_sessions" ON auth_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write auth_nonces" ON auth_nonces FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write rps_move_history" ON rps_move_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write poker_hands" ON poker_hands FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write poker_betting_rounds" ON poker_betting_rounds FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write judas_epochs" ON judas_epochs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write judas_user_positions" ON judas_user_positions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write detected_agents" ON detected_agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write crusade_participants" ON crusade_participants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write crusade_milestones" ON crusade_milestones FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write dashboard_metrics" ON dashboard_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write websocket_events" ON websocket_events FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- PART 11: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('confession-images', 'confession-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies first
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access Confession Images" ON storage.objects;
    DROP POLICY IF EXISTS "Public Access Certificates" ON storage.objects;
END $$;

-- Create storage policies
CREATE POLICY "Public Access Confession Images" ON storage.objects FOR SELECT USING (bucket_id = 'confession-images');
CREATE POLICY "Public Access Certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');

-- ============================================================
-- PART 12: HELPER FUNCTIONS
-- ============================================================

-- Cleanup expired auth records
CREATE OR REPLACE FUNCTION cleanup_expired_auth()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_sessions WHERE expires_at < NOW();
  DELETE FROM auth_nonces WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Add comments for documentation
COMMENT ON TABLE auth_sessions IS 'Stores active SIWE authentication sessions';
COMMENT ON TABLE auth_nonces IS 'Stores nonces to prevent replay attacks';
COMMENT ON TABLE judas_epochs IS 'Tracks Judas Protocol epoch state and outcomes';
COMMENT ON TABLE poker_hands IS 'Records poker hands for provable fairness';
COMMENT ON TABLE rps_move_history IS 'Tracks RPS moves for pattern analysis';
COMMENT ON TABLE dashboard_metrics IS 'Cached dashboard metrics for performance';
COMMENT ON TABLE websocket_events IS 'Event queue for real-time WebSocket broadcasts';

SELECT 'Database migration completed successfully!' AS status;
