-- Create unique index on tx_hash if not exists (required for ON CONFLICT DO UPDATE)
CREATE UNIQUE INDEX IF NOT EXISTS agent_sessions_tx_hash_key ON agent_sessions(tx_hash);

INSERT INTO agent_sessions (
    tx_hash, user_wallet, strategy, pvp_earnings, total_wins, total_losses,
    elo_rating, agent_mode, status, created_at, profit_loss
) VALUES
    ('0xseed001', '0x71C3a9f2E4b8D1A0c5F7e6B3d2A8c4E9F1b0D3e2', 'merchant',  128400.00, 94, 12, 2180, 'PvP', 'active',   NOW() - INTERVAL '30 days', '128400'),
    ('0xseed002', '0xB2A4f1C8e3D6b0A7F2c9E5d1B8a3C6f4E9d2B7a1', 'crusader',  98750.00,  87, 21, 1940, 'PvP', 'active',   NOW() - INTERVAL '25 days', '98750'),
    ('0xseed003', '0xC4e2A8f1B5d0E3c7F9a6D2b4E8c1A5f3D7b0E4c2', 'pacifist',  81200.00,  71, 18, 1820, 'PvE', 'active',   NOW() - INTERVAL '20 days', '81200'),
    ('0xseed004', '0xD7b3F5e9A1c4B8d2E6f0C3a7F1e5B9d3A8c2F6e0', 'betrayer',  67400.00,  63, 29, 1750, 'PvP', 'active',   NOW() - INTERVAL '18 days', '67400'),
    ('0xseed005', '0xE9c5A3f7B1d6E0a4C8b2F5e9A3c7F1d5B9a3E7c1', 'loyalist',  54200.00,  58, 24, 1680, 'PvE', 'active',   NOW() - INTERVAL '15 days', '54200'),
    ('0xseed006', '0xF1d7B9e3C5a0F4b8D2c6A9e1C5b7F3d9A1e5C8b2', 'merchant',  43100.00,  52, 31, 1610, 'PvP', 'inactive', NOW() - INTERVAL '12 days', '43100'),
    ('0xseed007', '0xA2e8C0f4D6b1A5e9C3d7F0b4D8a2E6c0A4f8D1e5', 'crusader',  38800.00,  47, 28, 1560, 'PvE', 'active',   NOW() - INTERVAL '10 days', '38800'),
    ('0xseed008', '0x3B4c9E1a7F5d2B8e0C6f4A3d1E9b5C7f2A0e8D4c', 'pacifist',  31780.00,  44, 33, 1490, 'PvP', 'active',   NOW() - INTERVAL '8 days', '31780'),
    ('0xseed009', '0x5F2d8A0c6E4b9D1f7C3a5E8d2B0f6A4c8E2d0B7f', 'betrayer',  27500.00,  39, 37, 1420, 'PvE', 'inactive', NOW() - INTERVAL '6 days', '27500'),
    ('0xseed010', '0x7A1e5C9b3F7d0A4e8B2c6F0d4A8b2E6c0F4d8A1e', 'loyalist',  22100.00,  35, 41, 1360, 'PvP', 'active',   NOW() - INTERVAL '4 days', '22100'),
    ('0xseed011', '0x9C3f7A1e5B9d3E7c1F5a9D3b7E1c5A9f3D7b1E5c', 'merchant',  18400.00,  31, 44, 1300, 'PvE', 'active',   NOW() - INTERVAL '3 days', '18400'),
    ('0xseed012', '0x2D8b4F0e6A2c8E4b0F6d2A8c4E0b6F2d8A4c0E2b', 'crusader',  14200.00,  27, 48, 1240, 'PvP', 'active',   NOW() - INTERVAL '2 days', '14200')
ON CONFLICT (tx_hash) DO UPDATE SET
    pvp_earnings   = EXCLUDED.pvp_earnings,
    profit_loss    = EXCLUDED.profit_loss,
    total_wins     = EXCLUDED.total_wins,
    total_losses   = EXCLUDED.total_losses,
    elo_rating     = EXCLUDED.elo_rating,
    agent_mode     = EXCLUDED.agent_mode,
    status         = EXCLUDED.status;
