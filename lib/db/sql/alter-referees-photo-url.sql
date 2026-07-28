-- Referee profile photo (URL only — same pattern as players.photo_url).
ALTER TABLE referees
  ADD COLUMN IF NOT EXISTS photo_url text;
