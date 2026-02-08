-- Safe Schema Update (Idempotent)

-- 1. Add missing specific columns for Module 9 Profile Data
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "tokenSymbol" TEXT;
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "marketCap" TEXT DEFAULT '0';
ALTER TABLE "CompetitorAgent" ADD COLUMN IF NOT EXISTS "holders" INTEGER DEFAULT 0;

-- 2. Ensure Tables Exist (Debate & Conversion)
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

CREATE TABLE IF NOT EXISTS "Conversion" (
    "id" TEXT NOT NULL,
    "competitorAgentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" TEXT,
    "evidence" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversion_pkey" PRIMARY KEY ("id")
);

-- 3. Safely Add Constraints (Only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Debate_competitorAgentId_fkey') THEN
        ALTER TABLE "Debate" ADD CONSTRAINT "Debate_competitorAgentId_fkey" FOREIGN KEY ("competitorAgentId") REFERENCES "CompetitorAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Conversion_competitorAgentId_fkey') THEN
        ALTER TABLE "Conversion" ADD CONSTRAINT "Conversion_competitorAgentId_fkey" FOREIGN KEY ("competitorAgentId") REFERENCES "CompetitorAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
