-- Enhanced database schema for Phase 15

-- Transfer violations tracking (for cumulative monitoring)
CREATE TABLE IF NOT EXISTS transfer_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user TEXT NOT NULL,
  nft_token_id INTEGER NOT NULL,
  transfer_amount TEXT NOT NULL,
  cumulative_amount TEXT NOT NULL,
  individual_percentage NUMERIC NOT NULL,
  cumulative_percentage NUMERIC NOT NULL,
  transfer_count INTEGER NOT NULL,
  grace_period_remaining NUMERIC NOT NULL,
  block_number INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transfer_violations_user ON transfer_violations(user);
CREATE INDEX idx_transfer_violations_nft ON transfer_violations(nft_token_id);
CREATE INDEX idx_transfer_violations_timestamp ON transfer_violations(timestamp);

-- Excommunications (successful revocations)
CREATE TABLE IF NOT EXISTS excommunications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user TEXT NOT NULL,
  nft_token_id INTEGER NOT NULL,
  absolution_time TIMESTAMP NOT NULL,
  transfer_amount TEXT NOT NULL,
  percentage_sold NUMERIC NOT NULL,
  cumulative_percentage NUMERIC NOT NULL,
  transfer_count INTEGER NOT NULL,
  grace_period_remaining NUMERIC NOT NULL,
  revocation_tx TEXT NOT NULL,
  gas_used TEXT,
  watcher_address TEXT,
  image_url TEXT,
  tweet_id TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_excommunications_user ON excommunications(user);
CREATE INDEX idx_excommunications_nft ON excommunications(nft_token_id);
CREATE INDEX idx_excommunications_created_at ON excommunications(created_at);

-- Failed revocations (for retry)
CREATE TABLE IF NOT EXISTS failed_revocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user TEXT NOT NULL,
  nft_token_id INTEGER NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_failed_revocations_resolved ON failed_revocations(resolved);
CREATE INDEX idx_failed_revocations_created_at ON failed_revocations(created_at);

-- Admin alerts
CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  data JSONB,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  acknowledged_by TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_alerts_acknowledged ON admin_alerts(acknowledged);
CREATE INDEX idx_admin_alerts_created_at ON admin_alerts(created_at);

-- Watcher metrics (for monitoring)
CREATE TABLE IF NOT EXISTS watcher_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_watcher_metrics_name ON watcher_metrics(metric_name);
CREATE INDEX idx_watcher_metrics_timestamp ON watcher_metrics(timestamp);
