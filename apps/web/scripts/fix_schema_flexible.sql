
-- Fix created_at default if missing
ALTER TABLE agent_sessions ALTER COLUMN created_at SET DEFAULT NOW();

-- Check and update status enum if necessary (idempotent style)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'agent_status' AND e.enumlabel = 'pending_funding') THEN
        -- If status is an ENUM type called 'agent_status' (hypothetical), add value
        -- BUT usually status is TEXT in Supabase unless explicitly defined.
        -- If it's pure TEXT with a CHECK constraint, we might need to drop/update the constraint.
        NULL;
    END IF;
END $$;

-- If status has a check constraint, drop it to allow new values
ALTER TABLE agent_sessions DROP CONSTRAINT IF EXISTS agent_sessions_status_check;
