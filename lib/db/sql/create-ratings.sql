-- Public star ratings (players, managers, matches). One vote per device per entity.
CREATE TABLE IF NOT EXISTS ratings (
  id serial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id integer NOT NULL,
  stars smallint NOT NULL,
  voter_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ratings_stars_check CHECK (stars >= 1 AND stars <= 5),
  CONSTRAINT ratings_entity_type_check CHECK (entity_type IN ('player', 'manager', 'match'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ratings_entity_voter_uidx
  ON ratings (entity_type, entity_id, voter_token);

CREATE INDEX IF NOT EXISTS ratings_entity_idx
  ON ratings (entity_type, entity_id);
