/**
 * Sync 2019 assists from published season totals.
 * Only updates player_season_stats; does not invent match-sheet events.
 *
 * Aliases: Jonatan Gómez→Jonathan Gómez, Jean Kléber→Jean Cléber,
 * Régis→Régis Souza, Safira→Alisson Safira, Julian Benitez→Julián Benítez.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");
const SEASON = "2019";

const ROWS = [
  { id: 18, name: "Apodi", value: 5 },
  { id: 163, name: "Matheus Sávio", value: 5 },
  { id: 188, name: "Patrick Fabiano", value: 4 },
  { id: 192, name: "Jonathan Gómez", value: 3 }, // source: Jonatan Gómez
  { id: 194, name: "Naldo", value: 3 },
  { id: 5, name: "Didira", value: 3 },
  { id: 201, name: "Régis Souza", value: 3 }, // source: Régis
  { id: 23, name: "Rafinha", value: 2 },
  { id: 108, name: "Celsinho", value: 2 },
  { id: 105, name: "Jean Cléber", value: 2 }, // source: Jean Kléber
  { id: 165, name: "Mauro Silva", value: 2 },
  { id: 172, name: "Héctor Bustamante", value: 1 },
  { id: 176, name: "Alisson Safira", value: 1 }, // source: Safira
  { id: 139, name: "Victor Paraíba", value: 1 },
  { id: 196, name: "Robinho", value: 1 },
  { id: 502, name: "Julián Benítez", value: 1 }, // source: Julian Benitez
  { id: 79, name: "Cassiano", value: 1 },
  { id: 68, name: "Dawhan", value: 1 },
  { id: 171, name: "Gerson", value: 1 },
];

try {
  await client.query("BEGIN");
  const wanted = new Map(ROWS.map((r) => [r.id, r]));
  const changes = [];

  for (const r of ROWS) {
    const { rows } = await client.query(
      `SELECT p.id, p.name, pss.assists AS current
       FROM player_season_stats pss
       JOIN players p ON p.id = pss.player_id
       WHERE pss.season=$1 AND p.id=$2`,
      [SEASON, r.id],
    );
    if (!rows[0]) throw new Error(`missing roster ${r.id} ${r.name}`);
    if (rows[0].name !== r.name) {
      throw new Error(`name mismatch id=${r.id} db="${rows[0].name}" expected="${r.name}"`);
    }
    const from = rows[0].current;
    if (from !== r.value) {
      if (!DRY) {
        await client.query(
          `UPDATE player_season_stats SET assists=$1 WHERE player_id=$2 AND season=$3`,
          [r.value, r.id, SEASON],
        );
      }
      changes.push({ id: r.id, name: r.name, from, to: r.value, changed: true });
    } else {
      changes.push({ id: r.id, name: r.name, from, to: r.value, changed: false });
    }
  }

  const ids = [...wanted.keys()];
  const { rows: extras } = await client.query(
    `SELECT p.id, p.name, pss.assists AS v
     FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.season=$1 AND pss.assists > 0 AND NOT (p.id = ANY($2::int[]))
     ORDER BY p.name`,
    [SEASON, ids],
  );
  const cleared = [];
  for (const e of extras) {
    if (!DRY) {
      await client.query(
        `UPDATE player_season_stats SET assists=0 WHERE player_id=$1 AND season=$2`,
        [e.id, SEASON],
      );
    }
    cleared.push({ id: e.id, name: e.name, from: e.v, to: 0 });
  }

  const total = ROWS.reduce((s, r) => s + r.value, 0);
  console.log(
    JSON.stringify(
      {
        ok: true,
        dry: DRY,
        season: SEASON,
        totalAssists: total,
        updated: changes.filter((c) => c.changed),
        unchanged: changes.filter((c) => !c.changed).map((c) => c.name),
        cleared,
      },
      null,
      2,
    ),
  );

  if (DRY) await client.query("ROLLBACK");
  else await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
