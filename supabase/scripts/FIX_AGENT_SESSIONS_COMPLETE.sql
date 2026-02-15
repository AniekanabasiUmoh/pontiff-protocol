-- =====================================================
-- COMPLETE FIX FOR AGENT SESSIONS
-- Fixes both schema cache and NOT NULL constraint issues
-- =====================================================

-- Step 1: Make session_wallet nullable (it's created by the contract later)
ALTER TABLE agent_sessions 
ALTER COLUMN session_wallet DROP NOT NULL;

-- Step 2: Make expires_at nullable (we don't set expiry at spawn time)
ALTER TABLE agent_sessions 
ALTER COLUMN expires_at DROP NOT NULL;

-- Step 3: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 4: Add comment to force schema change detection
COMMENT ON TABLE agent_sessions IS 'Tracks autonomous AI agent sessions - Updated 2026-02-12 13:17';

-- Step 5: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agent_sessions' 
AND column_name IN ('session_wallet', 'expires_at', 'user_wallet', 'deposit_amount')
ORDER BY ordinal_position;

-- Success message
SELECT '✅ agent_sessions table fixed! Wait 5 seconds then try spawning an agent.' as status;
