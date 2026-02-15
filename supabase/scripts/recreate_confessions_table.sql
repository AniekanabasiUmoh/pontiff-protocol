DROP TABLE IF EXISTS "confessions";

CREATE TABLE "confessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "walletAddress" TEXT NOT NULL,
    "sins" JSONB,
    "roast" TEXT,
    "indulgencePrice" TEXT,
    "status" TEXT,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
