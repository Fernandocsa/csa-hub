/**
 * Fill opponents missing city and/or home_stadium_id — confirmed data only.
 * - Prefer existing stadiums (exact / soft-unique match); create only when name is confirmed and no similar exists
 * - Well-known club cities; stadiums when confirmed
 * - Match-history away stadium only if not a shared Maceió ground for non-Maceió clubs
 * Does NOT merge possible duplicate opponents (lists them for user)
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
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

/** Confirmed city (+ optional stadium name) by opponent name. */
const CONFIRMED = {
  "ABC-RN": { city: "Natal", stadium: "Machadão", country: "Brasil" },
  "ASA-AL": { city: "Arapiraca", stadium: "Coaracy da Mata (Fumeirão)", country: "Brasil" },
  "América-MG": { city: "Belo Horizonte", country: "Brasil" },
  "América-RN": { city: "Natal", country: "Brasil" },
  "Athletico-PR": { city: "Curitiba", country: "Brasil" },
  "Atlético-GO": { city: "Goiânia", country: "Brasil" },
  "Atlético-MG": { city: "Belo Horizonte", country: "Brasil" },
  "Avaí-SC": { city: "Florianópolis", country: "Brasil" },
  "Bahia-BA": { city: "Salvador", country: "Brasil" },
  "Botafogo-PB": { city: "João Pessoa", country: "Brasil" },
  "Botafogo-RJ": { city: "Rio de Janeiro", country: "Brasil" },
  "Botafogo-SP": { city: "Ribeirão Preto", country: "Brasil" },
  "Brasil de Pelotas-RS": { city: "Pelotas", country: "Brasil" },
  "Brusque-SC": { city: "Brusque", country: "Brasil" },
  "CRB-AL": { city: "Maceió", stadium: "Estádio Rei Pelé (Trapichão)", country: "Brasil" },
  "CSE-AL": { city: "Palmeira dos Índios", stadium: "Estádio Juca Sampaio", country: "Brasil" },
  "Campinense-PB": { city: "Campina Grande", stadium: "Amigão", country: "Brasil" },
  "Capela-AL": { city: "Capela", country: "Brasil" },
  "Capelense-AL": { city: "Capela", country: "Brasil" },
  "Caxias do Sul-RS": { city: "Caxias do Sul", country: "Brasil" },
  "Ceará-CE": { city: "Fortaleza", stadium: "Estádio Castelão", country: "Brasil" },
  "Central-PE": { city: "Caruaru", stadium: "Luiz Lacerda", country: "Brasil" },
  "Chapecoense-SC": { city: "Chapecó", country: "Brasil" },
  "Comercial-AL": { city: "Viçosa", stadium: "Teotônio Vilela", country: "Brasil" },
  "Confiança-SE": { city: "Aracaju", country: "Brasil" },
  "Corinthians-SP": { city: "São Paulo", country: "Brasil" },
  "Criciúma-SC": { city: "Criciúma", country: "Brasil" },
  "Cruzeiro de Arapiraca-AL": {
    city: "Arapiraca",
    stadium: "Coaracy da Mata (Fumeirão)",
    country: "Brasil",
  },
  "Cruzeiro-AL": { city: "Arapiraca", stadium: "Coaracy da Mata (Fumeirão)", country: "Brasil" },
  "Cruzeiro-MG": { city: "Belo Horizonte", country: "Brasil" },
  "Cuiabá-MT": { city: "Cuiabá", country: "Brasil" },
  "Flamengo-RJ": { city: "Rio de Janeiro", country: "Brasil" },
  "Fluminense-RJ": { city: "Rio de Janeiro", country: "Brasil" },
  "Fortaleza-CE": { city: "Fortaleza", stadium: "Estádio Castelão", country: "Brasil" },
  "Goiás-GO": { city: "Goiânia", country: "Brasil" },
  "Grêmio-RS": { city: "Porto Alegre", country: "Brasil" },
  "Internacional-RS": { city: "Porto Alegre", country: "Brasil" },
  "Náutico-PE": { city: "Recife", stadium: "Estádio dos Aflitos", country: "Brasil" },
  "Palmeiras-SP": { city: "São Paulo", country: "Brasil" },
  "Paysandu-PA": { city: "Belém", country: "Brasil" },
  "Picos-PI": { city: "Picos", stadium: "Helvídio Nunes", country: "Brasil" },
  "Ponte Preta-SP": { city: "Campinas", country: "Brasil" },
  "Remo-PA": { city: "Belém", country: "Brasil" },
  "Sampaio Corrêa-MA": { city: "São Luís", country: "Brasil" },
  "Santa Cruz-PE": { city: "Recife", stadium: "Estádio do Arruda", country: "Brasil" },
  "Santos-SP": { city: "Santos", country: "Brasil" },
  "Sergipe-SE": { city: "Aracaju", country: "Brasil" },
  "Sport-PE": { city: "Recife", stadium: "Estádio Ilha do Retiro", country: "Brasil" },
  "São Bernardo-SP": { city: "São Bernardo do Campo", country: "Brasil" },
  "São Luiz de Ijuí-RS": { city: "Ijuí", stadium: "Estádio 19 de Outubro", country: "Brasil" },
  "São Paulo-SP": { city: "São Paulo", country: "Brasil" },
  "São Sebastião-AL": { city: "São Sebastião", stadium: "José Nivaldo", country: "Brasil" },
  "Treze-PB": { city: "Campina Grande", country: "Brasil" },
  "Tuna Luso-PA": { city: "Belém", stadium: "Baenão", country: "Brasil" },
  "Uberlândia-MG": { city: "Uberlândia", stadium: "Estádio Parque do Sabiá", country: "Brasil" },
  "Vasco-RJ": { city: "Rio de Janeiro", stadium: "São Januário", country: "Brasil" },
  "Vila Nova-GO": { city: "Goiânia", country: "Brasil" },
  "Vitória-BA": { city: "Salvador", country: "Brasil" },
  "Volta Redonda-RJ": { city: "Volta Redonda", country: "Brasil" },
  "Amazonas-AM": { city: "Manaus", country: "Brasil" },
  "Nacional-AM": { city: "Manaus", country: "Brasil" },
  "São Raimundo-AM": { city: "Manaus", country: "Brasil" },
  "Altos-PI": { city: "Altos", country: "Brasil" },
  "River-PI": { city: "Teresina", country: "Brasil" },
  "Parnahyba-PI": { city: "Parnaíba", country: "Brasil" },
  "Salgueiro-PE": { city: "Salgueiro", country: "Brasil" },
  "Retrô-PE": { city: "Camaragibe", country: "Brasil" },
  "Novorizontino-SP": { city: "Novo Horizonte", country: "Brasil" },
  "Oeste-SP": { city: "Barueri", country: "Brasil" },
  "São Bento-SP": { city: "Sorocaba", country: "Brasil" },
  "Operário-PR": { city: "Ponta Grossa", country: "Brasil" },
  "Paraná-PR": { city: "Curitiba", country: "Brasil" },
  "Tombense-MG": { city: "Tombos", country: "Brasil" },
  "Athletic-MG": { city: "São João del-Rei", country: "Brasil" },
  "Boa Esporte-MG": { city: "Varginha", country: "Brasil" },
  "Betim-MG": { city: "Betim", country: "Brasil" },
  "Pouso Alegre-MG": { city: "Pouso Alegre", country: "Brasil" },
  "Tupi-MG": { city: "Juiz de Fora", country: "Brasil" },
  "Aparecidense-GO": { city: "Aparecida de Goiânia", country: "Brasil" },
  "Anápolis-GO": { city: "Anápolis", country: "Brasil" },
  "Anapolina-GO": { city: "Anápolis", country: "Brasil" },
  "Ypiranga-RS": { city: "Erechim", country: "Brasil" },
  "São José-RS": { city: "Porto Alegre", country: "Brasil" },
  "Boavista-RJ": { city: "Saquarema", country: "Brasil" },
  "Sousa-PB": { city: "Sousa", country: "Brasil" },
  "Potiguar-RN": { city: "Mossoró", country: "Brasil" },
  "Vitória da Conquista-BA": { city: "Vitória da Conquista", country: "Brasil" },
  "Barcelona de Ilhéus-BA": { city: "Ilhéus", country: "Brasil" },
  "Colo Colo-BA": { city: "Ilhéus", country: "Brasil" },
  "Desportiva-ES": { city: "Cariacica", country: "Brasil" },
  "Serra-ES": { city: "Serra", country: "Brasil" },
  "Vitória-ES": { city: "Vitória", country: "Brasil" },
  "CEO-AL": { city: "Olho d'Água das Flores", country: "Brasil" },
  "Murici-AL": { city: "Murici", country: "Brasil" },
  "Murici Sport-AL": { city: "Murici", stadium: "José Gomes (Murici)", country: "Brasil" },
  "Santa Rita-AL": { city: "Boca da Mata", country: "Brasil" },
  "Zumbi-AL": { city: "União dos Palmares", country: "Brasil" },
  "Coruripe-AL": { city: "Coruripe", country: "Brasil" },
  "CSE": { city: "Palmeira dos Índios", country: "Brasil" },
};

