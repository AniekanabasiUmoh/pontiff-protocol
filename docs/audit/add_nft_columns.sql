-- Add NFT columns to debates table
ALTER TABLE debates ADD COLUMN IF NOT EXISTS nft_token_id TEXT;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS nft_minted_at TIMESTAMPTZ;
