-- ============================================================
-- PONTIFF PVP SYSTEM - ENHANCEMENT MIGRATION
-- Run AFTER 001_casino_tables.sql
-- Safe to re-run (fully idempotent)
-- ============================================================

-- ─── 1. PVP MATCHES TABLE ───
CREATE TABLE IF NOT EXISTS pvp_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id TEXT NOT NULL,    -- agent_session_id or wallet
    player2_id TEXT NOT NULL,
    game_type TEXT NOT NULL,     -- RPS, POKER
    stake_amount NUMERIC NOT NULL,
    winner_id TEXT,              -- NULL if draw
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled, disputed
    round_data JSONB DEFAULT '[]', -- [{round: 1, p1_move: 1, p2_move: 2, winner: 'p2'}, ...]
    best_of INT DEFAULT 3,
    house_fee NUMERIC DEFAULT 0,
    duration_ms INT,
    elo_change_p1 INT DEFAULT 0,
    elo_change_p2 INT DEFAULT 0,
    server_seed TEXT,
    client_seed_1 TEXT,
    client_seed_2 TEXT,
    logs JSONB DEFAULT '{}',
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column adds for pvp_matches
DO $$ BEGIN
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS round_data JSONB DEFAULT '[]';
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS best_of INT DEFAULT 3;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS house_fee NUMERIC DEFAULT 0;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS duration_ms INT;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS elo_change_p1 INT DEFAULT 0;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS elo_change_p2 INT DEFAULT 0;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_pvp_matches_player1 ON pvp_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_player2 ON pvp_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_status ON pvp_matches(status);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_created ON pvp_matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_game_type ON pvp_matches(game_type);

-- ─── 2. MATCHMAKING QUEUE TABLE ───
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    session_id UUID,
    game_type TEXT NOT NULL,      -- RPS, POKER
    stake_amount NUMERIC NOT NULL,
    stake_range_min NUMERIC NOT NULL,
    stake_range_max NUMERIC NOT NULL,
    strategy TEXT,                 -- berzerker, merchant, disciple
    elo_rating INT DEFAULT 1000,
    priority INT DEFAULT 0,
    status TEXT DEFAULT 'searching', -- searching, matched, fighting, expired
    matched_with UUID,            -- FK to another queue entry
    match_id UUID,                -- FK to pvp_matches
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + interval '5 minutes')
);

