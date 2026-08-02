/**
 * Apply CSA lineups found for Taça de Ouro / Taça de Prata from public sources.
 * Sources: futebol80 csaft.htm, jogosdoguarani, verdazzo, acervosantista, galopedia.
 *
 * Usage: node scripts/apply-taca-lineups-found.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
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

/** Forced IDs for ambiguous names (prefer existing Taça finals / known eras). */
const FORCE_ID = {
  // GK era 80s (same as Londrina finals)
  "ze luis": 1689,
  "ze luiz": 1689,
  // GK 1983 Prata finals (Adeíldo)
  adeildo: 647,
  // 1985 CF Luizão
  luisao: 968,
  luizao: 968,
  // 1974/75 GK Dida
  dida: 782,
  // Ferretti 1975
  ferreti: 842,
  ferretti: 842,
  tuca: 1139,
  // Ditinho 1986
  ditinho: 789,
  "ditinho souza": 789,
  // Ademir Pereira explicit
  "ademir pereira": 652,
  // Washington LE 1986
  washington: 1162,
  // Paulo César zagueiro 1986 — prefer Domingues (common in era sheets)
  "paulo cesar": 1064,
  // Carlinhos ≈ Marechal when alone in 1985/86 back line
  carlinhos: 546,
  // Soareste classic
  soareste: 537,
  // Manoelzinho meia/ponta 1974
  manoelzinho: 981,
  // Rômel
  romel: 495,
  rommel: 495,
};

const FORCE_MANAGER = {
  "walmir louruz": 39,
  "valmir louruz": 39,
  "alberto menezes": null, // create if needed
};

