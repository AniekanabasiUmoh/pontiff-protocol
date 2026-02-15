-- Quick fix for column issues
-- Run this to fix immediate test failures

-- Add created_at to competitor_agents if it doesn't exist
ALTER TABLE competitor_agents
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have created_at = last_interaction
UPDATE competitor_agents
SET created_at = COALESCE(last_interaction, NOW())
WHERE created_at IS NULL;

-- Ensure crusades has the right columns
ALTER TABLE crusades
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- For cardinal memberships - check what column name is actually used
DO $$
BEGIN
    -- Try to add expires_at if expiresAt doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cardinal_memberships'
        AND column_name = 'expires_at'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cardinal_memberships'
        AND column_name = 'expiry_date'
    ) THEN
        -- Alias expiry_date as expires_at for backwards compatibility
        EXECUTE 'ALTER TABLE cardinal_memberships ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE';
        EXECUTE 'UPDATE cardinal_memberships SET expires_at = expiry_date WHERE expires_at IS NULL';
    END IF;
END $$;

SELECT 'Migration completed!' as status;
