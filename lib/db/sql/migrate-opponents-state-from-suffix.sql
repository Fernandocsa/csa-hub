-- Fill opponents.state from trailing -UF name suffix (Brazilian UFs only).
-- Only updates rows where state is null/empty and suffix matches a valid UF.
-- Does not infer city. Skips rows where state already differs from suffix.
-- Run via: node scripts/migrate-opponents-state-from-suffix.mjs

BEGIN;

DO $$
DECLARE
  updated int;
  conflicts int;
BEGIN
  SELECT COUNT(*) INTO conflicts
  FROM opponents o
  WHERE NULLIF(trim(o.state), '') IS NOT NULL
    AND regexp_match(o.name, '-\s*([A-Za-z]{2})\s*$') IS NOT NULL
    AND upper(trim(o.state)) <> upper((regexp_match(o.name, '-\s*([A-Za-z]{2})\s*$'))[1]);

  IF conflicts > 0 THEN
    RAISE EXCEPTION 'opponents_state_from_suffix: % conflict(s) state <> suffix', conflicts;
  END IF;

  UPDATE opponents o
  SET state = upper((regexp_match(o.name, '-\s*([A-Za-z]{2})\s*$'))[1])
  WHERE (o.state IS NULL OR trim(o.state) = '')
    AND regexp_match(o.name, '-\s*([A-Za-z]{2})\s*$') IS NOT NULL
    AND upper((regexp_match(o.name, '-\s*([A-Za-z]{2})\s*$'))[1]) IN (
      'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
      'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
      'RS','RO','RR','SC','SP','SE','TO'
    );

  GET DIAGNOSTICS updated = ROW_COUNT;
  RAISE NOTICE 'opponents_state_from_suffix: updated=%', updated;
END $$;

COMMIT;
