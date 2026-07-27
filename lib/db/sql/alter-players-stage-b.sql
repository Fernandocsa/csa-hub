-- Player profile stage B: secondary positions (informative only).
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS secondary_positions text[] NOT NULL DEFAULT '{}';
