-- Missed / saved penalties (Ogol A / C). Never count as goals.
CREATE TABLE IF NOT EXISTS match_penalty_events (
  id serial PRIMARY KEY,
  match_id integer NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  side text NOT NULL DEFAULT 'csa',
  event_type text NOT NULL,
  player_id integer REFERENCES players(id),
  player_name text NOT NULL,
  minute integer NOT NULL,
  injury_time_minute integer
);

CREATE INDEX IF NOT EXISTS match_penalty_events_match_id_idx
  ON match_penalty_events (match_id);

CREATE INDEX IF NOT EXISTS match_penalty_events_player_id_idx
  ON match_penalty_events (player_id);
