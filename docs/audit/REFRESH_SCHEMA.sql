-- Refresh PostgREST schema cache
-- This tells the Supabase REST API to reload the database schema
-- Necessary after creating new tables or columns

NOTIFY pgrst, 'reload schema';

-- Verification: After running this, the tournament_brackets table
-- should be visible to the REST API and the Record Match test should pass.
