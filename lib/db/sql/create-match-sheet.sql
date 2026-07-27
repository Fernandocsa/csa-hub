-- Phase 1 match sheet (CSA side). `side` kept for future opponent support.
CREATE TABLE IF NOT EXISTS match_lineups (
  id serial PRIMARY KEY,
  match_id integer NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  side text NOT NULL DEFAULT 'csa',
  player_id integer REFERENCES players(id),
  player_name text NOT NULL,
  role text NOT NULL,
  shirt_number integer,
  position text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS match_lineups_match_side_player_uidx
  ON match_lineups (match_id, side, player_id);

CREATE TABLE IF NOT EXISTS match_goals (
  id serial PRIMARY KEY,
  match_id integer NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  side text NOT NULL DEFAULT 'csa',
  scorer_lineup_id integer REFERENCES match_lineups(id) ON DELETE SET NULL,
  scorer_player_id integer REFERENCES players(id),
  scorer_name text NOT NULL,
  minute integer NOT NULL,
  injury_time_minute integer,
  assist_lineup_id integer REFERENCES match_lineups(id) ON DELETE SET NULL,
  assist_player_id integer REFERENCES players(id),
  assist_name text
);

CREATE TABLE IF NOT EXISTS match_cards (
  id serial PRIMARY KEY,
  match_id integer NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  side text NOT NULL DEFAULT 'csa',
  card_type text NOT NULL,
  lineup_id integer REFERENCES match_lineups(id) ON DELETE SET NULL,
  player_id integer REFERENCES players(id),
  player_name text NOT NULL,
  minute integer NOT NULL,
  injury_time_minute integer
);

CREATE INDEX IF NOT EXISTS match_lineups_match_id_idx ON match_lineups (match_id);
CREATE INDEX IF NOT EXISTS match_goals_match_id_idx ON match_goals (match_id);
CREATE INDEX IF NOT EXISTS match_cards_match_id_idx ON match_cards (match_id);

-- Phase 2: substitutions (CSA). `side` kept for future opponent support.
CREATE TABLE IF NOT EXISTS match_substitutions (
  id serial PRIMARY KEY,
  match_id integer NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  side text NOT NULL DEFAULT 'csa',
  player_out_lineup_id integer REFERENCES match_lineups(id) ON DELETE SET NULL,
  player_out_id integer REFERENCES players(id),
  player_out_name text NOT NULL,
  player_in_lineup_id integer REFERENCES match_lineups(id) ON DELETE SET NULL,
  player_in_id integer REFERENCES players(id),
  player_in_name text NOT NULL,
  minute integer NOT NULL,
  injury_time_minute integer
);

CREATE INDEX IF NOT EXISTS match_substitutions_match_id_idx ON match_substitutions (match_id);
