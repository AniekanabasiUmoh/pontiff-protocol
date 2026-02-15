-- Add table for tracking Cardinal memberships
CREATE TABLE IF NOT EXISTS public.cardinal_members (
    wallet_address TEXT PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired'
    tier TEXT NOT NULL DEFAULT 'cardinal',
    last_renewed_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT status_check CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- RLS Policies
ALTER TABLE public.cardinal_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read membership status (public ledger)
CREATE POLICY "Public read access" ON public.cardinal_members
    FOR SELECT USING (true);

-- Allow backend (service role) to manage memberships
CREATE POLICY "Service role full access" ON public.cardinal_members
    FOR ALL USING (auth.role() = 'service_role');
