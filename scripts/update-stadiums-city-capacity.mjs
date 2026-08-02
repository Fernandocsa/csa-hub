/**
 * Backfill city/state/country/capacity for all stadiums.
 * Sources: Wikipedia (pt), Transfermarkt, CBF/club pages, GE.
 *
 * Usage: node scripts/update-stadiums-city-capacity.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const DRY = process.argv.includes("--dry");
loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

/**
 * id -> { city?, state?, country?, capacity? }
 * Only fields present are updated (null capacity is allowed when explicitly set).
 */
const UPDATES = {
  // Already had capacity — fix UF/country + refresh capacity where better source exists
  1: { city: "Maceió", state: "AL", country: "Brasil", capacity: 19000 },
  2: { city: "Maceió", state: "AL", country: "Brasil", capacity: 5000 },
  4: { city: "Fortaleza", state: "CE", country: "Brasil", capacity: 63903 },
  5: { city: "Recife", state: "PE", country: "Brasil", capacity: 35000 },
  6: { city: "Recife", state: "PE", country: "Brasil", capacity: 22800 },
  7: { city: "Recife", state: "PE", country: "Brasil", capacity: 60000 },
  8: { city: "Salvador", state: "BA", country: "Brasil", capacity: 48000 },
  9: { city: "Salvador", state: "BA", country: "Brasil", capacity: 35000 },
  10: { city: "Fortaleza", state: "CE", country: "Brasil", capacity: 20000 },

  13: { city: "Viçosa", state: "AL", country: "Brasil", capacity: 10000 },
  15: { city: "Batalha", state: "AL", country: "Brasil", capacity: 4000 },
  16: {
    city: "Matriz de Camaragibe",
    state: "AL",
    country: "Brasil",
    capacity: 4000,
  },
  17: { city: "Capela", state: "AL", country: "Brasil", capacity: 5000 },
  19: {
    city: "Olho d'Água das Flores",
    state: "AL",
    country: "Brasil",
    capacity: 6000,
  },
  20: { city: "Murici", state: "AL", country: "Brasil", capacity: 3500 },
  21: {
    city: "Santana do Ipanema",
    state: "AL",
    country: "Brasil",
    capacity: 3000,
  },
  22: { city: "Arapiraca", state: "AL", country: "Brasil", capacity: 15000 },
  23: { city: "Maceió", state: "AL", country: "Brasil", capacity: 9500 },
  24: { city: "Maceió", state: "AL", country: "Brasil", capacity: 10000 },
  26: { city: "Piripiri", state: "PI", country: "Brasil", capacity: 8500 },
  29: { city: "Maceió", state: "AL", country: "Brasil", capacity: 5000 },
  30: { city: "Ijuí", state: "RS", country: "Brasil", capacity: 6000 },
  32: { city: "Uberlândia", state: "MG", country: "Brasil", capacity: 53000 },
  33: { city: "Maceió", state: "AL", country: "Brasil", capacity: 4000 },
  34: {
    city: "Palmeira dos Índios",
    state: "AL",
    country: "Brasil",
    capacity: 7000,
  },
  35: { city: "Recife", state: "PE", country: "Brasil", capacity: 22800 },
  36: { city: "Catu", state: "BA", country: "Brasil", capacity: 8000 },
  37: { city: "Coruripe", state: "AL", country: "Brasil", capacity: 7000 },
  38: { city: "Maceió", state: "AL", country: "Brasil", capacity: 10000 },
  39: { city: "Penedo", state: "AL", country: "Brasil", capacity: 6000 },
  40: { city: "Pão de Açúcar", state: "AL", country: "Brasil", capacity: 4000 },
  41: { city: "Maceió", state: "AL", country: "Brasil", capacity: 4000 },
  42: { city: "Pão de Açúcar", state: "AL", country: "Brasil", capacity: 4000 },
  43: { city: "Belém", state: "PA", country: "Brasil", capacity: 12000 },
  44: {
    city: "Rio de Janeiro",
    state: "RJ",
    country: "Brasil",
    capacity: 24584,
  },
  45: { city: "Picos", state: "PI", country: "Brasil", capacity: 5000 },
  46: { city: "Natal", state: "RN", country: "Brasil", capacity: 35000 },
  47: {
    city: "Campina Grande",
    state: "PB",
    country: "Brasil",
    capacity: 20000,
  },
  48: { city: "Caruaru", state: "PE", country: "Brasil", capacity: 19800 },
  49: { city: "São Sebastião", state: "AL", country: "Brasil", capacity: 4000 },
  50: { city: "Erechim", state: "RS", country: "Brasil", capacity: 22000 },
  51: { city: "Londrina", state: "PR", country: "Brasil", capacity: 31019 },
  52: {
    city: "São Bernardo do Campo",
    state: "SP",
    country: "Brasil",
    capacity: 15159,
  },
  53: {
    city: "Volta Redonda",
    state: "RJ",
    country: "Brasil",
    capacity: 20255,
  },
  54: { city: "Aracaju", state: "SE", country: "Brasil", capacity: 15575 },
  55: { city: "Natal", state: "RN", country: "Brasil", capacity: 15000 },
  56: { city: "Belém", state: "PA", country: "Brasil", capacity: 45007 },
  57: { city: "Tombos", state: "MG", country: "Brasil", capacity: 7000 },
  58: {
    city: "Aparecida de Goiânia",
    state: "GO",
    country: "Brasil",
    capacity: 8000,
  },
  60: {
    city: "União dos Palmares",
    state: "AL",
    country: "Brasil",
    capacity: 4000,
  },
  61: { city: "Teresina", state: "PI", country: "Brasil", capacity: 8000 },
  62: { city: "São Luís", state: "MA", country: "Brasil", capacity: 40013 },
  63: { city: "Alagoinhas", state: "BA", country: "Brasil", capacity: 16000 },
  64: { city: "Belém", state: "PA", country: "Brasil", capacity: 6600 },
  65: {
    city: "Porto Alegre",
    state: "RS",
    country: "Brasil",
    capacity: 50815,
  },
  66: { city: "Ponta Grossa", state: "PR", country: "Brasil", capacity: 10632 },
  67: {
    city: "Florianópolis",
    state: "SC",
    country: "Brasil",
    capacity: 19584,
  },
  68: { city: "Belém", state: "PA", country: "Brasil", capacity: 16200 },
  69: { city: "Manaus", state: "AM", country: "Brasil", capacity: 15000 },
  70: { city: "Sousa", state: "PB", country: "Brasil", capacity: 10000 },
  71: {
    city: "Belo Horizonte",
    state: "MG",
    country: "Brasil",
    capacity: 23018,
  },
  72: { city: "Itu", state: "SP", country: "Brasil", capacity: 16000 },
  73: { city: "Brusque", state: "SC", country: "Brasil", capacity: 5000 },
  74: { city: "Muriaé", state: "MG", country: "Brasil", capacity: 15000 },
  75: { city: "Campinas", state: "SP", country: "Brasil", capacity: 29130 },
  76: { city: "Goiânia", state: "GO", country: "Brasil", capacity: 11200 },
  77: { city: "Criciúma", state: "SC", country: "Brasil", capacity: 19300 },
  78: {
    city: "São Lourenço da Mata",
    state: "PE",
    country: "Brasil",
    capacity: 44298,
  },
  79: {
    city: "Novo Horizonte",
    state: "SP",
    country: "Brasil",
    capacity: 16000,
  },
  80: { city: "Chapecó", state: "SC", country: "Brasil", capacity: 19351 },
  81: { city: "Campinas", state: "SP", country: "Brasil", capacity: 17728 },
  82: {
    city: "Belo Horizonte",
    state: "MG",
    country: "Brasil",
    capacity: 61846,
  },
  83: { city: "Maceió", state: "AL", country: "Brasil", capacity: 4000 },
  84: { city: "Lagarto", state: "SE", country: "Brasil", capacity: 8000 },
  85: { city: "Sobral", state: "CE", country: "Brasil", capacity: 10000 },
  86: {
    city: "Rio de Janeiro",
    state: "RJ",
    country: "Brasil",
    capacity: 46831,
  },
  87: { city: "Pelotas", state: "RS", country: "Brasil", capacity: 18000 },
  88: { city: "Goiânia", state: "GO", country: "Brasil", capacity: 14500 },
  89: { city: "Salvador", state: "BA", country: "Brasil", capacity: 30618 },
  90: {
    city: "Florianópolis",
    state: "SC",
    country: "Brasil",
    capacity: 17826,
  },
  91: { city: "Curitiba", state: "PR", country: "Brasil", capacity: 40502 },
  92: { city: "Teresina", state: "PI", country: "Brasil", capacity: 44200 },
  93: { city: "Vitória", state: "ES", country: "Brasil", capacity: 3000 },
  94: { city: "Barueri", state: "SP", country: "Brasil", capacity: 31452 },
  95: { city: "Cuiabá", state: "MT", country: "Brasil", capacity: 44003 },
  96: {
    city: "Caxias do Sul",
    state: "RS",
    country: "Brasil",
    capacity: 19924,
  },
  97: { city: "Curitiba", state: "PR", country: "Brasil", capacity: 20083 },
  98: {
    city: "Ribeirão Preto",
    state: "SP",
    country: "Brasil",
    capacity: 29292,
  },
  99: { city: "São Luís", state: "MA", country: "Brasil", capacity: 11857 },
  100: { city: "João Pessoa", state: "PB", country: "Brasil", capacity: 25770 },
  101: { city: "Brasília", state: "DF", country: "Brasil", capacity: 72788 },
  102: { city: "São Paulo", state: "SP", country: "Brasil", capacity: 49205 },
  103: { city: "Cariacica", state: "ES", country: "Brasil", capacity: 21000 },
  104: {
    city: "Rio de Janeiro",
    state: "RJ",
    country: "Brasil",
    capacity: 78838,
  },
  105: { city: "São Paulo", state: "SP", country: "Brasil", capacity: 66795 },
  106: { city: "São Paulo", state: "SP", country: "Brasil", capacity: 40000 },
  107: { city: "Santos", state: "SP", country: "Brasil", capacity: 16068 },
  108: { city: "Goiânia", state: "GO", country: "Brasil", capacity: 50049 },
  109: { city: "Curitiba", state: "PR", country: "Brasil", capacity: 42372 },
  110: {
    city: "Porto Alegre",
    state: "RS",
    country: "Brasil",
    capacity: 55662,
  },
  111: { city: "Boca da Mata", state: "AL", country: "Brasil", capacity: 2500 },
  112: { city: "Salgueiro", state: "PE", country: "Brasil", capacity: 12070 },
  113: { city: "Manaus", state: "AM", country: "Brasil", capacity: 44000 },
  114: { city: "Sorocaba", state: "SP", country: "Brasil", capacity: 13772 },
  115: { city: "Goiânia", state: "GO", country: "Brasil", capacity: 13250 },
  116: { city: "Goiânia", state: "GO", country: "Brasil", capacity: 13250 },
  117: { city: "Varginha", state: "MG", country: "Brasil", capacity: 15471 },
  118: { city: "Campinas", state: "SP", country: "Brasil", capacity: 29130 },
  119: { city: "Itabaiana", state: "SE", country: "Brasil", capacity: 12000 },
  120: { city: "Parnaíba", state: "PI", country: "Brasil", capacity: 4700 },
  121: {
    city: "Santana do Ipanema",
    state: "AL",
    country: "Brasil",
    capacity: 3000,
  },
  122: { city: "Murici", state: "AL", country: "Brasil", capacity: 3500 },
  123: {
    city: "Juazeiro do Norte",
    state: "CE",
    country: "Brasil",
    capacity: 17230,
  },
  125: {
    city: "Vitória da Conquista",
    state: "BA",
    country: "Brasil",
    capacity: 12230,
  },
  126: {
    city: "União dos Palmares",
    state: "AL",
    country: "Brasil",
    capacity: 4000,
  },
  127: { city: "Atalaia", state: "AL", country: "Brasil", capacity: 3000 },
  128: { city: "Maceió", state: "AL", country: "Brasil", capacity: 4000 },
  129: { city: "Juazeiro", state: "BA", country: "Brasil", capacity: 8000 },
  130: { city: "Carmópolis", state: "SE", country: "Brasil", capacity: 5000 },
  131: { city: "Pilar", state: "AL", country: "Brasil", capacity: 2000 },
  132: {
    city: "Senhor do Bonfim",
    state: "BA",
    country: "Brasil",
    capacity: 6000,
  },
  133: { city: "Sousa", state: "PB", country: "Brasil", capacity: 10000 },
  134: { city: "Itabaiana", state: "SE", country: "Brasil", capacity: 10000 },
  135: {
    city: "São Miguel dos Campos",
    state: "AL",
    country: "Brasil",
    capacity: 5000,
  },
  136: { city: "Saquarema", state: "RJ", country: "Brasil", capacity: 6000 },
  137: { city: "Natal", state: "RN", country: "Brasil", capacity: 31375 },
  138: { city: "Joinville", state: "SC", country: "Brasil", capacity: 22400 },
  139: {
    city: "Feira de Santana",
    state: "BA",
    country: "Brasil",
    capacity: 7000,
  },
  140: { city: "Jequié", state: "BA", country: "Brasil", capacity: 6000 },
};

