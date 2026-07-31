/**
 * Resolve ambiguous missing roster players from user-provided profiles.
 *
 * Creates / links:
 * - João Paulo de Assis Penha (Meia 2016)
 * - Alberto Rafael da Silva (GK 2016)
 * - Rafael Gonçalves da Silva (Ata 2016, falecido)
 * - João Victor Severino (LE 2018)
 * - Guilherme Ferreira Lúcio Neto (Def 2018) — NOT Neto Berola
 * - Cristiano Fontes (Zagueiro 2018) — NEW (pending confirm if = #80)
 * - Giva #515 → 2018
 * - Mazinho = José Osmar Ventura da Paz (2018)
 * - Lucão 2019 = Lucas Rafael Gonçalves da Silva (NOT #9)
 * - Thiaguinho 2019 = Wytallo Thiago Lima Da Silva (NOT #358)
 * - Elly #132 profile + → 2019
 * - João #249 → 2020
 * - Zé do Carmo #259 → 2020
 * - Lucas Surcin 2018
 * - Mascote 2018
 *
 * Skipped pending user:
 * - Jefferson 2016 GK
 * - Cassiano 2016 (no third)
 * - Cristiano #80 vs Fontes (created Fontes separately for now? — see flag)
 * - Vitão age
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

async function ensureSeason(playerId, season) {
  const { rows } = await client.query(
    `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
     VALUES ($1, $2, 0, 0, 0)
     ON CONFLICT (player_id, season) DO NOTHING
     RETURNING id, player_id, season, appearances`,
    [playerId, season],
  );
  if (rows[0]) return { ...rows[0], rowCreated: true };
  const ex = await client.query(
    `SELECT id, player_id, season, appearances FROM player_season_stats
     WHERE player_id=$1 AND season=$2`,
    [playerId, season],
  );
  return { ...ex.rows[0], rowCreated: false };
}

async function insertPlayer(p) {
  const { rows } = await client.query(
    `INSERT INTO players (
       name, full_name, position, secondary_positions, nationality,
       birth_year, birth_date, birth_city, birth_state, birth_country,
       preferred_foot, height_cm, weight_kg
     ) VALUES (
       $1, $2, $3, $4::text[], $5,
       $6, $7::date, $8, $9, $10,
       $11, $12, $13
     )
     RETURNING id, name, full_name, position, secondary_positions,
               birth_date, birth_year, birth_city, birth_state,
               preferred_foot, height_cm, weight_kg`,
    [
      p.name,
      p.fullName,
      p.position,
      p.secondary ?? [],
      "Brasil",
      p.birthYear,
      p.birthDate,
      p.city ?? null,
      p.state ?? null,
      "Brasil",
      p.foot ?? null,
      p.height ?? null,
      p.weight ?? null,
    ],
  );
  return { ...rows[0], deathDateNote: p.deathDate ?? null };
}

try {
  await client.query("BEGIN");

  const created = [];
  const linked = [];
  const updated = [];

  // 1) João Paulo de Assis Penha — Meia 2016
  {
    const p = await insertPlayer({
      name: "João Paulo",
      fullName: "João Paulo de Assis Penha",
      position: "Meia Ofensivo",
      secondary: ["Ponta Esquerda"],
      birthYear: 1993,
      birthDate: "1993-09-06",
      city: "Vila Velha",
      state: "ES",
      foot: "destro",
      height: 176,
      weight: 74,
    });
    created.push({ player: p, seasons: [await ensureSeason(p.id, "2016")] });
  }

  // 2) Alberto Rafael da Silva — GK 2016
  {
    const p = await insertPlayer({
      name: "Rafael",
      fullName: "Alberto Rafael da Silva",
      position: "Goleiro",
      birthYear: 1984,
      birthDate: "1984-03-24",
      city: "Araraquara",
      state: "SP",
      foot: "destro",
      height: 192,
      weight: 84,
    });
    created.push({ player: p, seasons: [await ensureSeason(p.id, "2016")] });
  }

  // 3) Rafael Gonçalves da Silva — Ata 2016 (falecido)
  {
    const p = await insertPlayer({
      name: "Rafael Silva",
      fullName: "Rafael Gonçalves da Silva",
      position: "Atacante",
      birthYear: 1991,
      birthDate: "1991-11-02",
      city: "São Paulo",
      state: "SP",
      height: 180,
      weight: 73,
    });
    const { rows: dec } = await client.query(
      `UPDATE players SET is_deceased = true WHERE id = $1
       RETURNING id, name, is_deceased`,
      [p.id],
    );
    created.push({
      player: { ...p, is_deceased: dec[0]?.is_deceased, death_note: "2018-06-08" },
      seasons: [await ensureSeason(p.id, "2016")],
    });
  }

  // 4) João Victor Severino — LE 2018
  {
    const p = await insertPlayer({
      name: "João Victor",
      fullName: "João Victor Severino",
      position: "Lateral Esquerdo",
      birthYear: 1984,
      birthDate: "1984-02-13",
      city: "Guarujá",
      state: "SP",
      foot: "canhoto",
      height: 177,
      weight: 74,
    });
    created.push({ player: p, seasons: [await ensureSeason(p.id, "2018")] });
  }

  // 5) Neto (not Berola) — Def 2018
  {
    const p = await insertPlayer({
      name: "Neto",
      fullName: "Guilherme Ferreira Lúcio Neto",
      position: "Zagueiro",
      birthYear: 1998,
      birthDate: "1998-09-19",
      city: "Maceió",
      state: "AL",
      height: 187,
    });
    created.push({ player: p, seasons: [await ensureSeason(p.id, "2018")] });
  }

  // 6) Cristiano Fontes — Zagueiro 2018
  // Create separate from #80 for now; user can merge later if same
  {
    const { rows: c80 } = await client.query(
      `SELECT id, name, full_name, position, birth_year FROM players WHERE id=80`,
    );
    const p = await insertPlayer({
      name: "Cristiano",
      fullName: "Cristiano Fontes",
      position: "Zagueiro",
      birthYear: 1988,
      birthDate: "1988-05-07",
      city: "Maceió",
      state: "AL",
      foot: "destro",
    });
    created.push({
      player: p,
      seasons: [await ensureSeason(p.id, "2018")],
      note: `Created separate from #80 ${JSON.stringify(c80[0])} — confirm if same athlete`,
    });
  }

  // 7) Giva #515 → 2018 (centroavante)
  {
    const { rows } = await client.query(
      `UPDATE players SET
         position = 'Centroavante',
         full_name = COALESCE(full_name, 'Givanildo Pulgas da Silva')
       WHERE id = 515
       RETURNING id, name, full_name, position`,
    );
    updated.push(rows[0]);
    linked.push({ player: rows[0], season: await ensureSeason(515, "2018") });
  }

  // 8) Mazinho 2018
  {
    const p = await insertPlayer({
      name: "Mazinho",
      fullName: "José Osmar Ventura da Paz",
      position: "Volante",
      secondary: ["Meia Central"],
      birthYear: 1989,
      birthDate: "1989-11-10",
      city: "Santana do Ipanema",
      state: "AL",
      foot: "destro",
      height: 181,
      weight: 77,
    });
    created.push({ player: p, seasons: [await ensureSeason(p.id, "2018")] });
  }

  // 9) Lucão 2019 (not #9)
  {
    const p = await insertPlayer({
      name: "Lucão",
      fullName: "Lucas Rafael Gonçalves da Silva",
      position: "Zagueiro",
      birthYear: 1998,
      birthDate: "1998-03-25",
      city: "Rio de Janeiro",
      state: "RJ",
      foot: "destro",
      height: 188,
      weight: 74,
    });
    created.push({ player: p, seasons: [await ensureSeason(p.id, "2019")] });
  }

  // 10) Thiaguinho 2019 (not #358)
  {
    const p = await insertPlayer({
      name: "Thiaguinho",
      fullName: "Wytallo Thiago Lima Da Silva",
      position: "Atacante",
      birthYear: 1998,
      birthDate: "1998-01-02",
      city: null,
      state: null,
    });
    created.push({ player: p, seasons: [await ensureSeason(p.id, "2019")] });
  }

  // 11) Elly #132 profile + 2019
  {
    const { rows } = await client.query(
      `UPDATE players SET
         full_name = 'Elly Emanoel Cândido Rolim',
         position = 'Atacante',
         nationality = 'Brasil',
         birth_year = 1998,
         birth_date = '1998-02-20'::date,
         birth_city = 'Campina Grande',
         birth_state = 'PB',
         birth_country = 'Brasil',
         height_cm = 180
       WHERE id = 132 AND name = 'Elly'
       RETURNING id, name, full_name, position, birth_date, birth_year,
                 birth_city, birth_state, height_cm`,
      [],
    );
    if (!rows[0]) throw new Error("Elly #132 not found");
    updated.push(rows[0]);
    linked.push({ player: rows[0], season: await ensureSeason(132, "2019") });
  }

  // 12) João #249 → 2020
  {
    const { rows } = await client.query(
      `SELECT id, name, position, birth_year FROM players WHERE id=249`,
    );
    if (!rows[0] || rows[0].name !== "João") throw new Error("João #249 missing");
    linked.push({ player: rows[0], season: await ensureSeason(249, "2020") });
  }

  // 13) Zé do Carmo #259 → 2020
  {
    const { rows } = await client.query(
      `SELECT id, name, position, birth_year FROM players WHERE id=259`,
    );
    if (!rows[0] || rows[0].name !== "Zé do Carmo") {
      throw new Error("Zé do Carmo #259 missing");
    }
    linked.push({ player: rows[0], season: await ensureSeason(259, "2020") });
  }

  // 14) Lucas Surcin 2018
  {
    const p = await insertPlayer({
      name: "Lucas Surcin",
      fullName: "Lucas da Silva Pereira Surcin",
      position: "Meia Central",
      birthYear: 1993,
      birthDate: "1993-12-03",
      city: "Rio de Janeiro",
      state: "RJ",
      foot: "destro",
      height: 173,
      weight: 65,
    });
    created.push({ player: p, seasons: [await ensureSeason(p.id, "2018")] });
  }

  // 15) Mascote 2018
  {
    const p = await insertPlayer({
      name: "Mascote",
      fullName: "Franklin Geovane de Santana Chagas",
      position: "Centroavante",
      birthYear: 1996,
      birthDate: "1996-08-14",
      city: "Candeias",
      state: "BA",
      foot: "destro",
      height: 188,
      weight: 75,
    });
    created.push({ player: p, seasons: [await ensureSeason(p.id, "2018")] });
  }

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        ok: true,
        createdCount: created.length,
        linkedCount: linked.length,
        created,
        linked,
        updated,
        pendingUser: [
          "Jefferson 2016 GK 23y",
          "Cassiano 2016 — no third: link which / leave out?",
          "Cristiano #80 Meia 2017 vs Cristiano Fontes (created separate)",
          "Vitão 2023 age",
        ],
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
