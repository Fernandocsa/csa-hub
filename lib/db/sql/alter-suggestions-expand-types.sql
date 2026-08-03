-- Expand suggestions: more entity types + optional entity_id for "general".
ALTER TABLE suggestions
  DROP CONSTRAINT IF EXISTS suggestions_entity_type_check;

ALTER TABLE suggestions
  ALTER COLUMN entity_id DROP NOT NULL;

ALTER TABLE suggestions
  ADD CONSTRAINT suggestions_entity_type_check CHECK (
    entity_type IN (
      'player',
      'manager',
      'match',
      'opponent',
      'stadium',
      'referee',
      'season',
      'general'
    )
  );

ALTER TABLE suggestions
  DROP CONSTRAINT IF EXISTS suggestions_entity_id_for_type_check;

ALTER TABLE suggestions
  ADD CONSTRAINT suggestions_entity_id_for_type_check CHECK (
    (entity_type = 'general' AND entity_id IS NULL)
    OR (entity_type <> 'general' AND entity_id IS NOT NULL)
  );
