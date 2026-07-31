-- Champion campaign flags for titles credit.
-- is_champion: this season×competition was won by CSA.
-- final_match_id: optional pointer to one final leg (display / two-legged via related_match_id).

ALTER TABLE season_competition_stats
  ADD COLUMN IF NOT EXISTS is_champion boolean NOT NULL DEFAULT false;

ALTER TABLE season_competition_stats
  ADD COLUMN IF NOT EXISTS final_match_id integer
    REFERENCES matches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS season_competition_stats_champion_idx
  ON season_competition_stats (is_champion)
  WHERE is_champion = true;

-- Seed from existing free-text classification used by /titulos.
UPDATE season_competition_stats
SET is_champion = true
WHERE is_champion = false
  AND classification IS NOT NULL
  AND (
    lower(trim(classification)) IN ('1º', '1o', '1°', 'campeao', 'campeão', '1º lugar', '1o lugar')
    OR trim(classification) ~* '^1[ºo°]\s*$'
  );
