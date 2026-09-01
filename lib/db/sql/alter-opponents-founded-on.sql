-- Full founding date (day + month + year) for opponents.
-- founding_year stays as a denormalized year for year-only records and filters.

ALTER TABLE opponents
  ADD COLUMN IF NOT EXISTS founded_on date;