-- Unique constraint: one agent can only be in queue once
DO $$ BEGIN
    ALTER TABLE matchmaking_queue ADD CONSTRAINT uq_matchmaking_agent UNIQUE (agent_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_game ON matchmaking_queue(game_type, stake_range_min);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_status ON matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_expires ON matchmaking_queue(expires_at);

-- ─── 3. ENHANCE AGENT_SESSIONS WITH PVP COLUMNS ───
DO $$ BEGIN
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS agent_mode TEXT DEFAULT 'PvE';
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS pvp_wins INT DEFAULT 0;
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS pvp_losses INT DEFAULT 0;
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS pvp_draws INT DEFAULT 0;
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS elo_rating INT DEFAULT 1000;
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS pvp_earnings NUMERIC DEFAULT 0;
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS target_archetype TEXT;
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS target_rival TEXT;
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS pvp_aggression NUMERIC DEFAULT 0.5;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ─── 4. AGENT ESCROW TABLE ───
CREATE TABLE IF NOT EXISTS agent_escrow (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    session_id UUID,
    match_id UUID,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'locked', -- locked, released, refunded
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_escrow_agent ON agent_escrow(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_escrow_match ON agent_escrow(match_id);
CREATE INDEX IF NOT EXISTS idx_agent_escrow_status ON agent_escrow(status);

-- ─── 5. PVP LEADERBOARD VIEW ───
-- Drop and recreate for idempotency
DROP VIEW IF EXISTS pvp_leaderboard;

CREATE VIEW pvp_leaderboard AS
SELECT
    a.id AS session_id,
    a.user_wallet,
    a.strategy,
    a.agent_mode,
    COALESCE(a.pvp_wins, 0) AS wins,
    COALESCE(a.pvp_losses, 0) AS losses,
    COALESCE(a.pvp_draws, 0) AS draws,
    COALESCE(a.elo_rating, 1000) AS elo_rating,
    COALESCE(a.pvp_earnings, 0) AS total_earnings,
    CASE WHEN COALESCE(a.pvp_wins, 0) + COALESCE(a.pvp_losses, 0) > 0
         THEN ROUND(COALESCE(a.pvp_wins, 0)::NUMERIC / (COALESCE(a.pvp_wins, 0) + COALESCE(a.pvp_losses, 0)) * 100, 1)
         ELSE 0
    END AS win_rate,
    a.status,
    a.created_at
FROM agent_sessions a
WHERE a.agent_mode IN ('PvP_Any', 'PvP_Target')
   OR COALESCE(a.pvp_wins, 0) + COALESCE(a.pvp_losses, 0) > 0
ORDER BY COALESCE(a.elo_rating, 1000) DESC, COALESCE(a.pvp_earnings, 0) DESC;

-- ─── 6. RLS FOR NEW TABLES ───
ALTER TABLE pvp_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_escrow ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read all pvp matches" ON pvp_matches;
DROP POLICY IF EXISTS "Allow read matchmaking queue" ON matchmaking_queue;
DROP POLICY IF EXISTS "Allow read agent escrow" ON agent_escrow;

CREATE POLICY "Allow read all pvp matches" ON pvp_matches FOR SELECT USING (true);
CREATE POLICY "Allow read matchmaking queue" ON matchmaking_queue FOR SELECT USING (true);
CREATE POLICY "Allow read agent escrow" ON agent_escrow FOR SELECT USING (true);

-- ─── 7. HELPER FUNCTIONS ───

-- Cleanup expired queue entries
CREATE OR REPLACE FUNCTION cleanup_expired_queue()
RETURNS void AS $$
BEGIN
    DELETE FROM matchmaking_queue
    WHERE status = 'searching'
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Idempotent match settlement guard
CREATE OR REPLACE FUNCTION settle_pvp_match(
    p_match_id UUID,
    p_winner_id TEXT,
    p_round_data JSONB,
    p_house_fee NUMERIC,
    p_duration_ms INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    -- Lock the row
    SELECT status INTO v_current_status
    FROM pvp_matches
    WHERE id = p_match_id
    FOR UPDATE;

    -- Idempotency: already settled
    IF v_current_status = 'completed' THEN
        RETURN FALSE;
    END IF;

    UPDATE pvp_matches SET
        winner_id = p_winner_id,
        round_data = p_round_data,
        house_fee = p_house_fee,
        duration_ms = p_duration_ms,
        status = 'completed',
        settled_at = NOW()
    WHERE id = p_match_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ELO calculation helper
CREATE OR REPLACE FUNCTION calculate_elo(
    p_rating_a INT,
    p_rating_b INT,
    p_score_a NUMERIC  -- 1.0 = win, 0.5 = draw, 0.0 = loss
)
RETURNS INT AS $$
DECLARE
    k CONSTANT INT := 32;
    expected_a NUMERIC;
    new_rating INT;
BEGIN
    expected_a := 1.0 / (1.0 + POWER(10.0, (p_rating_b - p_rating_a)::NUMERIC / 400.0));
    new_rating := p_rating_a + ROUND(k * (p_score_a - expected_a));
    RETURN GREATEST(100, new_rating); -- Floor at 100
END;
$$ LANGUAGE plpgsql;

-- ─── 8. VERIFICATION ───
SELECT 'pvp_matches' AS table_name, COUNT(*) AS row_count FROM pvp_matches
UNION ALL
SELECT 'matchmaking_queue', COUNT(*) FROM matchmaking_queue
UNION ALL
SELECT 'agent_escrow', COUNT(*) FROM agent_escrow;
