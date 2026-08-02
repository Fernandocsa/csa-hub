-- CSA player transfers (arrivals / departures by season)
CREATE TABLE IF NOT EXISTS transfers (
  id serial PRIMARY KEY,
  player_id integer NOT NULL REFERENCES players(id),
  direction text NOT NULL CHECK (direction IN ('in', 'out')),
  club text,
  transfer_date date,
  season text NOT NULL,
  transfer_type text,
  notes text
);

CREATE INDEX IF NOT EXISTS transfers_season_idx ON transfers (season);
CREATE INDEX IF NOT EXISTS transfers_player_idx ON transfers (player_id);
CREATE INDEX IF NOT EXISTS transfers_direction_idx ON transfers (direction);
