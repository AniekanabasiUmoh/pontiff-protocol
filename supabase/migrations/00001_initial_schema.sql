-- Initial schema for The Pontiff

-- 1. Users Table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  twitter_handle TEXT,
  discord_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- 2. Sins Table
CREATE TABLE sins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  sin_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  token_address TEXT,
  token_symbol TEXT,
  buy_amount NUMERIC,
  sell_amount NUMERIC,
  loss_amount_usd NUMERIC,
  buy_timestamp TIMESTAMP WITH TIME ZONE,
  sell_timestamp TIMESTAMP WITH TIME ZONE,
  transaction_hash TEXT,
  chain TEXT DEFAULT 'monad',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sins_user ON sins(user_id);
CREATE INDEX idx_sins_wallet ON sins(wallet_address);
CREATE INDEX idx_sins_severity ON sins(severity);
CREATE INDEX idx_sins_type ON sins(sin_type);

-- 3. Confessions Table
CREATE TABLE confessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  roast_text TEXT NOT NULL,
  writ_image_url TEXT,
  tweet_id TEXT,
  tweet_url TEXT,
  share_count INTEGER DEFAULT 0,
  is_absolved BOOLEAN DEFAULT FALSE,
  absolution_tx_hash TEXT,
  absolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_confessions_user ON confessions(user_id);
CREATE INDEX idx_confessions_wallet ON confessions(wallet_address);
CREATE INDEX idx_confessions_absolved ON confessions(is_absolved);
CREATE INDEX idx_confessions_created ON confessions(created_at DESC);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sins ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON sins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON confessions FOR SELECT USING (true);

-- Service role write policies
CREATE POLICY "Service role all access" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all access" ON sins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all access" ON confessions FOR ALL USING (auth.role() = 'service_role');
