/**
 * Fill missing birth_year for 2022 squad from published elenco ages.
 * Does NOT overwrite existing birth_year/birth_date.
 * birth_year = 2022 - age (calcAgeInSeason uses seasonYear - birthYear).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = 2022;

/** Source elenco ages → DB player id (2022 roster). */
const UPDATES = [
  // Goleiro
  { id: 302, name: "Jean", age: 21 },
  { id: 288, name: "Marcelo Carné", age: 32 },
  // Defensor
  { id: 291, name: "Werley", age: 33 },
  { id: 278, name: "Anderson Martins", age: 34 },
  { id: 282, name: "Lucas Marques", age: 24 },
  { id: 298, name: "Guilherme Paraíba", age: 28 },
  { id: 285, name: "Igor Inocêncio", age: 24 },
  { id: 37, name: "Diego Renan", age: 32 },
  { id: 293, name: "Wellington Nascimento", age: 27 },
  { id: 290, name: "Denílson", age: 27 },
  { id: 286, name: "Marcel Scalese", age: 26 },
  { id: 300, name: "Edson Lucas", age: 21 },
  // Meia
  { id: 281, name: "Bruno Paulista", age: 26 },
  { id: 218, name: "Wallace", age: 22 },
  { id: 32, name: "Gabriel", age: 32 },
  { id: 294, name: "Lourenço", age: 24 },
  { id: 277, name: "Léo Carvalho", age: 23 },
  { id: 248, name: "Yann Rolim", age: 27 },
  { id: 295, name: "Lucas Lourenço", age: 21 },
  { id: 297, name: "Ferreira", age: 29 },
  { id: 289, name: "Héctor Canteros", age: 33 },
  { id: 245, name: "Bruno Mota", age: 27 },
  { id: 280, name: "Rickson", age: 24 },
  { id: 284, name: "Luiz Beserra", age: 25 },
  // Atacante
  { id: 276, name: "Osvaldo", age: 35 },
  { id: 279, name: "Sassá", age: 28 },
  { id: 287, name: "Bruno Mezenga", age: 33 },
  { id: 303, name: "Felipe Augusto", age: 30 },
  { id: 275, name: "Rogério", age: 31 },
  { id: 296, name: "Dalberto", age: 27 },
  { id: 304, name: "John Mercado", age: 20 },
  { id: 299, name: "Lucas Barcelos", age: 23 },
  { id: 12, name: "Élton", age: 36 },
  { id: 271, name: "Clayton", age: 26 },
  { id: 246, name: "Marco Túlio", age: 24 },
  // Already had birth data (not in UPDATES): Cedric, Didira, Douglas, Ernandes,
  // Éverton Silva, Gabriel Tonini, Geovane, Giva, Jonathan, Lucão, Paulo Ricardo,
  // Rodrigo Rodrigues, Tito.
  // William 2022 is William Fernando da Silva (see fix-william-2022-2023-split.mjs).
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
        stillMissingAgeOnRoster: stillMissing,
        rosterWithAgeAfter: withAge[0].n,
        rosterTotal: rosterIds.size,
        notOn2022RosterFromSource: [
          "Gabriel Bubniack",
          "Pedro Caracoci",
          "Luan Henrique",
        ],
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
