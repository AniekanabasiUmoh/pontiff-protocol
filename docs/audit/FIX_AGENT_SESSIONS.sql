-- =====================================================
-- FIX AGENT_SESSIONS TABLE
-- Add missing columns required by the Spawn Agent API
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add missing columns to agent_sessions table
ALTER TABLE agent_sessions 
ADD COLUMN IF NOT EXISTS deposit_amount VARCHAR(78) DEFAULT '0',
ADD COLUMN IF NOT EXISTS total_games INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS session_wallet_backup VARCHAR(42);  -- Backup in case session_wallet is used differently

-- Update total_games from games_played for existing rows
UPDATE agent_sessions 
SET total_games = games_played 
WHERE total_games = 0 AND games_played > 0;

-- Sync deposit_amount with starting_balance for existing rows
UPDATE agent_sessions 
SET deposit_amount = starting_balance::TEXT 
WHERE deposit_amount = '0' AND starting_balance > 0;

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_agent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS agent_sessions_updated_at ON agent_sessions;

-- Create trigger to auto-update updated_at
CREATE TRIGGER agent_sessions_updated_at
    BEFORE UPDATE ON agent_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_sessions_updated_at();

-- Add index for updated_at
CREATE INDEX IF NOT EXISTS idx_agent_sessions_updated_at ON agent_sessions(updated_at DESC);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agent_sessions' 
ORDER BY ordinal_position;

-- Show success message
SELECT 'agent_sessions table updated successfully! Missing columns added.' as status;
