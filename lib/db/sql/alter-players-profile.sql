-- Player profile fields for detail page redesign (Phase: personal data).
ALTER TABLE players ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_city text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_state text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_country text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS preferred_foot text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS height_cm integer;
ALTER TABLE players ADD COLUMN IF NOT EXISTS weight_kg integer;
