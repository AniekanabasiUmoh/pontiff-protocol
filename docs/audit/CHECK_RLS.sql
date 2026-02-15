-- Step 1: Check if RLS is enabled on tournament_brackets
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'tournament_brackets';

-- Step 2: Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tournament_brackets';
