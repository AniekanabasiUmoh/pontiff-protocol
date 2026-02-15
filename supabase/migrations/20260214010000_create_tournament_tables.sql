-- Tournament supporting tables
-- Required by the tournament API routes

-- Tournament registrations
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    entry_paid TEXT NOT NULL DEFAULT '0',
    seed_number INTEGER NOT NULL DEFAULT 1,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tournament_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_wallet ON tournament_registrations(wallet_address);

-- Tournament brackets (matches)
CREATE TABLE IF NOT EXISTS tournament_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    bracket_number INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    player1_wallet TEXT,
    player2_wallet TEXT,
    winner_wallet TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | active | completed | bye
    match_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournament_brackets_tournament ON tournament_brackets(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_round ON tournament_brackets(tournament_id, round_number);

-- Tournament results (final standings)
CREATE TABLE IF NOT EXISTS tournament_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    rank INTEGER NOT NULL,
    games_won INTEGER NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    win_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    prize_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament ON tournament_results(tournament_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_results_rank ON tournament_results(tournament_id, rank);
