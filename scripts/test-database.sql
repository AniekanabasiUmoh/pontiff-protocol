-- =====================================================
-- Pontiff Database Integrity Tests
-- Run with: psql -f scripts/test-database.sql
-- Or: supabase db test
-- =====================================================

\echo '=== DATABASE INTEGRITY TESTS ==='
\echo ''

-- Test 1: Check all required tables exist
\echo '--- Test 1: Table Existence ---'
SELECT
    CASE
        WHEN COUNT(*) = 19 THEN '✓ PASS: All expected tables exist'
        ELSE '✗ FAIL: Missing tables'
    END as result,
    COUNT(*) as found,
    19 as expected
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'users',
    'agents',
    'games',
    'crusades',
    'debates',
    'conversions',
    'competitor_agents',
    'leaderboard_entries',
    'vatican_entrants',
    'world_events',
    'confessions',
    'roast_tweets',
    'treasury_revenue',
    'revenue_distributions',
    'cardinal_memberships',
    'tournaments',
    'tournament_registrations',
    'tournament_brackets',
    'tournament_results'
);

-- Test 2: Check for missing indexes
\echo ''
\echo '--- Test 2: Index Coverage ---'
SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('games', 'confessions', 'tournaments', 'leaderboard_entries')
GROUP BY tablename
ORDER BY index_count DESC;

-- Test 3: Check foreign key constraints
\echo ''
\echo '--- Test 3: Foreign Key Constraints ---'
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Test 4: Check for missing columns in critical tables
\echo ''
\echo '--- Test 4: Cardinal Memberships Table Structure ---'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'cardinal_memberships'
ORDER BY ordinal_position;

-- Test 5: Check crusades table has goal_type column
\echo ''
\echo '--- Test 5: Crusades Table - goal_type Column ---'
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'crusades'
            AND column_name = 'goal_type'
        ) THEN '✓ PASS: goal_type column exists'
        ELSE '✗ FAIL: goal_type column missing'
    END as result;

-- Test 6: Check competitor_agents table exists
\echo ''
\echo '--- Test 6: Competitor Agents Table ---'
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = 'competitor_agents'
        ) THEN '✓ PASS: competitor_agents table exists'
        ELSE '✗ FAIL: competitor_agents table missing'
    END as result;

-- Test 7: Check confessions table structure
\echo ''
\echo '--- Test 7: Confessions Table Columns ---'
SELECT
    column_name,
    data_type,
    CASE
        WHEN is_nullable = 'YES' THEN 'NULL'
        ELSE 'NOT NULL'
    END as nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'confessions'
ORDER BY ordinal_position;

-- Test 8: Check RLS is enabled on sensitive tables
\echo ''
\echo '--- Test 8: Row Level Security (RLS) Status ---'
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('tournaments', 'tournament_registrations', 'cardinal_memberships')
ORDER BY tablename;

-- Test 9: Check for orphaned records (debates without competitor agents)
\echo ''
\echo '--- Test 9: Data Integrity - Orphaned Debates ---'
SELECT
    COUNT(*) as orphaned_debates
FROM debates d
WHERE NOT EXISTS (
    SELECT 1 FROM competitor_agents ca
    WHERE ca.id = d.competitor_agent_id
);

-- Test 10: Check for orphaned conversions
\echo ''
\echo '--- Test 10: Data Integrity - Orphaned Conversions ---'
SELECT
    COUNT(*) as orphaned_conversions
FROM conversions c
WHERE NOT EXISTS (
    SELECT 1 FROM competitor_agents ca
    WHERE ca.id = c.competitor_agent_id
);

-- Test 11: Check tournament functions exist
\echo ''
\echo '--- Test 11: Tournament Helper Functions ---'
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name LIKE '%tournament%'
ORDER BY routine_name;

-- Test 12: Verify data types for amounts (should be VARCHAR for BigInt compatibility)
\echo ''
\echo '--- Test 12: Amount Column Data Types (BigInt Safety) ---'
SELECT
    table_name,
    column_name,
    data_type,
    CASE
        WHEN data_type IN ('character varying', 'text') THEN '✓ Safe for BigInt'
        WHEN data_type IN ('integer', 'numeric') THEN '⚠ May lose precision'
        ELSE '? Unknown'
    END as bigint_compatibility
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name LIKE '%amount%'
ORDER BY table_name, column_name;

-- Test 13: Check users table has required columns for confession system
\echo ''
\echo '--- Test 13: Users Table - Confession Columns ---'
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name = 'sin_score'
        ) THEN '✓ PASS: sin_score column exists'
        ELSE '✗ FAIL: sin_score column missing'
    END as sin_score_check;

SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name = 'last_confession_at'
        ) THEN '✓ PASS: last_confession_at column exists'
        ELSE '✗ FAIL: last_confession_at column missing'
    END as confession_timestamp_check;

-- Test 14: Check for duplicate wallet addresses in cardinal_memberships
\echo ''
\echo '--- Test 14: Cardinal Memberships - Duplicate Check ---'
SELECT
    wallet_address,
    COUNT(*) as membership_count
FROM cardinal_memberships
WHERE status = 'active'
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- Test 15: Validate leaderboard_entries constraints
\echo ''
\echo '--- Test 15: Leaderboard Entries - Category Values ---'
SELECT DISTINCT category
FROM leaderboard_entries
ORDER BY category;

\echo ''
\echo '=== DATABASE TESTS COMPLETED ==='
