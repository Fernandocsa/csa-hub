/**
 * Apply 2024 match metadata from user CSV:
 * phase/round, attendance, attendance_paid, gross_revenue, stadium, related legs.
 * Matches existing season=2024 rows by date (unique). Does not invent scores/lineups.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const DRY = process.argv.includes("--dry");

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseBrDate(d) {
  const [dd, mm, yyyy] = d.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

function parseMoney(s) {
  if (s == null || String(s).trim() === "") return null;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function parseIntOrNull(s) {
  if (s == null || String(s).trim() === "") return null;
  if (/PORTOES_FECHADOS/i.test(String(s))) return null;
  const n = parseInt(String(s), 10);
  return Number.isFinite(n) ? n : null;
}

/** Split CSV fase_rodada into phase + round (portal conventions). */
function parseFaseRodada(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return { phase: null, round: null };

  let m = s.match(/^(Semifinal|Final)\s+(Ida|Volta)$/i);
  if (m) {
    const phase = /^semi/i.test(m[1]) ? "Semifinal" : "Final";
    const round = /^ida$/i.test(m[2]) ? "Ida" : "Volta";
    return { phase, round };
  }

  m = s.match(/^Jogo de (Ida|Volta)$/i);
  if (m) {
    return { phase: null, round: /^ida$/i.test(m[1]) ? "Ida" : "Volta" };
  }

  m = s.match(/^Pré-Copa\s+(.+)$/i);
  if (m) return { phase: "Pré-Copa", round: m[1].trim() };

  m = s.match(/^(\d+ª\s+Fase)\s+(\d+ª\s+Rodada)$/i);
  if (m) {
    return {
      phase: m[1].replace(/\s+/g, " "),
      round: m[2].replace(/Rodada/i, "rodada").replace(/\s+/g, " "),
    };
  }

  m = s.match(/^(\d+ª)\s*Rodada$/i);
  if (m) return { phase: null, round: `${m[1]} rodada` };

  return { phase: s, round: null };
}

/** Stadium short name from CSV → preferred DB name (+ city/state to create if missing). */
const STADIUM_MAP = {
  "rei pele": {
    prefer: ["rei pele", "trapichao"],
    create: { name: "Estádio Rei Pelé (Trapichão)", city: "Maceió", state: "AL" },
  },
  "coaracy da mata fonseca": {
    prefer: ["coaracy"],
    create: { name: "Coaracy da Mata (Fumeirão)", city: "Arapiraca", state: "AL" },
  },
  "jose gomes da costa": {
    prefer: ["jose gomes", "gomes da costa", "murici"],
    create: { name: "José Gomes (Murici)", city: "Murici", state: "AL" },
  },
  "juca sampaio": {
    prefer: ["juca sampaio"],
    create: { name: "Estádio Juca Sampaio", city: "Palmeira dos Índios", state: "AL" },
  },
  "gerson amaral": {
    prefer: ["gerson amaral"],
    create: { name: "Estádio Gerson Amaral", city: "Coruripe", state: "AL" },
  },
  "alfredo leahy": {
    prefer: ["alfredo leahy"],
    create: { name: "Estádio Alfredo Leahy", city: "Penedo", state: "AL" },
  },
  "colosso da lagoa": {
    prefer: ["colosso"],
    create: { name: "Colosso da Lagoa", city: "Erechim", state: "RS" },
  },
  "do cafe": {
    prefer: ["do cafe", "estadio do cafe", "cafe"],
    create: { name: "Estádio do Café", city: "Londrina", state: "PR" },
  },
  "1 de maio": {
    prefer: ["1o de maio", "1 de maio", "primeiro de maio"],
    create: { name: "Estádio 1º de Maio", city: "São Bernardo do Campo", state: "SP" },
  },
  "1o de maio": {
    prefer: ["1o de maio", "1 de maio", "primeiro de maio"],
    create: { name: "Estádio 1º de Maio", city: "São Bernardo do Campo", state: "SP" },
  },
  "raulino de oliveira": {
    prefer: ["raulino"],
    create: { name: "Estádio Raulino de Oliveira", city: "Volta Redonda", state: "RJ" },
  },
  "lourival batista": {
    prefer: ["lourival batista", "batistao"],
    create: { name: "Estádio Lourival Baptista", city: "Aracaju", state: "SE" },
  },
  "frasqueirao": {
    prefer: ["frasqueirao"],
    create: { name: "Frasqueirão", city: "Natal", state: "RN" },
  },
  "mangueirao": {
    prefer: ["mangueirao"],
    create: { name: "Mangueirão", city: "Belém", state: "PA" },
  },
  "presidente vargas": {
    prefer: ["presidente vargas"],
    create: { name: "Estádio Presidente Vargas", city: "Fortaleza", state: "CE" },
  },
  "antonio de almeida": {
    prefer: ["antonio de almeida", "almeida tombos"],
    create: { name: "Estádio Antônio de Almeida", city: "Tombos", state: "MG" },
  },
  "annibal batista de toledo": {
    prefer: ["annibal", "anibal batista"],
    create: {
      name: "Estádio Annibal Batista de Toledo",
      city: "Aparecida de Goiânia",
      state: "GO",
    },
  },
};

