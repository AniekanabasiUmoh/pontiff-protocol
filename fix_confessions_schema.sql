-- =====================================================
-- FIX CONFESSIONS TABLE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Option 1: If you have a 'roast' column, rename it to 'roast_text'
ALTER TABLE "confessions"
RENAME COLUMN "roast" TO "roast_text";

-- Option 2: If the above fails, just add the missing columns
ALTER TABLE "confessions" ADD COLUMN IF NOT EXISTS "roast_text" TEXT;
ALTER TABLE "confessions" ADD COLUMN IF NOT EXISTS "writ_image_url" TEXT;
ALTER TABLE "confessions" ADD COLUMN IF NOT EXISTS "tweet_id" TEXT;
ALTER TABLE "confessions" ADD COLUMN IF NOT EXISTS "tweet_url" TEXT;
ALTER TABLE "confessions" ADD COLUMN IF NOT EXISTS "share_count" INTEGER DEFAULT 0;
ALTER TABLE "confessions" ADD COLUMN IF NOT EXISTS "is_absolved" BOOLEAN DEFAULT FALSE;
ALTER TABLE "confessions" ADD COLUMN IF NOT EXISTS "absolution_tx_hash" TEXT;
ALTER TABLE "confessions" ADD COLUMN IF NOT EXISTS "absolved_at" TIMESTAMP WITH TIME ZONE;

-- Verify the schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'confessions'
ORDER BY ordinal_position;
