/**
 * Fill missing birth_year for 2016 squad from published elenco ages.
 * Does NOT overwrite existing birth_year/birth_date.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = 2016;

const UPDATES = [
  { id: 81, name: "Pantera", age: 33 },
  { id: 58, name: "Rayro", age: 30 },
  { id: 103, name: "Santa Rosa", age: 26 },
  { id: 114, name: "Zé Romário", age: 22 },
  { id: 88, name: "Denilson", age: 28 },
  { id: 98, name: "Leandro Cardoso", age: 34 },
  { id: 83, name: "Hudson", age: 29 },
  { id: 112, name: "Douglas Marques", age: 31 },
  { id: 115, name: "Panda", age: 31 },
  { id: 110, name: "Elizeu", age: 27 },
  { id: 123, name: "David Oliveira", age: 29 },
  { id: 51, name: "Ronaldo Caetano", age: 31 },
  { id: 101, name: "Katê", age: 24 },
  { id: 73, name: "Washington", age: 27 },
  { id: 54, name: "Thiago Santos", age: 32 },
  { id: 95, name: "Sorin", age: 21 },
  { id: 113, name: "Kelvin", age: 24 },
  { id: 87, name: "Cleyton Lima", age: 26 },
  { id: 99, name: "Bismarck", age: 25 },
  { id: 72, name: "Azul", age: 23 },
  { id: 117, name: "Jefferson Maranhense", age: 27 },
  { id: 69, name: "David Dener", age: 29 },
  { id: 67, name: "Tiago Chulapa", age: 28 },
  { id: 77, name: "Rafael Oliveira", age: 28 },
  { id: 102, name: "Marcelo Nicácio", age: 33 },
  { id: 84, name: "Jônatas Obina", age: 30 },
  { id: 100, name: "Luís Soares", age: 25 },
  { id: 121, name: "Kauhan", age: 22 },
  // Skipped: João Paulo #7 (cadastro 2001 / age 15 — conflated; list has GK 27 + Meia 22)
  // Walter kept by 1990 (age 26; list had 32)
  // Henrique → already Henrique Choco with birth_date
  // Not on roster: many names from source list
];

try {
  await client.query("BEGIN");
  const { rows: roster } = await client.query(
    `SELECT player_id FROM player_season_stats WHERE season = $1`,
    [String(SEASON)],
  );
  const rosterIds = new Set(roster.map((r) => r.player_id));
  const results = [];

  for (const u of UPDATES) {
    if (!rosterIds.has(u.id)) throw new Error(`Not on roster ${u.id} ${u.name}`);
    const birthYear = SEASON - u.age;
    const { rows: before } = await client.query(
      `SELECT id, name, birth_year, birth_date FROM players WHERE id=$1`,
      [u.id],
    );
    if (!before[0] || before[0].name !== u.name) {
      throw new Error(`Name mismatch ${u.id}: ${before[0]?.name} vs ${u.name}`);
    }
    const { rows } = await client.query(
      `UPDATE players SET birth_year = CASE
         WHEN birth_year IS NULL AND birth_date IS NULL THEN $2 ELSE birth_year END
       WHERE id = $1 RETURNING id, name, birth_year, birth_date`,
      [u.id, birthYear],
    );
    results.push({
      id: u.id,
      name: u.name,
      set: before[0].birth_year == null && before[0].birth_date == null,
      from: before[0].birth_year,
      to: rows[0].birth_year,
    });
  }

  const { rows: stillMissing } = await client.query(
    `SELECT p.id, p.name FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.season=$1 AND p.birth_year IS NULL AND p.birth_date IS NULL ORDER BY p.name`,
    [String(SEASON)],
  );
  const { rows: withAge } = await client.query(
    `SELECT COUNT(*)::int AS n FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.season=$1 AND (p.birth_year IS NOT NULL OR p.birth_date IS NOT NULL)`,
    [String(SEASON)],
  );

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        ok: true,
        season: SEASON,
        updatedPlayers: results.filter((r) => r.set).length,
        skippedAlreadyHad: results.filter((r) => !r.set),
        stillMissingAgeOnRoster: stillMissing,
        rosterWithAgeAfter: withAge[0].n,
        rosterTotal: rosterIds.size,
        joaoPauloNote:
          "João Paulo #7 kept birth_year 2001 (age 15 in 2016) — likely wrong athlete vs list GK 27 / Meia 22",
        walterNote: "Walter kept birth_year 1990 (age 26; list had 32)",
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
