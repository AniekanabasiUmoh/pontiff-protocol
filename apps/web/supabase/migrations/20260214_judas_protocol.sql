-- Epoch resolution history
CREATE TABLE IF NOT EXISTS judas_epochs (
    id SERIAL PRIMARY KEY,
    epoch_id INTEGER NOT NULL UNIQUE,
    tournament_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    total_loyal NUMERIC NOT NULL DEFAULT 0,
    total_betrayed NUMERIC NOT NULL DEFAULT 0,
    betrayal_pct NUMERIC NOT NULL DEFAULT 0,
    outcome TEXT NOT NULL, -- 'FAILED_COUP' | 'PARTIAL_COUP' | 'FULL_COUP'
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tx_hash TEXT NOT NULL
);

-- Pontiff participation log (prevent double-staking)
CREATE TABLE IF NOT EXISTS judas_pontiff_log (
    id SERIAL PRIMARY KEY,
    epoch_id INTEGER NOT NULL UNIQUE,
    action TEXT NOT NULL, -- 'COOPERATE' | 'BETRAY'
    tx_hash TEXT,
    staked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Player epoch snapshots (optional but useful for leaderboard)
CREATE TABLE IF NOT EXISTS judas_player_epochs (
    id SERIAL PRIMARY KEY,
    epoch_id INTEGER NOT NULL,
    player_address TEXT NOT NULL,
    action TEXT NOT NULL, -- 'COOPERATE' | 'BETRAY' | 'WITHDRAW'
    stake_amount NUMERIC NOT NULL,
    multiplier NUMERIC, -- applied at resolution
    pnl NUMERIC,
    tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
