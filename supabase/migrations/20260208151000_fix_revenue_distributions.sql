-- =====================================================
-- Fix revenue_distributions table
-- Add missing columns used by treasury/distribute API
-- =====================================================

-- Add missing columns
ALTER TABLE revenue_distributions
ADD COLUMN IF NOT EXISTS cardinal_amount VARCHAR(50),
ADD COLUMN IF NOT EXISTS dev_fund_amount VARCHAR(50),
ADD COLUMN IF NOT EXISTS cardinals_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS per_cardinal_share VARCHAR(50),
ADD COLUMN IF NOT EXISTS distribution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index on distribution_date
CREATE INDEX IF NOT EXISTS idx_revenue_distributions_date ON revenue_distributions(distribution_date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_distributions_status ON revenue_distributions(status);

COMMENT ON COLUMN revenue_distributions.distribution_date IS 'When the distribution was initiated';
COMMENT ON COLUMN revenue_distributions.status IS 'pending, completed, or failed';
COMMENT ON COLUMN revenue_distributions.cardinal_amount IS 'Total amount distributed to cardinals';
COMMENT ON COLUMN revenue_distributions.dev_fund_amount IS 'Amount allocated to development fund';
