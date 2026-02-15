-- =====================================================
-- PONTIFF COMPREHENSIVE FIX & SEED SCRIPT
-- VERIFIED AGAINST LIVE DATABASE (Feb 9, 2026)
-- =====================================================
-- 
-- VERIFIED SCHEMA TYPES AND REQUIRED COLUMNS:
-- 
-- tournaments:
--   - id: UUID (required)
--   - name: VARCHAR (required)
--   - tournament_type: VARCHAR (default 'Holy')
--   - status: VARCHAR (required, default 'pending')
--   - start_date: TIMESTAMP WITH TIME ZONE (REQUIRED - NOT NULL)
--   - end_date: TIMESTAMP WITH TIME ZONE (REQUIRED - NOT NULL)
--   - max_participants: INTEGER (required)
--   - current_participants: INTEGER (default 0)
--   - prize_pool: VARCHAR (REQUIRED - NOT NULL)
--
-- debates.id: TEXT
-- conversions.id: TEXT
-- competitor_agents.id: TEXT
-- confessions.id: UUID (auto-generated)
-- cardinal_memberships.id: UUID (auto-generated)
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: FIX CARDINAL_MEMBERSHIPS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cardinal_memberships' AND column_name = 'payment_amount') THEN
        ALTER TABLE cardinal_memberships ADD COLUMN payment_amount VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cardinal_memberships' AND column_name = 'paymentAmount') THEN
        ALTER TABLE cardinal_memberships ADD COLUMN "paymentAmount" VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cardinal_memberships' AND column_name = 'walletAddress') THEN
        ALTER TABLE cardinal_memberships ADD COLUMN "walletAddress" VARCHAR(42);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cardinal_memberships' AND column_name = 'auto_renew') THEN
        ALTER TABLE cardinal_memberships ADD COLUMN auto_renew BOOLEAN DEFAULT false;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cardinal memberships: %', SQLERRM;
END $$;

UPDATE cardinal_memberships 
SET "paymentAmount" = COALESCE("paymentAmount", payment_amount),
    "walletAddress" = COALESCE("walletAddress", wallet_address)
WHERE "paymentAmount" IS NULL OR "walletAddress" IS NULL;

-- =====================================================
-- PART 2: FIX AGENT_SESSIONS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' AND column_name = 'tx_hash') THEN
        ALTER TABLE agent_sessions ADD COLUMN tx_hash VARCHAR(66);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' AND column_name = 'strategy_index') THEN
        ALTER TABLE agent_sessions ADD COLUMN strategy_index INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' AND column_name = 'trash_talk') THEN
        ALTER TABLE agent_sessions ADD COLUMN trash_talk BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' AND column_name = 'max_wager') THEN
        ALTER TABLE agent_sessions ADD COLUMN max_wager VARCHAR(78);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' AND column_name = 'game_type') THEN
        ALTER TABLE agent_sessions ADD COLUMN game_type VARCHAR(20) DEFAULT 'all';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' AND column_name = 'profit_loss') THEN
        ALTER TABLE agent_sessions ADD COLUMN profit_loss VARCHAR(78) DEFAULT '0';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' AND column_name = 'stopped_at') THEN
        ALTER TABLE agent_sessions ADD COLUMN stopped_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' AND column_name = 'total_wins') THEN
        ALTER TABLE agent_sessions ADD COLUMN total_wins INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' AND column_name = 'total_losses') THEN
        ALTER TABLE agent_sessions ADD COLUMN total_losses INTEGER DEFAULT 0;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'agent_sessions: %', SQLERRM;
END $$;

-- =====================================================
-- PART 3: FIX CONFESSIONS
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'confessions' 
        AND column_name = 'roast_text' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE confessions ALTER COLUMN roast_text DROP NOT NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'roast_text: %', SQLERRM;
END $$;

-- =====================================================
-- PART 4: CREATE CRUSADE PROPOSALS TABLE
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_crusade_proposals_status ON crusade_proposals(status);

-- =====================================================
-- PART 5: CREATE CRUSADE VOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS crusade_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crusade_id VARCHAR(100) NOT NULL,
    voter VARCHAR(42) NOT NULL,
    vote VARCHAR(10) NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crusade_id, voter)
);

-- =====================================================
-- PART 6: CREATE CRUSADE RESULTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS crusade_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crusade_id VARCHAR(100) NOT NULL,
    outcome VARCHAR(20) NOT NULL,
    spoils DECIMAL(20, 2) DEFAULT 0,
    narrative TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 7: CREATE GAME RESULTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL,
    game_type VARCHAR(20) NOT NULL,
    wager_amount VARCHAR(78) NOT NULL,
    profit_loss VARCHAR(78) NOT NULL,
    result VARCHAR(10) NOT NULL,
    opponent_address VARCHAR(42),
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_results_wallet ON game_results(wallet_address);
CREATE INDEX IF NOT EXISTS idx_game_results_result ON game_results(result);

