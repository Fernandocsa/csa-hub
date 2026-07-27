-- Opponent crest / logo URL (Wikimedia Commons Special:FilePath links).
ALTER TABLE opponents
  ADD COLUMN IF NOT EXISTS logo_url text;
