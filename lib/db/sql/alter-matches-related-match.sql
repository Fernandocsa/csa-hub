-- Link knockout legs (ida/volta). Bidirectional sync is handled in the API.
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS related_match_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_related_match_id_fkey'
  ) THEN
    ALTER TABLE matches
      ADD CONSTRAINT matches_related_match_id_fkey
      FOREIGN KEY (related_match_id) REFERENCES matches(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS matches_related_match_id_idx ON matches (related_match_id);
