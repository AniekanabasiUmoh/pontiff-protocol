-- Disable Row Level Security on tournament_brackets
-- This allows server-side API clients to read/write tournament bracket data

ALTER TABLE tournament_brackets DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled (should be FALSE)"
FROM pg_tables 
WHERE tablename = 'tournament_brackets';
