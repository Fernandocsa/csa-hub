import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const r = await pool.query(
  `UPDATE season_competition_stats
   SET final_match_id = 1233,
       is_champion = true,
       classification = COALESCE(classification, '1º')
   WHERE id = 14
   RETURNING id, season, competition_id, is_champion, final_match_id, classification`,
);
console.log("updated", r.rows[0]);

const holders = await pool.query(`
  SELECT COUNT(DISTINCT ml.player_id) AS players
  FROM match_lineups ml
  JOIN matches m ON m.id = ml.match_id
  WHERE m.season = '2024' AND m.competition_id = 12
    AND m.is_friendly = false AND m.status <> 'scheduled' AND m.result <> 'unknown'
    AND ml.side = 'csa' AND ml.player_id IS NOT NULL
`);
const mgrs = await pool.query(`
  SELECT COUNT(DISTINCT manager_id) AS managers
  FROM matches
  WHERE season = '2024' AND competition_id = 12
    AND is_friendly = false AND status <> 'scheduled' AND result <> 'unknown'
    AND manager_id IS NOT NULL
`);
console.log("holders", holders.rows[0], mgrs.rows[0]);
await pool.end();
