-- Season-scoped nicknames for Ogol paste (e.g. "Enio" → Ênio Oliveira in 2025 only).
CREATE TABLE IF NOT EXISTS player_season_name_aliases (
  id serial PRIMARY KEY,
  player_id integer NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season text NOT NULL,
  alias text NOT NULL,
  alias_norm text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS player_season_name_aliases_season_norm_uidx
  ON player_season_name_aliases (season, alias_norm);

CREATE INDEX IF NOT EXISTS player_season_name_aliases_season_idx
  ON player_season_name_aliases (season);

CREATE INDEX IF NOT EXISTS player_season_name_aliases_player_idx
  ON player_season_name_aliases (player_id);
