/**
 * Seed CSA historical presidents (2026 research batch).
 * Does not invent gap-filling interim presidents.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

/** @type {{ name: string; termStart: string | null; termEnd: string | null; notes: string | null }[]} */
const ROWS = [
  {
    name: "Fernando Collor",
    termStart: "1973-09-03",
    termEnd: null,
    notes:
      "Futuro presidente do Brasil (1990-1992). Assumiu aos 24 anos, por aclamação, após virar conselheiro do CSA em 07/08/1973. Promoveu amistoso festivo com Garrincha e Didi em campo. Mandato breve — data de término não localizada.",
  },
  {
    name: "Rafael Tenório",
    termStart: "2008-01-01",
    termEnd: null,
    notes:
      "Primeira de três passagens pela presidência do CSA. Início antes de julho/2008 (data exata não encontrada). Pediu licença de 3 meses em setembro/2008, com Abel Duarte assumindo interinamente. Fim desta passagem não localizado com precisão.",
  },
  {
    name: "Abel Duarte",
    termStart: "2008-09-21",
    termEnd: "2008-11-08",
    notes:
      "Vice-presidente-geral, assumiu interinamente durante licença de Rafael Tenório.",
  },
  {
    name: "Jorge Sexto",
    termStart: "2009-10-01",
    termEnd: "2013-12-31",
    notes:
      'Também referido como "Jorge VI". Dois mandatos consecutivos (out/2009–out/2011 e out/2011–fim de 2013). Subiu o CSA da 2ª divisão alagoana em 2010.',
  },
  {
    name: "José Jurandy Torres de Albuquerque",
    termStart: null,
    termEnd: "2014-03-01",
    notes:
      "Ativo já em março/2014; data de início do mandato não localizada. Renunciou em março/2014.",
  },
  {
    name: "Roberto Mendes",
    termStart: "2014-05-06",
    termEnd: "2015-06-01",
    notes:
      "Ídolo do clube — ex-jogador, ex-técnico e ex-diretor de futebol do CSA antes de virar presidente. Aclamado em 05/05/2014; posse oficial às 20h do dia seguinte (06/05). Eleito por aclamação, único candidato. Renúncia em junho/2015. (Já cadastrado como jogador #1101 — Roberto Tavares Mendes, nasc. 12/08/1938.)",
  },
  {
    name: "Rafael Tenório",
    termStart: "2015-01-01",
    termEnd: "2021-10-31",
    notes:
      "Segunda passagem. Conquistou a Série C em 2017 e o acesso à Série A do Brasileirão em 2019. Término aproximado (antes da posse de Omar Coelho em nov/2021).",
  },
  {
    name: "Omar Coelho",
    termStart: "2021-11-01",
    termEnd: "2022-12-01",
    notes:
      "Renúncia em dezembro/2022. Faleceu em 25/09/2023, aos 62 anos, tratando leucemia.",
  },
  {
    name: "Rafael Tenório",
    termStart: "2023-02-01",
    termEnd: "2024-03-14",
    notes:
      "Terceira e última passagem pela presidência do CSA. Eleito por aclamação em fevereiro/2023; renúncia em coletiva em 14/03/2024, véspera de completar 70 anos.",
  },
  {
    name: "Mirian Monte",
    termStart: "2024-03-14",
    termEnd: "2025-09-01",
    notes:
      "Conquistou a Copa Alagoas 2024. Neta de Benício Monte, presidente do CSA na década de 1950. Afastada pelo Conselho Deliberativo em 01/09/2025, dois dias após o rebaixamento à Série D.",
  },
  {
    name: "Clauwerney Ferreira",
    termStart: "2025-09-01",
    termEnd: "2025-12-02",
    notes:
      'Presidente do Conselho Deliberativo, assumiu interinamente após o afastamento de Mirian Monte. Também referido como "Ney Ferreira" em algumas fontes.',
  },
  {
    name: "Robson Rodas",
    termStart: "2025-12-02",
    termEnd: null,
    notes:
      "Era vice na chapa de Mirian Monte; deu continuidade ao mandato dela, sem eleição emergencial. Mandato previsto até 2027 (em aberto).",
  },
];

const { rows: existing } = await pool.query(`SELECT count(*)::int AS n FROM presidents`);
if (existing[0].n > 0) {
  console.log(`presidents já tem ${existing[0].n} registro(s). Abortando para não duplicar.`);
  await pool.end();
  process.exit(1);
}

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const r of ROWS) {
    const ins = await client.query(
      `INSERT INTO presidents (name, term_start, term_end, notes)
       VALUES ($1, $2::date, $3::date, $4)
       RETURNING id, name, term_start::text, term_end::text`,
      [r.name, r.termStart, r.termEnd, r.notes],
    );
    console.log("OK", ins.rows[0]);
  }
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}

const { rows } = await pool.query(`
  SELECT id, name, term_start::text AS start, term_end::text AS "end"
  FROM presidents
  ORDER BY term_start NULLS LAST, id
`);
console.log("\n=== presidents ===");
console.table(rows);
await pool.end();
