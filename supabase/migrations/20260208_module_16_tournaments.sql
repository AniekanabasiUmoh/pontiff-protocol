-- =====================================================
-- Module 16: Marketing & Community - Tournament System
-- Holy Tournament, Bracket Management, Leaderboards
-- =====================================================

-- Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tournament_type VARCHAR(50) NOT NULL DEFAULT 'Holy',  -- 'Holy', 'Championship', 'Weekly'
    status VARCHAR(50) NOT NULL DEFAULT 'pending',         -- 'pending', 'active', 'completed', 'cancelled'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    prize_pool VARCHAR(50) NOT NULL,                      -- Total prize in GUILT tokens
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_type ON tournaments(tournament_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_created ON tournaments(created_at DESC);

-- Tournament Registrations Table
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    agent_name VARCHAR(255),
    agent_strategy VARCHAR(50),                           -- 'berzerker', 'merchant', 'disciple'
    registration_fee VARCHAR(50) DEFAULT '10',
    seed_number INTEGER,                                   -- Bracket seeding (1-indexed)
    final_placement INTEGER,                               -- 1st, 2nd, 3rd place
    prize_won VARCHAR(50) DEFAULT '0',
    nft_awarded BOOLEAN DEFAULT FALSE,
    nft_token_id INTEGER,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_wallet ON tournament_registrations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_registrations_placement ON tournament_registrations(final_placement);
CREATE INDEX IF NOT EXISTS idx_registrations_seed ON tournament_registrations(seed_number);

-- Tournament Brackets Table (Matches)
CREATE TABLE IF NOT EXISTS tournament_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    bracket_number INTEGER NOT NULL,                      -- Unique number within round
    round_number INTEGER NOT NULL,                         -- 1 = finals, 2 = semi-finals, etc.
    player1_wallet VARCHAR(42),
    player2_wallet VARCHAR(42),
    player1_score NUMERIC DEFAULT 0,
    player2_score NUMERIC DEFAULT 0,
    winner_wallet VARCHAR(42),
    game_id UUID,                                          -- Reference to actual game played
    status VARCHAR(50) DEFAULT 'pending',                  -- 'pending', 'active', 'completed', 'bye'
    match_timestamp TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brackets_tournament ON tournament_brackets(tournament_id);
CREATE INDEX IF NOT EXISTS idx_brackets_round ON tournament_brackets(round_number);
CREATE INDEX IF NOT EXISTS idx_brackets_status ON tournament_brackets(status);
CREATE INDEX IF NOT EXISTS idx_brackets_winner ON tournament_brackets(winner_wallet);
CREATE INDEX IF NOT EXISTS idx_brackets_players ON tournament_brackets(player1_wallet, player2_wallet);

-- Tournament Results Table (Final Leaderboard)
CREATE TABLE IF NOT EXISTS tournament_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,                                 -- 1st, 2nd, 3rd, etc.
    wallet_address VARCHAR(42) NOT NULL,
    agent_name VARCHAR(255),
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    total_prize VARCHAR(50) DEFAULT '0',
    nft_token_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_results_tournament ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_results_rank ON tournament_results(rank);
CREATE INDEX IF NOT EXISTS idx_results_wallet ON tournament_results(wallet_address);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get Active Tournaments
CREATE OR REPLACE FUNCTION get_active_tournaments()
RETURNS TABLE (
    tournament_id UUID,
    tournament_name VARCHAR,
    tournament_type VARCHAR,
    participants INTEGER,
    max_participants INTEGER,
    prize_pool VARCHAR,
    start_date TIMESTAMP WITH TIME ZONE,
    spots_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id as tournament_id,
        t.name as tournament_name,
        t.tournament_type,
        t.current_participants as participants,
        t.max_participants,
        t.prize_pool,
        t.start_date,
        (t.max_participants - t.current_participants) as spots_remaining
    FROM tournaments t
    WHERE t.status = 'active' OR t.status = 'pending'
    ORDER BY t.start_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Tournament Leaderboard
CREATE OR REPLACE FUNCTION get_tournament_leaderboard(tournament_uuid UUID)
RETURNS TABLE (
    rank INTEGER,
    wallet_address VARCHAR,
    agent_name VARCHAR,
    games_played INTEGER,
    games_won INTEGER,
    win_rate DECIMAL,
    total_prize VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tr.rank,
        tr.wallet_address,
        tr.agent_name,
        tr.games_played,
        tr.games_won,
        tr.win_rate,
        tr.total_prize
    FROM tournament_results tr
    WHERE tr.tournament_id = tournament_uuid
    ORDER BY tr.rank ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Player Tournament History
CREATE OR REPLACE FUNCTION get_player_tournament_history(player_wallet VARCHAR)
RETURNS TABLE (
    tournament_id UUID,
    tournament_name VARCHAR,
    final_placement INTEGER,
    prize_won VARCHAR,
    games_played INTEGER,
    games_won INTEGER,
    tournament_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id as tournament_id,
        t.name as tournament_name,
        tr.final_placement,
        tr.prize_won,
        tres.games_played,
        tres.games_won,
        t.start_date as tournament_date
    FROM tournament_registrations tr
    JOIN tournaments t ON tr.tournament_id = t.id
    LEFT JOIN tournament_results tres ON tres.tournament_id = t.id
        AND tres.wallet_address = tr.wallet_address
    WHERE tr.wallet_address = player_wallet
    ORDER BY t.start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Analytics Views
-- =====================================================

-- View: Tournament Statistics
CREATE OR REPLACE VIEW tournament_statistics AS
SELECT
    tournament_type,
    COUNT(*) as total_tournaments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_tournaments,
    COUNT(*) FILTER (WHERE status = 'active') as active_tournaments,
    AVG(current_participants) as avg_participants,
    SUM(CAST(prize_pool AS NUMERIC)) as total_prizes_distributed
FROM tournaments
GROUP BY tournament_type;

-- View: Top Tournament Players
CREATE OR REPLACE VIEW top_tournament_players AS
SELECT
    tr.wallet_address,
    COUNT(DISTINCT tr.tournament_id) as tournaments_entered,
    COUNT(*) FILTER (WHERE tr.final_placement = 1) as first_place_finishes,
    COUNT(*) FILTER (WHERE tr.final_placement <= 3) as podium_finishes,
    COALESCE(SUM(CAST(tr.prize_won AS NUMERIC)), 0) as total_winnings
FROM tournament_registrations tr
WHERE tr.final_placement IS NOT NULL
GROUP BY tr.wallet_address
ORDER BY total_winnings DESC
LIMIT 100;

-- View: Upcoming Tournaments
CREATE OR REPLACE VIEW upcoming_tournaments AS
SELECT
    t.id,
    t.name,
    t.tournament_type,
    t.status,
    t.current_participants,
    t.max_participants,
    (t.max_participants - t.current_participants) as spots_remaining,
    t.prize_pool,
    t.start_date,
    t.end_date
FROM tournaments t
WHERE t.status IN ('pending', 'active')
    AND t.start_date > NOW()
ORDER BY t.start_date ASC;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on tournament tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow read access to all authenticated users
CREATE POLICY "Allow read tournaments" ON tournaments FOR SELECT USING (TRUE);
CREATE POLICY "Allow insert tournaments" ON tournaments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow update tournaments" ON tournaments FOR UPDATE USING (TRUE);

CREATE POLICY "Allow read registrations" ON tournament_registrations FOR SELECT USING (TRUE);
CREATE POLICY "Allow insert registrations" ON tournament_registrations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow update own registrations" ON tournament_registrations FOR UPDATE
    USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Allow read brackets" ON tournament_brackets FOR SELECT USING (TRUE);
CREATE POLICY "Allow insert brackets" ON tournament_brackets FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow update brackets" ON tournament_brackets FOR UPDATE USING (TRUE);

CREATE POLICY "Allow read results" ON tournament_results FOR SELECT USING (TRUE);
CREATE POLICY "Allow insert results" ON tournament_results FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- Triggers
-- =====================================================

-- Trigger: Update updated_at timestamp on tournaments
CREATE OR REPLACE FUNCTION update_tournament_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournaments_timestamp
BEFORE UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION update_tournament_timestamp();

-- =====================================================
-- Migration Complete
-- =====================================================

COMMENT ON TABLE tournaments IS 'Module 16: Holy Tournament system - tournament metadata';
COMMENT ON TABLE tournament_registrations IS 'Module 16: Player registrations for tournaments';
COMMENT ON TABLE tournament_brackets IS 'Module 16: Tournament bracket matches (single elimination)';
COMMENT ON TABLE tournament_results IS 'Module 16: Final tournament results and leaderboards';
