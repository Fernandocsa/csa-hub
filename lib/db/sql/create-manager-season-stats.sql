-- Per-season manager stats (manual or calculated from matches).
CREATE TABLE IF NOT EXISTS manager_season_stats (
  id serial PRIMARY KEY,
  manager_id integer NOT NULL REFERENCES managers(id) ON DELETE CASCADE,
  season text NOT NULL,
  games integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  goals_for integer NOT NULL DEFAULT 0,
  goals_against integer NOT NULL DEFAULT 0,
  stats_source text NOT NULL DEFAULT 'manual',
  stats_recalculated_at timestamptz,
  CONSTRAINT manager_season_stats_source_check
    CHECK (stats_source IN ('manual', 'calculated')),
  CONSTRAINT manager_season_stats_nonneg_check
    CHECK (
      games >= 0 AND wins >= 0 AND draws >= 0 AND losses >= 0
      AND goals_for >= 0 AND goals_against >= 0
    ),
  CONSTRAINT manager_season_stats_manager_season_uidx UNIQUE (manager_id, season)
);

CREATE INDEX IF NOT EXISTS manager_season_stats_manager_idx
  ON manager_season_stats (manager_id);

CREATE INDEX IF NOT EXISTS manager_season_stats_season_idx
  ON manager_season_stats (season);
