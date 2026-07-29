-- Split mixed "Cruzeiro-AL" (id=109) into extinct vs 2019-refounded clubs.
-- - Keep id=109 as extinct: rename → "Cruzeiro de Arapiraca-AL" (matches before 2019).
-- - Create "Cruzeiro-AL" for matches on/after 2019-01-01.
-- Run via: node scripts/migrate-split-cruzeiro-arapiraca-al.mjs

BEGIN;

DO $$
DECLARE
  old_id      constant int := 109;
  old_name    constant text := 'Cruzeiro-AL';
  extinct_name constant text := 'Cruzeiro de Arapiraca-AL';
  new_name    constant text := 'Cruzeiro-AL';
  cutoff      constant date := DATE '2019-01-01';
  o opponents%ROWTYPE;
  new_id int;
  moved int;
  left_old int;
BEGIN
  SELECT * INTO o FROM opponents WHERE id = old_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opponent id=% not found', old_id;
  END IF;

  -- Idempotent: already split
  IF o.name = extinct_name THEN
    IF EXISTS (SELECT 1 FROM opponents WHERE name = new_name) THEN
      RAISE NOTICE 'split_cruzeiro_arapiraca: already applied (id=% is "%")', old_id, extinct_name;
      RETURN;
    END IF;
    RAISE EXCEPTION 'id=% already named "%" but "%" missing', old_id, extinct_name, new_name;
  END IF;

  IF o.name <> old_name THEN
    RAISE EXCEPTION 'Opponent id=% expected name="%", got "%"', old_id, old_name, o.name;
  END IF;

  IF EXISTS (SELECT 1 FROM opponents WHERE name = extinct_name) THEN
    RAISE EXCEPTION 'Target name "%" already exists', extinct_name;
  END IF;

  -- Free the modern name, then create the new club
  UPDATE opponents
  SET
    name = extinct_name,
    city = COALESCE(NULLIF(trim(city), ''), 'Arapiraca'),
    state = COALESCE(NULLIF(trim(state), ''), 'AL')
  WHERE id = old_id;

  INSERT INTO opponents (name, city, state, country, logo_url, home_stadium_id)
  VALUES (
    new_name,
    'Arapiraca',
    'AL',
    o.country,
    o.logo_url,
    o.home_stadium_id
  )
  RETURNING id INTO new_id;

  UPDATE matches
  SET opponent_id = new_id
  WHERE opponent_id = old_id
    AND match_date >= cutoff;
  GET DIAGNOSTICS moved = ROW_COUNT;

  SELECT count(*)::int INTO left_old FROM matches WHERE opponent_id = old_id;

  IF moved < 1 THEN
    RAISE EXCEPTION 'Expected to move 2019+ matches; moved=%', moved;
  END IF;

  RAISE NOTICE 'split_cruzeiro_arapiraca: extinct_id=% new_id=% moved=% left_on_extinct=%',
    old_id, new_id, moved, left_old;
END $$;

COMMIT;
