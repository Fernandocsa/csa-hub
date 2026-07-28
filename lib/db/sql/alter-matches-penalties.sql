-- Penalty shootout score (90' result stays in result/goals_*).
ALTER TABLE matches ADD COLUMN IF NOT EXISTS penalties_for integer;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS penalties_against integer;

-- Público pagante (vs attendance = total).
ALTER TABLE matches ADD COLUMN IF NOT EXISTS attendance_paid integer;
