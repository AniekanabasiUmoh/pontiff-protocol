-- SIWE Authentication Tables for Production

-- Store active sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  nonce TEXT NOT NULL,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, chain_id)
);

-- Store used nonces to prevent replay attacks
CREATE TABLE IF NOT EXISTS auth_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_wallet ON auth_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_nonces_nonce ON auth_nonces(nonce);
CREATE INDEX IF NOT EXISTS idx_nonces_expires ON auth_nonces(expires_at);

-- Cleanup function for expired sessions and nonces
CREATE OR REPLACE FUNCTION cleanup_expired_auth()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_sessions WHERE expires_at < NOW();
  DELETE FROM auth_nonces WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE auth_sessions IS 'Stores active SIWE authentication sessions';
COMMENT ON TABLE auth_nonces IS 'Stores nonces to prevent replay attacks';
COMMENT ON COLUMN auth_nonces.used_at IS 'Timestamp when nonce was used for verification';
