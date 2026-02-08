-- =====================================================
-- COMPLETE FIX FOR CONFESSIONS TABLE
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- First, let's see what we have
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'confessions'
ORDER BY ordinal_position;

-- Drop and recreate the table with correct schema
DROP TABLE IF EXISTS "confessions" CASCADE;

CREATE TABLE "confessions" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "wallet_address" TEXT NOT NULL,
  "roast_text" TEXT NOT NULL,
  "writ_image_url" TEXT,
  "tweet_id" TEXT,
  "tweet_url" TEXT,
  "share_count" INTEGER DEFAULT 0,
  "is_absolved" BOOLEAN DEFAULT FALSE,
  "absolution_tx_hash" TEXT,
  "absolved_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX "idx_confessions_user" ON "confessions"("user_id");
CREATE INDEX "idx_confessions_wallet" ON "confessions"("wallet_address");
CREATE INDEX "idx_confessions_absolved" ON "confessions"("is_absolved");
CREATE INDEX "idx_confessions_created" ON "confessions"("created_at" DESC);

-- Enable RLS
ALTER TABLE "confessions" ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public read access" ON "confessions" FOR SELECT USING (true);

-- Verify the final schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'confessions'
ORDER BY ordinal_position;

SELECT 'Confessions table recreated successfully!' AS status;
