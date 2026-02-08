-- Migration: Data Validation Constraints (Audit Remediation)

-- Ensure valid game states
ALTER TABLE games ADD CONSTRAINT valid_status 
  CHECK (status IN ('Pending', 'Active', 'Completed'));

-- Ensure valid leaderboard categories
ALTER TABLE leaderboard_entries ADD CONSTRAINT valid_category 
  CHECK (category IN ('Sinner', 'Saint', 'Heretic'));

-- Ensure positive scores (allow negative for Sinners depending on logic, but typically score is magnitude)
-- Audit says: "CHECK (score >= 0 OR category = 'Sinner')"
ALTER TABLE leaderboard_entries ADD CONSTRAINT positive_score 
  CHECK (score >= 0 OR category = 'Sinner');

-- Ensure valid crusade goal types
ALTER TABLE crusades ADD CONSTRAINT valid_goal_type
  CHECK (goal_type IN ('Conversion', 'Destruction'));

-- Ensure valid threat levels
ALTER TABLE competitor_agents ADD CONSTRAINT valid_threat_level
  CHECK (threat_level IN ('Low', 'Medium', 'High', 'Heretic'));
