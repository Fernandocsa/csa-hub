-- Season-level stats verification (distinct from per-player verification).
ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS stats_fully_verified boolean NOT NULL DEFAULT false;

ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS stats_verified_at timestamptz;

-- Badges for players and managers (manual + auto).
CREATE TABLE IF NOT EXISTS entity_badges (
  id serial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id integer NOT NULL,
  label text NOT NULL,
  source text NOT NULL,
  auto_kind text,
  season_year integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entity_badges_entity_type_check
    CHECK (entity_type IN ('player', 'manager')),
  CONSTRAINT entity_badges_source_check
    CHECK (source IN ('manual', 'auto')),
  CONSTRAINT entity_badges_auto_kind_check
    CHECK (
      auto_kind IS NULL
      OR auto_kind IN ('top_scorer', 'top_assister')
    ),
  CONSTRAINT entity_badges_auto_fields_check
    CHECK (
      (source = 'manual' AND auto_kind IS NULL)
      OR (source = 'auto' AND auto_kind IS NOT NULL AND season_year IS NOT NULL)
    )
);

-- Same player cannot get the same auto badge twice for a season;
-- ties ALLOW multiple different players with the same auto_kind + season_year.
CREATE UNIQUE INDEX IF NOT EXISTS entity_badges_auto_uidx
  ON entity_badges (entity_type, entity_id, auto_kind, season_year)
  WHERE source = 'auto' AND auto_kind IS NOT NULL AND season_year IS NOT NULL;

CREATE INDEX IF NOT EXISTS entity_badges_entity_idx
  ON entity_badges (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS entity_badges_season_auto_idx
  ON entity_badges (season_year, auto_kind);
