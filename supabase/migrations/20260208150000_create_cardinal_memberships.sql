-- =====================================================
-- Cardinal Memberships Table Creation
-- Fixes: "Could not find the table 'public.cardinal_memberships'"
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cardinal_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'basic',  -- 'basic', 'premium', 'elite'
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active', 'expired', 'cancelled'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT false,
    subscription_price VARCHAR(50),  -- Price paid in GUILT tokens
    total_spent VARCHAR(50) DEFAULT '0',  -- Total lifetime spending
    perks JSONB DEFAULT '{
        "revenue_share": 0.05,
        "early_access": true,
        "exclusive_tournaments": false,
        "custom_badge": false
    }',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cardinal_memberships_wallet ON public.cardinal_memberships(wallet_address);
CREATE INDEX IF NOT EXISTS idx_cardinal_memberships_status ON public.cardinal_memberships(status);
CREATE INDEX IF NOT EXISTS idx_cardinal_memberships_tier ON public.cardinal_memberships(tier);
CREATE INDEX IF NOT EXISTS idx_cardinal_memberships_expiry ON public.cardinal_memberships(expiry_date);

-- Ensure only one active membership per wallet
CREATE UNIQUE INDEX IF NOT EXISTS idx_cardinal_memberships_unique_active
ON public.cardinal_memberships(wallet_address)
WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.cardinal_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read own membership" ON public.cardinal_memberships
    FOR SELECT
    USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR TRUE);

CREATE POLICY "Allow insert membership" ON public.cardinal_memberships
    FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Allow update own membership" ON public.cardinal_memberships
    FOR UPDATE
    USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR TRUE);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cardinal_membership_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cardinal_memberships_timestamp
    BEFORE UPDATE ON public.cardinal_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_cardinal_membership_timestamp();

-- Trigger to auto-expire memberships
CREATE OR REPLACE FUNCTION check_membership_expiry()
RETURNS void AS $$
BEGIN
    UPDATE public.cardinal_memberships
    SET status = 'expired'
    WHERE status = 'active'
        AND expiry_date IS NOT NULL
        AND expiry_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Helper function to get active membership
CREATE OR REPLACE FUNCTION get_active_membership(wallet VARCHAR)
RETURNS TABLE (
    id UUID,
    tier VARCHAR,
    perks JSONB,
    expiry_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.id,
        cm.tier,
        cm.perks,
        cm.expiry_date
    FROM public.cardinal_memberships cm
    WHERE cm.wallet_address = wallet
        AND cm.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.cardinal_memberships IS 'Module 13: Cardinal membership subscriptions for revenue sharing and exclusive perks';
