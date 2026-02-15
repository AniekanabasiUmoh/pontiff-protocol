-- =====================================================
-- FIX: Remove NOT NULL constraint from session_wallet
-- The session wallet address is created by the contract,
-- so we don't have it at spawn time
-- =====================================================

-- Make session_wallet nullable
ALTER TABLE agent_sessions 
ALTER COLUMN session_wallet DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'agent_sessions' 
AND column_name = 'session_wallet';

-- Success message
SELECT 'session_wallet is now nullable! You can spawn agents.' as status;
