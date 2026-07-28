-- Stadium photo (facade/pitch) — URL only.
ALTER TABLE stadiums
  ADD COLUMN IF NOT EXISTS photo_url text;
