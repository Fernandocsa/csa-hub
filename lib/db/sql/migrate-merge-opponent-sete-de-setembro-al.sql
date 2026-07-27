-- Merge duplicate opponents: "7 de Setembro-AL" → "Sete de Setembro-AL"
-- Keeps id=84 ("Sete de Setembro-AL"), discards id=190 ("7 de Setembro-AL").
-- Reassigns matches; preserves city/state/home_stadium_id from discard when keep is empty.
-- Run via: node scripts/migrate-merge-opponent-sete-de-setembro-al.mjs

BEGIN;

DO $$
DECLARE
  keep_id    constant int := 84;
  discard_id constant int := 190;
  keep_name    constant text := 'Sete de Setembro-AL';
  discard_name constant text := '7 de Setembro-AL';
  k opponents%ROWTYPE;
  d opponents%ROWTYPE;
  moved int;
BEGIN
  SELECT * INTO k FROM opponents WHERE id = keep_id FOR UPDATE;
  IF NOT FOUND OR k.name <> keep_name THEN
    RAISE EXCEPTION 'Keep opponent id=% name=% not found or renamed', keep_id, keep_name;
  END IF;

  SELECT * INTO d FROM opponents WHERE id = discard_id FOR UPDATE;
  IF NOT FOUND OR d.name <> discard_name THEN
    RAISE EXCEPTION 'Discard opponent id=% name=% not found or renamed', discard_id, discard_name;
  END IF;

  UPDATE opponents
  SET
    city = COALESCE(NULLIF(trim(k.city), ''), NULLIF(trim(d.city), '')),
    state = COALESCE(NULLIF(trim(k.state), ''), NULLIF(trim(d.state), '')),
    home_stadium_id = COALESCE(k.home_stadium_id, d.home_stadium_id)
  WHERE id = keep_id;

  UPDATE matches SET opponent_id = keep_id WHERE opponent_id = discard_id;
  GET DIAGNOSTICS moved = ROW_COUNT;

  DELETE FROM opponents WHERE id = discard_id;

  RAISE NOTICE 'merge_sete_de_setembro: moved_matches=% keep_id=% discard_id=%',
    moved, keep_id, discard_id;
END $$;

COMMIT;
