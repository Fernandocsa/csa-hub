-- Opponent founding year + many-to-many club (opponent) ↔ stadium.
-- club_id references opponents: there is no separate clubs table.

ALTER TABLE opponents
  ADD COLUMN IF NOT EXISTS founding_year integer;

CREATE TABLE IF NOT EXISTS club_stadiums (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES opponents(id) ON DELETE CASCADE,
  stadium_id INTEGER NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(club_id, stadium_id)
);

CREATE INDEX IF NOT EXISTS club_stadiums_stadium_idx
  ON club_stadiums (stadium_id);

CREATE UNIQUE INDEX IF NOT EXISTS club_stadiums_one_primary_uidx
  ON club_stadiums (club_id)
  WHERE is_primary IS TRUE;

-- Existing single home_stadium_id becomes the primary club stadium.
INSERT INTO club_stadiums (club_id, stadium_id, is_primary)
SELECT id, home_stadium_id, true
FROM opponents
WHERE home_stadium_id IS NOT NULL
ON CONFLICT (club_id, stadium_id) DO NOTHING;
