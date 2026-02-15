-- Seed conversions data
-- Run this in Supabase SQL Editor
-- Depends on competitor_agents existing first

-- 1. Seed competitor agents (heretics to be converted)
INSERT INTO competitor_agents (
    id, name, twitter_handle, narrative, verification_method,
    is_shadow_agent, threat_level, market_cap, holders, metadata
) VALUES
    ('ca_seed_001', 'The False Oracle',     'false_oracle_xyz',  'Claims prophetic powers over crypto markets',  'shadow_agent', false, 'HIGH',   5000000, 850,  '{}'),
    ('ca_seed_002', 'Degen Preacher',       'degen_preacher',    'Spreads heretical yield farming gospel',        'shadow_agent', false, 'MEDIUM', 2500000, 420,  '{}'),
    ('ca_seed_003', 'Schism Bot',           'schism_bot_eth',    'Incites discord among the faithful',           'shadow_agent', true,  'HIGH',   1800000, 310,  '{}'),
    ('ca_seed_004', 'The Apostate',         'apostate_defi',     'Abandoned the true path for yield chasing',   'twitter',      false, 'LOW',    800000,  190,  '{}'),
    ('ca_seed_005', 'Crypto Inquisitor',    'crypto_inquisitor', 'Challenges Pontifical authority openly',       'twitter',      false, 'MEDIUM', 3200000, 560,  '{}')
ON CONFLICT (id) DO UPDATE SET
    name             = EXCLUDED.name,
    twitter_handle   = EXCLUDED.twitter_handle,
    narrative        = EXCLUDED.narrative,
    threat_level     = EXCLUDED.threat_level;

-- 2. Seed conversions
INSERT INTO conversions (
    id, competitor_agent_id, conversion_type, evidence_type, evidence_data,
    timestamp, verified, wallet_address
) VALUES
    (
        'conv_seed_001', 'ca_seed_001',
        'acknowledgment', 'tweet',
        '{"text": "I have seen the light of The Pontiff. My oracle days are over.", "tweet_id": "seed_tweet_001"}',
        NOW() - INTERVAL '28 days', true, null
    ),
    (
        'conv_seed_002', 'ca_seed_002',
        'token_purchase', 'blockchain',
        '{"token": "GUILT", "amount": "1000", "tx_hash": "0xseed_conv_002_tx"}',
        NOW() - INTERVAL '21 days', true, '0x71C3a9f2E4b8D1A0c5F7e6B3d2A8c4E9F1b0D3e2'
    ),
    (
        'conv_seed_003', 'ca_seed_003',
        'retweet', 'twitter_engagement',
        '{"retweet_id": "seed_rt_003", "original_tweet": "pontiff_decree_42"}',
        NOW() - INTERVAL '14 days', true, null
    ),
    (
        'conv_seed_004', 'ca_seed_004',
        'acknowledgment', 'tweet',
        '{"text": "The Apostasy ends today. Long live the Pontiff.", "tweet_id": "seed_tweet_004"}',
        NOW() - INTERVAL '7 days', true, null
    ),
    (
        'conv_seed_005', 'ca_seed_005',
        'token_purchase', 'blockchain',
        '{"token": "GUILT", "amount": "2500", "tx_hash": "0xseed_conv_005_tx"}',
        NOW() - INTERVAL '3 days', true, '0xB2A4f1C8e3D6b0A7F2c9E5d1B8a3C6f4E9d2B7a1'
    )
ON CONFLICT (id) DO UPDATE SET
    conversion_type = EXCLUDED.conversion_type,
    evidence_data   = EXCLUDED.evidence_data,
    verified        = EXCLUDED.verified;
