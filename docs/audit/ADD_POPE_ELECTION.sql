-- Add column to tracking who is Pope
ALTER TABLE public.cardinal_members 
ADD COLUMN IF NOT EXISTS is_pope BOOLEAN DEFAULT FALSE;

-- Create table for tracking votes
CREATE TABLE IF NOT EXISTS public.pope_election_votes (
    voter_wallet TEXT PRIMARY KEY REFERENCES public.cardinal_members(wallet_address),
    candidate_wallet TEXT NOT NULL REFERENCES public.cardinal_members(wallet_address),
    term_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Tracks which election term (e.g. 1st of month)
    casted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (safe to re-run)
ALTER TABLE pope_election_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Public read election" ON pope_election_votes;
DROP POLICY IF EXISTS "Service role manage election" ON pope_election_votes;

-- Allow public reads
CREATE POLICY "Public read election" ON pope_election_votes
    FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role manage election" ON pope_election_votes
    FOR ALL USING (auth.role() = 'service_role');

-- Also need same for cardinal_members
ALTER TABLE cardinal_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Public read cardinals" ON cardinal_members;

CREATE POLICY "Public read cardinals" ON cardinal_members FOR SELECT USING (true);
