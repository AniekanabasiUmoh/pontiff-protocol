-- Fix the agent's stop-loss issue
-- The agent has 10 GUILT but stop-loss is set to 20
-- This makes it stop immediately without playing

UPDATE agent_sessions
SET stop_loss = 2  -- Set to 2 GUILT (20% of 10)
WHERE id = '369a5b90-d98a-4701-9202-8b64d2c287e5';

-- Verify the update
SELECT 
    id,
    strategy,
    deposit_amount,
    current_balance,
    stop_loss,
    status
FROM agent_sessions
WHERE id = '369a5b90-d98a-4701-9202-8b64d2c287e5';
