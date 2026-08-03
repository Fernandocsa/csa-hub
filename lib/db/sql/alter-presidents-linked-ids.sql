-- Optional links from presidents to existing player / manager personas.
ALTER TABLE presidents
  ADD COLUMN IF NOT EXISTS linked_player_id integer REFERENCES players(id);

ALTER TABLE presidents
  ADD COLUMN IF NOT EXISTS linked_manager_id integer REFERENCES managers(id);

CREATE INDEX IF NOT EXISTS presidents_linked_player_idx
  ON presidents (linked_player_id);
CREATE INDEX IF NOT EXISTS presidents_linked_manager_idx
  ON presidents (linked_manager_id);
