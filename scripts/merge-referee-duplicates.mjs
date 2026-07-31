/**
 * Merge duplicate referees and set canonical names + UF.
 *
 * Pairs (keep ← remove…):
 * - Denis Ribeiro Serafim (AL) ← Denis da Silva Ribeiro Serafim
 * - Dewson Freitas da Silva (PA) ← Dewson Freiitas…, Dewson Fernando…
 * - Vinicius Gomes do Amaral (RS/MG) ← Vinícius Gomes do Amaral
 * - Ricarle Gustavo Gonçalves Batista ← Ricardo Gustavo…
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

/** @type {{ keepName: string, state: string | null, removeNames: string[] }[]} */
const MERGES = [
  {
    keepName: "Denis Ribeiro Serafim",
    state: "AL",
    removeNames: ["Denis da Silva Ribeiro Serafim", "Dênis da Silva Ribeiro Serafim"],
  },
  {
    keepName: "Dewson Freitas da Silva",
    state: "PA",
    removeNames: ["Dewson Freiitas da Silva", "Dewson Fernando Freitas da Silva"],
  },
  {
    // Cadastro oficial sem acento; UF RS/MG ambígua — deixa null até definir a federação principal.
    keepName: "Vinicius Gomes do Amaral",
    state: null,
    removeNames: ["Vinícius Gomes do Amaral"],
  },
  {
    keepName: "Ricarle Gustavo Gonçalves Batista",
    state: null,
    removeNames: ["Ricardo Gustavo Gonçalves Batista"],
  },
];

async function findByName(name) {
  const { rows } = await client.query(
    `SELECT id, name, state, photo_url,
            (SELECT count(*)::int FROM matches m WHERE m.referee_id = referees.id) AS matches
     FROM referees WHERE name = $1`,
    [name],
  );
  return rows[0] ?? null;
}

try {
  await client.query("BEGIN");
  const report = [];

  for (const m of MERGES) {
    let keep = await findByName(m.keepName);
    if (!keep) {
      // Prefer creating from first remove that exists, then rename
      let seed = null;
      for (const rn of m.removeNames) {
        seed = await findByName(rn);
        if (seed) break;
      }
      if (!seed) {
        report.push({ keepName: m.keepName, status: "skipped_missing" });
        continue;
      }
      await client.query(`UPDATE referees SET name = $2 WHERE id = $1`, [seed.id, m.keepName]);
      keep = await findByName(m.keepName);
    }

    const removed = [];
    for (const rn of m.removeNames) {
      const rem = await findByName(rn);
      if (!rem) continue;
      if (rem.id === keep.id) continue;

      const { rowCount: moved } = await client.query(
        `UPDATE matches SET referee_id = $2 WHERE referee_id = $1`,
        [rem.id, keep.id],
      );
      // Prefer photo from remove if keep has none
      if (!keep.photo_url && rem.photo_url) {
        await client.query(`UPDATE referees SET photo_url = $2 WHERE id = $1`, [
          keep.id,
          rem.photo_url,
        ]);
        keep.photo_url = rem.photo_url;
      }
      await client.query(`DELETE FROM referees WHERE id = $1`, [rem.id]);
      removed.push({ id: rem.id, name: rem.name, matchesMoved: moved });
    }

    if (m.state != null) {
      await client.query(`UPDATE referees SET state = $2 WHERE id = $1`, [keep.id, m.state]);
    }

    const after = await findByName(m.keepName);
    report.push({
      keep: { id: after.id, name: after.name, state: after.state, matches: after.matches },
      removed,
    });
  }

  await client.query("COMMIT");
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
