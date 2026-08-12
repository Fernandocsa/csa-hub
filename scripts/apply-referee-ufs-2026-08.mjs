/**
 * Set referee federation UF + merge name variants (2026-08).
 *
 * UF = federação de atuação, not birth state.
 * Does not create new referees. Match stats (J/V/E/D/gols/%) stay live from matches.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const ACCENT_FROM = "áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ";
const ACCENT_TO = "aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCNN";

/** @type {{ keepName: string, state: string, aliases: string[] }[]} */
const MERGES = [
  {
    keepName: "Charles Hebert Cavalcante Ferreira",
    state: "AL",
    aliases: [
      "Charles Herbert Cavalcante Ferreira",
      "Charles Hebert",
      "Charles Hebert Ferreira Cavalcante",
    ],
  },
  {
    keepName: "Sílvio Acioli dos Santos",
    state: "AL",
    aliases: ["Sílvio Acioli"],
  },
  {
    keepName: "Jorge Luiz da Silva",
    state: "AL",
    aliases: ["Jorge Luís da Silva"],
  },
  {
    keepName: "Fernando Rogério de Oliveira Assunção",
    state: "AL",
    aliases: ["Fernando Rogério Assunção", "Fernando Rogério Oliveira Assunção"],
  },
  {
    keepName: "Cláudio Luciano Mercante Júnior",
    state: "PE",
    aliases: ["Cláudio Mercante", "Cláudio Mercante Júnior"],
  },
  {
    keepName: "Rosivaldo Aureliano",
    state: "AL",
    aliases: ["Rosival Aureliano"],
  },
  {
    keepName: "Francisco Carlos do Nascimento",
    state: "AL",
    aliases: ["Francisco Carlos Nascimento"],
  },
  {
    keepName: "Marlon Reinoldson do Nascimento",
    state: "AL",
    aliases: ["Marlon Reinoldson"],
  },
];

/** Exact / folded DB name → federation UF */
const UF_BY_NAME = {
  "Cláudio Regis": "AL",
  "Marivan da Silva": "AL",
  "Sílvio Acioli dos Santos": "AL",
  "Fernando Rogério de Oliveira Assunção": "AL",
  "Francisco Carlos do Nascimento": "AL",
  "Francisco Carlos Nascimento": "AL",
  "Mário Sérgio da Silva Bancilon": "SE",
  "Charles Hebert Cavalcante Ferreira": "AL",
  "Hércules Martins": "AL",
  "Jorge Luiz da Silva": "AL",
  "George Alves Feitosa": "AL",
  "Paulo Belence Alves dos Prazeres Filho": "PE",
  "Ricardo Luiz de Camargo": "SP",
  "Rosivaldo Aureliano": "AL",
  "Sálvio Spínola Fagundes Filho": "SP",
  "Sivaldo Silva": "AL",
  "Wílson de Souza Mendonça": "PE",
  "Ademir da Silva Barros": "AL",
  "Aldemir Vieira de Matos": "AL",
  "Álvaro Azeredo Quelhas": "RJ",
  "Bruno Monteiro Cunha": "AL",
  "Carlos José Dantas": "AL",
  "Cláudio Luciano Mercante Júnior": "PE",
  "Claudionor dos Santos Júnior": "AL",
  "Diego da Costa": "AL",
  "Edílson Pereira de Carvalho": "SP",
  "Édson Inácio": "AL",
  "Elizabete Esmeralda Gomes": "CE",
  "Emerson Sobral": "PE",
  "Henrique José Ribeiro": "AL",
  "Iudiney Rocha e Silva": "PI",
  "Jaílson Freitas": "AL",
  "Jorge Figueira": "AL",
  "José Carlos Santos Oliveira": "AL",
  "José Cavalcanti de Brito": "AL",
  "José Elias Santos Filho": "AL",
  "José Marcelino Tavares": "AL",
  "José Teixeira de Araújo": "AL",
  "José Vicente Neto": "AL",
  "Lourival Dias Filho": "AL",
  "Manoel Amaro de Lima": "AL",
  "Marcelo Fonseca": "AL",
  "Márcio Rezende de Freitas": "MG",
  "Marco Antônio Sampaio": "AL",
  "Marlon Reinoldson do Nascimento": "AL",
  "Matheus de Moraes Silva": "AL",
  "Murilo Duarte": "AL",
  "Oscar Scolfaro": "SP",
  "Pedro Alves de Oliveira": "AL",
  "Pedro de Grandi": "AL",
  "Rogério Lima da Rocha": "AL",
  "Rubens de Souza": "AL",
  "Rubens dos Santos": "AL",
  "Wagner Tardelli": "RJ",
  "Wilson Luís Seneme": "SP",
};

