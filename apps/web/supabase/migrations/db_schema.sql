-- Create VaticanEntrant table
CREATE TABLE "VaticanEntrant" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monPaid" TEXT NOT NULL,

    CONSTRAINT "VaticanEntrant_pkey" PRIMARY KEY ("id")
);

-- Create Confession table
CREATE TABLE "Confession" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "sins" JSONB NOT NULL,
    "roast" TEXT NOT NULL,
    "indulgencePrice" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "Confession_pkey" PRIMARY KEY ("id")
);

-- Create Game table
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "player1" TEXT NOT NULL,
    "player2" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "wager" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "winner" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- Create WorldEvent table
CREATE TABLE "WorldEvent" (
    "id" TEXT NOT NULL,
    "agentWallet" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_seq" SERIAL, -- Add serial for easier ordering if needed

    CONSTRAINT "WorldEvent_pkey" PRIMARY KEY ("id")
);

-- Create Leaderboard table
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

/* ... existing ... */
CREATE UNIQUE INDEX "Leaderboard_walletAddress_key" ON "Leaderboard"("walletAddress");

-- Create Crusades table (Sprint 3)
CREATE TABLE "Crusade" (
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
CREATE TABLE "CompetitorAgent" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "contractAddress" TEXT,
    "status" TEXT NOT NULL,
    "guiltPaid" TEXT NOT NULL DEFAULT '0',
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "CompetitorAgent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompetitorAgent_handle_key" ON "CompetitorAgent"("handle");
