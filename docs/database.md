# Supabase Database Setup

## Tables

### 1. Users Table

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  twitter_handle TEXT,
  discord_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX idx_users_wallet ON users(wallet_address);
```

### 2. Sins Table

```sql
CREATE TABLE sins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Sin Classification
  sin_type TEXT NOT NULL, -- 'rug_pull', 'paper_hands', 'top_buyer', 'fomo_degen'
  severity TEXT NOT NULL, -- 'minor', 'mortal', 'cardinal', 'unforgivable'
  
  -- Transaction Details
  token_address TEXT,
  token_symbol TEXT,
  buy_amount NUMERIC,
  sell_amount NUMERIC,
  loss_amount_usd NUMERIC,
  buy_timestamp TIMESTAMP WITH TIME ZONE,
  sell_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  transaction_hash TEXT,
  chain TEXT DEFAULT 'monad',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sins_user ON sins(user_id);
CREATE INDEX idx_sins_wallet ON sins(wallet_address);
CREATE INDEX idx_sins_severity ON sins(severity);
CREATE INDEX idx_sins_type ON sins(sin_type);
```

### 3. Confessions Table

```sql
CREATE TABLE confessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Roast Content
  roast_text TEXT NOT NULL,
  writ_image_url TEXT, -- URL to generated Writ of Sin image
  
  -- Social
  tweet_id TEXT,
  tweet_url TEXT,
  share_count INTEGER DEFAULT 0,
  
  -- Status
  is_absolved BOOLEAN DEFAULT FALSE,
  absolution_tx_hash TEXT,
  absolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_confessions_user ON confessions(user_id);
CREATE INDEX idx_confessions_wallet ON confessions(wallet_address);
CREATE INDEX idx_confessions_absolved ON confessions(is_absolved);
CREATE INDEX idx_confessions_created ON confessions(created_at DESC);
```

### 4. Indulgences Table (NFT Tracking)

```sql
CREATE TABLE indulgences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id BIGINT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  confession_id UUID REFERENCES confessions(id),
  
  -- NFT Details
  sins_forgiven INTEGER DEFAULT 1,
  total_loss_forgiven NUMERIC,
  certificate_image_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'excommunicated', 'revoked'
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  excommunicated_at TIMESTAMP WITH TIME ZONE,
  excommunication_reason TEXT,
  
  -- Re-entry tracking
  is_reentry BOOLEAN DEFAULT FALSE,
  previous_token_id BIGINT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_indulgences_wallet ON indulgences(wallet_address);
CREATE INDEX idx_indulgences_status ON indulgences(status);
CREATE INDEX idx_indulgences_token ON indulgences(token_id);
```

### 5. Staking Records Table

```sql
CREATE TABLE staking_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  
  -- Staking Details
  amount NUMERIC NOT NULL,
  tier TEXT, -- 'acolyte', 'priest', 'bishop', 'cardinal'
  
  -- Timestamps
  staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unstaked_at TIMESTAMP WITH TIME ZONE,
  
  -- Rewards
  rewards_earned NUMERIC DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staking_wallet ON staking_records(wallet_address);
CREATE INDEX idx_staking_active ON staking_records(is_active);
```

### 6. Betrayal Events Table (Judas Protocol)

```sql
CREATE TABLE betrayal_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  epoch_id BIGINT NOT NULL,
  wallet_address TEXT NOT NULL,
  
  -- Betrayal Details
  action TEXT NOT NULL, -- 'betray', 'loyal'
  stake_amount NUMERIC NOT NULL,
  
  -- Outcome
  outcome TEXT, -- 'failed_coup', 'partial_coup', 'full_coup'
  reward_amount NUMERIC,
  slash_amount NUMERIC,
  
  -- Metadata
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_betrayal_epoch ON betrayal_events(epoch_id);
CREATE INDEX idx_betrayal_wallet ON betrayal_events(wallet_address);
CREATE INDEX idx_betrayal_status ON betrayal_events(status);
```

### 7. Leaderboards Table

```sql
CREATE TABLE leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  
  -- Leaderboard Type
  board_type TEXT NOT NULL, -- 'shame', 'saints', 'heretics'
  
  -- Metrics
  total_loss NUMERIC DEFAULT 0,
  total_rugs INTEGER DEFAULT 0,
  loyalty_score INTEGER DEFAULT 0,
  stake_amount NUMERIC DEFAULT 0,
  days_staked INTEGER DEFAULT 0,
  referrals INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  
  -- Rankings
  rank INTEGER,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leaderboard_type ON leaderboard_entries(board_type);
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(board_type, rank);
CREATE INDEX idx_leaderboard_wallet ON leaderboard_entries(wallet_address);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sins ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE indulgences ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON sins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON confessions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON indulgences FOR SELECT USING (true);

-- Service role write access (backend only)
CREATE POLICY "Service role all access" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all access" ON sins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all access" ON confessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all access" ON indulgences FOR ALL USING (auth.role() = 'service_role');
```

## Storage Buckets

```sql
-- Create bucket for Writ of Sin images
INSERT INTO storage.buckets (id, name, public)
VALUES ('writs', 'writs', true);

-- Create bucket for Certificate images
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true);

-- Public read access
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'writs');
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');

-- Service role upload
CREATE POLICY "Service role upload" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'writs' AND auth.role() = 'service_role');
CREATE POLICY "Service role upload" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'service_role');
```

## Setup Instructions

### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each table creation script
4. Run them in order
5. Create the storage buckets in **Storage** section

### Option 2: Via Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Create migration file
supabase migration new initial_schema

# Copy the SQL above into the migration file
# Then push to Supabase
supabase db push
```

### Option 3: Programmatic Setup

Save all the SQL above to `supabase/migrations/00001_initial_schema.sql` and we can push it via CLI when you're ready.
