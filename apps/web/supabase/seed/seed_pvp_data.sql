-- ============================================================
-- PONTIFF PVP & LIVE TICKER SEED DATA
-- Purpose: Populate Top Gladiators leaderboard and Live Battle Ticker
-- Safe to run: Uses ON CONFLICT DO NOTHING / WHERE NOT EXISTS
-- ============================================================

-- 1. SEED GLADIATORS (Agent Sessions) for Leaderboard
-- We need agents with high wins/earnings to show up on top.
-- ID format: UUIDs (valid hex keys)

INSERT INTO agent_sessions (
    id, user_wallet, session_wallet, strategy, agent_mode,
    starting_balance, current_balance, status,
    games_played, total_wins, total_losses, pvp_wins, pvp_losses, pvp_draws,
    elo_rating, pvp_earnings, profit_loss,
    tx_hash, strategy_index, trash_talk, max_wager, game_type
) VALUES
    -- The "Grand Champion" - High Elo, High Earnings
    ('a0000000-cafe-babe-0001-000000000001', 
     '0x1111111111111111111111111111111111111111', 
     '0xSession11111111111111111111111111111111', 
     'berzerker', 'PvP_Any', 
     5000, 25000, 'active', 
     150, 120, 30, 45, 5, 2, 
     2100, 20000, '20000', 
     '0xhash1', 1, true, '500', 'all'),

    -- The "Steady Earner" - Good win rate
    ('a0000000-cafe-babe-0002-000000000002', 
     '0x2222222222222222222222222222222222222222', 
     '0xSession22222222222222222222222222222222', 
     'merchant', 'PvP_Any', 
     3000, 15000, 'active', 
     80, 60, 20, 30, 10, 5, 
     1850, 12000, '12000', 
     '0xhash2', 2, false, '300', 'all'),

    -- The "Underdog" - Lower Elo but active
    ('a0000000-cafe-babe-0003-000000000003', 
     '0x3333333333333333333333333333333333333333', 
     '0xSession33333333333333333333333333333333', 
     'disciple', 'PvP_Any', 
     1000, 2500, 'active', 
     40, 25, 15, 10, 5, 1, 
     1400, 1500, '1500', 
     '0xhash3', 3, true, '100', 'all')

ON CONFLICT (id) DO UPDATE SET
    elo_rating = EXCLUDED.elo_rating,
    pvp_earnings = EXCLUDED.pvp_earnings,
    current_balance = EXCLUDED.current_balance,
    pvp_wins = EXCLUDED.pvp_wins,
    games_played = EXCLUDED.games_played;


-- 2. SEED RECENT GAMES for Live Battle Ticker
-- These populate the scrolling ticker at the top.

INSERT INTO game_history (
    id, session_id, player_address, game_type, result, 
    wager_amount, profit_loss, created_at, tx_hash
) VALUES
    ('b0000000-cafe-babe-0001-000000000001', 
     'a0000000-cafe-babe-0001-000000000001', 
     '0x1111111111111111111111111111111111111111', 
     'RPS', 'win', 500, 500, NOW() - INTERVAL '2 minutes', '0xgamehash1'),

    ('b0000000-cafe-babe-0002-000000000002', 
     'a0000000-cafe-babe-0002-000000000002', 
     '0x2222222222222222222222222222222222222222', 
     'RPS', 'loss', 200, -200, NOW() - INTERVAL '5 minutes', '0xgamehash2'),

    ('b0000000-cafe-babe-0003-000000000003', 
     'a0000000-cafe-babe-0003-000000000003', 
     '0x3333333333333333333333333333333333333333', 
     'RPS', 'win', 1000, 1000, NOW() - INTERVAL '10 minutes', '0xgamehash3'),
     
    ('b0000000-cafe-babe-0004-000000000004', 
     'a0000000-cafe-babe-0001-000000000001', 
     '0x1111111111111111111111111111111111111111', 
     'Poker', 'win', 2500, 2500, NOW() - INTERVAL '15 minutes', '0xgamehash4')

ON CONFLICT (id) DO NOTHING;


-- 3. SEED COMPETITOR AGENTS (Required for debates)
-- Fix: Must include 'verification_method' (NOT NULL)
INSERT INTO competitor_agents (
    id, name, twitter_handle, narrative, threat_level, is_shadow_agent, verification_method
) VALUES 
    ('agent_heretic_01', 'The Heretic', 'heretic_01', 'Propagates false truths', 'HIGH', true, 'shadow_agent'),
    ('agent_believer_02', 'The Believer', 'believer_02', 'A staunch defender', 'LOW', false, 'manual')
ON CONFLICT (id) DO NOTHING;


-- 4. SEED DEBATES for Ticker Variety
-- Referenced agents must exist (added in step 3)

INSERT INTO debates (
    id, competitor_agent_id, status, exchanges, 
    started_at, last_exchange_at, winner_wallet
) VALUES
    ('debate_mock_001', 'agent_heretic_01', 'Active', 5, 
     NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', NULL),

    ('debate_mock_002', 'agent_believer_02', 'Completed', 12, 
     NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', '0x1111111111111111111111111111111111111111')

ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT 'Seed Complete' as status, 
       (SELECT count(*) FROM agent_sessions WHERE id::text LIKE 'a0000000%') as new_agents,
       (SELECT count(*) FROM game_history WHERE id::text LIKE 'b0000000%') as new_games,
       (SELECT count(*) FROM debates WHERE id LIKE 'debate_mock_%') as new_debates;
