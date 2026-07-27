-- Player profile admin stage A: deceased flag.
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_deceased boolean NOT NULL DEFAULT false;
