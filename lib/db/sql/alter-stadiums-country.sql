-- Stadium country (ISO 3166-1 alpha-3). Mutually exclusive with state in application logic.
ALTER TABLE stadiums
  ADD COLUMN IF NOT EXISTS country text;

CREATE INDEX IF NOT EXISTS stadiums_country_idx ON stadiums (country);
