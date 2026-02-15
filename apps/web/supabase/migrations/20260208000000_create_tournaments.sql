-- Migration: Create tournaments table for Holy Tournament System
-- Date: 2026-02-08

CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tournament_type TEXT DEFAULT 'Holy',
    status TEXT NOT NULL DEFAULT 'pending',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 32,
    current_participants INTEGER NOT NULL DEFAULT 0,
    prize_pool NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_dates ON tournaments(start_date, end_date);

-- Add constraint to ensure valid participant counts
ALTER TABLE tournaments 
ADD CONSTRAINT valid_max_participants 
CHECK (max_participants IN (8, 16, 32, 64, 128));

ALTER TABLE tournaments 
ADD CONSTRAINT valid_participant_count 
CHECK (current_participants >= 0 AND current_participants <= max_participants);
