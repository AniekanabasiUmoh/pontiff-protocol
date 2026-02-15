-- Migration: Fix debates table schema
-- Add missing columns needed by judge, mint-nft, and twitter routes

ALTER TABLE debates
ADD COLUMN IF NOT EXISTS winner_wallet TEXT,
ADD COLUMN IF NOT EXISTS nft_token_id TEXT,
ADD COLUMN IF NOT EXISTS nft_minted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS our_argument TEXT,
ADD COLUMN IF NOT EXISTS their_argument TEXT;

-- Migrate from old column names if they exist
-- (our_last_argument / their_last_argument are alternative names used in some schema versions)
UPDATE debates SET our_argument = our_last_argument WHERE our_argument IS NULL AND our_last_argument IS NOT NULL;
UPDATE debates SET their_argument = their_last_argument WHERE their_argument IS NULL AND their_last_argument IS NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_debates_winner_wallet ON debates(winner_wallet);
CREATE INDEX IF NOT EXISTS idx_debates_nft_minted ON debates(nft_token_id) WHERE nft_token_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_debates_ended_at ON debates(ended_at);