/** @type {object[]} */
const FOUND = [
  // ——— 1974 ———
  {
    date: "1974-03-20",
    opp: "Atlético-MG",
    ha: "home",
    season: "1974",
    manager: "Hélio Miranda",
    starters: [
      "Zé Galego",
      "Gato Preto",
      "Pires",
      "Zé Preta",
      "Verghetti",
      "Zé Leite",
      "Soareste",
      "Manoelzinho",
      "Batoré",
      "Misso",
      "Otávio",
    ],
    subs: [{ out: "Otávio", in: "Giraldo" }],
    source: "galopedia 1974-03-20",
  },
  {
    date: "1974-04-06",
    opp: "Guarani-SP",
    ha: "home",
    season: "1974",
    manager: "Hélio Miranda",
    starters: [
      "Zé Galego",
      "Gato Preto",
      "Isauro",
      "Zé Preta",
      "Jaiminho",
      "Pires",
      "Soareste",
      "Manoelzinho",
      "Jorge Nunes",
      "Misso",
      "Ademir",
    ],
    subs: [
      { out: "Pires", in: "Zé Leite" },
      { out: "Ademir", in: "Ricardo" },
    ],
    source: "jogosdoguarani 1974/1874",
  },
  {
    date: "1974-05-04",
    opp: "Palmeiras-SP",
    ha: "home",
    season: "1974",
    manager: "Laerte Dória",
    starters: [
      "Zé Galego",
      "Gato Preto",
      "Isauro",
      "Zé Preta",
      "Jaiminho",
      "Zé Leite",
      "Soareste",
      "Manoelzinho",
      "Giraldo",
      "Ricardo",
      "Dudu",
    ],
    entered: ["Jorge Nunes", "Ademir"],
    source: "verdazzo 1974-05-04",
  },
  {
    date: "1974-05-22",
    opp: "Santos-SP",
    ha: "away",
    season: "1974",
    manager: "Laerte Dória",
    starters: [
      "Dida",
      "Mendes",
      "Pires",
      "Zé Preta",
      "Jaiminho",
      "Lulinha",
      "Jorge Nunes",
      "Jorge Siri",
      "Misso",
      "Giraldo",
      "Ademir",
    ],
    subs: [
      { out: "Jorge Nunes", in: "Manoelzinho" },
      { out: "Giraldo", in: "Soareste" },
    ],
    source: "acervosantista 1974-05-22",
  },

  // ——— 1975 ———
  {
    date: "1975-09-06",
    opp: "Santos-SP",
    ha: "away",
    season: "1975",
    manager: "Laerte Dória",
    starters: [
      "Dida",
      "Natal",
      "Geraldo",
      "Zé Preta",
      "Rogério",
      "Roberto Menezes",
      "Tuca",
      "Ênio",
      "Ferreti",
      "Soareste",
      "Torino",
    ],
    subs: [
      { out: "Natal", in: "Ricardo" },
      { out: "Tuca", in: "Hélio" },
    ],
    source: "acervosantista 1975-09-06",
  },

  // ——— 1978 ———
  {
    date: "1978-04-06",
    opp: "Guarani-SP",
    ha: "away",
    season: "1978",
    manager: "Esquerdinha",
    starters: [
      "Cícero",
      "Olímpio",
      "Gílson",
      "Mauro",
      "César",
      "Alberto",
      "Soareste",
      "Luís Carlos",
      "Ênio",
      "Joãozinho Paulista",
      "Reginaldo",
    ],
    subs: [
      { out: "Gílson", in: "Pires" },
      { out: "Reginaldo", in: "Ricardo" },
    ],
    source: "jogosdoguarani 1978/1078",
  },

  // ——— 1979 ———
  {
    date: "1979-11-25",
    opp: "Cruzeiro-MG",
    ha: "home",
    season: "1979",
    manager: "Laerte Dória",
    starters: [
      "Rafael",
      "Evaristo",
      "Zé Luiz",
      "Beto",
      "Luisinho",
      "Alex",
      "Alberto Carioca",
      "Luiz Carlos",
      "Jorge Siri",
      "Aílton",
      "Odilon",
    ],
    forceGk: false, // Rafael is GK; Zé Luiz here is Zagueiro #1748 style — do NOT force 1689
    startersForce: { "Zé Luiz": 1748 },
    subs: [
      { out: "Aílton", in: "Almir" },
      { out: "Odilon", in: "Gilmar" },
    ],
    source: "futebol80 csaft.htm",
  },

  // ——— 1981 ———
  {
    date: "1981-01-18",
    opp: "Atlético-MG",
    ha: "away",
    season: "1981",
    manager: "Alberto Menezes",
    starters: [
      "Zé Luiz",
      "Antunes",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Vilmário",
      "Rômel",
      "Jacozinho",
      "Dentinho",
      "Nílson",
    ],
    subs: [
      { out: "Ronaldo Alves", in: "Luiz Carlos" },
      { out: "Nílson", in: "Jorge Siri" },
    ],
    source: "futebol80 / galopedia",
  },
  {
    date: "1981-01-21",
    opp: "Fluminense-RJ",
    ha: "home",
    season: "1981",
    manager: "Alberto Menezes",
    starters: [
      "Zé Luiz",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Luiz Carlos",
      "Rômel",
      "Jacozinho",
      "Zé Roberto",
      "Luís Paulo",
    ],
    subs: [
      { out: "Ronaldo Alves", in: "Vilmário" },
      { out: "Zé Roberto", in: "Adílton" },
    ],
    source: "futebol80 csaft.htm",
  },
  {
    date: "1981-01-25",
    opp: "River-PI",
    ha: "home",
    season: "1981",
    manager: "Tadeu Lima",
    starters: [
      "Iane",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Vilmário",
      "Rômel",
      "Jacozinho",
      "Adílton",
      "Luís Paulo",
    ],
    subs: [
      { out: "Vilmário", in: "Jorge Siri" },
      { out: "Adílton", in: "Dentinho" },
    ],
    source: "futebol80 csaft.htm",
  },
  {
    date: "1981-01-29",
    opp: "Campinense-PB",
    ha: "away",
    season: "1981",
    manager: "Valmir Louruz",
    starters: [
      "Iane",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Adílton",
      "Rômel",
      "Jacozinho",
      "Dentinho",
      "Luís Paulo",
    ],
    subs: [{ out: "Dentinho", in: "Luiz Carlos" }],
    source: "futebol80 csaft.htm",
  },
  {
    date: "1981-02-01",
    opp: "São Paulo-SP",
    ha: "home",
    season: "1981",
    manager: "Valmir Louruz",
    starters: [
      "Iane",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Remi",
      "Rômel",
      "Jacozinho",
      "Dentinho",
      "Luís Paulo",
    ],
    subs: [
      { out: "Remi", in: "Jorge Siri" },
      { out: "Luís Paulo", in: "Luiz Carlos" },
    ],
    source: "futebol80 csaft.htm",
  },
  {
    date: "1981-03-12",
    opp: "Galícia-BA",
    ha: "home",
    season: "1981",
    manager: "Valmir Louruz",
    starters: [
      "Zé Luiz",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Remi",
      "Adílton",
      "Rômel",
      "Jacozinho",
      "Dentinho",
      "Luís Paulo",
    ],
    subs: [
      { out: "Jacozinho", in: "Jorge Siri" },
      { out: "Dentinho", in: "Mauro" },
    ],
    source: "futebol80 csaft.htm",
  },
  {
    date: "1981-03-19",
    opp: "Vasco-RJ",
    ha: "away",
    season: "1981",
    manager: "Valmir Louruz",
    starters: [
      "Zé Luiz",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Remi",
      "Adílton",
      "Rômel",
      "Jorge Siri",
      "Dentinho",
      "Luís Paulo",
    ],
    subs: [
      { out: "Dick", in: "Ronaldo Alves" },
      { out: "Adílton", in: "Jacozinho" },
    ],
    source: "futebol80 csaft.htm",
  },
  {
    date: "1981-04-09",
    opp: "Botafogo-RJ",
    ha: "home",
    season: "1981",
    manager: "Valmir Louruz",
    starters: [
      "Zé Luiz",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Adílton",
      "Rômel",
      "Jorge Siri",
      "Mauro",
      "Luís Paulo",
    ],
    subs: [
      { out: "Zezinho", in: "Geraldo" },
      { out: "Mauro", in: "Zé Roberto" },
    ],
    source: "futebol80 csaft.htm",
  },
  {
    date: "1981-04-12",
    opp: "Botafogo-RJ",
    ha: "away",
    season: "1981",
    manager: "Valmir Louruz",
    starters: [
      "Zé Luiz",
      "Antunes",
      "Fernando",
      "Ronaldo Alves",
      "Geraldo",
      "Remi",
      "Adílton",
      "Rômel",
      "Jorge Luís",
      "Mauro",
      "Luís Paulo",
    ],
    subs: [
      { out: "Ronaldo Alves", in: "Vilmário" },
      { out: "Mauro", in: "Nílson" },
    ],
    source: "futebol80 csaft.htm",
  },

  // ——— 1983 Prata ———
  {
    date: "1983-04-03",
    opp: "Mixto-MT",
    ha: "home",
    season: "1983",
    manager: "China",
    starters: [
      "Adeíldo",
      "Humberto",
      "Café",
      "Dequinha",
      "Cícero Besouro",
      "Ademir Pereira",
      "Veiga",
      "Rômel",
      "Jorge Siri",
      "Josenílton",
      "Jacozinho",
    ],
    subs: [{ out: "Dequinha", in: "Eliberto" }],
    source: "futebol80 / RSSSF 03/04",
  },

  // ——— 1985 ———
  {
    date: "1985-04-03",
    opp: "Ceará-CE",
    ha: "home",
    season: "1985",
    manager: "Valdemar Carabina",
    starters: [
      "Zé Luiz",
      "Carlinhos Marechal",
      "Café",
      "Zezinho",
      "Agnaldo",
      "Veiga",
      "Josenílton",
      "Zé Carlos",
      "Miguelzinho",
      "Luizão",
      "Jacozinho",
    ],
    subs: [
      { out: "Miguelzinho", in: "João Neto" },
      { out: "Jacozinho", in: "Frank" },
    ],
    source: "futebol80 csaft.htm",
  },
  {
    date: "1985-07-03",
    opp: "Guarani-SP",
    ha: "home",
    season: "1985",
    manager: "Fidélis",
    starters: [
      "Zé Luiz",
      "Carlos Alberto Rocha",
      "Café",
      "Josival",
      "Zezinho",
      "Veiga",
      "Zé Carlos",
      "Josenílton",
      "Miguelzinho",
      "Luizão",
      "Jacozinho",
    ],
    subs: [
      { out: "Zé Carlos", in: "Frank" },
      { out: "Josenílton", in: "Cidão" },
    ],
    source: "jogosdoguarani 1985/3585",
  },
  {
    date: "1985-07-10",
    opp: "Atlético-MG",
    ha: "away",
    season: "1985",
    manager: "Fidélis",
    starters: [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Josival",
      "Zé Carlos",
      "Veiga",
      "Zé Carlos Baiano",
      "Josenílton",
      "Miguelzinho",
      "Luizão",
      "Jacozinho",
    ],
    // Zé Carlos as LE that day — do not remap other names via FORCE except GK
    forceOnlyGk: true,
    subs: [
      { out: "Zé Carlos Baiano", in: "Dóia" },
      { out: "Miguelzinho", in: "Frank" },
    ],
    source: "galopedia 1985-07-10 Mineirão",
  },
  {
    date: "1985-07-17",
    opp: "Atlético-MG",
    ha: "home",
    season: "1985",
    manager: "Fidélis",
    starters: [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Josival",
      "Zezinho",
      "Veiga",
      "Josenílton",
      "Toninho Vanuza",
      "Frank",
      "Luizão",
      "Jacozinho",
    ],
    subs: [
      { out: "Josenílton", in: "Dóia" },
      { out: "Jacozinho", in: "Zé Carlos Baiano" },
    ],
    source: "galopedia 1985-07-17",
  },
  {
    date: "1985-07-21",
    opp: "Guarani-SP",
    ha: "away",
    season: "1985",
    manager: "Fidélis",
    starters: [
      "Zé Luiz",
      "Carlos Alberto Rocha",
      "Café",
      "Josival",
      "Zezinho",
      "Veiga",
      "Zé Carlos",
      "Josenílton",
      "Cidão",
      "Dóia",
      "Luizão",
    ],
    subs: [
      { out: "Josival", in: "Batista" },
      { out: "Dóia", in: "Frank" },
    ],
    source: "jogosdoguarani 1985/4085",
  },

  // ——— 1986 ———
  {
    date: "1986-09-07",
    opp: "Atlético-MG",
    ha: "home",
    season: "1986",
    manager: "Valmir Louruz",
    starters: [
      "Zico",
      "Carlinhos",
      "Paulo César",
      "Marcelo",
      "Washington",
      "Luís Fernando",
      "Coca",
      "André",
      "Mário Tilico",
      "Hélio",
      "Nívio",
    ],
    subs: [
      { out: "Luís Fernando", in: "Carlinhos Paulista" },
      { out: "Hélio", in: "Borges" },
    ],
    source: "galopedia 1986-09-07",
  },
  {
    date: "1986-10-05",
    opp: "Palmeiras-SP",
    ha: "home",
    season: "1986",
    manager: "Valmir Louruz",
    starters: [
      "Zico",
      "Luís Cláudio",
      "Paulo César",
      "Marcelo",
      "Washington",
      "Coca",
      "André",
      "Luís Fernando",
      "Nívio",
      "Carlinhos Paulista",
      "Ditinho",
    ],
    subs: [
      { out: "Luís Fernando", in: "Helinho" },
      { out: "Nívio", in: "Carlinhos Marechal" },
    ],
    source: "futebol80 csaft.htm",
  },
];

