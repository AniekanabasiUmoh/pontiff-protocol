-- =====================================================
-- COMPREHENSIVE LEADERBOARD SEED DATA
-- Populates all 3 leaderboard categories with realistic entries
-- =====================================================

-- First, seed some wallets with confession data for SHAME leaderboard
-- (Total sin amount - most guilty wallets)
INSERT INTO confessions (
    id, wallet_address, sin_amount, sin_type, roast_text,
    indulgence_amount, is_redeemed, created_at
) VALUES
    -- High shame players
    (gen_random_uuid(), '0xSinner001000000000000000000000000000001', '15000000000000000000000', 'GREED', 'Thy greed knows no bounds! 15K GUILT accumulated from endless degen trades.', '0', false, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), '0xSinner002000000000000000000000000000002', '12500000000000000000000', 'WRATH', 'Thy wrath has ruined many. 12.5K GUILT from rage-selling and FUD spreading.', '0', false, NOW() - INTERVAL '25 days'),
    (gen_random_uuid(), '0xSinner003000000000000000000000000000003', '10000000000000000000000', 'PRIDE', 'Thy pride precedes thy falls. 10K GUILT from failed calls.', '1000000000000000000000', true, NOW() - INTERVAL '20 days'),
    (gen_random_uuid(), '0xSinner004000000000000000000000000000004', '8500000000000000000000', 'SLOTH', 'Thy sloth has cost thee dearly. 8.5K GUILT from missed opportunities.', '0', false, NOW() - INTERVAL '15 days'),
    (gen_random_uuid(), '0xSinner005000000000000000000000000000005', '7200000000000000000000', 'GREED', 'Another who cannot resist. 7.2K GUILT from overtrading.', '2000000000000000000000', true, NOW() - INTERVAL '12 days'),
    (gen_random_uuid(), '0xSinner006000000000000000000000000000006', '6800000000000000000000', 'ENVY', 'Thy envy has blinded thee. 6.8K GUILT from chasing others trades.', '0', false, NOW() - INTERVAL '10 days'),
    (gen_random_uuid(), '0xSinner007000000000000000000000000000007', '5500000000000000000000', 'LUST', 'Thy lust for gains corrupts. 5.5K GUILT from FOMO entries.', '0', false, NOW() - INTERVAL '8 days'),
    (gen_random_uuid(), '0xSinner008000000000000000000000000000008', '4200000000000000000000', 'WRATH', 'Thy temper is costly. 4.2K GUILT from revenge trading.', '500000000000000000000', true, NOW() - INTERVAL '7 days'),
    (gen_random_uuid(), '0xSinner009000000000000000000000000000009', '3800000000000000000000', 'PRIDE', 'Thy ego blinds thee. 3.8K GUILT from ignoring signals.', '0', false, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), '0xSinner010000000000000000000000000000010', '3200000000000000000000', 'GREED', 'Will thy greed never cease? 3.2K GUILT from position sizing sins.', '0', false, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- SAINTS leaderboard - those who have redeemed themselves
-- (Highest indulgence purchases / redemption)
INSERT INTO confessions (
    id, wallet_address, sin_amount, sin_type, roast_text,
    indulgence_amount, is_redeemed, created_at
) VALUES
    -- High redemption saints
    (gen_random_uuid(), '0xSaint001000000000000000000000000000001', '5000000000000000000000', 'GREED', 'Former sinner now redeemed.', '5000000000000000000000', true, NOW() - INTERVAL '28 days'),
    (gen_random_uuid(), '0xSaint002000000000000000000000000000002', '4500000000000000000000', 'WRATH', 'Found peace through confession.', '4500000000000000000000', true, NOW() - INTERVAL '22 days'),
    (gen_random_uuid(), '0xSaint003000000000000000000000000000003', '4000000000000000000000', 'PRIDE', 'Humbled by the Pontiff.', '4000000000000000000000', true, NOW() - INTERVAL '18 days'),
    (gen_random_uuid(), '0xSaint004000000000000000000000000000004', '3500000000000000000000', 'SLOTH', 'Awakened from slumber.', '3500000000000000000000', true, NOW() - INTERVAL '14 days'),
    (gen_random_uuid(), '0xSaint005000000000000000000000000000005', '3200000000000000000000', 'ENVY', 'Learned contentment.', '3200000000000000000000', true, NOW() - INTERVAL '10 days'),
    (gen_random_uuid(), '0xSaint006000000000000000000000000000006', '2800000000000000000000', 'LUST', 'Temptation conquered.', '2800000000000000000000', true, NOW() - INTERVAL '8 days'),
    (gen_random_uuid(), '0xSaint007000000000000000000000000000007', '2500000000000000000000', 'GREED', 'Generosity discovered.', '2500000000000000000000', true, NOW() - INTERVAL '6 days'),
    (gen_random_uuid(), '0xSaint008000000000000000000000000000008', '2200000000000000000000', 'WRATH', 'Inner peace achieved.', '2200000000000000000000', true, NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), '0xSaint009000000000000000000000000000009', '1800000000000000000000', 'PRIDE', 'Ego surrendered.', '1800000000000000000000', true, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '0xSaint010000000000000000000000000000010', '1500000000000000000000', 'SLOTH', 'Awakened and active.', '1500000000000000000000', true, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- HERETICS leaderboard - game winners (RPS/betting victories)
