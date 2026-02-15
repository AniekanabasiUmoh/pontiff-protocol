-- ==========================================
-- PONTIFF PROTOCOL DEPLOYMENT MIGRATION v1
-- Generated: 2026-02-09
-- Contains: Tournaments, Cardinal Membership, Pope Election
-- ==========================================

-- 1. TOURNAMENT SYSTEM
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tournament_type TEXT DEFAULT 'Holy',
    status TEXT DEFAULT 'pending', -- 'pending', 'open', 'active', 'completed'
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    max_participants INTEGER DEFAULT 32,
    current_participants INTEGER DEFAULT 0,
    prize_pool NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    agent_name TEXT,
    agent_strategy TEXT,
    seed_number INTEGER,
    entry_paid NUMERIC DEFAULT 0,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tournament_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS public.tournament_brackets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    bracket_number INTEGER NOT NULL,
    player1_wallet TEXT,
    player2_wallet TEXT,
    winner_wallet TEXT,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
    game_id UUID, -- Reference to specific game instance if applicable
    match_timestamp TIMESTAMPTZ
);

-- RLS for Tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public read registrations" ON public.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Public read brackets" ON public.tournament_brackets FOR SELECT USING (true);

-- Service role policies (Backend Write Access)
CREATE POLICY "Service role write tournaments" ON public.tournaments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write registrations" ON public.tournament_registrations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write brackets" ON public.tournament_brackets FOR ALL USING (auth.role() = 'service_role');


-- 2. CARDINAL MEMBERSHIP
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.cardinal_members (
    wallet_address TEXT PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    tier TEXT NOT NULL DEFAULT 'cardinal',
    last_renewed_at TIMESTAMPTZ DEFAULT NOW(),
    is_pope BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT status_check CHECK (status IN ('active', 'expired', 'cancelled'))
);

ALTER TABLE public.cardinal_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read members" ON public.cardinal_members FOR SELECT USING (true);
CREATE POLICY "Service role manage members" ON public.cardinal_members FOR ALL USING (auth.role() = 'service_role');


-- 3. POPE ELECTION
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.pope_election_votes (
    voter_wallet TEXT PRIMARY KEY REFERENCES public.cardinal_members(wallet_address),
    candidate_wallet TEXT NOT NULL REFERENCES public.cardinal_members(wallet_address),
    term_date DATE NOT NULL DEFAULT CURRENT_DATE,
    casted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pope_election_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read votes" ON public.pope_election_votes FOR SELECT USING (true);
CREATE POLICY "Service role manage votes" ON public.pope_election_votes FOR ALL USING (auth.role() = 'service_role');

-- End of Migration
