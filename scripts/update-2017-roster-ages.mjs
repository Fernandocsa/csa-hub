/**
 * Fill missing birth_year for 2017 squad from published elenco ages.
 * Does NOT overwrite existing birth_year/birth_date.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = 2017;

const UPDATES = [
  { id: 112, name: "Douglas Marques", age: 32 },
  { id: 88, name: "Denilson", age: 29 },
  { id: 58, name: "Rayro", age: 31 },
  { id: 115, name: "Panda", age: 32 },
  { id: 56, name: "Dick", age: 33 },
  { id: 106, name: "Jorge Fellipe", age: 28 },
  { id: 66, name: "Mateus Lima", age: 22 },
  { id: 87, name: "Cleyton Lima", age: 27 },
  { id: 96, name: "Geovani", age: 25 },
  { id: 118, name: "Joãozinho", age: 23 },
  { id: 113, name: "Kelvin", age: 25 },
  { id: 91, name: "Michel Schmöller", age: 29 },
  { id: 80, name: "Cristiano", age: 29 },
  { id: 97, name: "Serginho", age: 29 },
  { id: 94, name: "Alex Henrique", age: 32 },
  { id: 85, name: "Rosinei", age: 34 },
  { id: 90, name: "Francisco Alex", age: 33 },
  { id: 100, name: "Luís Soares", age: 26 },
  { id: 76, name: "Thiago Potiguar", age: 32 },
  { id: 64, name: "Daniel Cruz", age: 27 },
  { id: 116, name: "Jeam", age: 22 },
  { id: 120, name: "Giancarlo", age: 34 },
  { id: 109, name: "Luís Maranhão", age: 24 },
  { id: 122, name: "Jacó", age: 21 },
  { id: 119, name: "Vanger", age: 30 },
  { id: 65, name: "Gustavinho", age: 23 },
  { id: 92, name: "Daniel Angulo", age: 30 },
  // Edinho/Cassiano later split; Anderson/Dalton/Lucas Silva added via add-2017-anderson-dalton-lucas-silva.mjs
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
        stillMissingAgeOnRoster: stillMissing,
        rosterWithAgeAfter: withAge[0].n,
        rosterTotal: rosterIds.size,
        conflictsKeptExisting: [
          { name: "Edinho", listAge: 22, cadastroImpliesAge: 34 },
          { name: "Cassiano", listAge: 23, cadastroImpliesAge: 28 },
        ],
        notOnRoster: ["Anderson", "Dalton", "Lucas Silva"],
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
