-- Soft-merge pointer for duplicate referee rows (aliases kept, matches reassigned).
ALTER TABLE referees
  ADD COLUMN IF NOT EXISTS merged_into_id integer NULL REFERENCES referees(id);

CREATE INDEX IF NOT EXISTS referees_merged_into_id_idx
  ON referees (merged_into_id)
  WHERE merged_into_id IS NOT NULL;