// CSV rows (header omitted). Source: user paste 2024.
const CSV = `
Copa do Nordeste,Pré-Copa 1ª Fase,06/01/2024,CSA,Iguatu-CE,1x1 (pen: CSA 3x4),Fábio Augusto Santos Sá Júnior-SE,Rei Pelé,Maceió-AL,8288,10453,131260.00
Campeonato Alagoano,1ª Rodada,21/01/2024,CSA,Coruripe,1x0,João Paulo dos Santos Nascimento-AL,Rei Pelé,Maceió-AL,3133,5279,61500.00
Campeonato Alagoano,2ª Rodada,24/01/2024,Cruzeiro de Arapiraca,CSA,0x2,Wiomar Santana de Oliveira-AL,Coaracy da Mata Fonseca,Arapiraca-AL,,,
Campeonato Alagoano,3ª Rodada,28/01/2024,CSA,CRB,1x3,Denis Ribeiro Serafim-AL,Rei Pelé,Maceió-AL,8148,10382,245340.00
Campeonato Alagoano,4ª Rodada,07/02/2024,ASA,CSA,2x0,Jonata de Souza Gouveia-AL,Coaracy da Mata Fonseca,Arapiraca-AL,,,
Campeonato Alagoano,5ª Rodada,17/02/2024,Murici,CSA,0x0,Denis Ribeiro Serafim-AL,José Gomes da Costa,Murici-AL,,,
Campeonato Alagoano,6ª Rodada,24/02/2024,CSA,Penedense,1x1,Márcio dos Santos Oliveira-AL,Rei Pelé,Maceió-AL,1868,3621,25170.00
Campeonato Alagoano,7ª Rodada,02/03/2024,CSE,CSA,3x2,Rodrigo José Pereira de Lima-PE,Juca Sampaio,Palmeira dos Índios-AL,,,
Copa Alagoas,1ª Fase 1ª Rodada,31/01/2024,Coruripe,CSA,0x2,José Ricardo Laranjeira-AL,Gerson Amaral,Coruripe-AL,,,
Copa Alagoas,2ª Rodada,04/02/2024,CSA,CSE,1x2,José Jaini Oliveira Bispo-AL,Rei Pelé,Maceió-AL,788,1002,10675.00
Copa Alagoas,3ª Rodada,14/02/2024,Penedense,CSA,2x1,José Ailton da Silva-AL,Alfredo Leahy,Penedo-AL,,,
Copa Alagoas,4ª Rodada,21/02/2024,CSA,Dimensão Saúde,6x0,Carlos Vitor Oliveira Alves-AL,Rei Pelé,Maceió-AL,19,156,190.00
Copa Alagoas,5ª Rodada,06/03/2024,CRB,CSA,0x1,Felype Wanderley Urubá-AL,José Gomes da Costa,Murici-AL,PORTOES_FECHADOS,PORTOES_FECHADOS,
Copa Alagoas,6ª Rodada,13/03/2024,CSA,Cruzeiro de Arapiraca,2x0,José Ailton da Silva-AL,Rei Pelé,Maceió-AL,102,1084,1020.00
Copa Alagoas,Semifinal Ida,23/03/2024,CSA,Murici,3x3,José Ricardo Laranjeira-AL,Rei Pelé,Maceió-AL,1837,2708,19270.00
Copa Alagoas,Semifinal Volta,26/03/2024,Murici,CSA,0x3,Márcio dos Santos Oliveira-AL,José Gomes da Costa,Murici-AL,,,
Copa Alagoas,Final Ida,31/03/2024,CSA,Penedense,1x1,Jonata de Souza Gouveia-AL,Rei Pelé,Maceió-AL,3835,5320,69110.00
Copa Alagoas,Final Volta,03/04/2024,Penedense,CSA,0x1,Denis da Silva Ribeiro Serafim-AL,Alfredo Leahy,Penedo-AL,,,
Seletiva Copa do Brasil 2025,Jogo de Ida,07/04/2024,CSE,CSA,0x2,Rafael Carlos Salgueiro-AL,Juca Sampaio,Palmeira dos Índios-AL,,,
Seletiva Copa do Brasil 2025,Jogo de Volta,11/04/2024,CSA,CSE,1x2,José Ricardo Laranjeira-AL,Rei Pelé,Maceió-AL,5383,6936,107820.00
Campeonato Brasileiro Série C,1ª Rodada,20/04/2024,Ypiranga-RS,CSA,3x1,Luiz Paulo de Moura Pinheiro-MT,Colosso da Lagoa,Erechim-RS,,,
Campeonato Brasileiro Série C,2ª Rodada,28/04/2024,CSA,Ferroviária-SP,1x1,Carlos Tadeu Ferreira de Castro-RJ,Rei Pelé,Maceió-AL,3573,4974,82080.00
Campeonato Brasileiro Série C,3ª Rodada,06/05/2024,Londrina-PR,CSA,2x2,Wagner Francisco Silva Souza-BA,do Café,Londrina-PR,,,
Campeonato Brasileiro Série C,4ª Rodada,12/05/2024,CSA,Athletic-MG,0x5,José Henrique de Azevedo Júnior-MA,Rei Pelé,Maceió-AL,3282,4979,49460.00
Campeonato Brasileiro Série C,5ª Rodada,18/05/2024,CSA,Sampaio Corrêa-MA,0x0,Luiz Augusto Silveira Tisne-SC,Rei Pelé,Maceió-AL,3282,4979,49460.00
Campeonato Brasileiro Série C,6ª Rodada,26/05/2024,São Bernardo-SP,CSA,2x0,Murilo Ugolini Klein-PR,1º de Maio,São Bernardo do Campo-SP,,,
Campeonato Brasileiro Série C,7ª Rodada,03/06/2024,Volta Redonda-RJ,CSA,2x1,Emerson Souza Silva-BA,Raulino de Oliveira,Volta Redonda-RJ,,,
Campeonato Brasileiro Série C,8ª Rodada,10/06/2024,CSA,São José-RS,1x1,Leonardo Willers Lorenzatto-MT,Rei Pelé,Maceió-AL,4110,5125,71630.00
Campeonato Brasileiro Série C,9ª Rodada,15/06/2024,CSA,Botafogo-PB,1x1,Roger Goulart-RS,Rei Pelé,Maceió-AL,2886,3774,48790.00
Campeonato Brasileiro Série C,10ª Rodada,27/06/2024,Confiança-SE,CSA,0x1,Rafael Martins Diniz-DF,Lourival Batista,Aracaju-SE,,,
Campeonato Brasileiro Série C,11ª Rodada,03/07/2024,CSA,Figueirense-SC,3x1,Tarcizo Pinheiro Caetano-RJ,Rei Pelé,Maceió-AL,8210,10957,146210.00
Campeonato Brasileiro Série C,12ª Rodada,06/07/2024,ABC-RN,CSA,0x2,Léo Simão Holanda-CE,Frasqueirão,Natal-RN,,,
Campeonato Brasileiro Série C,13ª Rodada,14/07/2024,CSA,Floresta-CE,1x2,Angleison Marcos Vieira Monteiro-RO,Rei Pelé,Maceió-AL,15000,17898,300840.00
Campeonato Brasileiro Série C,14ª Rodada,22/07/2024,Remo-PA,CSA,2x1,Júlio César Pfleger-SC,Mangueirão,Belém-PA,,,
Campeonato Brasileiro Série C,15ª Rodada,27/07/2024,Ferroviário-CE,CSA,1x1,Fabiano Monteiro dos Santos-SP,Presidente Vargas,Fortaleza-CE,,,
Campeonato Brasileiro Série C,16ª Rodada,04/08/2024,CSA,Náutico-PE,2x2,Alisson Sidnei Furtado-TO,Rei Pelé,Maceió-AL,5401,8064,112750.00
Campeonato Brasileiro Série C,17ª Rodada,11/08/2024,Tombense-MG,CSA,0x1,André Ricardo Martins-PR,Antônio de Almeida,Tombos-MG,,,
Campeonato Brasileiro Série C,18ª Rodada,18/08/2024,Aparecidense-GO,CSA,0x1,Dyorgines José Padovani de Andrade-ES,Annibal Batista de Toledo,Aparecida de Goiânia-GO,,,
Campeonato Brasileiro Série C,19ª Rodada,24/08/2024,CSA,Caxias-RS,2x1,Samuel dos Santos-AP,Rei Pelé,Maceió-AL,6142,7067,106140.00
`.trim();

