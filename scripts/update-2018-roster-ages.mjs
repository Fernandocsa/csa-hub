/**
 * Fill missing birth_year for 2018 squad from published elenco ages.
 * Does NOT overwrite existing birth_year/birth_date.
 * birth_year = 2018 - age (calcAgeInSeason uses seasonYear - birthYear).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = 2018;

const UPDATES = [
  // Goleiro
  { id: 133, name: "Felipe Garcia", age: 30 },
  { id: 111, name: "Alexandre Cajuru", age: 25 },
  { id: 62, name: "Willis Mota", age: 33 },
  // Defensor
  { id: 144, name: "Talisson Calcinha", age: 23 },
  { id: 152, name: "Wellington Silva", age: 30 },
  { id: 145, name: "Matheus Lopes", age: 33 },
  { id: 131, name: "John Lennon", age: 26 },
  { id: 130, name: "Velicka", age: 32 },
  { id: 160, name: "Muriel", age: 30 },
  { id: 155, name: "Elivelton", age: 26 },
  { id: 60, name: "Rodrigo Lobão", age: 24 },
  { id: 146, name: "Roger", age: 23 },
  { id: 127, name: "Paulinho", age: 30 },
  // Meia
  { id: 161, name: "Juan", age: 36 },
  { id: 153, name: "Da Silva", age: 20 },
  { id: 157, name: "Daniel Alagoano", age: 19 },
  { id: 135, name: "Charles", age: 20 },
  { id: 86, name: "Caíque", age: 31 },
  { id: 78, name: "Marcos Antônio", age: 30 },
  { id: 125, name: "Joílson", age: 20 },
  { id: 70, name: "Edinho", age: 35 },
  { id: 148, name: "Ferrugem", age: 30 },
  { id: 143, name: "Pio", age: 30 },
  { id: 126, name: "Eduardo Echeverría", age: 29 },
  // Atacante
  { id: 137, name: "Neto Berola", age: 30 },
  { id: 151, name: "Josimar", age: 30 },
  { id: 156, name: "Rubens", age: 24 },
  { id: 159, name: "Judivan", age: 23 },
  { id: 132, name: "Elly", age: 20 },
  { id: 147, name: "Bruno Veiga", age: 28 },
  { id: 124, name: "Hugo Cabral", age: 29 },
  { id: 129, name: "Taiberson", age: 24 },
  { id: 142, name: "Pingo", age: 27 },
  { id: 150, name: "Leandro Kivel", age: 35 },
  { id: 61, name: "Walter", age: 28 }, // listed as Atacante; DB position Zagueiro
  { id: 89, name: "Maxuell Samurai", age: 26 },
  { id: 149, name: "Niltinho", age: 24 },
  // Not on 2018 roster from source:
  // Tallison, Dalton, João Victor (x2), Neto, Toinho, Cristiano, Mazinho,
  // Lucas Surcin, Mascote, Giva
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
        notOn2018RosterFromSource: [
          "Tallison",
          "Dalton",
          "João Victor (defensor 34)",
          "João Victor (atacante 23)",
          "Neto",
          "Toinho",
          "Cristiano",
          "Mazinho",
          "Lucas Surcin",
          "Mascote",
          "Giva",
        ],
        noteYago:
          "Yago kept birth_year 1997 (age 21 in 2018); source list had 24",
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
