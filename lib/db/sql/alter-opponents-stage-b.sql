-- Opponent location fields (city + Brazilian UF). home_stadium_id comes in Stage C.
ALTER TABLE opponents
  ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE opponents
  ADD COLUMN IF NOT EXISTS state text;

CREATE INDEX IF NOT EXISTS opponents_state_idx ON opponents (state);
