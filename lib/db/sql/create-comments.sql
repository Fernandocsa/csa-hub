-- Public visitor comments (players, managers, matches).
CREATE TABLE IF NOT EXISTS comments (
  id serial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id integer NOT NULL,
  author_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comments_entity_type_check CHECK (entity_type IN ('player', 'manager', 'match')),
  CONSTRAINT comments_author_name_len CHECK (char_length(author_name) >= 1 AND char_length(author_name) <= 80),
  CONSTRAINT comments_body_len CHECK (char_length(body) >= 1 AND char_length(body) <= 2000)
);

CREATE INDEX IF NOT EXISTS comments_entity_created_idx
  ON comments (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS comments_created_idx
  ON comments (created_at DESC);
