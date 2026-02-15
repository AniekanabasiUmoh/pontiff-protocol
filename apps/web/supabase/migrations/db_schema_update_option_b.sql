-- Upgrade CompetitorAgent (Track 1 Refinement)
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "threatLevel" TEXT NOT NULL DEFAULT 'Low';
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "isShadow" BOOLEAN NOT NULL DEFAULT false;

-- Add Profile Fields (Module 9 Audit Fix)
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "tokenSymbol" TEXT;
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "marketCap" TEXT DEFAULT '0';
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "holders" INTEGER DEFAULT 0;

-- Create Debate Table (Evidence)
CREATE TABLE IF NOT EXISTS "Debate" (
    "id" TEXT NOT NULL,
    "competitorAgentId" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "ourArgument" TEXT NOT NULL,
    "theirArgument" TEXT,
    "status" TEXT NOT NULL,
    "exchanges" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Debate_pkey" PRIMARY KEY ("id")
);

-- Create Conversion Table (Evidence)
CREATE TABLE IF NOT EXISTS "Conversion" (
    "id" TEXT NOT NULL,
    "competitorAgentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" TEXT,
    "evidence" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversion_pkey" PRIMARY KEY ("id")
);

-- Add Foreign Keys
ALTER TABLE "Debate" ADD CONSTRAINT "Debate_competitorAgentId_fkey" FOREIGN KEY ("competitorAgentId") REFERENCES "CompetitorAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Conversion" ADD CONSTRAINT "Conversion_competitorAgentId_fkey" FOREIGN KEY ("competitorAgentId") REFERENCES "CompetitorAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
