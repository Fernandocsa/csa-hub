-- Run once on Supabase (SQL editor) if drizzle-kit push is unavailable.
CREATE TABLE IF NOT EXISTS next_match (
  id integer PRIMARY KEY DEFAULT 1,
  opponent text NOT NULL,
  match_date date NOT NULL,
  competition text NOT NULL,
  home_away text NOT NULL,
  stadium text,
  updated_at timestamptz DEFAULT now() NOT NULL
);
