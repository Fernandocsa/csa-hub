/**
 * Fill missing birth_year for 2021 squad from published elenco ages.
 * Does NOT overwrite existing birth_year/birth_date.
 * birth_year = 2021 - age (calcAgeInSeason uses seasonYear - birthYear).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = 2021;

/** Source elenco ages → DB player id (2021 roster). */
const UPDATES = [
  // Goleiro
  { id: 257, name: "Montanhas", age: 20 },
  // Raul Jonas Steffens (GK) split in fix-raul-2021-gk-split.mjs — not id 63
  { id: 247, name: "Darley", age: 31 },
  { id: 128, name: "Lucas Frigeri", age: 32 },
  { id: 205, name: "Thiago Rodrigues", age: 32 },
  // Defensor
  { id: 207, name: "Cantionilo", age: 20 },
  { id: 262, name: "Pedrinho", age: 19 },
  { id: 250, name: "Athirson", age: 21 },
  { id: 267, name: "Patrick Brey", age: 24 },
  { id: 187, name: "Lucas Dias", age: 25 },
  { id: 30, name: "Cristovam", age: 30 },
  { id: 269, name: "Ewerthon", age: 20 },
  { id: 215, name: "Norberto", age: 30 },
  { id: 235, name: "Rodolfo Filemon", age: 26 },
  { id: 239, name: "Matheus Felipe", age: 22 },
  { id: 258, name: "Wellington", age: 29 },
  { id: 251, name: "Fabrício", age: 31 },
  { id: 273, name: "Kevyn", age: 23 },
  { id: 260, name: "Vitor Costa", age: 26 },
  // Meia
  { id: 266, name: "Vinicius José", age: 20 },
  { id: 259, name: "Zé do Carmo", age: 19 },
  { id: 217, name: "Bruno Tesouro", age: 20 },
  { id: 249, name: "João", age: 19 },
  { id: 270, name: "Gustavo Martins", age: 18 },
  { id: 244, name: "Andrey Rafael", age: 21 },
  { id: 240, name: "Alisson", age: 21 },
  { id: 272, name: "Fernando Ferro", age: 20 },
  { id: 154, name: "Yuri Lara", age: 27 },
  { id: 254, name: "Silas", age: 25 },
  { id: 230, name: "Nádson", age: 31 },
  { id: 263, name: "Ítalo", age: 28 },
  { id: 45, name: "Renato Cajá", age: 36 },
  { id: 268, name: "Silvinho", age: 30 },
  // Atacante
  { id: 243, name: "Nilson", age: 30 },
  { id: 252, name: "Ryan Gonzales", age: 20 },
  { id: 261, name: "Wykley", age: 18 },
  { id: 255, name: "Iury Castilho", age: 25 },
  { id: 7, name: "João Paulo", age: 20 },
  { id: 136, name: "Yago", age: 24 },
  { id: 274, name: "Aylon", age: 29 },
  { id: 15, name: "Dellatorre", age: 29 },
  { id: 241, name: "Dudu Beberibe", age: 28 },
  { id: 1, name: "Rodrigo Pimpão", age: 33 },
  { id: 253, name: "Reinaldo", age: 20 },
  // Marquinhos split in fix-marquinhos-2021-split.mjs (Sousa Júnior + Gonçalves)
  // Pedro Caracoci, João Guilherme, Fagner Alagoano, Márcio Bruno, Mosquito
  // Already had birth data: Almir Luan, Bruno Mota, Clayton, Didira, Ernandes,
  // Éverton Silva, Gabriel, Gabriel Tonini, Geovane, Giva, João Victor, Lucão,
  // Marco Túlio, Rodrigo Rodrigues, Tito, Wallace, Yann Rolim
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
    `SELECT p.id, p.name, p.position, p.birth_year, p.birth_date
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
        notOn2021RosterFromSource: [
          "Pedro Caracoci",
          "João Guilherme",
          "Fagner Alagoano",
          "Márcio Bruno",
          "Mosquito",
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
