/**
 * Sync 2018 assists from published season totals (RESUMO DA TEMPORADA list
 * at the end of the source paste). Only updates player_season_stats; does
 * not invent match-sheet events.
 *
 * Aliases: Echeverria→Eduardo Echeverría, Michel→Michel Douglas,
 * Yuri→Yuri Lara, Giva→Giva (#515), Rafinha→Rafinha (#23),
 * Walter→Walter (#605), Joilson→Joílson.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");
const SEASON = "2018";

const ROWS = [
  { id: 23, name: "Rafinha", value: 6 },
  { id: 5, name: "Didira", value: 6 },
  { id: 53, name: "Daniel Costa", value: 5 },
  { id: 108, name: "Celsinho", value: 5 },
  { id: 126, name: "Eduardo Echeverría", value: 4 }, // source: Echeverria
  { id: 143, name: "Pio", value: 4 },
  { id: 605, name: "Walter", value: 2 },
  { id: 154, name: "Yuri Lara", value: 2 }, // source: Yuri
  { id: 55, name: "Michel Douglas", value: 2 }, // source: Michel
  { id: 149, name: "Niltinho", value: 2 },
  { id: 515, name: "Giva", value: 2 },
  { id: 134, name: "Jhon Cley", value: 1 },
  { id: 156, name: "Rubens", value: 1 },
  { id: 128, name: "Lucas Frigeri", value: 1 },
  { id: 161, name: "Juan", value: 1 },
  { id: 59, name: "Leandro Souza", value: 1 },
  { id: 148, name: "Ferrugem", value: 1 },
  { id: 52, name: "Xandão", value: 1 },
  { id: 74, name: "Boquita", value: 1 },
  { id: 125, name: "Joílson", value: 1 }, // source: Joilson
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
