-- Stage A (foreign opponents): optional ISO 3166-1 alpha-3 country code.
-- Brazilian clubs use state; foreign clubs use country (mutually exclusive in data).
ALTER TABLE opponents
  ADD COLUMN IF NOT EXISTS country text;

CREATE INDEX IF NOT EXISTS opponents_country_idx ON opponents (country);
