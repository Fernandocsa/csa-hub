-- Own-goals for CSA (not stored as match_goals rows) — completeness gate for competition badges.
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS own_goals_for_count integer NOT NULL DEFAULT 0;

-- Competition-scoped auto badges (Artilheiro {competição} {ano}).
ALTER TABLE entity_badges
  ADD COLUMN IF NOT EXISTS competition_id integer REFERENCES competitions(id);

-- Relax / replace auto_kind check to include top_scorer_competition.
ALTER TABLE entity_badges DROP CONSTRAINT IF EXISTS entity_badges_auto_kind_check;
ALTER TABLE entity_badges ADD CONSTRAINT entity_badges_auto_kind_check CHECK (
  auto_kind IS NULL
  OR auto_kind IN ('top_scorer', 'top_assister', 'top_scorer_competition')
);

ALTER TABLE entity_badges DROP CONSTRAINT IF EXISTS entity_badges_auto_fields_check;
ALTER TABLE entity_badges ADD CONSTRAINT entity_badges_auto_fields_check CHECK (
  (source = 'manual' AND auto_kind IS NULL AND competition_id IS NULL)
  OR (
    source = 'auto'
    AND auto_kind IN ('top_scorer', 'top_assister')
    AND season_year IS NOT NULL
    AND competition_id IS NULL
  )
  OR (
    source = 'auto'
    AND auto_kind = 'top_scorer_competition'
    AND season_year IS NOT NULL
    AND competition_id IS NOT NULL
  )
);

-- Replace old single unique with season vs competition partial uniques.
DROP INDEX IF EXISTS entity_badges_auto_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS entity_badges_auto_season_uidx
  ON entity_badges (entity_type, entity_id, auto_kind, season_year)
  WHERE source = 'auto'
    AND auto_kind IN ('top_scorer', 'top_assister')
    AND season_year IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS entity_badges_auto_comp_uidx
  ON entity_badges (entity_type, entity_id, auto_kind, season_year, competition_id)
  WHERE source = 'auto'
    AND auto_kind = 'top_scorer_competition'
    AND competition_id IS NOT NULL
    AND season_year IS NOT NULL;
