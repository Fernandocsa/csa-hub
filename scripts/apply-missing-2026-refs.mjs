/**
 * Fill missing 2026 referees:
 * #1309 CSA 3x0 Cruzeiro-AL — João Pedro da Silva Braga
 * #1315 Joinville 1x0 CSA — Arthur Gomes Rabelo
 * #1311 CSA 4x0 Dimensão — Carlos Vitor Oliveira Alves (escala FAF 1ª rodada; jogo adiado)
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const norm = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

async function ensureReferee(preferredName, softFn, state = null) {
  let { rows } = await client.query(
    `SELECT id, name FROM referees WHERE lower(name)=lower($1) LIMIT 1`,
    [preferredName],
  );
  if (rows[0]) return rows[0];

  const all = await client.query(`SELECT id, name FROM referees`);
  const exact = all.rows.find((r) => norm(r.name) === norm(preferredName));
  if (exact) return exact;

  if (softFn) {
    const hits = all.rows.filter((r) => softFn(norm(r.name)));
    if (hits.length === 1) {
      console.log("REF_MATCH", preferredName, "->", hits[0]);
      return hits[0];
    }
    if (hits.length > 1) {
      console.log(
        "REF_AMBIGUOUS",
        preferredName,
        hits.map((h) => h.name),
      );
    }
  }

  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,$2) RETURNING id, name`,
    [preferredName, state],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

try {
  await client.query("BEGIN");

  const joao = await ensureReferee("João Pedro da Silva Braga", (n) =>
    n.includes("joao pedro") && n.includes("braga"),
  );

  const arthur = await ensureReferee(
    "Arthur Gomes Rabelo",
    (n) => n.includes("arthur") && n.includes("rabelo"),
    "ES",
  );

  const carlos = await ensureReferee(
    "Carlos Vitor Oliveira Alves",
    (n) =>
      n.includes("carlos vitor") ||
      (n.includes("carlos") && n.includes("oliveira alves")),
  );

  const updates = [
    [1309, joao],
    [1315, arthur],
    [1311, carlos],
  ];

  for (const [matchId, ref] of updates) {
    await client.query(`UPDATE matches SET referee_id=$2 WHERE id=$1`, [
      matchId,
      ref.id,
    ]);
    console.log(`#${matchId} -> ${ref.name}`);
  }

  await client.query("COMMIT");

  const check = await client.query(`
    SELECT m.id, o.name AS opponent, m.goals_for, m.goals_against, r.name AS referee
    FROM matches m
    LEFT JOIN opponents o ON o.id=m.opponent_id
    LEFT JOIN referees r ON r.id=m.referee_id
    WHERE m.id IN (1309,1311,1315)
    ORDER BY m.id
  `);
  console.log(check.rows);

  const still = await client.query(`
    SELECT m.id, m.match_date::date, o.name
    FROM matches m
    LEFT JOIN opponents o ON o.id=m.opponent_id
    WHERE m.match_date >= '2026-01-01' AND m.match_date < '2027-01-01'
      AND m.referee_id IS NULL
      AND m.goals_for IS NOT NULL
  `);
  console.log("ainda sem juiz (jogados):", still.rows);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
