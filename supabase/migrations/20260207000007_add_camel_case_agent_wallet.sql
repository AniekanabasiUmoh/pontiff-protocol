-- Add agentWallet column to world_events to fix camelCase compatibility issue
ALTER TABLE "world_events" ADD COLUMN IF NOT EXISTS "agentWallet" TEXT;
