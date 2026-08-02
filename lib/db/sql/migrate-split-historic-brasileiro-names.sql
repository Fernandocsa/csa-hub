-- Separate historic national competitions from modern "Campeonato Brasileiro Série A/B".
-- - Taça de Prata  ← 1980 matches under Série B
-- - Taça de Ouro   ← 1981 / 1983 / 1986 matches under Série A
-- - Copa João Havelange ← 2000 matches under Série B
-- Run via: node scripts/migrate-split-historic-brasileiro-names.mjs

BEGIN;

DO $$
DECLARE
  serie_a_id int;
  serie_b_id int;
  ouro_id int;
  prata_id int;
  havelange_id int;
  n int;
BEGIN
  SELECT id INTO serie_a_id FROM competitions WHERE name = 'Campeonato Brasileiro Série A';
  SELECT id INTO serie_b_id FROM competitions WHERE name = 'Campeonato Brasileiro Série B';

  IF serie_a_id IS NULL THEN
    RAISE EXCEPTION 'Competition "Campeonato Brasileiro Série A" not found';
  END IF;
  IF serie_b_id IS NULL THEN
    RAISE EXCEPTION 'Competition "Campeonato Brasileiro Série B" not found';
  END IF;

  INSERT INTO competitions (name, type)
  VALUES ('Taça de Ouro', 'league')
  ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type
  RETURNING id INTO ouro_id;
  IF ouro_id IS NULL THEN
    SELECT id INTO ouro_id FROM competitions WHERE name = 'Taça de Ouro';
  END IF;

  INSERT INTO competitions (name, type)
  VALUES ('Taça de Prata', 'league')
  ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type
  RETURNING id INTO prata_id;
  IF prata_id IS NULL THEN
    SELECT id INTO prata_id FROM competitions WHERE name = 'Taça de Prata';
  END IF;

  INSERT INTO competitions (name, type)
  VALUES ('Copa João Havelange', 'league')
  ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type
  RETURNING id INTO havelange_id;
  IF havelange_id IS NULL THEN
    SELECT id INTO havelange_id FROM competitions WHERE name = 'Copa João Havelange';
  END IF;

  -- Taça de Prata: 1980 Série B
  UPDATE matches
  SET competition_id = prata_id
  WHERE competition_id = serie_b_id
    AND season = '1980';
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'Taça de Prata matches moved: %', n;

  UPDATE season_competition_stats
  SET competition_id = prata_id
  WHERE competition_id = serie_b_id
    AND season = '1980';

  -- Taça de Ouro: 1981 / 1983 / 1986 Série A
  UPDATE matches
  SET competition_id = ouro_id
  WHERE competition_id = serie_a_id
    AND season IN ('1981', '1983', '1986');
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'Taça de Ouro matches moved: %', n;

  UPDATE season_competition_stats
  SET competition_id = ouro_id
  WHERE competition_id = serie_a_id
    AND season IN ('1981', '1983', '1986');

  -- Copa João Havelange: 2000 Série B
  UPDATE matches
  SET competition_id = havelange_id
  WHERE competition_id = serie_b_id
    AND season = '2000';
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'Copa João Havelange matches moved: %', n;

  UPDATE season_competition_stats
  SET competition_id = havelange_id
  WHERE competition_id = serie_b_id
    AND season = '2000';
END $$;

COMMIT;