function parseCsvLine(line) {
  // Simple CSV (no quoted commas in this dataset).
  const cols = line.split(",");
  if (cols.length < 12) throw new Error(`bad csv cols ${cols.length}: ${line}`);
  return {
    competicao: cols[0],
    faseRodada: cols[1],
    data: cols[2],
    mandante: cols[3],
    visitante: cols[4],
    placar: cols[5],
    arbitro: cols[6],
    estadio: cols[7],
    cidadeUf: cols[8],
    publicoPagante: cols[9],
    publicoPresente: cols[10],
    renda: cols[11],
  };
}

const rows = CSV.split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map(parseCsvLine)
  .map((r) => {
    const { phase, round } = parseFaseRodada(r.faseRodada);
    const date = parseBrDate(r.data);
    const csaHome = /^csa$/i.test(r.mandante.trim());
    return {
      ...r,
      date,
      phase,
      round,
      homeAway: csaHome ? "home" : "away",
      attendancePaid: parseIntOrNull(r.publicoPagante),
      attendance: parseIntOrNull(r.publicoPresente),
      grossRevenue: parseMoney(r.renda),
      gatesClosed: /PORTOES_FECHADOS/i.test(
        `${r.publicoPagante} ${r.publicoPresente}`,
      ),
      stadiumKey: norm(r.estadio),
    };
  });

