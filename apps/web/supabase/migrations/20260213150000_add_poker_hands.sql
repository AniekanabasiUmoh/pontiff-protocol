
-- Create Types
DO $$ BEGIN
    CREATE TYPE poker_hand_stage AS ENUM ('PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN', 'ENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE poker_hand_result AS ENUM ('WIN', 'LOSS', 'DRAW', 'FOLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing table if it conflicts (Dev environment safe-mode)
DROP TABLE IF EXISTS public.poker_hands;

-- Create Table
CREATE TABLE IF NOT EXISTS public.poker_hands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.agent_sessions(id),
    wallet_address TEXT NOT NULL,
    deck JSONB NOT NULL,
    player_hand JSONB NOT NULL,
    pontiff_hand JSONB NOT NULL,
    community_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
    stage poker_hand_stage NOT NULL DEFAULT 'PREFLOP',
    pot NUMERIC NOT NULL DEFAULT 0,
    player_bet NUMERIC NOT NULL DEFAULT 0,
    result poker_hand_result,
    pnl NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_poker_hands_wallet ON public.poker_hands(wallet_address);
CREATE INDEX IF NOT EXISTS idx_poker_hands_session ON public.poker_hands(session_id);
