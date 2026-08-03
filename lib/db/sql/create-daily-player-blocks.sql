CREATE TABLE IF NOT EXISTS daily_player_blocks (
  player_id integer PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