async function resolveStadium(key) {
  const map = STADIUM_MAP[key];
  if (!map) {
    console.warn(`  ! stadium map missing for key="${key}"`);
    return null;
  }
  const all = await client.query(`SELECT id, name FROM stadiums`);
  for (const pref of map.prefer) {
    const hits = all.rows.filter((s) => norm(s.name).includes(pref));
    if (hits.length === 1) return hits[0].id;
    if (hits.length > 1) {
      // prefer exact-ish shortest
      hits.sort((a, b) => a.name.length - b.name.length);
      return hits[0].id;
    }
  }
  if (DRY) {
    console.log(`  would create stadium ${map.create.name}`);
    return null;
  }
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country)
     VALUES ($1, $2, $3, 'Brasil')
     RETURNING id`,
    [map.create.name, map.create.city, map.create.state],
  );
  console.log(`  + stadium #${ins.rows[0].id} ${map.create.name}`);
  return ins.rows[0].id;
}

try {
  await client.query("BEGIN");

  const existing = await client.query(`
    SELECT m.id, m.match_date::text AS d, m.home_away, o.name AS opp,
           m.attendance, m.attendance_paid, m.gross_revenue,
           m.phase, m.round, m.stadium_id, m.related_match_id
    FROM matches m
    JOIN opponents o ON o.id = m.opponent_id
    WHERE m.season = '2024' AND m.is_friendly = false
    ORDER BY m.match_date, m.id
  `);
  const byDate = new Map(existing.rows.map((r) => [r.d.slice(0, 10), r]));

  let updated = 0;
  let missing = 0;
  const updatedIds = [];

  for (const row of rows) {
    const match = byDate.get(row.date);
    if (!match) {
      console.warn(`MISSING match for ${row.date} ${row.mandante} x ${row.visitante}`);
      missing += 1;
      continue;
    }

    const stadiumId = row.stadiumKey
      ? await resolveStadium(row.stadiumKey)
      : null;

    const patch = {
      phase: row.phase,
      round: row.round,
      attendance: row.gatesClosed ? null : row.attendance,
      attendance_paid: row.gatesClosed ? null : row.attendancePaid,
      gross_revenue: row.grossRevenue,
      stadium_id: stadiumId ?? match.stadium_id,
    };

    const changes = [];
    if ((match.phase ?? null) !== (patch.phase ?? null)) {
      changes.push(`phase:${match.phase ?? "∅"}→${patch.phase ?? "∅"}`);
    }
    if ((match.round ?? null) !== (patch.round ?? null)) {
      changes.push(`round:${match.round ?? "∅"}→${patch.round ?? "∅"}`);
    }
    if ((match.attendance ?? null) !== (patch.attendance ?? null)) {
      changes.push(`att:${match.attendance ?? "∅"}→${patch.attendance ?? "∅"}`);
    }
    if ((match.attendance_paid ?? null) !== (patch.attendance_paid ?? null)) {
      changes.push(
        `paid:${match.attendance_paid ?? "∅"}→${patch.attendance_paid ?? "∅"}`,
      );
    }
    if ((match.gross_revenue ?? null) !== (patch.gross_revenue ?? null)) {
      changes.push(
        `renda:${match.gross_revenue ?? "∅"}→${patch.gross_revenue ?? "∅"}`,
      );
    }
    if ((match.stadium_id ?? null) !== (patch.stadium_id ?? null)) {
      changes.push(`stad:${match.stadium_id ?? "∅"}→${patch.stadium_id ?? "∅"}`);
    }

    if (changes.length === 0) {
      console.log(`= ${row.date} #${match.id} (no change)`);
      continue;
    }

    console.log(`* ${row.date} #${match.id} ${changes.join("; ")}`);
    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           phase = $2,
           round = $3,
           attendance = $4,
           attendance_paid = $5,
           gross_revenue = $6,
           stadium_id = $7
         WHERE id = $1`,
        [
          match.id,
          patch.phase,
          patch.round,
          patch.attendance,
          patch.attendance_paid,
          patch.gross_revenue,
          patch.stadium_id,
        ],
      );
    }
    updated += 1;
    updatedIds.push(match.id);
  }

  // Link two-legged ties
  const pairs = [
    ["2024-03-23", "2024-03-26"], // Copa Alagoas SF
    ["2024-03-31", "2024-04-03"], // Copa Alagoas Final
    ["2024-04-07", "2024-04-11"], // Seletiva CdB
  ];
  for (const [a, b] of pairs) {
    const ma = byDate.get(a);
    const mb = byDate.get(b);
    if (!ma || !mb) continue;
    if (ma.related_match_id === mb.id && mb.related_match_id === ma.id) {
      console.log(`= related already ${ma.id}↔${mb.id}`);
      continue;
    }
    console.log(`* related ${ma.id}↔${mb.id}`);
    if (!DRY) {
      await client.query(
        `UPDATE matches SET related_match_id = $2 WHERE id = $1`,
        [ma.id, mb.id],
      );
      await client.query(
        `UPDATE matches SET related_match_id = $2 WHERE id = $1`,
        [mb.id, ma.id],
      );
    }
  }

  if (DRY) {
    await client.query("ROLLBACK");
    console.log(`\nDRY RUN done. would update ${updated}, missing ${missing}`);
  } else {
    await client.query("COMMIT");
    console.log(`\nDONE. updated ${updated}, missing ${missing}`);
  }
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
  await pool.end();
}
