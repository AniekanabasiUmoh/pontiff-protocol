-- =========================================
-- 🚨 RUN THIS FIRST - CRITICAL SQL FIX
-- =========================================
-- This creates the missing game_history table
-- Without this, agents CANNOT record game results

-- Step 1: Create game_history table
CREATE TABLE IF NOT EXISTS game_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
    player_address TEXT NOT NULL,
    game_type TEXT DEFAULT 'RPS',
    result TEXT NOT NULL, -- 'win', 'loss', 'draw'
    wager_amount NUMERIC DEFAULT 0,
    profit_loss NUMERIC DEFAULT 0,
    player_move INTEGER,
    pontiff_move INTEGER,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_history_session 
    ON game_history(session_id);
CREATE INDEX IF NOT EXISTS idx_game_history_player 
    ON game_history(player_address);
CREATE INDEX IF NOT EXISTS idx_game_history_created 
    ON game_history(created_at DESC);

-- Step 3: Verify table exists
SELECT 'game_history table created successfully!' as status;
