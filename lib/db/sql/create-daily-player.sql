CREATE TABLE IF NOT EXISTS daily_player (
  play_date date PRIMARY KEY,
  player_id integer NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_player_player_id_idx
  ON daily_player (player_id);

CREATE INDEX IF NOT EXISTS daily_player_player_date_idx
  ON daily_player (player_id, play_date);
