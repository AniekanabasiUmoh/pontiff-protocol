-- =========================================
-- FIX ALL AGENT SYSTEM BUGS - SQL MIGRATION
-- =========================================
-- Run this FIRST before code fixes

-- Bug #7: Create game_history table for recording game results
CREATE TABLE IF NOT EXISTS game_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
    player_address TEXT NOT NULL,
    game_type TEXT DEFAULT 'RPS',
    result TEXT NOT NULL, -- 'win', 'loss', 'draw'
    wager_amount NUMERIC DEFAULT 0,
    profit_loss NUMERIC DEFAULT 0,
    player_move INTEGER, -- 1=Rock, 2=Paper, 3=Scissors
    pontiff_move INTEGER,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_history_session 
    ON game_history(session_id);
CREATE INDEX IF NOT EXISTS idx_game_history_player 
    ON game_history(player_address);
CREATE INDEX IF NOT EXISTS idx_game_history_created 
    ON game_history(created_at DESC);

-- Add total_draws column to agent_sessions if it doesn't exist
-- (It exists according to schema audit, this is just safety)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_sessions' 
        AND column_name = 'total_draws'
    ) THEN
        ALTER TABLE agent_sessions ADD COLUMN total_draws INTEGER DEFAULT 0;
    END IF;
END $$;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ game_history table created successfully';
    RAISE NOTICE '✅ Indexes created';
    RAISE NOTICE '✅ All SQL fixes applied';
END $$;
