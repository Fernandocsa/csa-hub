-- Optional match phase / round labels (free text).
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS phase text;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS round text;
