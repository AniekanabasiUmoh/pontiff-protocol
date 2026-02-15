-- ============================================================
-- PONTIFF CASINO MODEL - CONSOLIDATED MIGRATION
-- Run this ONCE in the Supabase SQL Editor
-- Safe to re-run (fully idempotent)
-- ============================================================

-- ─── 1. USER BALANCES ───
CREATE TABLE IF NOT EXISTS user_balances (
    wallet_address TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handle existing columns from previous schema versions (rename to match current code)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_balances' AND column_name = 'available_balance') THEN
        ALTER TABLE user_balances RENAME COLUMN available_balance TO available;
    END IF;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_balances' AND column_name = 'frozen_balance') THEN
        ALTER TABLE user_balances RENAME COLUMN frozen_balance TO frozen;
    END IF;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Safely add columns if they don't exist (idempotent)
DO $$ BEGIN
    ALTER TABLE user_balances ADD COLUMN IF NOT EXISTS available NUMERIC DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE user_balances ADD COLUMN IF NOT EXISTS frozen NUMERIC DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE user_balances ADD COLUMN IF NOT EXISTS total_deposited NUMERIC DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE user_balances ADD COLUMN IF NOT EXISTS total_withdrawn NUMERIC DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE user_balances ADD COLUMN IF NOT EXISTS total_wagered NUMERIC DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE user_balances ADD COLUMN IF NOT EXISTS total_won NUMERIC DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE user_balances ADD CONSTRAINT user_balances_available_non_negative CHECK (available >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE user_balances ADD CONSTRAINT user_balances_frozen_non_negative CHECK (frozen >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. BALANCE TRANSACTIONS (Audit Log) ───
CREATE TABLE IF NOT EXISTS balance_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    type TEXT NOT NULL, -- DEPOSIT, WITHDRAW, WAGER, WIN, LOSS, REFUND, HOUSE_EDGE, CRUSADE_REWARD
    amount NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    game_id TEXT,
    game_type TEXT, -- RPS, POKER, CRUSADE
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_tx_wallet ON balance_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_balance_tx_type ON balance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_balance_tx_game ON balance_transactions(game_id);
CREATE INDEX IF NOT EXISTS idx_balance_tx_created ON balance_transactions(created_at DESC);

-- ─── 3. GAME SEEDS (Provably Fair) ───
CREATE TABLE IF NOT EXISTS game_seeds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id TEXT NOT NULL,
    game_type TEXT NOT NULL, -- RPS, POKER, CRUSADE
    server_seed_hash TEXT NOT NULL,
    server_seed TEXT, -- Revealed after game
    client_seed TEXT,
    nonce BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_seeds_game ON game_seeds(game_id);

-- ─── 4. CRUSADE PARTICIPANTS ───
CREATE TABLE IF NOT EXISTS crusade_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crusade_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    contribution NUMERIC DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crusade_participants_crusade ON crusade_participants(crusade_id);
CREATE INDEX IF NOT EXISTS idx_crusade_participants_wallet ON crusade_participants(wallet_address);

DO $$ BEGIN
    ALTER TABLE crusade_participants ADD CONSTRAINT unique_crusade_participant UNIQUE (crusade_id, wallet_address);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 5. ADD CASINO COLUMNS TO EXISTING TABLES ───

-- Add progress and reward_pool to crusades (lowercase) if they don't exist
DO $$ BEGIN
    ALTER TABLE crusades ADD COLUMN IF NOT EXISTS progress NUMERIC DEFAULT 0;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE crusades ADD COLUMN IF NOT EXISTS reward_pool NUMERIC DEFAULT 0;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE crusades ADD COLUMN IF NOT EXISTS entry_fee NUMERIC DEFAULT 100;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE crusades ADD COLUMN IF NOT EXISTS participant_count INT DEFAULT 0;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Add to "Crusade" (PascalCase) separately to be safe
DO $$ BEGIN
    ALTER TABLE "Crusade" ADD COLUMN IF NOT EXISTS progress NUMERIC DEFAULT 0;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Crusade" ADD COLUMN IF NOT EXISTS reward_pool NUMERIC DEFAULT 0;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Crusade" ADD COLUMN IF NOT EXISTS entry_fee NUMERIC DEFAULT 100;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Crusade" ADD COLUMN IF NOT EXISTS participant_count INT DEFAULT 0;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Add play_mode column to games (lowercase) table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE games ADD COLUMN IF NOT EXISTS play_mode TEXT DEFAULT 'on-chain';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Add play_mode column to "Game" (PascalCase) table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS play_mode TEXT DEFAULT 'on-chain';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ─── 6. ROW LEVEL SECURITY ───
-- NOTE: In Supabase, the service_role key BYPASSES RLS entirely.
-- All writes happen through the backend (service_role), so we only need
-- SELECT policies for anon/authenticated clients (e.g. RPS page history query).

ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE crusade_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies safely (idempotent re-run)
DROP POLICY IF EXISTS "Users can read own balance" ON user_balances;
DROP POLICY IF EXISTS "Service role can manage balances" ON user_balances;
DROP POLICY IF EXISTS "Users can read own transactions" ON balance_transactions;
DROP POLICY IF EXISTS "Service role can manage transactions" ON balance_transactions;
DROP POLICY IF EXISTS "Users can read own seeds" ON game_seeds;
DROP POLICY IF EXISTS "Service role can manage seeds" ON game_seeds;
DROP POLICY IF EXISTS "Users can read own crusade participation" ON crusade_participants;
DROP POLICY IF EXISTS "Service role can manage crusade participants" ON crusade_participants;
DROP POLICY IF EXISTS "Allow read all balances" ON user_balances;
DROP POLICY IF EXISTS "Allow read all transactions" ON balance_transactions;
DROP POLICY IF EXISTS "Allow read all seeds" ON game_seeds;
DROP POLICY IF EXISTS "Allow read all crusade participation" ON crusade_participants;

-- READ policies: allow authenticated/anon users to read
-- (Writes are only done via service_role which bypasses RLS)
CREATE POLICY "Allow read all balances" ON user_balances
    FOR SELECT USING (true);

CREATE POLICY "Allow read all transactions" ON balance_transactions
    FOR SELECT USING (true);

CREATE POLICY "Allow read all seeds" ON game_seeds
    FOR SELECT USING (true);

CREATE POLICY "Allow read all crusade participation" ON crusade_participants
    FOR SELECT USING (true);

-- ─── 7. UPDATED_AT TRIGGER ───

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_balances_updated_at ON user_balances;
CREATE TRIGGER update_user_balances_updated_at
    BEFORE UPDATE ON user_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ─── 8. VERIFICATION ───
SELECT 'user_balances' AS table_name, COUNT(*) AS row_count FROM user_balances
UNION ALL
SELECT 'balance_transactions', COUNT(*) FROM balance_transactions
UNION ALL
SELECT 'game_seeds', COUNT(*) FROM game_seeds
UNION ALL
SELECT 'crusade_participants', COUNT(*) FROM crusade_participants;

-- ─── 9. PVP & MATCHMAKING ───

-- Add agent_mode to agent_sessions if it doesn't exist
DO $$ BEGIN
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS agent_mode TEXT DEFAULT 'PvE'; -- PvE, PvP_Any, PvP_Target
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- PvP Matches history (Off-chain settlement, on-chain record)
CREATE TABLE IF NOT EXISTS pvp_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id TEXT NOT NULL, -- agent_id or wallet
    player2_id TEXT NOT NULL,
    game_type TEXT NOT NULL, -- RPS, POKER
    stake_amount NUMERIC NOT NULL,
    winner_id TEXT, -- NULL if draw
    status TEXT DEFAULT 'completed', -- completed, disputed
    logs JSONB, -- Game replay data
    server_seed TEXT, -- Provable fairness
    client_seed_1 TEXT,
    client_seed_2 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if table exists but columns don't
DO $$ BEGIN
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS player1_id TEXT;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS player2_id TEXT;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS game_type TEXT;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS stake_amount NUMERIC;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS winner_id TEXT;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS logs JSONB;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS server_seed TEXT;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS client_seed_1 TEXT;
    ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS client_seed_2 TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_pvp_matches_player1 ON pvp_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_player2 ON pvp_matches(player2_id);

-- Matchmaking Queue (For high-speed pairing)
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL UNIQUE,
    game_type TEXT NOT NULL,
    stake_range_min NUMERIC NOT NULL,
    stake_range_max NUMERIC NOT NULL,
    priority INT DEFAULT 0,
    status TEXT DEFAULT 'searching', -- searching, matched, fighting
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ GENERATED ALWAYS AS (joined_at + interval '5 minutes') STORED
);

-- Safely add columns if table exists but columns don't
DO $$ BEGIN
    ALTER TABLE matchmaking_queue ADD COLUMN IF NOT EXISTS agent_id TEXT;
    ALTER TABLE matchmaking_queue ADD COLUMN IF NOT EXISTS game_type TEXT;
    ALTER TABLE matchmaking_queue ADD COLUMN IF NOT EXISTS stake_range_min NUMERIC;
    ALTER TABLE matchmaking_queue ADD COLUMN IF NOT EXISTS stake_range_max NUMERIC;
    ALTER TABLE matchmaking_queue ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;
    ALTER TABLE matchmaking_queue ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'searching';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_game ON matchmaking_queue(game_type, stake_range_min);

-- RLS for new tables
ALTER TABLE pvp_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Read-only for users (Bots/Server manage writes)
CREATE POLICY "Allow read all pvp matches" ON pvp_matches FOR SELECT USING (true);
CREATE POLICY "Allow read matchmaking queue" ON matchmaking_queue FOR SELECT USING (true);