async function findByFoldedName(name) {
  const { rows } = await client.query(
    `SELECT id, name, state, photo_url,
            (SELECT count(*)::int FROM matches m WHERE m.referee_id = referees.id) AS matches
     FROM referees
     WHERE translate(lower(name), $2, $3) = translate(lower($1), $2, $3)
     ORDER BY matches DESC, id ASC`,
    [name, ACCENT_FROM, ACCENT_TO],
  );
  return rows;
}

async function reassignEntity(keepId, remId) {
  await client.query(
    `UPDATE suggestions SET entity_id = $1
     WHERE entity_type = 'referee' AND entity_id = $2`,
    [keepId, remId],
  );
  await client.query(
    `UPDATE comments SET entity_id = $1
     WHERE entity_type = 'referee' AND entity_id = $2`,
    [keepId, remId],
  );
  await client.query(
    `UPDATE ratings r SET entity_id = $1
     WHERE entity_type = 'referee' AND entity_id = $2
       AND NOT EXISTS (
         SELECT 1 FROM ratings x
         WHERE x.entity_type = 'referee' AND x.entity_id = $1 AND x.voter_token = r.voter_token
       )`,
    [keepId, remId],
  );
  await client.query(
    `DELETE FROM ratings WHERE entity_type = 'referee' AND entity_id = $1`,
    [remId],
  );
}

try {
  await client.query("BEGIN");
  const mergeReport = [];

  for (const m of MERGES) {
    const names = [m.keepName, ...m.aliases];
    const found = [];
    const seen = new Set();
    for (const n of names) {
      for (const row of await findByFoldedName(n)) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        found.push(row);
      }
    }
    if (!found.length) {
      mergeReport.push({ keepName: m.keepName, status: "skipped_missing" });
      continue;
    }

    found.sort((a, b) => b.matches - a.matches || a.id - b.id);
    const keep = found[0];
    const removed = [];

    if (keep.name !== m.keepName) {
      await client.query(`UPDATE referees SET name = $2 WHERE id = $1`, [keep.id, m.keepName]);
      keep.name = m.keepName;
    }

    for (const rem of found.slice(1)) {
      const { rowCount: moved } = await client.query(
        `UPDATE matches SET referee_id = $2 WHERE referee_id = $1`,
        [rem.id, keep.id],
      );
      await reassignEntity(keep.id, rem.id);
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

    await client.query(`UPDATE referees SET state = $2 WHERE id = $1`, [keep.id, m.state]);
    const after = (await findByFoldedName(m.keepName))[0];
    const orphan = await client.query(
      `SELECT count(*)::int AS n FROM matches WHERE referee_id = ANY($1::int[])`,
      [removed.map((r) => r.id)],
    );
    if (removed.length && orphan.rows[0].n !== 0) {
      throw new Error(`orphan matches remain after merge ${m.keepName}`);
    }

    mergeReport.push({
      keep: {
        id: after.id,
        name: after.name,
        state: after.state,
        matches: after.matches,
      },
      removed,
    });
  }

  const updated = [];
  const missing = [];
  const skippedAlready = [];

  for (const [name, state] of Object.entries(UF_BY_NAME)) {
    const rows = await findByFoldedName(name);
    if (!rows.length) {
      missing.push(name);
      continue;
    }
    if (rows.length > 1) {
      missing.push(`${name} (ambiguous: ${rows.map((r) => `#${r.id}`).join(", ")})`);
      continue;
    }
    const row = rows[0];
    if (row.state && row.state.toUpperCase() === state) {
      skippedAlready.push({ id: row.id, name: row.name, state });
      continue;
    }
    const { rows: upd } = await client.query(
      `UPDATE referees SET state = $2 WHERE id = $1 RETURNING id, name, state`,
      [row.id, state],
    );
    updated.push({ ...upd[0], prev: row.state, matches: row.matches });
  }

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        merges: mergeReport,
        updatedCount: updated.length,
        updated,
        skippedAlreadyCount: skippedAlready.length,
        skippedAlready,
        missingFromDb: missing,
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