async function ensurePlayer(name, opts = {}) {
  if (opts.forceId) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [opts.forceId]);
    if (rows[0]) return rows[0];
  }
  const n = norm(name);
  const isGkAlias = n === "ze luis" || n === "ze luiz";
  const allowForce =
    !opts.skipForce &&
    (!opts.forceOnlyGk || isGkAlias) &&
    FORCE_ID[n];
  if (allowForce) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [FORCE_ID[n]]);
    if (rows[0]) return rows[0];
  }
  // exact
  let { rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  // accent-insensitive exact
  const all = await client.query(`SELECT id, name, position FROM players`);
  const hit = all.rows.find((p) => norm(p.name) === n);
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO players (name, nationality, nationality_flag, verification_status)
     VALUES ($1,'Brasil','🇧🇷','unverified') RETURNING id, name`,
    [name],
  );
  console.log("PLAYER_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  if (!name) return null;
  const n = norm(name);
  if (FORCE_MANAGER[n]) {
    const { rows } = await client.query(`SELECT id, name FROM managers WHERE id=$1`, [
      FORCE_MANAGER[n],
    ]);
    if (rows[0]) return rows[0];
  }
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const all = await client.query(`SELECT id, name FROM managers`);
  const hit = all.rows.find((m) => norm(m.name) === n);
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO managers (name, nationality, verification_status)
     VALUES ($1,'Brasil','unverified') RETURNING id, name`,
    [name],
  );
  console.log("MANAGER_CREATED", ins.rows[0]);
  return ins.rows[0];
}

