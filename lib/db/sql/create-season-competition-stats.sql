-- Per-season, per-competition summary (manual or calculated from matches).
-- classification is always manual free text; never overwritten by recalculate.
CREATE TABLE IF NOT EXISTS season_competition_stats (
  id serial PRIMARY KEY,
  season text NOT NULL,
  competition_id integer NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  games integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  goals_for integer NOT NULL DEFAULT 0,
  goals_against integer NOT NULL DEFAULT 0,
  classification text,
  stats_source text NOT NULL DEFAULT 'manual',
  stats_recalculated_at timestamptz,
  CONSTRAINT season_competition_stats_source_check
    CHECK (stats_source IN ('manual', 'calculated')),
  CONSTRAINT season_competition_stats_nonneg_check
    CHECK (
      games >= 0 AND wins >= 0 AND draws >= 0 AND losses >= 0
      AND goals_for >= 0 AND goals_against >= 0
    ),
  CONSTRAINT season_competition_stats_season_comp_uidx UNIQUE (season, competition_id)
);

CREATE INDEX IF NOT EXISTS season_competition_stats_season_idx
  ON season_competition_stats (season);

CREATE INDEX IF NOT EXISTS season_competition_stats_competition_idx
  ON season_competition_stats (competition_id);
