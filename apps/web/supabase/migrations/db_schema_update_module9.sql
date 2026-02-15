-- Create Crusades table (Sprint 3)
CREATE TABLE IF NOT EXISTS "Crusade" (
    "id" TEXT NOT NULL,
    "targetAgent" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "participants" JSONB,

    CONSTRAINT "Crusade_pkey" PRIMARY KEY ("id")
);

-- Create CompetitorAgent table (Track 1)
CREATE TABLE IF NOT EXISTS "CompetitorAgent" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "contractAddress" TEXT,
    "status" TEXT NOT NULL,
    "guiltPaid" TEXT NOT NULL DEFAULT '0',
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "CompetitorAgent_pkey" PRIMARY KEY ("id")
);

-- Safely create index
CREATE UNIQUE INDEX IF NOT EXISTS "CompetitorAgent_handle_key" ON "CompetitorAgent"("handle");
