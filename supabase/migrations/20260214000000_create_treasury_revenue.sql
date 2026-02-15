-- Treasury Revenue Tracking
-- Aggregated view of house fees collected per game type
-- Populated by /api/cron/sync-treasury from balance_transactions

CREATE TABLE IF NOT EXISTS treasury_revenue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type text NOT NULL,          -- 'RPS', 'POKER', 'JUDAS', 'DEBATE', etc.
    amount numeric(20, 8) NOT NULL DEFAULT 0,
    tx_count integer NOT NULL DEFAULT 0,
    period_start timestamptz NOT NULL, -- start of the aggregation window
    period_end timestamptz NOT NULL,   -- end of the aggregation window
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique per game_type + period for upsert
CREATE UNIQUE INDEX IF NOT EXISTS treasury_revenue_game_period_idx
    ON treasury_revenue (game_type, period_start, period_end);

-- Index for fast summing
CREATE INDEX IF NOT EXISTS treasury_revenue_game_type_idx ON treasury_revenue (game_type);
CREATE INDEX IF NOT EXISTS treasury_revenue_created_at_idx ON treasury_revenue (created_at DESC);

-- Also create a simple lifetime totals table for quick dashboard reads
CREATE TABLE IF NOT EXISTS treasury_totals (
    game_type text PRIMARY KEY,
    total_revenue numeric(20, 8) NOT NULL DEFAULT 0,
    total_tx_count integer NOT NULL DEFAULT 0,
    last_synced_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);
