-- Manager profile fields (parity with players; tenure columns kept until cutover cleanup).
ALTER TABLE managers ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS birth_city text;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS birth_state text;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS birth_country text;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS is_deceased boolean NOT NULL DEFAULT false;
