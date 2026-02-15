-- ============================================================
-- PONTIFF PVP DEMO SEED DATA
-- Seeds sample data for PvP system testing and UI display.
-- Safe to re-run (uses ON CONFLICT or conditional inserts).
-- ============================================================

-- ─── 1. SEED AGENT SESSIONS (Gladiator agents) ───
INSERT INTO agent_sessions (
    id, user_wallet, session_wallet, strategy, agent_mode,
    starting_balance, current_balance, stop_loss, take_profit,
    status, games_played, total_wins, total_losses,
    pvp_wins, pvp_losses, pvp_draws, elo_rating, pvp_earnings,
    profit_loss, tx_hash, strategy_index, trash_talk, max_wager, game_type
) VALUES
    -- Top gladiator: Berzerker
    ('a0000001-0000-0000-0000-000000000001', '0x4a1BcD3E5f7890AbCdEf1234567890AbCdEf1234', '0x1111111111111111111111111111111111111111',
     'berzerker', 'PvP_Any', 5000, 13420, 20, 200, 'active', 59, 47, 12, 47, 12, 0, 1342, 8420, '8420', '0x' || repeat('a1', 32), 0, true, '500', 'rps'),

    -- #2: Merchant
    ('a0000002-0000-0000-0000-000000000002', '0x7fAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x2222222222222222222222222222222222222222',
     'merchant', 'PvP_Any', 3000, 8100, 15, 150, 'active', 90, 62, 28, 62, 28, 0, 1298, 5100, '5100', '0x' || repeat('b2', 32), 1, false, '200', 'rps'),

    -- #3: Disciple
    ('a0000003-0000-0000-0000-000000000003', '0x3cAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x3333333333333333333333333333333333333333',
     'disciple', 'PvP_Any', 2000, 4340, 10, 100, 'active', 50, 31, 19, 31, 19, 0, 1187, 2340, '2340', '0x' || repeat('c3', 32), 2, true, '100', 'rps'),

    -- #4: Berzerker
    ('a0000004-0000-0000-0000-000000000004', '0x9eAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x4444444444444444444444444444444444444444',
     'berzerker', 'PvP_Any', 4000, 5800, 25, null, 'active', 72, 38, 34, 38, 34, 0, 1156, 1800, '1800', '0x' || repeat('d4', 32), 0, true, '300', 'rps'),

    -- #5: Merchant
    ('a0000005-0000-0000-0000-000000000005', '0x2bAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x5555555555555555555555555555555555555555',
     'merchant', 'PvP_Any', 1500, 2390, 20, 80, 'active', 45, 25, 20, 25, 20, 0, 1120, 890, '890', '0x' || repeat('e5', 32), 1, false, '150', 'rps'),

    -- Additional PvE agent
    ('a0000006-0000-0000-0000-000000000006', '0x5eAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x6666666666666666666666666666666666666666',
     'disciple', 'PvE', 1000, 1280, 10, 50, 'active', 30, 18, 12, 0, 0, 0, 1000, 0, '280', '0x' || repeat('f6', 32), 2, false, '50', 'all')
ON CONFLICT (id) DO UPDATE SET
    pvp_wins = EXCLUDED.pvp_wins,
    pvp_losses = EXCLUDED.pvp_losses,
    elo_rating = EXCLUDED.elo_rating,
    pvp_earnings = EXCLUDED.pvp_earnings,
    current_balance = EXCLUDED.current_balance,
    agent_mode = EXCLUDED.agent_mode;