try {
  const { rows: all } = await client.query(
    `SELECT id, name, city, state, country, capacity FROM stadiums ORDER BY id`,
  );

  const missing = all.filter((s) => !UPDATES[s.id]);
  if (missing.length) {
    console.error(
      `Sem dados para ${missing.length} estádios:`,
      missing.map((s) => `${s.id}:${s.name}`).join(", "),
    );
    process.exitCode = 1;
  }

  let changed = 0;
  let unchanged = 0;

  if (!DRY) await client.query("BEGIN");

  for (const s of all) {
    const u = UPDATES[s.id];
    if (!u) continue;

    const city = u.city ?? s.city;
    const state = u.state ?? s.state;
    const country = u.country ?? s.country ?? "Brasil";
    const capacity = u.capacity ?? s.capacity;

    const same =
      (s.city ?? null) === (city ?? null) &&
      (s.state ?? null) === (state ?? null) &&
      (s.country ?? null) === (country ?? null) &&
      (s.capacity ?? null) === (capacity ?? null);

    if (same) {
      unchanged++;
      continue;
    }

    console.log(
      `#${s.id} ${s.name}\n` +
        `  city: ${s.city ?? "∅"} → ${city ?? "∅"} | state: ${s.state ?? "∅"} → ${state ?? "∅"}\n` +
        `  country: ${s.country ?? "∅"} → ${country ?? "∅"} | cap: ${s.capacity ?? "∅"} → ${capacity ?? "∅"}`,
    );

    if (!DRY) {
      await client.query(
        `UPDATE stadiums
         SET city = $2, state = $3, country = $4, capacity = $5
         WHERE id = $1`,
        [s.id, city, state, country, capacity],
      );
    }
    changed++;
  }

  if (!DRY) await client.query("COMMIT");

  const after = await client.query(`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE city IS NULL OR btrim(city)='')::int AS miss_city,
      count(*) FILTER (WHERE state IS NULL OR btrim(state)='')::int AS miss_state,
      count(*) FILTER (WHERE capacity IS NULL)::int AS miss_cap
    FROM stadiums
  `);

  console.log(
    `\n${DRY ? "DRY " : ""}done: ${changed} updated, ${unchanged} unchanged`,
  );
  console.log("totals:", after.rows[0]);
} catch (e) {
  if (!DRY) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
  }
  throw e;
} finally {
  client.release();
  await pool.end();
}
