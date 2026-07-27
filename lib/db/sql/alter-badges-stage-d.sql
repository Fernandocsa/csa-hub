-- Stage D badges:
-- - persist manual template slug
-- - optionally link manual badges to a match
-- - enforce exact-duplicate rules per template
-- - keep allowing manual badges with competition_id

ALTER TABLE entity_badges
  ADD COLUMN IF NOT EXISTS template text;

ALTER TABLE entity_badges
  ADD COLUMN IF NOT EXISTS match_id integer REFERENCES matches(id);

ALTER TABLE entity_badges DROP CONSTRAINT IF EXISTS entity_badges_template_check;
ALTER TABLE entity_badges ADD CONSTRAINT entity_badges_template_check CHECK (
  template IS NULL
  OR template IN (
    'cria_do_mutange',
    'garcom',
    'artilheiro',
    'artilheiro_comp',
    'campeao',
    'acesso',
    'heroi_do_acesso',
    'gol_do_titulo',
    'gol_historico'
  )
);

ALTER TABLE entity_badges DROP CONSTRAINT IF EXISTS entity_badges_auto_fields_check;
ALTER TABLE entity_badges ADD CONSTRAINT entity_badges_auto_fields_check CHECK (
  (source = 'manual' AND auto_kind IS NULL)
  OR (
    source = 'auto'
    AND template IS NULL
    AND match_id IS NULL
    AND auto_kind IN ('top_scorer', 'top_assister')
    AND season_year IS NOT NULL
    AND competition_id IS NULL
  )
  OR (
    source = 'auto'
    AND template IS NULL
    AND match_id IS NULL
    AND auto_kind = 'top_scorer_competition'
    AND season_year IS NOT NULL
    AND competition_id IS NOT NULL
  )
);

-- Backfill template slug for existing generated manual badges when recognizable.
UPDATE entity_badges
SET template = CASE
  WHEN source = 'manual' AND label = 'Cria do Mutange' THEN 'cria_do_mutange'
  WHEN source = 'manual' AND competition_id IS NULL AND label ~ '^Garçom [0-9]{4}$' THEN 'garcom'
  WHEN source = 'manual' AND competition_id IS NULL AND label ~ '^Artilheiro [0-9]{4}$' THEN 'artilheiro'
  WHEN source = 'manual' AND competition_id IS NOT NULL AND label ~ '^Artilheiro .+ [0-9]{4}$' THEN 'artilheiro_comp'
  WHEN source = 'manual' AND competition_id IS NOT NULL AND label ~ '^Campeão .+ [0-9]{4}$' THEN 'campeao'
  ELSE template
END
WHERE source = 'manual' AND template IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS entity_badges_manual_cria_uidx
  ON entity_badges (entity_type, entity_id)
  WHERE source = 'manual'
    AND template = 'cria_do_mutange';

CREATE UNIQUE INDEX IF NOT EXISTS entity_badges_manual_year_uidx
  ON entity_badges (entity_type, entity_id, template, season_year)
  WHERE source = 'manual'
    AND template IN ('garcom', 'artilheiro')
    AND season_year IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS entity_badges_manual_comp_year_uidx
  ON entity_badges (entity_type, entity_id, template, competition_id, season_year)
  WHERE source = 'manual'
    AND template IN ('artilheiro_comp', 'campeao', 'acesso')
    AND competition_id IS NOT NULL
    AND season_year IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS entity_badges_manual_match_uidx
  ON entity_badges (entity_type, entity_id, template, match_id)
  WHERE source = 'manual'
    AND template IN ('heroi_do_acesso', 'gol_do_titulo', 'gol_historico')
    AND match_id IS NOT NULL;
