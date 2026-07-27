-- Manual badges may reference a competition (e.g. Campeão {comp} {year}).
-- auto_kind stays NULL for manual rows.
ALTER TABLE entity_badges DROP CONSTRAINT IF EXISTS entity_badges_auto_fields_check;
ALTER TABLE entity_badges ADD CONSTRAINT entity_badges_auto_fields_check CHECK (
  (source = 'manual' AND auto_kind IS NULL)
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
