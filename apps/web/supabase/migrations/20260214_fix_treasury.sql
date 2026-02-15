-- ============================================================
-- FIX TREASURY TABLES
-- Purpose: Create treasury_totals (missing) and handle treasury_revenue
-- ============================================================

-- 1. Create treasury_totals (Required for Dashboard Vault Reserves)
-- This table was missing in the inspection.
CREATE TABLE IF NOT EXISTS treasury_totals (
    game_type text PRIMARY KEY,
    total_revenue numeric(20, 8) NOT NULL DEFAULT 0,
    total_tx_count integer NOT NULL DEFAULT 0,
    last_synced_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. treasury_revenue (Aggregated View)
-- NOTE: A table named 'treasury_revenue' already exists with a different schema.
-- The existing one has columns: id, source, amount, transaction_hash... (likely for Indulgences)
-- The new one wants: game_type, amount, tx_count...
--
-- To avoid data loss, we do NOT drop the existing table.
-- The dashboard only uses 'treasury_totals' so we can skip creating the aggregated 'treasury_revenue' for now.
-- If you need the aggregated view, you would need to rename the old table first:
-- ALTER TABLE treasury_revenue RENAME TO treasury_revenue_legacy;
-- Then run the original migration.

-- 3. Verification
SELECT 'Fix Complete' as status, 
       (SELECT count(*) FROM information_schema.tables WHERE table_name = 'treasury_totals') as totals_table_exists;
