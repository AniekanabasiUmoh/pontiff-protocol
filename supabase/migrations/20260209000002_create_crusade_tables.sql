-- =====================================================
-- CRUSADE SYSTEM TABLES
-- Ensures tables exist for crusade persistence
-- =====================================================

-- Crusade proposals table
CREATE TABLE IF NOT EXISTS crusade_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crusade_id VARCHAR(100) UNIQUE NOT NULL,
    target_agent VARCHAR(100) NOT NULL,
    target_twitter VARCHAR(100),
    target_token VARCHAR(42),
    target_market_cap DECIMAL(20, 2) DEFAULT 0,
    target_volume DECIMAL(20, 2) DEFAULT 0,
    threat_level VARCHAR(20) DEFAULT 'MEDIUM',
    is_religious BOOLEAN DEFAULT false,
    proposed_by VARCHAR(42) NOT NULL,
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'VOTING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crusade votes table
CREATE TABLE IF NOT EXISTS crusade_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crusade_id VARCHAR(100) NOT NULL,
    voter VARCHAR(42) NOT NULL,
    vote VARCHAR(10) NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crusade_id, voter)
);

-- Crusade results table
CREATE TABLE IF NOT EXISTS crusade_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crusade_id VARCHAR(100) NOT NULL REFERENCES crusade_proposals(crusade_id),
    outcome VARCHAR(20) NOT NULL,
    spoils DECIMAL(20, 2) DEFAULT 0,
    narrative TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crusades (challenges) table
CREATE TABLE IF NOT EXISTS crusades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_agent VARCHAR(100) NOT NULL,
    target_token VARCHAR(42),
    challenge_text TEXT,
    status VARCHAR(20) DEFAULT 'CHALLENGED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crusade_proposals_status ON crusade_proposals(status);
CREATE INDEX IF NOT EXISTS idx_crusade_proposals_proposed_by ON crusade_proposals(proposed_by);
CREATE INDEX IF NOT EXISTS idx_crusade_votes_crusade ON crusade_votes(crusade_id);
CREATE INDEX IF NOT EXISTS idx_crusade_results_crusade ON crusade_results(crusade_id);

-- RLS Policies
ALTER TABLE crusade_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crusade_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crusade_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE crusades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crusades viewable by all" ON crusade_proposals FOR SELECT USING (true);
CREATE POLICY "Votes viewable by all" ON crusade_votes FOR SELECT USING (true);
CREATE POLICY "Results viewable by all" ON crusade_results FOR SELECT USING (true);
CREATE POLICY "Crusades challenges viewable by all" ON crusades FOR SELECT USING (true);

SELECT 'Crusade tables created successfully!' as status;
