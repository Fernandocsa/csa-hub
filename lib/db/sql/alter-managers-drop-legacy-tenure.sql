-- Drop legacy manager tenure columns (replaced by manager_season_stats + derived period).
ALTER TABLE managers DROP COLUMN IF EXISTS start_year;
ALTER TABLE managers DROP COLUMN IF EXISTS end_year;
ALTER TABLE managers DROP COLUMN IF EXISTS seasons;
