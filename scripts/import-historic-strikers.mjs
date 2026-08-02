/**
 * Import historic CSA strikers (goals by season only).
 * Pedrinho / Ítalo: create NEW rows (different people from #262 / #263).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const PLAYERS = [
  { name: "Anísio", seasons: [[1930, 8], [1935, 6], [1937, 9]] },
  { name: "Murilo", seasons: [[1936, 10]] },
  { name: "Pedrinho", seasons: [[1941, 11]], forceNew: true },
  { name: "Caio Mário", seasons: [[1944, 12]] },
  { name: "Zé Maria", seasons: [[1945, 17], [1946, 12], [1947, 14], [1950, 12]] },
  { name: "Dida", seasons: [[1952, 9]] },
  { name: "King", seasons: [[1953, 12]] },
  { name: "Ítalo", seasons: [[1955, 17]], forceNew: true },
  { name: "Barra", seasons: [[1956, 9]] },
  { name: "Santos", seasons: [[1958, 7]] },
  { name: "Clóvis", seasons: [[1960, 5]] },
  { name: "Arcanjo", seasons: [[1965, 15]] },
  { name: "Tonho Lima", seasons: [[1967, 12]] },
  { name: "Giraldo", seasons: [[1969, 7], [1973, 12]] },
  { name: "Misso", seasons: [[1974, 20]] },
  { name: "Hélio", seasons: [[1975, 17]] },
  { name: "Idalmir", seasons: [[1979, 26]] },
  { name: "Rinaldo", seasons: [[1991, 19]] },
  { name: "Gílson", seasons: [[1996, 20]] },
  { name: "Mimi", seasons: [[1998, 23]] },
];

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

try {
  await client.query("BEGIN");

  const { rows: existing } = await client.query(
    `SELECT id, name, position FROM players ORDER BY id`,
  );
  const byNorm = new Map();
  for (const p of existing) {
    const k = norm(p.name);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(p);
  }

  const results = [];

  for (const entry of PLAYERS) {
    const hits = byNorm.get(norm(entry.name)) ?? [];
    let playerId;
    let action;

    if (entry.forceNew) {
      // Confirmed different person — always insert
      const ins = await client.query(
        `INSERT INTO players (name, position, nationality, nationality_flag)
         VALUES ($1, 'Atacante', 'Brasil', '🇧🇷')
         RETURNING id, name, position`,
        [entry.name],
      );
      playerId = ins.rows[0].id;
      action = "created_homonym";
      // track for subsequent exact lookups in this run
      if (!byNorm.has(norm(entry.name))) byNorm.set(norm(entry.name), []);
      byNorm.get(norm(entry.name)).push(ins.rows[0]);
    } else if (hits.length === 0) {
      const ins = await client.query(
        `INSERT INTO players (name, position, nationality, nationality_flag)
         VALUES ($1, 'Atacante', 'Brasil', '🇧🇷')
         RETURNING id, name, position`,
        [entry.name],
      );
      playerId = ins.rows[0].id;
      action = "created";
      byNorm.set(norm(entry.name), [ins.rows[0]]);
    } else if (hits.length === 1) {
      playerId = hits[0].id;
      action = "reused";
    } else {
      throw new Error(
        `Ambiguous name "${entry.name}": ${hits.map((h) => `#${h.id}`).join(", ")}`,
      );
    }

    const seasonActions = [];
    for (const [year, goals] of entry.seasons) {
      const season = String(year);
      const existingStat = await client.query(
        `SELECT id, goals, appearances, assists
         FROM player_season_stats
         WHERE player_id = $1 AND season = $2`,
        [playerId, season],
      );
      if (existingStat.rows[0]) {
        const row = existingStat.rows[0];
        if (row.goals !== goals) {
          await client.query(
            `UPDATE player_season_stats SET goals = $2 WHERE id = $1`,
            [row.id, goals],
          );
          seasonActions.push({
            season,
            action: "updated_goals",
            from: row.goals,
            to: goals,
          });
        } else {
          seasonActions.push({ season, action: "unchanged", goals });
        }
      } else {
        await client.query(
          `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
           VALUES ($1, $2, 0, $3, 0)`,
          [playerId, season, goals],
        );
        seasonActions.push({ season, action: "created", goals });
      }
    }

    results.push({ name: entry.name, playerId, action, seasons: seasonActions });
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, count: results.length, results }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
