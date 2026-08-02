-- Rename Torneio Início → Torneio Início de Alagoas and seed CSA champion seasons
-- (no final_match_id — titles credited via is_champion + campaign lineups).

UPDATE competitions
SET name = 'Torneio Início de Alagoas'
WHERE name = 'Torneio Início';

-- Insert missing season×competition rows as champion; update existing.
-- Years: 1927, 1928, 1929, 1930, 1933, 1935, 1940, 1942, 1946, 1949, 1957, 1961, 1965, 1972
INSERT INTO season_competition_stats (
  season, competition_id, games, wins, draws, losses,
  goals_for, goals_against, classification, is_champion, final_match_id, stats_source
)
SELECT
  y.season,
  c.id,
  0, 0, 0, 0, 0, 0,
  '1º',
  true,
  NULL,
  'manual'
FROM competitions c
CROSS JOIN (
  VALUES
    ('1927'), ('1928'), ('1929'), ('1930'), ('1933'), ('1935'), ('1940'),
    ('1942'), ('1946'), ('1949'), ('1957'), ('1961'), ('1965'), ('1972')
) AS y(season)
WHERE c.name = 'Torneio Início de Alagoas'
ON CONFLICT (season, competition_id) DO UPDATE
SET
  is_champion = true,
  classification = COALESCE(season_competition_stats.classification, '1º'),
  final_match_id = season_competition_stats.final_match_id;
