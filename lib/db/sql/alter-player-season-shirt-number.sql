-- Season shirt number (catalog / fixed number for the season).
-- Independent from match_lineups.shirt_number (per-match).
ALTER TABLE player_season_stats
  ADD COLUMN IF NOT EXISTS shirt_number integer;

-- Deduplicate before unique: keep the row with highest appearances, then id.
DELETE FROM player_season_stats a
USING player_season_stats b
WHERE a.player_id = b.player_id
  AND a.season = b.season
  AND (
    a.appearances < b.appearances
    OR (a.appearances = b.appearances AND a.id < b.id)
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'player_season_stats_player_season_uidx'
  ) THEN
    ALTER TABLE player_season_stats
      ADD CONSTRAINT player_season_stats_player_season_uidx
      UNIQUE (player_id, season);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS player_season_stats_season_idx
  ON player_season_stats (season);
