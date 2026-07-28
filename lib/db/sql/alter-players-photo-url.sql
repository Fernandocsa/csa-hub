-- Player profile photo (HTTPS URL or local path e.g. /players/192.jpg).
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url text;