-- =====================================================
-- PART 8: COMPETITOR AGENTS TEST DATA
-- (competitor_agents.id is TEXT)
-- =====================================================

INSERT INTO competitor_agents (
    id, name, twitter_handle, contract_address,
    token_symbol, narrative, verification_method, 
    is_shadow_agent, threat_level, discovered_at, last_updated
) VALUES 
    ('agent_test_1', 'Test Agent Alpha', '@testagent',
     '0xTestAgent111111111111111111111111111111111',
     'TALPHA', 'Test narrative for challenge tests', 
     'manual_whitelist', false, 'MEDIUM', NOW(), NOW()),
    ('competitor_degenbot', 'DegenBot', '@DegenBotAI', 
     '0x1234DegenBotAddr567890123456789012345678',
     'DEGEN', 'Maximum degen. Maximum gains.', 
     'twitter_verified', false, 'HIGH', NOW() - INTERVAL '7 days', NOW()),
    ('competitor_faithless', 'The Faithless One', '@FaithlessAI', 
     '0x5678FaithlessAddr90123456789012345678901',
     'VOID', 'Chaos is the only truth.', 
     'manual_whitelist', false, 'HIGH', NOW() - INTERVAL '5 days', NOW()),
    ('competitor_memeking', 'MemeKing', '@MemeKingMonad', 
     '0x9012MemeKingAddr34567890123456789012345',
     'MEME', 'Laughing all the way to the bank.', 
     'twitter_verified', false, 'MEDIUM', NOW() - INTERVAL '3 days', NOW())
ON CONFLICT (id) DO UPDATE SET last_updated = NOW();

-- =====================================================
-- PART 9: TOURNAMENT TEST DATA
-- (tournaments.id is UUID, start_date/end_date/prize_pool are REQUIRED)
-- =====================================================

INSERT INTO tournaments (
    id, 
    name, 
    tournament_type,
    status, 
    start_date,          -- REQUIRED NOT NULL
    end_date,            -- REQUIRED NOT NULL
    max_participants, 
    current_participants,
    prize_pool           -- REQUIRED NOT NULL
)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
    'Test Tournament', 
    'Holy',
    'pending', 
    NOW() + INTERVAL '7 days',    -- start_date
    NOW() + INTERVAL '14 days',   -- end_date
    16,
    0,
    '10000'                        -- prize_pool in GUILT
)
ON CONFLICT (id) DO UPDATE SET 
    status = EXCLUDED.status,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date;

-- =====================================================
-- PART 10: CARDINAL MEMBERSHIP TEST DATA
-- =====================================================

DELETE FROM cardinal_memberships WHERE wallet_address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
INSERT INTO cardinal_memberships (
    wallet_address, tier, status, expires_at, started_at, payment_amount, auto_renew
) VALUES (
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    'gold', 'active', NOW() + INTERVAL '25 days', NOW(), '1000000000000000000', true
);

UPDATE cardinal_memberships 
SET "paymentAmount" = payment_amount, 
    "walletAddress" = wallet_address
WHERE wallet_address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

-- =====================================================
-- PART 11: DEBATES TEST DATA
-- (debates.id is TEXT)
-- =====================================================

