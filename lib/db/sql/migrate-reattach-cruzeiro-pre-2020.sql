-- Reassign pre-2020 matches from modern "Cruzeiro-AL" (id=231)
-- to extinct "Cruzeiro de Arapiraca-AL" (id=109).
-- Historic 1991–1992 imports landed on the refounded club after the original split.
-- Run via: node scripts/migrate-reattach-cruzeiro-pre-2020.mjs

BEGIN;

DO $$
DECLARE
  extinct_id   constant int := 109;
  modern_id    constant int := 231;
  extinct_name constant text := 'Cruzeiro de Arapiraca-AL';
  modern_name  constant text := 'Cruzeiro-AL';
  cutoff       constant date := DATE '2020-01-01';
  e opponents%ROWTYPE;
  m opponents%ROWTYPE;
  moved int;
  left_pre int;
BEGIN
  SELECT * INTO e FROM opponents WHERE id = extinct_id FOR UPDATE;
  IF NOT FOUND OR e.name <> extinct_name THEN
    RAISE EXCEPTION 'Extinct opponent id=% name=% not found or renamed', extinct_id, extinct_name;
  END IF;

  SELECT * INTO m FROM opponents WHERE id = modern_id FOR UPDATE;
  IF NOT FOUND OR m.name <> modern_name THEN
    RAISE EXCEPTION 'Modern opponent id=% name=% not found or renamed', modern_id, modern_name;
  END IF;

  UPDATE matches
  SET opponent_id = extinct_id
  WHERE opponent_id = modern_id
    AND match_date < cutoff;
  GET DIAGNOSTICS moved = ROW_COUNT;

  SELECT count(*)::int INTO left_pre
  FROM matches
  WHERE opponent_id = modern_id
    AND match_date < cutoff;

  IF left_pre <> 0 THEN
    RAISE EXCEPTION 'Still have pre-2020 matches on modern id=%: %', modern_id, left_pre;
  END IF;

  IF moved < 1 THEN
    RAISE NOTICE 'reattach_cruzeiro_pre_2020: nothing to move (already applied?)';
  ELSE
    RAISE NOTICE 'reattach_cruzeiro_pre_2020: moved=% extinct_id=% modern_id=%',
      moved, extinct_id, modern_id;
  END IF;
END $$;

COMMIT;
