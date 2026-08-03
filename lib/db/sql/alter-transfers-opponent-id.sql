-- Link transfers to opponents catalog (crest + /adversarios/:id).
ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS opponent_id integer REFERENCES opponents(id);

CREATE INDEX IF NOT EXISTS transfers_opponent_idx ON transfers (opponent_id);
