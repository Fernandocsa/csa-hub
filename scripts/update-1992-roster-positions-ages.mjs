/**
 * Fill missing position + birth_year for 1992 squad from published elenco ages.
 * Does NOT overwrite existing position/birth_year/birth_date.
 * birth_year = 1992 - age (calcAgeInSeason uses seasonYear - birthYear).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = 1992;

/** Source elenco → mapped DB player id + position group + age in 1992. */
const UPDATES = [
  // Defensor → Zagueiro (canonical)
  { id: 549, name: "Talvanes", position: "Zagueiro", age: 21 },
  { id: 548, name: "Marcelo", position: "Zagueiro", age: 28 },
  { id: 560, name: "Marcelo Barreto", position: "Zagueiro", age: 21 },
  { id: 572, name: "Rau", position: "Zagueiro", age: 23 },
  { id: 555, name: "Ivanildo", position: "Zagueiro", age: 32 },
  { id: 546, name: "Carlinhos Marechal", position: "Zagueiro", age: 30 },
  { id: 547, name: "Café", position: "Zagueiro", age: 32 },
  // Meia
  { id: 556, name: "Beu", position: "Meia", age: 26 },
  { id: 563, name: "Dago", position: "Meia", age: 24 },
  { id: 558, name: "Marcelo Gomes", position: "Meia", age: 21 },
  { id: 553, name: "Mazinho", position: "Meia", age: 22 },
  { id: 550, name: "Oseas", position: "Meia", age: 25 }, // Oséias
  { id: 559, name: "Mário Xavier", position: "Meia", age: 21 },
  // Atacante
  { id: 568, name: "Williams", position: "Atacante", age: 20 }, // Willians
  { id: 552, name: "Bizu", position: "Atacante", age: 32 },
  { id: 498, name: "Peu", position: "Atacante", age: 32 },
  { id: 554, name: "Édson", position: "Atacante", age: 33 }, // Édson Carioca
  { id: 551, name: "Chico", position: "Atacante", age: 25 },
  { id: 566, name: "Piti", position: "Atacante", age: 29 },
  // Already complete in DB (skipped intentionally):
  // Flávio (Goleiro/1970), Ivan (Atacante/1969), Lino (Meia Ofensivo/1971), Wilson (Atacante/1973)
];

try {
  await client.query("BEGIN");
  const results = [];

  for (const u of UPDATES) {
    const birthYear = SEASON - u.age;
    const { rows: before } = await client.query(
      `SELECT id, name, position, birth_year, birth_date FROM players WHERE id=$1`,
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
         position = CASE WHEN position IS NULL OR btrim(position) = '' THEN $2 ELSE position END,
         birth_year = CASE
           WHEN birth_year IS NULL AND birth_date IS NULL THEN $3
           ELSE birth_year
         END
       WHERE id = $1
       RETURNING id, name, position, birth_year, birth_date`,
      [u.id, u.position, birthYear],
    );

    const after = rows[0];
    results.push({
      id: u.id,
      name: u.name,
      position: {
        from: before[0].position,
        to: after.position,
        set: before[0].position == null || String(before[0].position).trim() === "",
      },
      birth_year: {
        from: before[0].birth_year,
        to: after.birth_year,
        set: before[0].birth_year == null && before[0].birth_date == null,
        implied: birthYear,
      },
    });
  }

  await client.query("COMMIT");

  const filled = results.filter((r) => r.position.set || r.birth_year.set);
  console.log(
    JSON.stringify(
      {
        ok: true,
        updatedPlayers: filled.length,
        details: filled,
        skippedAlreadyHadData: results.filter(
          (r) => !r.position.set && !r.birth_year.set,
        ),
        notOn1992RosterFromSource: [
          "Filho",
          "Fernando Lima",
          "Mingo",
          "Ivanildo Gomes",
          "Marcão",
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
