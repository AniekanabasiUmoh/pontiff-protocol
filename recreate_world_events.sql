-- Drop potential old names
DROP TABLE IF EXISTS "WorldEvent";
DROP TABLE IF EXISTS "world_events";

-- Create table matching the code's expectations (snake_case table, camelCase columns)
CREATE TABLE "world_events" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "agentWallet" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