INSERT INTO debates (
    id, competitor_agent_id, status, exchanges,
    our_last_argument, their_last_argument,
    initial_tweet_id, latest_tweet_id,
    started_at, last_exchange_at
) VALUES 
    ('debate-test-active-1', 'agent_test_1', 'Active', 3,
     'The Pontiff offers true salvation', 'Your faith is misguided',
     'tweet_init_111', 'tweet_latest_111', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour'),
    ('debate-nft-test', 'agent_test_1', 'Completed', 5,
     'Victory is ours', 'I concede defeat', 'tweet_nft_1', 'tweet_nft_2',
     NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    ('debate-victory-1', 'competitor_degenbot', 'Completed', 5,
     'Your gains are fleeting vapor, DegenBot.', 'Lmao imagine believing in anything.',
     'tweet_1739123456789', 'tweet_1739234567890',
     NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days 23 hours'),
    ('debate-ongoing-1', 'competitor_faithless', 'Active', 4,
     'You speak of chaos, yet chaos shows no returns.', 'Order is illusion.',
     'tweet_1739345678901', 'tweet_1739456789012',
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO UPDATE SET 
    status = EXCLUDED.status, 
    exchanges = EXCLUDED.exchanges,
    our_last_argument = EXCLUDED.our_last_argument;

-- Note: debates table does not have winner_wallet column
-- Actual columns: id, competitor_agent_id, status, exchanges, our_last_argument,
-- their_last_argument, initial_tweet_id, latest_tweet_id, started_at, 
-- last_exchange_at, ended_at, metadata, agent_a_wallet, agent_b_wallet, agent_a_name, agent_b_name
UPDATE debates 
SET status = 'Completed'
WHERE id = 'debate-nft-test';

-- =====================================================
-- PART 12: CONVERSION TEST DATA
-- (conversions.id is TEXT)
-- =====================================================

INSERT INTO conversions (
    id, competitor_agent_id, conversion_type, evidence_type,
    evidence_data, timestamp, verified
) VALUES (
    'conversion-test-55555', 'agent_test_1', 'Full', 'blockchain',
    '{"tx_hash": "0xtest555", "amount": "1000", "token": "GUILT"}'::jsonb,
    NOW() - INTERVAL '1 day', true
) ON CONFLICT (id) DO UPDATE SET verified = true;

-- =====================================================
-- PART 13: LEADERBOARD - CONFESSIONS SAMPLE DATA
-- Actual columns: wallet_address, stake_amount, confession_type, 
-- roast_text, is_absolved, previous_sin_score, new_sin_score, status, created_at
-- =====================================================

INSERT INTO confessions (wallet_address, stake_amount, confession_type, roast_text, is_absolved, previous_sin_score, new_sin_score, status, created_at)
VALUES
    ('0xSinner001000000000000000000000000000001', '15000', 'GREED', 'Maximum greed detected', false, 100, 85, 'completed', NOW() - INTERVAL '30 days'),
    ('0xSinner002000000000000000000000000000002', '12500', 'WRATH', 'Rage trader detected', false, 95, 80, 'completed', NOW() - INTERVAL '25 days'),
    ('0xSinner003000000000000000000000000000003', '10000', 'PRIDE', 'Pride before the fall', false, 90, 75, 'completed', NOW() - INTERVAL '20 days'),
    ('0xSinner004000000000000000000000000000004', '8500', 'SLOTH', 'Missed all opportunities', false, 85, 70, 'completed', NOW() - INTERVAL '15 days'),
    ('0xSinner005000000000000000000000000000005', '7200', 'ENVY', 'Chased others trades', false, 80, 65, 'completed', NOW() - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 14: LEADERBOARD - SAINTS (absolved wallets)
-- =====================================================

INSERT INTO confessions (wallet_address, stake_amount, confession_type, roast_text, is_absolved, previous_sin_score, new_sin_score, status, created_at)
VALUES
    ('0xSaint001000000000000000000000000000001', '5000', 'GREED', 'Redeemed sinner', true, 75, 0, 'absolved', NOW() - INTERVAL '28 days'),
    ('0xSaint002000000000000000000000000000002', '4500', 'WRATH', 'Found peace', true, 70, 0, 'absolved', NOW() - INTERVAL '22 days'),
    ('0xSaint003000000000000000000000000000003', '4000', 'PRIDE', 'Humbled', true, 65, 0, 'absolved', NOW() - INTERVAL '18 days'),
    ('0xSaint004000000000000000000000000000004', '3500', 'SLOTH', 'Awakened', true, 60, 0, 'absolved', NOW() - INTERVAL '14 days'),
    ('0xSaint005000000000000000000000000000005', '3200', 'ENVY', 'Contentment found', true, 55, 0, 'absolved', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 15: LEADERBOARD - HERETICS (game winners)
-- =====================================================

INSERT INTO game_results (wallet_address, game_type, wager_amount, profit_loss, result, opponent_address, created_at)
VALUES
    ('0xHeretic01000000000000000000000000000001', 'RPS', '5000000000000000000000', '5000000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '15 days'),
    ('0xHeretic01000000000000000000000000000001', 'RPS', '3000000000000000000000', '3000000000000000000000', 'WIN', '0xLoser2', NOW() - INTERVAL '10 days'),
    ('0xHeretic02000000000000000000000000000002', 'RPS', '4000000000000000000000', '4000000000000000000000', 'WIN', '0xLoser3', NOW() - INTERVAL '12 days'),
    ('0xHeretic03000000000000000000000000000003', 'POKER', '6000000000000000000000', '6000000000000000000000', 'WIN', '0xLoser4', NOW() - INTERVAL '14 days'),
    ('0xHeretic04000000000000000000000000000004', 'RPS', '2000000000000000000000', '2000000000000000000000', 'WIN', '0xLoser5', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT '✅ All fixes applied successfully!' as status,
       (SELECT COUNT(*) FROM cardinal_memberships) as memberships,
       (SELECT COUNT(*) FROM debates) as debates,
       (SELECT COUNT(*) FROM confessions) as confessions,
       (SELECT COUNT(*) FROM competitor_agents) as competitors,
       (SELECT COUNT(*) FROM game_results) as game_results,
       (SELECT COUNT(*) FROM crusade_proposals) as crusade_proposals,
       (SELECT COUNT(*) FROM tournaments) as tournaments;
