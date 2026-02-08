-- Migration: Cleanup Job (Audit Remediation)
-- Schedule cleanup of expired auth sessions/nonces every hour
-- Requires pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job
SELECT cron.schedule('cleanup-auth', '0 * * * *', 'SELECT cleanup_expired_auth()');

-- Note: Ensure cleanup_expired_auth() function is defined (it is in 20260204000001_auth_sessions.sql)
