/**
 * Fill manager_id gaps: official non-W.O. matches with NULL manager where the
 * nearest previous and next non-null managers in the season are the same person.
 *
 * Usage: node scripts/fill-manager-gaps.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const client = await pool.connect();

try {
  if (!DRY) await client.query("BEGIN");

  const { rows: matches } = await client.query(`
    SELECT
      m.id,
      m.season,
      m.match_date::text AS match_date,
      m.manager_id,
      mgr.name AS manager_name,
      o.name AS opponent
    FROM matches m
    LEFT JOIN managers mgr ON mgr.id = m.manager_id
    LEFT JOIN opponents o ON o.id = m.opponent_id
    WHERE COALESCE(m.is_friendly, false) = false
      AND COALESCE(m.is_walkover, false) = false
      AND m.status IS DISTINCT FROM 'scheduled'
      AND m.result IS DISTINCT FROM 'unknown'
    ORDER BY m.season, m.match_date, m.id
  `);

  const bySeason = new Map();
  for (const m of matches) {
    if (!bySeason.has(m.season)) bySeason.set(m.season, []);
    bySeason.get(m.season).push(m);
  }

  const fills = [];
  for (const [season, list] of bySeason) {
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (m.manager_id != null) continue;

      let prev = null;
      for (let j = i - 1; j >= 0; j--) {
        if (list[j].manager_id != null) {
          prev = list[j];
          break;
        }
      }
      let next = null;
      for (let j = i + 1; j < list.length; j++) {
        if (list[j].manager_id != null) {
          next = list[j];
          break;
        }
      }

      if (!prev || !next) continue;
      if (prev.manager_id !== next.manager_id) continue;

      fills.push({
        matchId: m.id,
        season,
        matchDate: m.match_date,
        opponent: m.opponent,
        managerId: prev.manager_id,
        managerName: prev.manager_name,
      });
    }
  }

  console.log(`${DRY ? "[DRY] " : ""}Fills: ${fills.length}`);

  if (!DRY && fills.length > 0) {
    for (const f of fills) {
      const r = await client.query(
        `UPDATE matches
         SET manager_id = $1
         WHERE id = $2
           AND manager_id IS NULL
           AND COALESCE(is_walkover, false) = false
         RETURNING id`,
        [f.managerId, f.matchId],
      );
      if (r.rowCount !== 1) {
        throw new Error(`Failed to update match #${f.matchId}`);
      }
    }
    await client.query("COMMIT");
    console.log(`Updated ${fills.length} matches.`);
  } else if (!DRY) {
    await client.query("COMMIT");
  }

  const byKey = new Map();
  for (const f of fills) {
    const key = `${f.season}|${f.managerName}`;
    if (!byKey.has(key)) byKey.set(key, 0);
    byKey.set(key, byKey.get(key) + 1);
  }
  for (const [key, n] of [...byKey.entries()].sort()) {
    console.log(`  ${key}: ${n}`);
  }
} catch (err) {
  if (!DRY) await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
  await pool.end();
}
