-- Stage C: opponent home stadium + stadium UF
ALTER TABLE stadiums
  ADD COLUMN IF NOT EXISTS state text;

ALTER TABLE opponents
  ADD COLUMN IF NOT EXISTS home_stadium_id integer REFERENCES stadiums(id);

CREATE INDEX IF NOT EXISTS opponents_home_stadium_idx
  ON opponents (home_stadium_id);
