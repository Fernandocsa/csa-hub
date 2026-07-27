/**
 * Apply opponent logo_url for the 31 dry-run matches.
 * Creates column if missing, then UPDATEs by opponent id.
 *
 * Usage: node scripts/apply-opponent-logos.mjs
 */

import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();

/** id → logo URL (from dry-run exact matches) */
const UPDATES = [
  [20, "https://commons.wikimedia.org/wiki/Special:FilePath/São%20Paulo%20Futebol%20Clube%20logo%20(2022).svg"],
  [15, "https://commons.wikimedia.org/wiki/Special:FilePath/Fluminense%20Football%20Club.svg"],
  [19, "https://commons.wikimedia.org/wiki/Special:FilePath/Palmeiras%20logo.svg"],
  [17, "https://commons.wikimedia.org/wiki/Special:FilePath/Botafogo%20de%20Futebol%20e%20Regatas%20logo.svg"],
  [14, "https://commons.wikimedia.org/wiki/Special:FilePath/Clube%20de%20Regatas%20do%20Flamengo%20logo.svg"],
  [25, "https://commons.wikimedia.org/wiki/Special:FilePath/Clube%20Atlético%20Mineiro%20crest.svg"],
  [26, "https://commons.wikimedia.org/wiki/Special:FilePath/Cruzeiro%20Esporte%20Clube%20(logo).svg"],
  [23, "https://commons.wikimedia.org/wiki/Special:FilePath/Gremio%20logo.svg"],
  [22, "https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20do%20Sport%20Club%20Internacional.svg"],
  [6, "https://commons.wikimedia.org/wiki/Special:FilePath/Esporte%20Clube%20Bahia%20logo.svg"],
  [5, "https://commons.wikimedia.org/wiki/Special:FilePath/Esporte%20Clube%20Vitória%20(2024).svg"],
  [3, "https://commons.wikimedia.org/wiki/Special:FilePath/Clube%20Náutico%20Capibaribe.svg"],
  [4, "https://commons.wikimedia.org/wiki/Special:FilePath/Santa%20Cruz%20FC%20(01)%20-%20PE.svg"],
  [8, "https://commons.wikimedia.org/wiki/Special:FilePath/Ceará%20Sporting%20Club%20logo.svg"],
  [7, "https://commons.wikimedia.org/wiki/Special:FilePath/Fortaleza%20Esporte%20Clube%20logo.svg"],
  [30, "https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20do%20America%20Futebol%20Clube.svg"],
  [12, "https://commons.wikimedia.org/wiki/Special:FilePath/AmericaFC-RN.svg"],
  [11, "https://commons.wikimedia.org/wiki/Special:FilePath/ABC%20FC%20-%20RN.svg"],
  [38, "https://commons.wikimedia.org/wiki/Special:FilePath/Sampaio%20Corrêa%20FC.png"],
  [13, "https://commons.wikimedia.org/wiki/Special:FilePath/AD%20Confiança.svg"],
  [97, "https://commons.wikimedia.org/wiki/Special:FilePath/EscudoCSSergipe.svg"],
  [43, "https://commons.wikimedia.org/wiki/Special:FilePath/CSE%20logo.svg"],
  [131, "https://commons.wikimedia.org/wiki/Special:FilePath/SC%20Corinthians%20Alagoano.svg"],
  [45, "https://commons.wikimedia.org/wiki/Special:FilePath/EscudoAACoruripe.png"],
  [69, "https://commons.wikimedia.org/wiki/Special:FilePath/EscudoPenedense.svg"],
  [24, "https://commons.wikimedia.org/wiki/Special:FilePath/Athletico%20Paranaense%20(Logo%202019).svg"],
  [9, "https://commons.wikimedia.org/wiki/Special:FilePath/Botafogo%20Futebol%20Clube%20(PB).png"],
  [66, "https://commons.wikimedia.org/wiki/Special:FilePath/SDJuazeirense.png"],
  [121, "https://commons.wikimedia.org/wiki/Special:FilePath/ECJacuipense.png"],
  [162, "https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atlético%20Talleres.svg"],
  [163, "https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20de%20Estudiantes%20de%20Mérida.png"],
];

async function main() {
  const pool = createPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      ALTER TABLE opponents
      ADD COLUMN IF NOT EXISTS logo_url text
    `);

    let updated = 0;
    const rows = [];
    for (const [id, url] of UPDATES) {
      const res = await client.query(
        `UPDATE opponents
         SET logo_url = $1
         WHERE id = $2
         RETURNING id, name, state, country, logo_url`,
        [url, id],
      );
      if (res.rowCount === 1) {
        updated += 1;
        rows.push(res.rows[0]);
      } else {
        rows.push({ id, error: "not found" });
      }
    }

    const verify = await client.query(`
      SELECT count(*)::int AS with_logo
      FROM opponents
      WHERE logo_url IS NOT NULL AND logo_url <> ''
    `);

    const missing = UPDATES.filter(
      ([id]) => !rows.some((r) => r.id === id && r.logo_url),
    );

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          applied: true,
          columnEnsured: "logo_url",
          expectedUpdates: UPDATES.length,
          updated,
          withLogoTotal: verify.rows[0].with_logo,
          missing,
          rows: rows.map((r) => ({
            id: r.id,
            name: r.name,
            state: r.state,
            country: r.country,
            logo_url: r.logo_url,
          })),
        },
        null,
        2,
      ),
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
