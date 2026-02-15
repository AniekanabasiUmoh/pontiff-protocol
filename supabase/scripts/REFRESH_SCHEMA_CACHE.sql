-- =====================================================
-- REFRESH SUPABASE SCHEMA CACHE
-- Run this in Supabase SQL Editor to force schema reload
-- =====================================================

-- Method 1: Send NOTIFY to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Method 2: If that doesn't work, add a comment to force schema change detection
COMMENT ON TABLE agent_sessions IS 'Tracks autonomous AI agent sessions - Schema refreshed at 2026-02-12';

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agent_sessions' 
AND column_name IN ('deposit_amount', 'user_wallet', 'starting_balance', 'current_balance')
ORDER BY ordinal_position;

-- Success message
SELECT 'Schema cache refresh triggered! Wait 5-10 seconds then try spawning an agent.' as status;
