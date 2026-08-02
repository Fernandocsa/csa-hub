/**
 * Fill stadium_id for 2025–2026 away matches that were missing venues.
 * Sources: CBF, GE, Gazeta, Placar de Futebol, club sites (confirmed per match).
 * Skips #1256 Igaci (W.O. — jogo não disputado).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function ensureStadium({ name, city, state }) {
  const { rows } = await client.query(
    `SELECT id, name, city FROM stadiums WHERE lower(name)=lower($1) LIMIT 1`,
    [name],
  );
  if (rows[0]) return rows[0];

  const all = await client.query(`SELECT id, name, city FROM stadiums`);
  const hit = all.rows.find((s) => norm(s.name) === norm(name));
  if (hit) return hit;

  // soft unique contains
  const soft = all.rows.filter(
    (s) =>
      norm(s.name).includes(norm(name).slice(0, 14)) ||
      norm(name).includes(norm(s.name).slice(0, 14)),
  );
  if (soft.length === 1) return soft[0];

  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country)
     VALUES ($1,$2,$3,'Brasil') RETURNING id, name, city`,
    [name, city ?? null, state ?? null],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
}

/** match_id -> stadium name (or {name,city,state} for create) */
const UPDATES = [
  // 2025 Alagoano / Copa Alagoas / regionais
  // 1256 Igaci W.O. — skip
  { id: 1327, stadium: "Estádio Gerson Amaral" }, // Coruripe Copa Alagoas
  { id: 1258, stadium: "Estádio Rei Pelé (Trapichão)" }, // CRB
  { id: 1259, stadium: "Estádio Gerson Amaral" }, // Coruripe Alagoano
  { id: 1267, stadium: "Estádio Presidente Vargas" }, // Ceará Nordestão
  { id: 1261, stadium: "Estádio Alfredo Leahy" }, // Penedense
  {
    id: 1329,
    stadium: {
      name: "Estádio Manoel Ferreira de Amorim (Ferreirão)",
      city: "São Miguel dos Campos",
      state: "AL",
    },
  }, // Dimensão Saúde
  { id: 1262, stadium: "Coaracy da Mata (Fumeirão)" }, // ASA SF Ida
  {
    id: 1275,
    stadium: {
      name: "Estádio Elcyr Resende de Mendonça",
      city: "Saquarema",
      state: "RJ",
    },
  }, // Boavista CdB
  { id: 1331, stadium: "José Gomes (Murici)" }, // Murici Copa Alagoas
  { id: 1270, stadium: "Estádio Adauto Moraes" }, // Juazeirense Nordestão
  { id: 1265, stadium: "Estádio Juca Sampaio" }, // CSE 3º lugar

  // 2025 Série C / CdB / Nordestão
  { id: 1282, stadium: "Frasqueirão" }, // ABC
  { id: 1284, stadium: "Colosso da Lagoa" }, // Ypiranga
  { id: 1286, stadium: "Estádio Antônio de Almeida" }, // Tombense
  { id: 1278, stadium: "Arena do Grêmio" }, // Grêmio CdB
  { id: 1288, stadium: "Estádio 1º de Maio" }, // São Bernardo
  {
    id: 1272,
    stadium: {
      name: "Arena das Dunas",
      city: "Natal",
      state: "RN",
    },
  }, // América-RN Nordestão
  { id: 1290, stadium: "Estádio Brinco de Ouro" }, // Guarani
  { id: 1292, stadium: "Arena de Pernambuco" }, // Retrô
  { id: 1294, stadium: "Estádio do Café" }, // Londrina
  { id: 1280, stadium: "São Januário" }, // Vasco CdB
  { id: 1296, stadium: "Estádio Etelvino Mendonça" }, // Itabaiana
  { id: 1299, stadium: "Estádio Augusto Bauer" }, // Brusque

  // 2026
  {
    id: 1315,
    stadium: {
      name: "Arena Joinville",
      city: "Joinville",
      state: "SC",
    },
  }, // Joinville CdB
  {
    id: 1312,
    stadium: {
      name: "Estádio Manoel Ferreira de Amorim (Ferreirão)",
      city: "São Miguel dos Campos",
      state: "AL",
    },
  }, // CRB Copa Alagoas (Ferreirão)
  { id: 1314, stadium: "Coaracy da Mata (Fumeirão)" }, // ASA Copa Alagoas Final
  {
    id: 1317,
    stadium: {
      name: "Arena Cajueiro",
      city: "Feira de Santana",
      state: "BA",
    },
  }, // Jacuipense Série D
  { id: 1318, stadium: "Coaracy da Mata (Fumeirão)" }, // ASA Série D
  { id: 1321, stadium: "Estádio Adauto Moraes" }, // Juazeirense Série D
  { id: 1322, stadium: "Estádio Juca Sampaio" }, // CSE Série D
  {
    id: 1325,
    stadium: {
      name: "Estádio Waldomiro Borges (Waldomirão)",
      city: "Jequié",
      state: "BA",
    },
  }, // Atlético-BA (mandou em Jequié)
  { id: 1326, stadium: "Estádio Paulo Barreto" }, // Lagarto
  { id: 1335, stadium: "Arena Independência" }, // Betim (Independência)
];

try {
  await client.query("BEGIN");

  const applied = [];
  for (const u of UPDATES) {
    const stadiumSpec =
      typeof u.stadium === "string" ? { name: u.stadium } : u.stadium;
    const st = await ensureStadium(stadiumSpec);

    const { rows } = await client.query(
      `UPDATE matches SET stadium_id=$2
       WHERE id=$1 AND stadium_id IS NULL
       RETURNING id, stadium_id`,
      [u.id, st.id],
    );
    if (rows[0]) {
      applied.push({ id: u.id, stadium_id: st.id, stadium: st.name });
      console.log(`#${u.id} -> ${st.id} ${st.name}`);
    } else {
      const cur = await client.query(
        `SELECT m.id, m.stadium_id, s.name
         FROM matches m LEFT JOIN stadiums s ON s.id=m.stadium_id
         WHERE m.id=$1`,
        [u.id],
      );
      console.log(`SKIP #${u.id}`, cur.rows[0]);
    }
  }

  await client.query("COMMIT");

  const still = await client.query(`
    SELECT m.id, m.match_date::date AS date, o.name AS opponent
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    WHERE m.match_date >= '2025-01-01' AND m.match_date < '2027-01-01'
      AND m.stadium_id IS NULL
    ORDER BY m.match_date
  `);
  console.log("\nStill missing:", still.rows.length);
  for (const r of still.rows) {
    console.log(`  #${r.id} ${r.date} vs ${r.opponent}`);
  }
  console.log(JSON.stringify({ ok: true, applied: applied.length }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
