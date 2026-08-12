-- Referees entity + optional link from matches (stage 1).
CREATE TABLE IF NOT EXISTS referees (
  id serial PRIMARY KEY,
  name text NOT NULL,
  -- Brazilian federation UF; optional so historical refs can be registered without UF
  state text,
  -- Soft-merge alias pointer (duplicate rows kept; matches use the keep id)
  merged_into_id integer NULL REFERENCES referees(id)
);

CREATE INDEX IF NOT EXISTS referees_name_idx ON referees (name);
CREATE INDEX IF NOT EXISTS referees_state_idx ON referees (state);
CREATE INDEX IF NOT EXISTS referees_merged_into_id_idx
  ON referees (merged_into_id)
  WHERE merged_into_id IS NOT NULL;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS referee_id integer REFERENCES referees(id);

CREATE INDEX IF NOT EXISTS matches_referee_id_idx
  ON matches (referee_id)
  WHERE referee_id IS NOT NULL;
