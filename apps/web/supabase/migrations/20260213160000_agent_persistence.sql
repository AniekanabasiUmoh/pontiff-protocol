
-- Add persistence columns to agent_sessions
DO $$ BEGIN
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS is_running BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Update existing active sessions to be running (optional, but good for continuity if hot-reloading)
UPDATE agent_sessions SET is_running = TRUE WHERE status = 'active';
