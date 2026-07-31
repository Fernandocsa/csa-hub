/**
 * Fill missing birth_year for 2019 squad from published elenco ages.
 * Does NOT overwrite existing birth_year/birth_date.
 * birth_year = 2019 - age (calcAgeInSeason uses seasonYear - birthYear).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = 2019;

const UPDATES = [
  // Goleiro
  { id: 180, name: "Igo Gabriel", age: 17 },
  { id: 166, name: "João Carlos", age: 31 },
  { id: 190, name: "Jordi", age: 25 },
  { id: 198, name: "Fabrício Santana", age: 33 },
  // Defensor
  { id: 201, name: "Régis Souza", age: 30 },
  { id: 202, name: "Joazi", age: 22 },
  { id: 158, name: "Rony Fernandes", age: 21 },
  { id: 140, name: "Vital", age: 19 },
  { id: 171, name: "Gerson", age: 27 },
  { id: 193, name: "Ronaldo Alves", age: 29 },
  { id: 189, name: "Pedro Rosa", age: 28 },
  { id: 164, name: "Carlinhos", age: 32 },
  { id: 199, name: "Pablo Armero", age: 32 },
  // Meia
  { id: 177, name: "Léo Santos", age: 22 },
  { id: 184, name: "Amaral", age: 31 },
  { id: 165, name: "Mauro Silva", age: 25 },
  { id: 175, name: "Jhonnatan", age: 27 },
  { id: 173, name: "Lucca Motta", age: 21 },
  { id: 21, name: "Nilton", age: 32 },
  { id: 163, name: "Matheus Sávio", age: 22 },
  { id: 179, name: "Euller Silva", age: 24 },
  { id: 194, name: "Naldo", age: 29 },
  { id: 24, name: "João Vitor", age: 31 },
  { id: 68, name: "Dawhan", age: 23 },
  { id: 178, name: "Bruno Ramires", age: 25 },
  { id: 134, name: "Jhon Cley", age: 25 },
  { id: 185, name: "Madson", age: 33 },
  { id: 168, name: "Cristian Maidana", age: 32 },
  // Atacante
  { id: 167, name: "Lohan", age: 23 },
  { id: 195, name: "Hiago Ramiro", age: 27 },
  { id: 186, name: "Ramon", age: 20 },
  { id: 197, name: "Matheus Prado", age: 20 },
  { id: 182, name: "Maranhão", age: 29 },
  { id: 169, name: "Gersinho", age: 19 },
  { id: 200, name: "Warley", age: 19 },
  { id: 79, name: "Cassiano", age: 30 },
  { id: 170, name: "Andrés Escobar", age: 28 },
  { id: 181, name: "Ricardo Bueno", age: 31 },
  { id: 176, name: "Alisson Safira", age: 24 },
  { id: 188, name: "Patrick Fabiano", age: 31 },
  { id: 203, name: "Bruno Alves", age: 26 },
  { id: 191, name: "Rodolfo Gamarra", age: 30 },
  // Not on 2019 roster: Alexandre Cajuru, Lucão, Thiaguinho, Elly
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
        notOn2019RosterFromSource: [
          "Alexandre Cajuru",
          "Lucão",
          "Thiaguinho",
          "Elly",
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