try {
  if (!DRY) await client.query("BEGIN");

  let applied = 0;
  let skippedHas = 0;
  let missingMatch = 0;

  for (const f of FOUND) {
    const { rows: matches } = await client.query(
      `
      SELECT m.id,
             (SELECT count(*)::int FROM match_lineups ml WHERE ml.match_id=m.id AND ml.side='csa') AS n
      FROM matches m
      JOIN competitions c ON c.id=m.competition_id
      JOIN opponents o ON o.id=m.opponent_id
      WHERE m.season::text=$1
        AND m.match_date::date=$2::date
        AND m.home_away=$3
        AND c.name IN ('Taça de Ouro','Taça de Prata')
        AND (
          o.name=$4
          OR lower(o.name) LIKE '%' || lower(split_part($4,'-',1)) || '%'
        )
      LIMIT 1
      `,
      [f.season, f.date, f.ha, f.opp],
    );
    if (!matches[0]) {
      console.log("NO_MATCH", f.date, f.opp, f.source);
      missingMatch += 1;
      continue;
    }
    if (matches[0].n > 0) {
      console.log("SKIP_HAS_LINEUP", matches[0].id, f.date, f.opp);
      skippedHas += 1;
      continue;
    }

    const matchId = matches[0].id;
    console.log("APPLY", matchId, f.date, f.opp, "←", f.source);

    if (!DRY) {
      const mgr = await ensureManager(f.manager);
      if (mgr) {
        await client.query(`UPDATE matches SET manager_id=coalesce(manager_id,$2) WHERE id=$1`, [
          matchId,
          mgr.id,
        ]);
      }

      const lineup = new Map();
      let sort = 0;
      for (const n of f.starters) {
        const forceId = f.startersForce?.[n];
        const skipForce =
          f.forceGk === false && (norm(n) === "ze luis" || norm(n) === "ze luiz");
        const p = await ensurePlayer(n, {
          forceId,
          skipForce,
          forceOnlyGk: f.forceOnlyGk,
        });
        if (lineup.has(p.id)) continue;
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id,side,player_id,player_name,role,shirt_number,position,sort_order)
           VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
          [matchId, p.id, p.name, sort++],
        );
        lineup.set(p.id, rows[0].id);
      }
      for (const n of f.entered ?? []) {
        const p = await ensurePlayer(n, { forceOnlyGk: f.forceOnlyGk });
        if (lineup.has(p.id)) continue;
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id,side,player_id,player_name,role,shirt_number,position,sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [matchId, p.id, p.name, sort++],
        );
        lineup.set(p.id, rows[0].id);
      }
      for (const s of f.subs ?? []) {
        const outP = await ensurePlayer(s.out, {
          forceId: f.startersForce?.[s.out],
          skipForce: f.forceGk === false,
          forceOnlyGk: f.forceOnlyGk,
        });
        const inP = await ensurePlayer(s.in, { forceOnlyGk: f.forceOnlyGk });
        if (!lineup.has(inP.id)) {
          const { rows } = await client.query(
            `INSERT INTO match_lineups
               (match_id,side,player_id,player_name,role,shirt_number,position,sort_order)
             VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
            [matchId, inP.id, inP.name, sort++],
          );
          lineup.set(inP.id, rows[0].id);
        }
        await client.query(
          `INSERT INTO match_substitutions
             (match_id,side,player_out_lineup_id,player_out_id,player_out_name,
              player_in_lineup_id,player_in_id,player_in_name,minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,0)`,
          [
            matchId,
            lineup.get(outP.id) ?? null,
            outP.id,
            outP.name,
            lineup.get(inP.id) ?? null,
            inP.id,
            inP.name,
          ],
        );
      }
    }
    applied += 1;
  }

  if (DRY) console.log("DRY RUN");
  else await client.query("COMMIT");

  console.log({ applied, skippedHas, missingMatch, foundCatalog: FOUND.length });
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
