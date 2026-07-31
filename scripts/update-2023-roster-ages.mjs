/**
 * Fill missing birth_year for 2023 squad from published elenco ages.
 * Does NOT overwrite existing birth_year/birth_date.
 * birth_year = 2023 - age (calcAgeInSeason uses seasonYear - birthYear).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = 2023;

/** Source elenco ages → DB player id (2023 roster). */
const UPDATES = [
  // Goleiro
  { id: 350, name: "Eduardo", age: 22 },
  { id: 349, name: "Dalberson", age: 26 },
  { id: 301, name: "Paulo Ricardo", age: 26 },
  // Defensor
  { id: 292, name: "William", age: 19 },
  { id: 357, name: "Paulo César", age: 24 },
  { id: 310, name: "Gabriel Oliveira", age: 24 },
  { id: 93, name: "Jonathan", age: 30 },
  { id: 318, name: "Lucas Ryan", age: 20 },
  { id: 354, name: "Gabryel", age: 19 },
  { id: 325, name: "Eduardo Jacone", age: 20 },
  { id: 107, name: "Thales", age: 30 },
  { id: 283, name: "Douglas", age: 28 },
  { id: 330, name: "Kauã", age: 19 },
  { id: 265, name: "Éverton Silva", age: 34 },
  { id: 344, name: "Arnaldo", age: 31 },
  { id: 317, name: "Ednei", age: 32 },
  { id: 306, name: "Rafael Forster", age: 32 },
  { id: 340, name: "Mateus Santos", age: 20 },
  { id: 40, name: "Cedric", age: 25 },
  { id: 331, name: "Alex Matheus", age: 18 },
  { id: 227, name: "Almir Luan", age: 21 },
  { id: 336, name: "Victor Ramalho", age: 18 },
  { id: 222, name: "Tito", age: 22 },
  { id: 360, name: "Pará", age: 27 },
  { id: 323, name: "Giresse", age: 17 },
  { id: 264, name: "Ernandes", age: 35 },
  { id: 316, name: "Rhuan", age: 22 },
  // Meia
  { id: 309, name: "William Oliveira", age: 31 },
  { id: 352, name: "Moisés Gaúcho", age: 28 },
  { id: 339, name: "Fabrício Santos", age: 20 },
  { id: 346, name: "Pedro Victor", age: 20 },
  { id: 326, name: "Tomas Bastos", age: 31 },
  { id: 319, name: "Pedrão", age: 20 },
  { id: 307, name: "José Cleverton", age: 20 },
  { id: 320, name: "Marciel", age: 28 },
  { id: 335, name: "Rhayner", age: 32 },
  { id: 356, name: "Erick Melo", age: 17 },
  { id: 348, name: "Gabriel Taliari", age: 26 },
  { id: 333, name: "Rodolfo", age: 30 },
  { id: 216, name: "Yago Henrique", age: 27 },
  { id: 305, name: "Moisés Ribeiro", age: 32 },
  { id: 213, name: "João Victor", age: 19 },
  { id: 329, name: "Vinicius Toledo", age: 18 },
  { id: 343, name: "Guilherme Rend", age: 24 },
  { id: 242, name: "Gabriel Tonini", age: 27 },
  { id: 338, name: "Ramires", age: 24 },
  { id: 345, name: "Bruno Matias", age: 24 },
  { id: 315, name: "Geovane Silva", age: 25 },
  { id: 341, name: "Kleiton", age: 16 },
  { id: 334, name: "Erik", age: 20 },
  // Atacante
  { id: 311, name: "Jean Carlo", age: 30 },
  { id: 361, name: "Wenderson", age: 18 },
  { id: 342, name: "Vinicius Peixoto", age: 18 },
  { id: 337, name: "Dedé", age: 21 },
  { id: 322, name: "Rodriguinho", age: 22 },
  { id: 355, name: "Elvis", age: 17 },
  { id: 347, name: "Kaio Nunes", age: 27 },
  { id: 321, name: "Ray Vanegas", age: 30 },
  { id: 332, name: "Abner Vinicius", age: 20 },
  { id: 351, name: "Ruan", age: 21 },
  { id: 314, name: "Júnior Todinho", age: 29 },
  { id: 353, name: "Iago Teles", age: 23 },
  { id: 327, name: "Jô", age: 24 },
  { id: 313, name: "Luis Felipe", age: 22 },
  { id: 312, name: "João Felipe", age: 24 },
  { id: 324, name: "Matheus Lima", age: 20 },
  { id: 256, name: "Rodrigo Rodrigues", age: 27 },
  { id: 358, name: "Thiaguinho", age: 22 },
  { id: 359, name: "Jefferson Oliveira", age: 21 },
  // Already have birth data (kept; ages listed for reference only):
  // Xandão 33 (id 52), Celsinho 35 (id 108), Robinho published 24 / cadastro → 25 (id 492)
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
    if (!rosterIds.has(u.id)) {
      throw new Error(`Player ${u.id} ${u.name} not on ${SEASON} roster`);
    }
    const birthYear = SEASON - u.age;
    const { rows: before } = await client.query(
      `SELECT id, name, birth_year, birth_date FROM players WHERE id=$1`,
      [u.id],
    );
    if (!before[0]) throw new Error(`Missing player ${u.id} ${u.name}`);
    if (before[0].name !== u.name) {
      throw new Error(
        `Name mismatch id=${u.id}: db="${before[0].name}" expected="${u.name}"`,
      );
    }

    const { rows } = await client.query(
      `UPDATE players SET
         birth_year = CASE
           WHEN birth_year IS NULL AND birth_date IS NULL THEN $2
           ELSE birth_year
         END
       WHERE id = $1
       RETURNING id, name, birth_year, birth_date`,
      [u.id, birthYear],
    );

    const after = rows[0];
    results.push({
      id: u.id,
      name: u.name,
      birth_year: {
        from: before[0].birth_year,
        to: after.birth_year,
        set: before[0].birth_year == null && before[0].birth_date == null,
        implied: birthYear,
        sourceAge: u.age,
      },
    });
  }

  // Report roster players still without age after updates
  const { rows: stillMissing } = await client.query(
    `SELECT p.id, p.name, p.birth_year, p.birth_date
     FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.season = $1
       AND p.birth_year IS NULL
       AND p.birth_date IS NULL
     ORDER BY p.name`,
    [String(SEASON)],
  );

  const { rows: withAge } = await client.query(
    `SELECT COUNT(*)::int AS n
     FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.season = $1
       AND (p.birth_year IS NOT NULL OR p.birth_date IS NOT NULL)`,
    [String(SEASON)],
  );

  await client.query("COMMIT");

  const filled = results.filter((r) => r.birth_year.set);
  console.log(
    JSON.stringify(
      {
        ok: true,
        season: SEASON,
        updatedPlayers: filled.length,
        skippedAlreadyHadData: results
          .filter((r) => !r.birth_year.set)
          .map((r) => ({ id: r.id, name: r.name, birth_year: r.birth_year.to })),
        alreadyHadBirthOnRoster: [
          { id: 52, name: "Xandão" },
          { id: 108, name: "Celsinho" },
          { id: 492, name: "Robinho" },
        ],
        stillMissingAgeOnRoster: stillMissing,
        rosterWithAgeAfter: withAge[0].n,
        rosterTotal: rosterIds.size,
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
