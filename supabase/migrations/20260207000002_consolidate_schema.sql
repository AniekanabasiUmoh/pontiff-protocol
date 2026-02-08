-- Migration: Consolidate Schema and Remove Prisma Artifacts
-- 0. Cleanup (if old tables exist from Prisma)
DROP TABLE IF EXISTS "VaticanEntrant" CASCADE;
DROP TABLE IF EXISTS "Crusade" CASCADE;
DROP TABLE IF EXISTS "CompetitorAgent" CASCADE;
DROP TABLE IF EXISTS "Debate" CASCADE;
DROP TABLE IF EXISTS "Conversion" CASCADE;
DROP TABLE IF EXISTS "Leaderboard" CASCADE;
DROP TABLE IF EXISTS "Game" CASCADE;
DROP TABLE IF EXISTS "Confession" CASCADE;
DROP TABLE IF EXISTS "WorldEvent" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 1. VaticanEntrants (was VaticanEntrant)
CREATE TABLE IF NOT EXISTS vatican_entrants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mon_paid TEXT NOT NULL
);

-- 2. CompetitorAgents (was CompetitorAgent)
CREATE TABLE IF NOT EXISTS competitor_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    name TEXT,
    token_symbol TEXT,
    contract_address TEXT,
    status TEXT NOT NULL,
    threat_level TEXT NOT NULL DEFAULT 'Low', -- Low, Medium, High, Heretic
    is_shadow BOOLEAN NOT NULL DEFAULT false,
    guilt_paid TEXT NOT NULL DEFAULT '0',
    market_cap TEXT NOT NULL DEFAULT '0',
    holders INTEGER NOT NULL DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 3. Crusades (was Crusade)
CREATE TABLE IF NOT EXISTS crusades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_agent_id UUID REFERENCES competitor_agents(id) ON DELETE SET NULL, -- Better ref
    target_agent_handle TEXT, -- Redundant but useful if ref is null
    goal_type TEXT NOT NULL, -- "Conversion", "Destruction"
    status TEXT NOT NULL, -- "Active", "Victory", "Defeat"
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    participants JSONB,
    description TEXT
);

-- 4. Debates (was Debate)
CREATE TABLE IF NOT EXISTS debates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competitor_agent_id UUID REFERENCES competitor_agents(id) ON DELETE CASCADE,
    tweet_id TEXT NOT NULL,
    our_argument TEXT NOT NULL,
    their_argument TEXT,
    status TEXT NOT NULL, -- "Pending", "Active", "Won", "Lost"
    exchanges INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Conversions (was Conversion)
CREATE TABLE IF NOT EXISTS conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competitor_agent_id UUID REFERENCES competitor_agents(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- "Partial", "Full"
    amount TEXT,
    evidence JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. LeaderboardEntries (was Leaderboard)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    category TEXT NOT NULL, -- "Sinner", "Saint", "Heretic"
    score DOUBLE PRECISION NOT NULL,
    metadata JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_address, category)
);

-- 7. Games (was Game)
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1 TEXT NOT NULL, -- Wallet Address
    player2 TEXT NOT NULL, -- Wallet Address (or 'ThePontiff')
    game_type TEXT NOT NULL, -- "RPS", "Poker", "Judas"
    wager TEXT NOT NULL,
    status TEXT NOT NULL, -- "Pending", "Active", "Completed"
    winner TEXT,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. WorldEvents (was WorldEvent)
CREATE TABLE IF NOT EXISTS world_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_wallet TEXT,
    event_type TEXT NOT NULL, -- "Confess", "Stake", "Betray", "Game", "Debate"
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Indulgences (New - NFT purchase records)
CREATE TABLE IF NOT EXISTS indulgences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    token_id TEXT, -- NFT Token ID if applicable
    tier TEXT NOT NULL, -- "Minor", "Mortal", "Cardinal"
    price_paid TEXT NOT NULL,
    tx_hash TEXT,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. StakingRecords (New - History of stakes)
CREATE TABLE IF NOT EXISTS staking_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    action TEXT NOT NULL, -- "Stake", "Unstake", "Claim"
    tx_hash TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. BetrayalEvents (New - Judas Protocol state)
CREATE TABLE IF NOT EXISTS betrayal_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epoch_number INTEGER NOT NULL,
    traitor_address TEXT NOT NULL,
    stake_slashed TEXT,
    outcome TEXT, -- "Success", "Failed"
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE vatican_entrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crusades ENABLE ROW LEVEL SECURITY;
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE indulgences ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE betrayal_events ENABLE ROW LEVEL SECURITY;

-- Policies: Public Read for Transparency (The "Glass Box" Standard)
CREATE POLICY "Public read vatican_entrants" ON vatican_entrants FOR SELECT USING (true);
CREATE POLICY "Public read competitor_agents" ON competitor_agents FOR SELECT USING (true);
CREATE POLICY "Public read crusades" ON crusades FOR SELECT USING (true);
CREATE POLICY "Public read debates" ON debates FOR SELECT USING (true);
CREATE POLICY "Public read conversions" ON conversions FOR SELECT USING (true);
CREATE POLICY "Public read leaderboard_entries" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Public read games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read world_events" ON world_events FOR SELECT USING (true);
CREATE POLICY "Public read indulgences" ON indulgences FOR SELECT USING (true);
CREATE POLICY "Public read staking_records" ON staking_records FOR SELECT USING (true);
CREATE POLICY "Public read betrayal_events" ON betrayal_events FOR SELECT USING (true);

-- Policies: Service Role Write (Backend Actions)
CREATE POLICY "Service role write vatican_entrants" ON vatican_entrants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write competitor_agents" ON competitor_agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write crusades" ON crusades FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write debates" ON debates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write conversions" ON conversions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write leaderboard_entries" ON leaderboard_entries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write games" ON games FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write world_events" ON world_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write indulgences" ON indulgences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write staking_records" ON staking_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write betrayal_events" ON betrayal_events FOR ALL USING (auth.role() = 'service_role');

-- Storage Buckets Configuration (via SQL extensions if available, or just keeping note)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('confession-images', 'confession-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Confession Images" ON storage.objects FOR SELECT USING (bucket_id = 'confession-images');
CREATE POLICY "Public Access Certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
