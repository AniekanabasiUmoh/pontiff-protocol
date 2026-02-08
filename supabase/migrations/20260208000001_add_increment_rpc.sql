CREATE OR REPLACE FUNCTION increment_games_played(session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agent_sessions
  SET games_played = games_played + 1
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;
