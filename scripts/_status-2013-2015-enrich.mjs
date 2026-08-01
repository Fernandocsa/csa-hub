/**
 * Mark Danilinho deceased; quick post-apply for known flags.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv(".env");
const pool = createPgPool();
const r = await pool.query(
  `UPDATE players SET is_deceased = true WHERE id = 1208 AND is_deceased = false RETURNING id, name`,
);
console.log("deceased update:", r.rows);

const { rows } = await pool.query(`
  WITH season_players AS (
    SELECT player_id FROM player_season_stats
    WHERE season ~ '^[0-9]{4}$' AND season::int BETWEEN 2013 AND 2015
    UNION
    SELECT ml.player_id FROM match_lineups ml
    JOIN matches m ON m.id = ml.match_id
    WHERE ml.side='csa' AND ml.player_id IS NOT NULL
      AND m.season ~ '^[0-9]{4}$' AND m.season::int BETWEEN 2013 AND 2015
  )
  SELECT
    count(*)::int AS total_incomplete,
    count(*) FILTER (
      WHERE p.full_name IS NULL OR btrim(p.full_name)=''
         OR p.birth_date IS NULL
         OR p.position IS NULL OR btrim(p.position)=''
         OR p.preferred_foot IS NULL OR btrim(p.preferred_foot)=''
    )::int AS still_incomplete,
    count(*) FILTER (
      WHERE p.full_name IS NOT NULL AND btrim(p.full_name)<>''
        AND p.birth_date IS NOT NULL
        AND p.position IS NOT NULL AND btrim(p.position)<>''
        AND p.preferred_foot IS NOT NULL AND btrim(p.preferred_foot)<>''
    )::int AS now_complete
  FROM (
    SELECT DISTINCT player_id FROM season_players
  ) sp
  JOIN players p ON p.id = sp.player_id
`);
console.log(rows[0]);

const still = await pool.query(`
  WITH season_players AS (
    SELECT player_id, season::text AS season FROM player_season_stats
    WHERE season ~ '^[0-9]{4}$' AND season::int BETWEEN 2013 AND 2015
    UNION ALL
    SELECT ml.player_id, m.season::text FROM match_lineups ml
    JOIN matches m ON m.id = ml.match_id
    WHERE ml.side='csa' AND ml.player_id IS NOT NULL
      AND m.season ~ '^[0-9]{4}$' AND m.season::int BETWEEN 2013 AND 2015
  )
  SELECT p.id, p.name, array_agg(DISTINCT sp.season ORDER BY sp.season) AS seasons,
         (p.full_name IS NULL OR btrim(p.full_name)='') AS miss_full,
         (p.birth_date IS NULL) AS miss_birth,
         (p.position IS NULL OR btrim(p.position)='') AS miss_pos,
         (p.preferred_foot IS NULL OR btrim(p.preferred_foot)='') AS miss_foot
  FROM season_players sp
  JOIN players p ON p.id = sp.player_id
  WHERE NOT (
    p.full_name IS NOT NULL AND btrim(p.full_name)<>''
    AND p.birth_date IS NOT NULL
    AND p.position IS NOT NULL AND btrim(p.position)<>''
    AND p.preferred_foot IS NOT NULL AND btrim(p.preferred_foot)<>''
  )
  GROUP BY p.id
  ORDER BY p.name
`);
console.log("still incomplete:", still.rows.length);
for (const r of still.rows) {
  const miss = [
    r.miss_full ? "full" : null,
    r.miss_birth ? "birth" : null,
    r.miss_pos ? "pos" : null,
    r.miss_foot ? "foot" : null,
  ].filter(Boolean).join(",");
  console.log(`#${r.id} ${r.name} [${r.seasons}] miss=${miss}`);
}
await pool.end();