-- Create game_results table entries for this
CREATE TABLE IF NOT EXISTS game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL,
    game_type VARCHAR(20) NOT NULL,
    wager_amount VARCHAR(78) NOT NULL,
    profit_loss VARCHAR(78) NOT NULL,
    result VARCHAR(10) NOT NULL, -- 'WIN', 'LOSS', 'DRAW'
    opponent_address VARCHAR(42),
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert game results for heretics
INSERT INTO game_results (
    wallet_address, game_type, wager_amount, profit_loss, result, opponent_address, created_at
) VALUES
    -- Top heretics (biggest winners)
    ('0xHeretic01000000000000000000000000000001', 'RPS', '5000000000000000000000', '5000000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '15 days'),
    ('0xHeretic01000000000000000000000000000001', 'RPS', '3000000000000000000000', '3000000000000000000000', 'WIN', '0xLoser2', NOW() - INTERVAL '10 days'),
    ('0xHeretic01000000000000000000000000000001', 'POKER', '2500000000000000000000', '2500000000000000000000', 'WIN', '0xLoser3', NOW() - INTERVAL '5 days'),
    
    ('0xHeretic02000000000000000000000000000002', 'RPS', '4000000000000000000000', '4000000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '12 days'),
    ('0xHeretic02000000000000000000000000000002', 'RPS', '3500000000000000000000', '3500000000000000000000', 'WIN', '0xLoser2', NOW() - INTERVAL '8 days'),
    
    ('0xHeretic03000000000000000000000000000003', 'POKER', '6000000000000000000000', '6000000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '14 days'),
    
    ('0xHeretic04000000000000000000000000000004', 'RPS', '2000000000000000000000', '2000000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '7 days'),
    ('0xHeretic04000000000000000000000000000004', 'RPS', '2500000000000000000000', '2500000000000000000000', 'WIN', '0xLoser2', NOW() - INTERVAL '4 days'),
    ('0xHeretic04000000000000000000000000000004', 'RPS', '1000000000000000000000', '1000000000000000000000', 'WIN', '0xLoser3', NOW() - INTERVAL '2 days'),
    
    ('0xHeretic05000000000000000000000000000005', 'RPS', '2200000000000000000000', '2200000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '6 days'),
    ('0xHeretic05000000000000000000000000000005', 'POKER', '1800000000000000000000', '1800000000000000000000', 'WIN', '0xLoser2', NOW() - INTERVAL '3 days'),
    
    ('0xHeretic06000000000000000000000000000006', 'RPS', '3000000000000000000000', '3000000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '9 days'),
    
    ('0xHeretic07000000000000000000000000000007', 'POKER', '2500000000000000000000', '2500000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '11 days'),
    
    ('0xHeretic08000000000000000000000000000008', 'RPS', '1500000000000000000000', '1500000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '5 days'),
    ('0xHeretic08000000000000000000000000000008', 'RPS', '800000000000000000000', '800000000000000000000', 'WIN', '0xLoser2', NOW() - INTERVAL '1 day'),
    
    ('0xHeretic09000000000000000000000000000009', 'RPS', '1200000000000000000000', '1200000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '4 days'),
    
    ('0xHeretic10000000000000000000000000000010', 'POKER', '900000000000000000000', '900000000000000000000', 'WIN', '0xLoser1', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Create indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_confessions_shame ON confessions(wallet_address, sin_amount);
CREATE INDEX IF NOT EXISTS idx_confessions_saints ON confessions(wallet_address, indulgence_amount) WHERE is_redeemed = true;
CREATE INDEX IF NOT EXISTS idx_game_results_heretics ON game_results(wallet_address, profit_loss, result);

-- Verification
SELECT 'Leaderboard seed complete!' as status,
       (SELECT COUNT(DISTINCT wallet_address) FROM confessions WHERE sin_amount::numeric > 0) as shame_entries,
       (SELECT COUNT(DISTINCT wallet_address) FROM confessions WHERE is_redeemed = true AND indulgence_amount::numeric > 0) as saints_entries,
       (SELECT COUNT(DISTINCT wallet_address) FROM game_results WHERE result = 'WIN') as heretics_entries;
