-- Optional Home deep-links for the featured next match card.
ALTER TABLE next_match
  ADD COLUMN IF NOT EXISTS opponent_id integer REFERENCES opponents(id),
  ADD COLUMN IF NOT EXISTS match_id integer REFERENCES matches(id);
