-- Fill opponents.country from trailing -XXX name suffix (ISO alpha-3, not Brazilian UF).
-- Only updates rows where country is null/empty and suffix is a recognized country code.
-- Does not infer city. Does not touch state. Skips rows where country already differs from suffix.
-- Run via: node scripts/migrate-opponents-country-from-suffix.mjs

BEGIN;

DO $$
DECLARE
  updated int;
  conflicts int;
  dual_loc int;
BEGIN
  SELECT COUNT(*) INTO conflicts
  FROM opponents o
  WHERE NULLIF(trim(o.country), '') IS NOT NULL
    AND regexp_match(o.name, '-\s*([A-Za-z]{3})\s*$') IS NOT NULL
    AND upper(trim(o.country)) <> upper((regexp_match(o.name, '-\s*([A-Za-z]{3})\s*$'))[1]);

  IF conflicts > 0 THEN
    RAISE EXCEPTION 'opponents_country_from_suffix: % conflict(s) country <> suffix', conflicts;
  END IF;

  SELECT COUNT(*) INTO dual_loc
  FROM opponents o
  WHERE NULLIF(trim(o.state), '') IS NOT NULL
    AND NULLIF(trim(o.country), '') IS NOT NULL;

  IF dual_loc > 0 THEN
    RAISE EXCEPTION 'opponents_country_from_suffix: % row(s) have both state and country', dual_loc;
  END IF;

  UPDATE opponents o
  SET country = upper((regexp_match(o.name, '-\s*([A-Za-z]{3})\s*$'))[1])
  WHERE (o.country IS NULL OR trim(o.country) = '')
    AND (o.state IS NULL OR trim(o.state) = '')
    AND regexp_match(o.name, '-\s*([A-Za-z]{3})\s*$') IS NOT NULL
    AND upper((regexp_match(o.name, '-\s*([A-Za-z]{3})\s*$'))[1]) IN (
      'ARG', 'AUS', 'BEL', 'BOL', 'CAN', 'CHL', 'CHN', 'COL', 'DEU', 'ECU',
      'ENG', 'ESP', 'FRA', 'GBR', 'GER', 'ITA', 'JPN', 'KOR', 'MEX', 'NED',
      'NLD', 'PAR', 'PER', 'POR', 'PRY', 'URY', 'URU', 'USA', 'VEN'
    );

  GET DIAGNOSTICS updated = ROW_COUNT;
  RAISE NOTICE 'opponents_country_from_suffix: updated=%', updated;
END $$;

COMMIT;
