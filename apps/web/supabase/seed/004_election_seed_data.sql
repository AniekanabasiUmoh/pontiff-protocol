-- ============================================================
-- PONTIFF PAPAL ELECTION SEED DATA
-- Seeds demo cardinals and election votes for display.
-- Safe to re-run (uses ON CONFLICT).
-- ============================================================

-- ─── 1. SEED CARDINAL MEMBERS (if not exist) ───
INSERT INTO cardinal_members (wallet_address, tier, status, is_pope, started_at, expires_at)
VALUES
    ('0x4a1BcD3E5f7890AbCdEf1234567890AbCdEf1234', 2, 'active', true, NOW() - interval '90 days', NOW() + interval '275 days'),
    ('0x7fAbCdEf1234567890AbCdEf1234567890AbCdEf', 3, 'active', false, NOW() - interval '60 days', NOW() + interval '305 days'),
    ('0x3cAbCdEf1234567890AbCdEf1234567890AbCdEf', 1, 'active', false, NOW() - interval '45 days', NOW() + interval '320 days'),
    ('0x9eAbCdEf1234567890AbCdEf1234567890AbCdEf', 2, 'active', false, NOW() - interval '30 days', NOW() + interval '335 days'),
    ('0x2bAbCdEf1234567890AbCdEf1234567890AbCdEf', 1, 'active', false, NOW() - interval '15 days', NOW() + interval '350 days'),
    ('0x5eAbCdEf1234567890AbCdEf1234567890AbCdEf', 3, 'active', false, NOW() - interval '20 days', NOW() + interval '345 days'),
    ('0xAaAbCdEf1234567890AbCdEf1234567890AbCdEf', 2, 'active', false, NOW() - interval '10 days', NOW() + interval '355 days'),
    ('0xBbAbCdEf1234567890AbCdEf1234567890AbCdEf', 1, 'active', false, NOW() - interval '5 days', NOW() + interval '360 days')
ON CONFLICT (wallet_address) DO UPDATE SET
    status = 'active',
    is_pope = EXCLUDED.is_pope;


-- ─── 2. SEED ELECTION VOTES ───
-- Multiple cardinals vote for candidates — creating a realistic election state
INSERT INTO pope_election_votes (voter_wallet, candidate_wallet, term_date, casted_at)
VALUES
    -- 3 votes for 0x7fAb... (leading candidate)
    ('0x3cAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x7fAbCdEf1234567890AbCdEf1234567890AbCdEf', CURRENT_DATE, NOW() - interval '3 hours'),
    ('0x9eAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x7fAbCdEf1234567890AbCdEf1234567890AbCdEf', CURRENT_DATE, NOW() - interval '2 hours'),
    ('0xAaAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x7fAbCdEf1234567890AbCdEf1234567890AbCdEf', CURRENT_DATE, NOW() - interval '1 hour'),

    -- 2 votes for 0x4a1B... (current pope, seeking re-election)
    ('0x5eAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x4a1BcD3E5f7890AbCdEf1234567890AbCdEf1234', CURRENT_DATE, NOW() - interval '4 hours'),
    ('0xBbAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x4a1BcD3E5f7890AbCdEf1234567890AbCdEf1234', CURRENT_DATE, NOW() - interval '30 minutes'),

    -- 1 vote for 0x3cAb... (underdog)
    ('0x7fAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x3cAbCdEf1234567890AbCdEf1234567890AbCdEf', CURRENT_DATE, NOW() - interval '5 hours'),

    -- 1 vote for self (0x2bAb votes for self)
    ('0x2bAbCdEf1234567890AbCdEf1234567890AbCdEf', '0x2bAbCdEf1234567890AbCdEf1234567890AbCdEf', CURRENT_DATE, NOW() - interval '6 hours')
ON CONFLICT (voter_wallet) DO UPDATE SET
    candidate_wallet = EXCLUDED.candidate_wallet,
    casted_at = EXCLUDED.casted_at;


-- ─── 3. VERIFICATION ───
SELECT 'ELECTION SEED COMPLETE' AS status,
       (SELECT COUNT(*) FROM cardinal_members WHERE status = 'active') AS active_cardinals,
       (SELECT COUNT(*) FROM pope_election_votes) AS votes_cast,
       (SELECT candidate_wallet FROM pope_election_votes
        GROUP BY candidate_wallet ORDER BY COUNT(*) DESC LIMIT 1) AS leading_candidate;
