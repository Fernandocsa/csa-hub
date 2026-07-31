/**
 * Fill missing birth_year for 2020 squad from published elenco ages.
 * Does NOT overwrite existing birth_year/birth_date.
 * birth_year = 2020 - age (calcAgeInSeason uses seasonYear - birthYear).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = 2020;

const UPDATES = [
  // Defensor
  { id: 234, name: "Caio Felipe", age: 21 },
  { id: 210, name: "Ignácio", age: 23 },
  { id: 174, name: "Luciano Castán", age: 30 },
  { id: 236, name: "Cleberson", age: 27 },
  { id: 59, name: "Leandro Souza", age: 34 },
  { id: 206, name: "Willian Rocha", age: 31 },
  { id: 231, name: "Igor Fernandes", age: 28 },
  // Meia
  { id: 228, name: "Renatinho", age: 28 },
  { id: 221, name: "Richard Franco", age: 28 },
  { id: 226, name: "Rodrigo Andrade", age: 23 },
  { id: 225, name: "Márcio Araújo", age: 36 },
  { id: 224, name: "Andrigo", age: 25 },
  { id: 237, name: "Gustavo Hebling", age: 24 },
  // Atacante
  { id: 233, name: "Bruno José", age: 22 },
  { id: 232, name: "Diego Maurício", age: 29 },
  { id: 139, name: "Victor Paraíba", age: 22 },
  { id: 208, name: "Schutz", age: 21 },
  { id: 214, name: "Rone", age: 24 },
  { id: 183, name: "Jarro Pedroso", age: 26 },
  { id: 172, name: "Héctor Bustamante", age: 25 },
  { id: 204, name: "Netto", age: 22 },
  { id: 223, name: "Allano", age: 25 },
  { id: 55, name: "Michel Douglas", age: 28 },
  { id: 238, name: "Paulo Sérgio", age: 31 },
  { id: 219, name: "Pedro Júnior", age: 33 },
  { id: 209, name: "Pedro Lucas", age: 21 },
  { id: 211, name: "Rafael Bilu", age: 21 },
  // Not on 2020 roster from source: João, Zé do Carmo
  // No age in source (goleiros / extras on roster): Alexandre Cajuru, Bruno Grassi,
  // Matheus Mendes, Caíque, Thiago Rodrigues, Tito, João Victor
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
    `SELECT p.id, p.name, p.position
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
        notOn2020RosterFromSource: ["João", "Zé do Carmo"],
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