async function findStadium(name, city, state) {
  if (!name) return null;
  const { rows: all } = await client.query(`SELECT id, name, city, state FROM stadiums`);
  const exact = all.find((s) => s.name === name);
  if (exact) return exact;
  const n = norm(name);
  const same = all.filter((s) => norm(s.name) === n);
  if (same.length === 1) return same[0];
  if (same.length > 1) return { ambiguous: true, matches: same };

  const soft = all.filter(
    (s) => norm(s.name).includes(n) || n.includes(norm(s.name)),
  );
  if (soft.length === 1) return soft[0];
  if (soft.length > 1) {
    // Prefer same city/state if provided
    const narrowed = soft.filter(
      (s) =>
        (city && s.city && norm(s.city) === norm(city)) ||
        (state && s.state && s.state === state),
    );
    if (narrowed.length === 1) return narrowed[0];
    return { ambiguous: true, matches: soft };
  }

  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil')
     RETURNING id, name, city, state`,
    [name, city ?? null, state ?? null],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
}

try {
  await client.query("BEGIN");

  const { rows: missing } = await client.query(
    `SELECT id, name, city, state, country, home_stadium_id
     FROM opponents
     WHERE city IS NULL OR btrim(coalesce(city,''))='' OR home_stadium_id IS NULL
     ORDER BY name`,
  );

  const updated = [];
  const pending = [];
  const stadiumSkippedAmbiguous = [];

  for (const o of missing) {
    const conf = CONFIRMED[o.name];
    if (!conf) {
      pending.push({
        id: o.id,
        name: o.name,
        reason: "sem fonte confirmada de cidade/estádio",
        missingCity: !o.city,
        missingStadium: !o.home_stadium_id,
      });
      continue;
    }

    let stadiumId = o.home_stadium_id;
    let stadiumName = null;
    if (!stadiumId && conf.stadium) {
      const st = await findStadium(conf.stadium, conf.city, o.state);
      if (st?.ambiguous) {
        stadiumSkippedAmbiguous.push({
          opponent: o.name,
          wanted: conf.stadium,
          matches: st.matches.map((m) => `#${m.id} ${m.name}`),
        });
      } else if (st?.id) {
        stadiumId = st.id;
        stadiumName = st.name;
        // backfill stadium city if empty
        if (conf.city) {
          await client.query(
            `UPDATE stadiums SET
               city = coalesce(city, $2),
               state = coalesce(state, $3),
               country = coalesce(country, 'Brasil')
             WHERE id=$1`,
            [st.id, conf.city, o.state ?? null],
          );
        }
      }
    }

    const newCity = o.city?.trim() ? o.city : conf.city;
    const newCountry = o.country?.trim() ? o.country : conf.country ?? "Brasil";
    const newStadiumId = o.home_stadium_id ?? stadiumId ?? null;

    if (
      newCity === o.city &&
      newCountry === o.country &&
      newStadiumId === o.home_stadium_id
    ) {
      // nothing to change (e.g. only stadium wanted but ambiguous)
      if (!o.home_stadium_id && conf.stadium && !newStadiumId) {
        pending.push({
          id: o.id,
          name: o.name,
          reason: "cidade ok/aplicável mas estádio não vinculado",
          city: newCity,
          wantedStadium: conf.stadium,
        });
      }
      continue;
    }

    await client.query(
      `UPDATE opponents SET
         city = $2,
         country = coalesce($3, country, 'Brasil'),
         home_stadium_id = coalesce($4, home_stadium_id)
       WHERE id=$1`,
      [o.id, newCity, newCountry, newStadiumId],
    );

    updated.push({
      id: o.id,
      name: o.name,
      city: newCity,
      country: newCountry,
      stadiumId: newStadiumId,
      stadium: stadiumName ?? conf.stadium ?? null,
      before: { city: o.city, stadiumId: o.home_stadium_id },
    });
  }

  // Possible duplicates to report (not merged)
  const possibleDupes = [
    {
      a: "Cruzeiro-AL",
      b: "Cruzeiro de Arapiraca-AL",
      note: "clubes distintos: extinção vs refundação 2019+ (pré-2020 → Arapiraca)",
    },
    { a: "Capela-AL", b: "Capelense-AL", note: "mesmo clube de Capela?" },
    { a: "Murici-AL", b: "Murici Sport-AL", note: "mesmo clube de Murici?" },
    {
      a: "Coritiba-SC",
      b: "Coritiba-PR (não existe)",
      note: "Coritiba-SC parece erro de UF (clube é do PR)",
    },
  ];

  await client.query("COMMIT");

  const { rows: still } = await client.query(
    `SELECT count(*)::int AS n FROM opponents
     WHERE city IS NULL OR btrim(coalesce(city,''))='' OR home_stadium_id IS NULL`,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        updatedCount: updated.length,
        updated,
        pendingCount: pending.length,
        pendingSample: pending.slice(0, 30),
        pendingAllNames: pending.map((p) => p.name),
        stadiumSkippedAmbiguous,
        possibleDupes,
        stillMissingCityOrStadium: still[0].n,
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
