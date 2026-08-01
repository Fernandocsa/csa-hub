/**
 * Apply UF affiliations for CSA referees (research 2026-07-31).
 *
 * - Sets state for resolved names (exact match on current DB name)
 * - Renames Basconcelos → Vasconcelos (BA)
 * - Merges Vinícius Gonçalves dias Araújo → Vinicius Gonçalves Dias Araújo (SP)
 * - Leaves Paulo Belence unresolved
 * - Does NOT rename Paulo Roberto → Paulo Renato (needs user confirm)
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

/** Exact DB name → UF (primary federation for CSA era / current registration) */
const UF_BY_NAME = {
  "Diego Pombo Lopez": "BA",
  "Wagner do Nascimento Magalhães": "RJ",
  "Anderson Daronco": "RS",
  "Antônio Dib Moraes de Sousa": "PI",
  "Diego da Silva Castro": "PI",
  "José Mendonça da Silva Júnior": "PR",
  "Marielson Alves Silva": "BA",
  "Rodolpho Toski Marques": "PR",
  "Rodrigo Carvalhaes de Miranda": "RJ",
  "Sávio Pereira Sampaio": "DF",
  "Wagner Reway": "MT",
  "Bruno Arleu de Araújo": "RJ",
  "Emerson Ricardo de Almeida Andrade": "BA",
  "Felipe Fernandes de Lima": "MG",
  "Gilberto Rodrigues Castro Júnior": "PE",
  "Jean Pierre Gonçalves Lima": "RS",
  "Leandro Pedro Vuaden": "RS",
  "Ricardo Marques Ribeiro": "MG",
  "Alexandre Vargas Tavares de Jesus": "RJ",
  "André Luiz Skettino Policardo Bento": "MG",
  "Emerson de Almeida Ferreira": "MG",
  "Francisco Carlos do Nascimento": "AL",
  "Paulo César Zanovelli da Silva": "MG", // override task PR hint
  "Paulo Henrique Schleich Volfopf": "MS",
  "Paulo Roberto Moreira da Silva Coelho": "RJ", // likely typo of Renato; UF only
  "Vinicius Furlan": "SP",
  "Zandick Gondim Alves Júnior": "RN",
  "Adriano Barros Carneiro": "CE",
  "Andrey da Silva e Silva": "PA",
  "Daniel Nobre Bins": "RS",
  "Douglas Marques das Flores": "SP",
  "Jefferson Ferreira de Moraes": "GO",
  // Bizzio: CSA matches 2020–2021 around SP→PB transfer; research primary = PB
  "Leandro Bizzio Marinho": "PB",
  "Pablo Ramon Gonçalves Pinheiro": "RN",
  // Traci: 1×2018 PR + 2× after 2019 SC transfer → SC
  "Rafael Traci": "SC",
  "Rodrigo Batista Raposo": "DF",
  "Wanderson Alves de Sousa": "MG",
  "André Rodrigo Rocha": "RJ",
  "Diego Fernando Silva de Lima": "PE",
  "Djonaltan Costa de Araújo": "PA",
  "Douglas Schwengber da Silva": "RS",
  "Dyorgenes José Padovani de Andrade": "ES",
  "Grazianni Maciel Rocha": "RJ",
  "Leonilson Fernandes Trigueiro Filho": "RN",
  "Luciano da Silva Miranda Filho": "CE",
  "Luiz César de Oliveira Magalhães": "CE",
  "Maguielson Lima Barbosa": "DF",
  // Marcelo Aparecido: CSA matches both 2020 (post ~2018 SP→PB) → PB
  "Marcelo Aparecido de Souza": "PB",
  "Rodrigo Dalonso Ferreira": "SC",
  "Salim Fende Chavez": "SP",
  "Tarcísio Flores da Silva": "RN",
  "Thiago Luís Scarascati": "SP",
  "Alex Gomes Stefano": "RJ",
  "Davi de Oliveira Lacerda": "ES",
  // Edina: CSA match 2022 after 2019 SP filiation → SP
  "Edina Alves Batista": "SP",
  "Eduardo Tomaz de Aquino Valadão": "GO",
  "Gleiton Lins Vieira": "AL",
  // Heber: CSA match 2021, SC since Nov 2012 → SC
  "Heber Roberto Lopes": "SC",
  "Irinaldo Jorge dos Santos Silva": "BA",
  "João Pedro da Silva Braga": "AL",
  "Jonathan Benkenstein Pinheiro": "RS",
  "José Woshington da Silva": "PE",
  "Lucas Paulo Torezin": "PR",
  "Luiz Claudio Sobral": "PE",
  "Marco Aurélio Fazejas Ferreira": "MG",
  "Rafael Rodrigo Klein": "RS",
  "Ronei Candido Alves": "MG",
  "Tiago Nascimento dos Santos": "PE",
  "Yuri Elino Ferreira da Cruz": "RJ",
};

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
  const updated = [];
  const missing = [];
  const skippedAlready = [];

  for (const [name, state] of Object.entries(UF_BY_NAME)) {
    const row = await findByName(name);
    if (!row) {
      missing.push(name);
      continue;
    }
    if (row.state && row.state.toUpperCase() === state) {
      skippedAlready.push({ id: row.id, name, state });
      continue;
    }
    const { rows } = await client.query(
      `UPDATE referees SET state = $2 WHERE id = $1 RETURNING id, name, state`,
      [row.id, state],
    );
    updated.push({ ...rows[0], prev: row.state, matches: row.matches });
  }

  // Rename Basconcelos → Vasconcelos (keep BA already set above if present)
  let renameBasconcelos = null;
  {
    const bad = await findByName("Bruno Pereira Basconcelos");
    const good = await findByName("Bruno Pereira Vasconcelos");
    if (bad && !good) {
      const { rows } = await client.query(
        `UPDATE referees SET name = $2, state = COALESCE(state, 'BA') WHERE id = $1
         RETURNING id, name, state`,
        [bad.id, "Bruno Pereira Vasconcelos"],
      );
      renameBasconcelos = { from: bad.name, to: rows[0] };
    } else if (bad && good) {
      await client.query(`UPDATE matches SET referee_id = $2 WHERE referee_id = $1`, [
        bad.id,
        good.id,
      ]);
      if (!good.state) {
        await client.query(`UPDATE referees SET state = 'BA' WHERE id = $1`, [good.id]);
      }
      await client.query(`DELETE FROM referees WHERE id = $1`, [bad.id]);
      renameBasconcelos = { merged: true, keep: good.id, removed: bad.id };
    }
  }

  // Merge Vinícius Gonçalves dias Araújo → Vinicius Gonçalves Dias Araújo (SP)
  let mergeVinicius = null;
  {
    const keep = await findByName("Vinicius Gonçalves Dias Araújo");
    const rem = await findByName("Vinícius Gonçalves dias Araújo");
    if (keep && rem && keep.id !== rem.id) {
      const { rowCount: moved } = await client.query(
        `UPDATE matches SET referee_id = $2 WHERE referee_id = $1`,
        [rem.id, keep.id],
      );
      if (!keep.photo_url && rem.photo_url) {
        await client.query(`UPDATE referees SET photo_url = $2 WHERE id = $1`, [
          keep.id,
          rem.photo_url,
        ]);
      }
      await client.query(`UPDATE referees SET state = COALESCE(state, 'SP') WHERE id = $1`, [
        keep.id,
      ]);
      await client.query(`DELETE FROM referees WHERE id = $1`, [rem.id]);
      const after = await findByName("Vinicius Gonçalves Dias Araújo");
      mergeVinicius = {
        keep: { id: after.id, name: after.name, state: after.state, matches: after.matches },
        removed: rem.name,
        matchesMoved: moved,
      };
    } else if (!keep && rem) {
      await client.query(
        `UPDATE referees SET name = $2, state = COALESCE(state, 'SP') WHERE id = $1`,
        [rem.id, "Vinicius Gonçalves Dias Araújo"],
      );
      mergeVinicius = { renamedOnly: true, id: rem.id };
    }
  }

  const stillMissing = await client.query(`
    SELECT id, name,
      (SELECT count(*)::int FROM matches m WHERE m.referee_id = referees.id) AS matches
    FROM referees
    WHERE state IS NULL OR trim(state) = ''
    ORDER BY name
  `);

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        updatedCount: updated.length,
        updated,
        missingFromDb: missing,
        skippedAlready,
        renameBasconcelos,
        mergeVinicius,
        stillMissingUf: stillMissing.rows,
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
