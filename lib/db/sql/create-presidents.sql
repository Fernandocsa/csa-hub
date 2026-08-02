-- CSA club presidents catalog
CREATE TABLE IF NOT EXISTS presidents (
  id serial PRIMARY KEY,
  name text NOT NULL,
  photo_url text,
  term_start date,
  term_end date,
  notes text
);
