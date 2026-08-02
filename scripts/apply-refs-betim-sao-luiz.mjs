/**
 * Set referees for:
 * #1335 Betim 1x0 CSA — Pedro Alves de Oliveira
 * #1336 CSA 4x0 Betim — Dewson Fernando Silva
 * #2241 CSA 2x1 São Luiz — Paulo Roberto Jr
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

async function ensureReferee(preferredName, { soft } = {}) {
  let { rows } = await client.query(
    `SELECT id, name FROM referees WHERE lower(name)=lower($1) LIMIT 1`,
    [preferredName],
  );
  if (rows[0]) return rows[0];

  const all = await client.query(`SELECT id, name FROM referees`);
  const exact = all.rows.find((r) => norm(r.name) === norm(preferredName));
  if (exact) return exact;

  if (soft) {
    const hits = all.rows.filter((r) => soft(norm(r.name)));
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
    [preferredName, null],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

try {
  await client.query("BEGIN");

  const pedro = await ensureReferee("Pedro Alves de Oliveira", {
    soft: (n) => n.includes("pedro alves") && n.includes("oliveira"),
  });

  const dewson = await ensureReferee("Dewson Fernando Silva", {
    soft: (n) =>
      n.includes("dewson") &&
      (n.includes("fernando") || n.includes("freitas")) &&
      n.includes("silva"),
  });

  const paulo = await ensureReferee("Paulo Roberto Júnior", {
    soft: (n) => {
      if (!n.includes("paulo roberto")) return false;
      return (
        n.includes("junior") ||
        n.includes("jr") ||
        n.includes("moreira") ||
        n.endsWith(" jr")
      );
    },
  });

  const updates = [
    [1335, pedro.id, pedro.name],
    [1336, dewson.id, dewson.name],
    [2241, paulo.id, paulo.name],
  ];

  for (const [matchId, refId, refName] of updates) {
    const { rowCount } = await client.query(
      `UPDATE matches SET referee_id=$2 WHERE id=$1`,
      [matchId, refId],
    );
    console.log(`#${matchId} referee=${refName} (${rowCount})`);
  }

  await client.query("COMMIT");

  const check = await client.query(`
    SELECT m.id, o.name AS opponent, m.goals_for, m.goals_against, r.name AS referee
    FROM matches m
    LEFT JOIN opponents o ON o.id=m.opponent_id
    LEFT JOIN referees r ON r.id=m.referee_id
    WHERE m.id IN (1335,1336,2241)
    ORDER BY m.id
  `);
  console.log(check.rows);
  console.log("OK refs Betim/São Luiz");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
