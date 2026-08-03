-- Link multiple mandate rows that belong to the same person.
-- person_key = canonical group id (usually the earliest mandate's id).
ALTER TABLE presidents
  ADD COLUMN IF NOT EXISTS person_key integer;

CREATE INDEX IF NOT EXISTS presidents_person_key_idx ON presidents (person_key);

-- Rafael Tenório: three separate mandates, same person (ids 2, 7, 9).
UPDATE presidents
SET person_key = 2
WHERE id IN (2, 7, 9);

-- Euclides Mello: three separate mandates, same person (ids 17, 18, 19).
UPDATE presidents
SET person_key = 17
WHERE id IN (17, 18, 19);

-- Copy photo onto the passage that was missing one (same person).
UPDATE presidents p
SET photo_url = src.photo_url
FROM presidents src
WHERE p.person_key IN (2, 17)
  AND src.id = p.person_key
  AND src.photo_url IS NOT NULL
  AND (p.photo_url IS NULL OR btrim(p.photo_url) = '');
