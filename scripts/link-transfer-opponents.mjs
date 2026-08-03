/**
 * Ensure transfer clubs map to opponents (create missing) and set opponent_id.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const __dirname = dirname(fileURLToPath(import.meta.url));
const alterSql = readFileSync(
  join(__dirname, "../lib/db/sql/alter-transfers-opponent-id.sql"),
  "utf8",
);
await pool.query(alterSql);

/** Existing opponent ids or create specs for missing clubs. */
const CLUB_MAP = [
  { club: "Altos", opponentId: 82 },
  { club: "Athletic-MG", opponentId: 72 },
  { club: "Boavista-RJ", opponentId: 63 },
  { club: "CSE", opponentId: 43 },
  { club: "Ferroviário", opponentId: 65 }, // Ferroviário-CE (Ciel)
  { club: "GE Brasil", opponentId: 103 }, // Brasil de Pelotas-RS
  { club: "Joinville", opponentId: 34 },
  { club: "Juazeirense", opponentId: 66 },
  { club: "São José-RS", opponentId: 73 },
  { club: "Sousa", opponentId: 107 },
  { club: "Treze", opponentId: 41 },
  { club: "Volta Redonda", opponentId: 71 },
];

/** Clubs that need a new opponent row. */
const CREATE = [
  {
    club: "Atlético Piauiense",
    name: "Atlético Piauiense-PI",
    city: "Teresina",
    state: "PI",
    country: "Brasil",
    logoUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Atlético%20Piauiense.png",
  },
  {
    club: "CA Votuporanguense",
    name: "Votuporanguense-SP",
    city: "Votuporanga",
    state: "SP",
    country: "Brasil",
    logoUrl: null,
  },
  {
    club: "Juventus Jaraguá",
    name: "Juventus Jaraguá-SC",
    city: "Jaraguá do Sul",
    state: "SC",
    country: "Brasil",
    logoUrl: null,
  },
  {
    club: "KF Trepça'89",
    name: "KF Trepça'89",
    city: "Mitrovica",
    state: null,
    country: "XKX",
    logoUrl: null,
  },
  {
    club: "Mamoré",
    name: "Mamoré-MG",
    city: "Patos de Minas",
    state: "MG",
    country: "Brasil",
    logoUrl: null,
  },
  {
    club: "Marília",
    name: "Marília-SP",
    city: "Marília",
    state: "SP",
    country: "Brasil",
    logoUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Marília_Atlético_Clube.png",
  },
  {
    club: "Rio Branco-ES",
    name: "Rio Branco-ES",
    city: "Vitória",
    state: "ES",
    country: "Brasil",
    logoUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Rio_Branco_AC.png",
  },
  {
    club: "Santo André",
    name: "Santo André-SP",
    city: "Santo André",
    state: "SP",
    country: "Brasil",
    logoUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Esporte_Clube_Santo_André.png",
  },
  {
    club: "XV de Jaú",
    name: "XV de Jaú-SP",
    city: "Jaú",
    state: "SP",
    country: "Brasil",
    logoUrl: null,
  },
];

const client = await pool.connect();
try {
  await client.query("BEGIN");

  /** @type {Map<string, number>} */
  const byClub = new Map(CLUB_MAP.map((m) => [m.club, m.opponentId]));

  for (const c of CREATE) {
    const existing = await client.query(
      `SELECT id FROM opponents WHERE lower(name) = lower($1) LIMIT 1`,
      [c.name],
    );
    let id;
    if (existing.rows[0]) {
      id = existing.rows[0].id;
      if (c.logoUrl) {
        await client.query(
          `UPDATE opponents SET logo_url = COALESCE(logo_url, $1) WHERE id = $2`,
          [c.logoUrl, id],
        );
      }
    } else {
      const ins = await client.query(
        `INSERT INTO opponents (name, city, state, country, logo_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [c.name, c.city, c.state, c.country, c.logoUrl],
      );
      id = ins.rows[0].id;
      console.log(`Created opponent #${id} ${c.name}`);
    }
    byClub.set(c.club, id);
  }

  for (const [club, opponentId] of byClub) {
    const r = await client.query(
      `UPDATE transfers
       SET opponent_id = $1
       WHERE club = $2 AND (opponent_id IS DISTINCT FROM $1)
       RETURNING id`,
      [opponentId, club],
    );
    console.log(`Linked "${club}" → opponent ${opponentId} (${r.rowCount} rows)`);
  }

  await client.query("COMMIT");

  const { rows } = await client.query(`
    SELECT t.club, t.opponent_id, o.name AS opponent_name,
           o.logo_url IS NOT NULL AS has_logo
    FROM transfers t
    LEFT JOIN opponents o ON o.id = t.opponent_id
    WHERE t.season = '2026'
    ORDER BY t.club
  `);
  console.log("\n=== links ===");
  console.table(rows);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