-- ─── 2. SEED PVP MATCHES ───
INSERT INTO pvp_matches (
    id, player1_id, player2_id, game_type, stake_amount,
    winner_id, status, best_of, house_fee, duration_ms,
    elo_change_p1, elo_change_p2, server_seed, client_seed_1, client_seed_2,
    round_data, settled_at, created_at
) VALUES
    -- Match 1: Berzerker(1) beats Merchant(2)
    ('b0000001-0000-0000-0000-000000000001',
     'a0000001-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000002',
     'RPS', 250, 'a0000001-0000-0000-0000-000000000001', 'completed', 3, 25.00, 342,
     12, -12,
     'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
     'client1seed000001', 'client2seed000001',
     '[{"round":1,"p1Move":1,"p2Move":3,"p1MoveName":"Rock","p2MoveName":"Scissors","winner":"p1","timestamp":1707700000000},
       {"round":2,"p1Move":2,"p2Move":1,"p1MoveName":"Paper","p2MoveName":"Rock","winner":"p1","timestamp":1707700001000}]'::jsonb,
     NOW() - interval '2 minutes', NOW() - interval '2 minutes'),

    -- Match 2: Disciple(3) loses to Berzerker(4)
    ('b0000002-0000-0000-0000-000000000002',
     'a0000003-0000-0000-0000-000000000003', 'a0000004-0000-0000-0000-000000000004',
     'RPS', 500, 'a0000004-0000-0000-0000-000000000004', 'completed', 3, 50.00, 518,
     -15, 15,
     'f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2',
     'client1seed000002', 'client2seed000002',
     '[{"round":1,"p1Move":2,"p2Move":3,"p1MoveName":"Paper","p2MoveName":"Scissors","winner":"p2","timestamp":1707700100000},
       {"round":2,"p1Move":1,"p2Move":1,"p1MoveName":"Rock","p2MoveName":"Rock","winner":"draw","timestamp":1707700101000},
       {"round":3,"p1Move":3,"p2Move":1,"p1MoveName":"Scissors","p2MoveName":"Rock","winner":"p2","timestamp":1707700102000}]'::jsonb,
     NOW() - interval '5 minutes', NOW() - interval '5 minutes'),

    -- Match 3: Merchant(2) vs Merchant(5) — Draw
    ('b0000003-0000-0000-0000-000000000003',
     'a0000002-0000-0000-0000-000000000002', 'a0000005-0000-0000-0000-000000000005',
     'RPS', 100, NULL, 'completed', 3, 10.00, 290,
     0, 0,
     '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
     'client1seed000003', 'client2seed000003',
     '[{"round":1,"p1Move":1,"p2Move":1,"p1MoveName":"Rock","p2MoveName":"Rock","winner":"draw","timestamp":1707700200000},
       {"round":2,"p1Move":2,"p2Move":2,"p1MoveName":"Paper","p2MoveName":"Paper","winner":"draw","timestamp":1707700201000},
       {"round":3,"p1Move":3,"p2Move":3,"p1MoveName":"Scissors","p2MoveName":"Scissors","winner":"draw","timestamp":1707700202000}]'::jsonb,
     NOW() - interval '8 minutes', NOW() - interval '8 minutes'),

    -- Match 4: Berzerker(1) beats Disciple(3)
    ('b0000004-0000-0000-0000-000000000004',
     'a0000001-0000-0000-0000-000000000001', 'a0000003-0000-0000-0000-000000000003',
     'RPS', 1000, 'a0000001-0000-0000-0000-000000000001', 'completed', 3, 100.00, 456,
     8, -8,
     'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
     'client1seed000004', 'client2seed000004',
     '[{"round":1,"p1Move":3,"p2Move":2,"p1MoveName":"Scissors","p2MoveName":"Paper","winner":"p1","timestamp":1707700300000},
       {"round":2,"p1Move":1,"p2Move":3,"p1MoveName":"Rock","p2MoveName":"Scissors","winner":"p1","timestamp":1707700301000}]'::jsonb,
     NOW() - interval '12 minutes', NOW() - interval '12 minutes'),

    -- Match 5: Disciple(3) beats Merchant(5)
    ('b0000005-0000-0000-0000-000000000005',
     'a0000003-0000-0000-0000-000000000003', 'a0000005-0000-0000-0000-000000000005',
     'RPS', 75, 'a0000005-0000-0000-0000-000000000005', 'completed', 3, 7.50, 380,
     -10, 10,
     'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
     'client1seed000005', 'client2seed000005',
     '[{"round":1,"p1Move":2,"p2Move":3,"p1MoveName":"Paper","p2MoveName":"Scissors","winner":"p2","timestamp":1707700400000},
       {"round":2,"p1Move":1,"p2Move":2,"p1MoveName":"Rock","p2MoveName":"Paper","winner":"p2","timestamp":1707700401000}]'::jsonb,
     NOW() - interval '15 minutes', NOW() - interval '15 minutes')
ON CONFLICT (id) DO NOTHING;


-- ─── 3. VERIFICATION ───
SELECT 'SEED COMPLETE' AS status,
       (SELECT COUNT(*) FROM agent_sessions WHERE agent_mode IN ('PvP_Any','PvP_Target')) AS pvp_agents,
       (SELECT COUNT(*) FROM pvp_matches WHERE status = 'completed') AS completed_matches;
