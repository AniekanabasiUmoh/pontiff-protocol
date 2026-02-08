-- Migration: Audit Fixes and Missing Tables
-- Addresses critical issues identified in the comprehensive audit

-- 1. Add missing columns to existing tables

-- Add evidence timestamp to conversions table
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS evidence_timestamp TIMESTAMP WITH TIME ZONE;

-- Add game-specific fields to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_data JSONB; -- For storing moves, rounds, etc
ALTER TABLE games ADD COLUMN IF NOT EXISTS commit_hash TEXT; -- For commit-reveal fairness
ALTER TABLE games ADD COLUMN IF NOT EXISTS reveal_salt TEXT; -- For commit-reveal fairness
ALTER TABLE games ADD COLUMN IF NOT EXISTS fairness_proof JSONB; -- Provable fairness data

-- 2. Create RPS-specific tables for pattern analysis
CREATE TABLE IF NOT EXISTS rps_move_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_address TEXT NOT NULL,
    move TEXT NOT NULL, -- "rock", "paper", "scissors"
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rps_player ON rps_move_history(player_address);
CREATE INDEX IF NOT EXISTS idx_rps_timestamp ON rps_move_history(timestamp DESC);

-- 3. Create Poker-specific tables
CREATE TABLE IF NOT EXISTS poker_hands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_address TEXT NOT NULL,
    hand_cards JSONB NOT NULL, -- Array of card objects
    community_cards JSONB, -- Flop, turn, river
    hand_strength INTEGER, -- Numerical hand ranking
    hand_name TEXT, -- "Pair", "Flush", etc
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poker_betting_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    round_type TEXT NOT NULL, -- "pre-flop", "flop", "turn", "river"
    player_action TEXT NOT NULL, -- "bet", "call", "raise", "fold", "check"
    amount TEXT,
    pot_size TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Judas Protocol epoch tracking
CREATE TABLE IF NOT EXISTS judas_epochs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epoch_number INTEGER NOT NULL UNIQUE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_loyal TEXT NOT NULL DEFAULT '0',
    total_betrayed TEXT NOT NULL DEFAULT '0',
    betrayal_percentage DOUBLE PRECISION,
    outcome TEXT, -- "FAILED_COUP", "PARTIAL_COUP", "FULL_COUP"
    loyalist_multiplier TEXT,
    betrayer_multiplier TEXT,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE
);

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

-- 5. Create Twitter/Agent Detection tables
CREATE TABLE IF NOT EXISTS detected_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    twitter_handle TEXT NOT NULL UNIQUE,
    display_name TEXT,
    contract_address TEXT,
    token_symbol TEXT,
    detection_method TEXT NOT NULL, -- "twitter_search", "contract_validation", "manual"
    verification_status TEXT NOT NULL DEFAULT 'pending', -- "pending", "verified", "rejected"
    threat_assessment JSONB,
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Crusade tracking tables
CREATE TABLE IF NOT EXISTS crusade_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crusade_id UUID REFERENCES crusades(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    contribution_type TEXT, -- "debate", "conversion", "token_burn"
    contribution_value TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crusade_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS crusade_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crusade_id UUID REFERENCES crusades(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL, -- "25%", "50%", "75%", "100%"
    description TEXT,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Dashboard metrics cache
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_key TEXT NOT NULL UNIQUE,
    metric_value JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create WebSocket event queue
CREATE TABLE IF NOT EXISTS websocket_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    broadcast_to TEXT[], -- Array of user addresses (null = broadcast to all)
    processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_websocket_events_processed ON websocket_events(processed, created_at);

-- 9. Enable RLS on new tables
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

-- 10. Public read policies
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

-- 11. Service role write policies
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

-- 12. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_poker_hands_game ON poker_hands(game_id);
CREATE INDEX IF NOT EXISTS idx_poker_betting_game ON poker_betting_rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_judas_epochs_number ON judas_epochs(epoch_number);
CREATE INDEX IF NOT EXISTS idx_judas_positions_wallet ON judas_user_positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_judas_positions_epoch ON judas_user_positions(epoch_number);
CREATE INDEX IF NOT EXISTS idx_detected_agents_handle ON detected_agents(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_crusade_participants_crusade ON crusade_participants(crusade_id);
CREATE INDEX IF NOT EXISTS idx_crusade_participants_wallet ON crusade_participants(wallet_address);

-- 13. Add conversion tracking signal columns
ALTER TABLE conversions
    ADD COLUMN IF NOT EXISTS signal_type TEXT, -- "acknowledgment", "token_purchase", "retweet", "challenge"
    ADD COLUMN IF NOT EXISTS signal_data JSONB;

-- Update existing rows to have signal_type
UPDATE conversions SET signal_type = 'token_purchase' WHERE signal_type IS NULL;
