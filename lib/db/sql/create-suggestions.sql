-- Private visitor suggestions / error reports (admin inbox only).
CREATE TABLE IF NOT EXISTS suggestions (
  id serial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id integer NOT NULL,
  author_name text NOT NULL,
  message text NOT NULL,
  contact text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suggestions_entity_type_check CHECK (entity_type IN ('player', 'manager', 'match')),
  CONSTRAINT suggestions_status_check CHECK (status IN ('new', 'reviewed')),
  CONSTRAINT suggestions_author_name_len CHECK (char_length(author_name) >= 1 AND char_length(author_name) <= 80),
  CONSTRAINT suggestions_message_len CHECK (char_length(message) >= 1 AND char_length(message) <= 4000),
  CONSTRAINT suggestions_contact_len CHECK (contact IS NULL OR char_length(contact) <= 200)
);

CREATE INDEX IF NOT EXISTS suggestions_created_idx
  ON suggestions (created_at DESC);

CREATE INDEX IF NOT EXISTS suggestions_status_created_idx
  ON suggestions (status, created_at DESC);
