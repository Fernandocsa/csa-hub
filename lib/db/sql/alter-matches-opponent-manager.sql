-- Opponent head coach per match. CSA coach remains matches.manager_id.
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS opponent_manager_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_opponent_manager_id_fkey'
  ) THEN
    ALTER TABLE matches
      ADD CONSTRAINT matches_opponent_manager_id_fkey
      FOREIGN KEY (opponent_manager_id) REFERENCES managers(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS matches_opponent_manager_id_idx ON matches (opponent_manager_id);
