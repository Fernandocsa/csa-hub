/**
 * APPLY CSA 2023 match sheets (48 games) + meta (attendance/renda/phase/pens/stadiums).
 * Matches existing season=2023 rows by date (+opp when needed). Fixes Murici Copa Alagoas date to 2023-03-05.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES, convertMinute, norm } from "./data/season-2023-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");

/** Defaults when GAMES entry omits phase/round. */
const PHASE_ROUND = {
  1: { phase: null, round: "1ª rodada" },
  2: { phase: null, round: "2ª rodada" },
  3: { phase: null, round: "3ª rodada" },
  4: { phase: null, round: "4ª rodada" },
  5: { phase: null, round: "5ª rodada" },
  6: { phase: null, round: "6ª rodada" },
  7: { phase: null, round: "7ª rodada" },
  8: { phase: "1ª Fase", round: "1ª rodada" },
  9: { phase: null, round: "2ª rodada" },
  10: { phase: null, round: "3ª rodada" },
  11: { phase: null, round: "5ª rodada" },
  12: { phase: null, round: "6ª rodada" },
  13: { phase: null, round: "7ª rodada" },
  14: { phase: "Quartas", round: "Jogo único" },
  15: { phase: "Semifinal", round: "Jogo único" },
  16: { phase: "Pré-Copa", round: "1ª Fase" },
  17: { phase: "Pré-Copa", round: "2ª Fase" },
  18: { phase: "Fase de grupos", round: "1ª rodada" },
  19: { phase: "Fase de grupos", round: "2ª rodada" },
  20: { phase: "Fase de grupos", round: "3ª rodada" },
  21: { phase: "Fase de grupos", round: "4ª rodada" },
  22: { phase: "Fase de grupos", round: "5ª rodada" },
  23: { phase: "Fase de grupos", round: "6ª rodada" },
  24: { phase: "Fase de grupos", round: "7ª rodada" },
  25: { phase: "Fase de grupos", round: "8ª rodada" },
  26: { phase: "1ª Fase", round: "Jogo único" },
  27: { phase: "2ª Fase", round: "Jogo único" },
  28: { phase: "3ª Fase", round: "Ida" },
  29: { phase: "3ª Fase", round: "Volta" },
};
for (let i = 30; i <= 48; i++) {
  PHASE_ROUND[i] = { phase: null, round: `${i - 29}ª rodada` };
}

function phaseRoundFor(g) {
  const d = PHASE_ROUND[g.n] ?? { phase: null, round: null };
  return {
    phase: g.phase ?? d.phase,
    round: g.round ?? d.round,
  };
}

const FORCE_ID = {
  "everton silva": 265, // Éverton Silva
  "eduardo santos": 350, // Eduardo (GK)
  eduardo: 350,
  geovane: 315, // Geovane Silva
  robinho: 492,
  "willian oliveira": 309,
  "william oliveira": 309,
  "rhuan ferreira": 316,
  rhuan: 316,
  jacone: 325,
  "eduardo jacone": 325,
  victor: 336, // Victor Ramalho
  matheus: 324, // Matheus Lima
  "elvis gustavo": 355,
  elvis: 355,
  pedrinho: 319, // Pedrão
  pedrao: 319,
  "pedrão": 319,
  jeffinho: 359, // Jefferson Oliveira
  "jefferson oliveira": 359,
  "gabryel cezar": 354,
  gabryel: 354,
  fabricio: 339,
  "fabricio santos": 339,
  "fabrício": 339,
  "fabrício santos": 339,
  yago: 216, // Yago Henrique
  abner: 332,
  "abner vinicius": 332,
  "luis felipe": 313,
  "luís felipe": 313,
  "luan ryan": 318, // Lucas Ryan (source typo)
  santos: 340, // Mateus Santos
  "mateus santos": 340,
  wesley: 308, // Wesley (Cadu)
  "wesley (cadu)": 308,
  "william jackson": 292,
  erick: 356,
  "erick melo": 356,
  "vinicius toledo": 329,
  "vinícius toledo": 329,
  "vinicius peixoto": 342,
  "vinícius peixoto": 342,
  "pedro vitor": 346,
  "pedro victor": 346,
  "jean carlo": 311,
  "ray vanegas": 321,
  "junior todinho": 314,
  "júnior todinho": 314,
  jo: 327,
  "jô": 327,
  "vinicius bergantin": null, // manager
  "vinícius bergantin": null,
};

const SPELL_TO_DB = {
  "everton silva": "Éverton Silva",
  "eduardo santos": "Eduardo",
  geovane: "Geovane Silva",
  pedrinho: "Pedrão",
  jeffinho: "Jefferson Oliveira",
  "gabryel cezar": "Gabryel",
  "elvis gustavo": "Elvis",
  "rhuan ferreira": "Rhuan",
  jacone: "Eduardo Jacone",
  "luan ryan": "Lucas Ryan",
  "willian oliveira": "William Oliveira",
  "luis felipe": "Luis Felipe",
  "luís felipe": "Luis Felipe",
  yago: "Yago Henrique",
  abner: "Abner Vinicius",
  "wenderson rodrigues": "Wenderson",
  "pedro vitor": "Pedro Victor",
  fabricio: "Fabrício Santos",
  "fabrício": "Fabrício Santos",
  santos: "Mateus Santos",
  "william jackson": "William",
  erick: "Erick Melo",
  victor: "Victor Ramalho",
  matheus: "Matheus Lima",
};

const STADIUM_MAP = {
  "juca sampaio": { prefer: ["juca sampaio"], create: { name: "Estádio Juca Sampaio", city: "Palmeira dos Índios", state: "AL" } },
  "jose gomes da costa": { prefer: ["jose gomes", "gomes da costa"], create: { name: "José Gomes (Murici)", city: "Murici", state: "AL" } },
  "rei pele": { prefer: ["rei pele", "trapichao"], create: { name: "Estádio Rei Pelé (Trapichão)", city: "Maceió", state: "AL" } },
  "gerson amaral": { prefer: ["gerson amaral"], create: { name: "Estádio Gerson Amaral", city: "Coruripe", state: "AL" } },
  "coaracy da mata fonseca": { prefer: ["coaracy"], create: { name: "Coaracy da Mata (Fumeirão)", city: "Arapiraca", state: "AL" } },
  "nelson peixoto feijo": { prefer: ["nelson peixoto", "nelsao"], create: { name: "Estádio Nélson Peixoto (Nelsão)", city: "Maceió", state: "AL" } },
  "nelson peixoto": { prefer: ["nelson peixoto", "nelsao"], create: { name: "Estádio Nélson Peixoto (Nelsão)", city: "Maceió", state: "AL" } },
  orlandao: { prefer: ["orlandao"], create: { name: "Estádio Orlandão", city: "União dos Palmares", state: "AL" } },
  "lindolfo monteiro": { prefer: ["lindolfo monteiro"], create: { name: "Estádio Lindolfo Monteiro", city: "Teresina", state: "PI" } },
  "presidente vargas": { prefer: ["presidente vargas"], create: { name: "Estádio Presidente Vargas", city: "Fortaleza", state: "CE" } },
  castelao: { prefer: ["castelao sao luis", "castelao (sao luis)"], create: { name: "Castelão (São Luís)", city: "São Luís", state: "MA" } },
  "antonio carneiro": { prefer: ["antonio carneiro"], create: { name: "Estádio Antônio Carneiro", city: "Alagoinhas", state: "BA" } },
  "francisco vasques": { prefer: ["francisco vasques", "souza"], create: { name: "Estádio Francisco Vasques", city: "Belém", state: "PA" } },
  "beira rio": { prefer: ["beira rio"], create: { name: "Estádio Beira-Rio", city: "Porto Alegre", state: "RS" } },
  "colosso da lagoa": { prefer: ["colosso"], create: { name: "Colosso da Lagoa", city: "Erechim", state: "RS" } },
  "raulino de oliveira": { prefer: ["raulino"], create: { name: "Estádio Raulino de Oliveira", city: "Volta Redonda", state: "RJ" } },
  "orlando scarpelli": { prefer: ["scarpelli"], create: { name: "Estádio Orlando Scarpelli", city: "Florianópolis", state: "SC" } },
  "germano kruger": { prefer: ["germano kruger", "germano kruger"], create: { name: "Estádio Germano Krüger", city: "Ponta Grossa", state: "PR" } },
  curuzu: { prefer: ["curuzu"], create: { name: "Estádio da Curuzu", city: "Belém", state: "PA" } },
  "dos aflitos": { prefer: ["aflitos"], create: { name: "Estádio dos Aflitos", city: "Recife", state: "PE" } },
  "carlos zamith": { prefer: ["zamith"], create: { name: "Estádio Carlos Zamith", city: "Manaus", state: "AM" } },
};

function parseRef(raw) {
  const m = String(raw ?? "").trim().match(/^(.*?)(?:-([A-Z]{2}))?$/);
  return { name: (m?.[1] ?? raw).trim(), state: m?.[2] ?? null };
}

function stadiumKeyFromName(name) {
  return norm(name);
}

try {
  await client.query("BEGIN");
  let muriciDateFixId = null;

  // Ensure Daniel Abras manager
  {
    let { rows } = await client.query(
      `SELECT id, name FROM managers WHERE lower(name)=lower('Daniel Abras')`,
    );
    if (!rows[0]) {
      if (DRY) {
        console.log("would create manager Daniel Abras");
        rows = [{ id: -1, name: "Daniel Abras" }];
      } else {
        ({ rows } = await client.query(
          `INSERT INTO managers (name) VALUES ('Daniel Abras') RETURNING id, name`,
        ));
        console.log("+ manager", rows[0]);
      }
    }
    // stash for resolveManager after mgrRows load
    globalThis.__danielAbras = rows[0];
  }

  // Ensure Pedro Henrique player
  {
    let { rows } = await client.query(
      `SELECT id, name FROM players WHERE lower(name)=lower('Pedro Henrique')`,
    );
    if (!rows[0]) {
      if (DRY) {
        console.log("would create player Pedro Henrique");
        rows = [{ id: -2, name: "Pedro Henrique" }];
      } else {
        ({ rows } = await client.query(
          `INSERT INTO players (name, position) VALUES ('Pedro Henrique', 'Zagueiro') RETURNING id, name`,
        ));
        console.log("+ player", rows[0]);
      }
    }
    FORCE_ID["pedro henrique"] = rows[0].id;
  }

  // Managers
  const { rows: mgrRows } = await client.query(`SELECT id, name FROM managers`);
  if (globalThis.__danielAbras && !mgrRows.some((m) => m.id === globalThis.__danielAbras.id || norm(m.name) === "daniel abras")) {
    mgrRows.push(globalThis.__danielAbras);
  }
  function resolveManager(name) {
    const key = norm(name);
    // Vinicius without accent
    const aliases = {
      "vinicius bergantin": "vinicius bergantin",
      "vinícius bergantin": "vinicius bergantin",
    };
    const want = aliases[key] ?? key;
    const hit = mgrRows.find((m) => norm(m.name) === want);
    if (hit) return hit;
    const soft = mgrRows.filter((m) => norm(m.name).includes(want) || want.includes(norm(m.name)));
    if (soft.length === 1) return soft[0];
    throw new Error(`manager not found: ${name}`);
  }

  // Refs — ensure all
  const refCache = new Map();
  async function resolveRef(raw) {
    const { name, state } = parseRef(raw);
    const key = norm(name);
    if (refCache.has(key)) return refCache.get(key);
    let { rows } = await client.query(
      `SELECT id, name FROM referees WHERE lower(name)=lower($1)`,
      [name],
    );
    if (!rows[0]) {
      ({ rows } = await client.query(
        `SELECT id, name FROM referees WHERE lower(name) LIKE lower($1)`,
        [`%${name.split(/\s+/).slice(0, 2).join(" ")}%`],
      ));
      const exact = rows.filter((r) => norm(r.name) === key);
      if (exact.length === 1) rows = exact;
      else if (rows.length !== 1) rows = [];
    }
    if (!rows[0]) {
      if (DRY) {
        console.log("would create ref", name, state);
        const fake = { id: -1, name };
        refCache.set(key, fake);
        return fake;
      }
      const ins = await client.query(
        `INSERT INTO referees (name, state) VALUES ($1, $2) RETURNING id, name`,
        [name, state],
      );
      console.log("+ ref", ins.rows[0]);
      rows = ins.rows;
    }
    refCache.set(key, rows[0]);
    return rows[0];
  }

  // Stadiums
  const { rows: allStadiums } = await client.query(`SELECT id, name FROM stadiums`);
  async function resolveStadium(name, cityUf) {
    if (!name) return null;
    const key = stadiumKeyFromName(name);
    const map = STADIUM_MAP[key];
    const prefers = map?.prefer ?? [key];
    for (const pref of prefers) {
      const hits = allStadiums.filter((s) => norm(s.name).includes(pref));
      if (hits.length >= 1) {
    // Prefer exact city when Castelão: avoid Fortaleza Castelão for São Luís
        if (key === "castelao" || pref.includes("castelao")) {
          const sl = allStadiums.find(
            (s) =>
              norm(s.name).includes("castelao") &&
              (norm(s.name).includes("sao luis") ||
                norm(cityUf ?? "").includes("sao luis")),
          );
          if (sl) return sl.id;
          // force create São Luís Castelão below
          break;
        } else {
          hits.sort((a, b) => a.name.length - b.name.length);
          return hits[0].id;
        }
      }
    }
    if (map?.create) {
      if (DRY) {
        console.log("would create stadium", map.create.name);
        return null;
      }
      const [city, state] = (() => {
        if (map.create.city) return [map.create.city, map.create.state];
        const m = String(cityUf ?? "").match(/^(.+)-([A-Z]{2})$/);
        return m ? [m[1], m[2]] : [null, null];
      })();
      const ins = await client.query(
        `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil') RETURNING id, name`,
        [map.create.name, city ?? map.create.city, state ?? map.create.state],
      );
      console.log("+ stadium", ins.rows[0]);
      allStadiums.push(ins.rows[0]);
      return ins.rows[0].id;
    }
    // generic create from CSV name
    if (DRY) {
      console.log("would create stadium generic", name);
      return null;
    }
    const m = String(cityUf ?? "").match(/^(.+)-([A-Z]{2})$/);
    const ins = await client.query(
      `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil') RETURNING id, name`,
      [name.startsWith("Estádio") || name.startsWith("Estadio") ? name : `Estádio ${name}`, m?.[1] ?? null, m?.[2] ?? null],
    );
    console.log("+ stadium", ins.rows[0]);
    allStadiums.push(ins.rows[0]);
    return ins.rows[0].id;
  }

  // Players
  const { rows: allPlayers } = await client.query(`SELECT id, name FROM players`);
  const playersByNorm = new Map();
  for (const p of allPlayers) {
    const k = norm(p.name);
    if (!playersByNorm.has(k)) playersByNorm.set(k, []);
    playersByNorm.get(k).push(p);
  }
  const playerCache = new Map();
  async function resolvePlayer(name) {
    const key = norm(name);
    if (playerCache.has(key)) return playerCache.get(key);
    if (FORCE_ID[key]) {
      if (FORCE_ID[key] < 0) {
        const fake = { id: FORCE_ID[key], name };
        playerCache.set(key, fake);
        return fake;
      }
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [FORCE_ID[key]]);
      if (!rows[0]) throw new Error(`FORCE_ID missing ${name}`);
      playerCache.set(key, rows[0]);
      return rows[0];
    }
    if (SPELL_TO_DB[key]) {
      const spellKey = norm(SPELL_TO_DB[key]);
      const hits = playersByNorm.get(spellKey) ?? [];
      if (hits.length === 1) {
        playerCache.set(key, hits[0]);
        return hits[0];
      }
      const exact = allPlayers.find((p) => p.name === SPELL_TO_DB[key]);
      if (exact) {
        playerCache.set(key, exact);
        return exact;
      }
    }
    const direct = playersByNorm.get(key) ?? [];
    if (direct.length === 1) {
      playerCache.set(key, direct[0]);
      return direct[0];
    }
    if (direct.length > 1) {
      throw new Error(`player ambiguous: ${name} → ${direct.map((p) => `#${p.id} ${p.name}`).join(", ")}`);
    }
    throw new Error(`player unresolved: ${name}`);
  }

  // Fix Murici Copa Alagoas date if needed
  {
    const { rows } = await client.query(`
      SELECT m.id, m.match_date::text AS d
      FROM matches m
      JOIN competitions c ON c.id=m.competition_id
      JOIN opponents o ON o.id=m.opponent_id
      WHERE m.season='2023' AND c.name ILIKE '%Copa Alagoas%'
        AND o.name ILIKE 'Murici%' AND m.home_away='away'
    `);
    if (rows[0] && rows[0].d.slice(0, 10) === "2023-03-04") {
      console.log(`* fix Murici Copa Alagoas date #${rows[0].id} 2023-03-04→2023-03-05`);
      if (!DRY) {
        await client.query(`UPDATE matches SET match_date='2023-03-05' WHERE id=$1`, [rows[0].id]);
      }
      // keep in-memory list in sync for matching (including dry-run)
      muriciDateFixId = rows[0].id;
    }
  }

  const { rows: dbMatches } = await client.query(`
    SELECT m.id, m.match_date::text AS d, o.name AS opp, c.name AS comp, m.home_away
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    JOIN competitions c ON c.id=m.competition_id
    WHERE m.season='2023' AND m.is_friendly=false
  `);
  if (typeof muriciDateFixId === "number") {
    const row = dbMatches.find((m) => m.id === muriciDateFixId);
    if (row) row.d = "2023-03-05";
  }

  function findMatch(g) {
    const sameDate = dbMatches.filter((m) => m.d.slice(0, 10) === g.date);
    if (sameDate.length === 1) return sameDate[0];
    const oppKey = norm(g.opp).split("-")[0].trim();
    const hit = sameDate.filter((m) => {
      const on = norm(m.opp);
      return on.includes(oppKey) || oppKey.includes(on.split("-")[0].trim());
    });
    if (hit.length === 1) return hit[0];
    // also try by competition hint
    const compHint =
      g.comp === "Alagoano"
        ? "alagoano"
        : g.comp === "Copa Alagoas"
          ? "copa alagoas"
          : g.comp === "Nordeste"
            ? "nordeste"
            : g.comp === "Copa do Brasil"
              ? "copa do brasil"
              : "serie c";
    const byComp = hit.filter((m) => norm(m.comp).includes(compHint));
    if (byComp.length === 1) return byComp[0];
    throw new Error(
      `match not found n=${g.n} ${g.date} ${g.opp} candidates=${sameDate.map((m) => m.id + ":" + m.opp).join(",")}`,
    );
  }

  const applied = [];

  for (const g of GAMES) {
    const match = findMatch(g);
    const mgr = resolveManager(g.mgr);
    const ref = await resolveRef(g.ref);
    const stadiumId = await resolveStadium(g.stadium, g.cityUf);

    const pr = phaseRoundFor(g);
    const att = g.gatesClosed ? null : (g.att ?? null);
    const attP = g.gatesClosed ? null : (g.attP ?? null);
    const renda = g.renda ?? null;
    const pensFor = g.pensFor ?? null;
    const pensAgainst = g.pensAgainst ?? null;

    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           manager_id=$2,
           referee_id=$3,
           stadium_id=COALESCE($4, stadium_id),
           attendance=$5,
           attendance_paid=$6,
           gross_revenue=COALESCE($7, gross_revenue),
           phase=$8,
           round=$9,
           penalties_for=$10,
           penalties_against=$11,
           scorers=$12
         WHERE id=$1`,
        [
          match.id,
          mgr.id,
          ref.id > 0 ? ref.id : null,
          stadiumId,
          att,
          attP,
          renda,
          pr.phase,
          pr.round,
          pensFor,
          pensAgainst,
          g.goals.map((x) => x.p).join(", ") || null,
        ],
      );

      await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [match.id]);

      const lineupIdByPlayer = new Map();
      let sort = 0;
      for (const name of g.starters) {
        const p = await resolvePlayer(name);
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
          [match.id, p.id, p.name, sort++],
        );
        lineupIdByPlayer.set(p.id, rows[0].id);
      }
      const benchNames = [];
      for (const [, inn] of g.subs) {
        if (!benchNames.includes(inn)) benchNames.push(inn);
      }
      for (const name of benchNames) {
        const p = await resolvePlayer(name);
        if (lineupIdByPlayer.has(p.id)) continue;
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [match.id, p.id, p.name, sort++],
        );
        lineupIdByPlayer.set(p.id, rows[0].id);
      }

      for (const goal of g.goals) {
        const conv = convertMinute(goal.m, goal.h);
        if (conv.error) throw new Error(`n=${g.n} ${conv.error}`);
        const p = await resolvePlayer(goal.p);
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute, injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6)`,
          [
            match.id,
            lineupIdByPlayer.get(p.id) ?? null,
            p.id,
            p.name,
            conv.minute,
            conv.injuryTimeMinute,
          ],
        );
      }

      for (const [outName, inName] of g.subs) {
        const outP = await resolvePlayer(outName);
        const inP = await resolvePlayer(inName);
        await client.query(
          `INSERT INTO match_substitutions
             (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
              player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,0,NULL)`,
          [
            match.id,
            lineupIdByPlayer.get(outP.id) ?? null,
            outP.id,
            outP.name,
            lineupIdByPlayer.get(inP.id) ?? null,
            inP.id,
            inP.name,
          ],
        );
      }
    }

    applied.push({
      n: g.n,
      matchId: match.id,
      date: g.date,
      opp: g.opp,
      mgr: mgr.name,
      goals: g.goals.length,
      subs: g.subs.length,
    });
    console.log(
      `* n=${g.n} #${match.id} ${g.date} ${g.opp} mgr=${mgr.name} goals=${g.goals.length} subs=${g.subs.length}`,
    );
  }

  // Related legs Copa do Brasil Inter
  {
    const ida = applied.find((a) => a.n === 28);
    const volta = applied.find((a) => a.n === 29);
    if (ida && volta && !DRY) {
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [ida.matchId, volta.matchId]);
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [volta.matchId, ida.matchId]);
      console.log(`* related Inter ${ida.matchId}↔${volta.matchId}`);
    }
  }

  // Sync player_season_stats appearances/goals from sheets (floor-friendly: max with existing)
  if (!DRY) {
    const { rows: sheetStats } = await client.query(`
      WITH apps AS (
        SELECT ml.player_id,
          count(DISTINCT ml.match_id)::int AS appearances
        FROM match_lineups ml
        JOIN matches m ON m.id=ml.match_id
        WHERE m.season='2023' AND ml.side='csa' AND ml.player_id IS NOT NULL
          AND (
            ml.role='starter'
            OR EXISTS (
              SELECT 1 FROM match_substitutions s
              WHERE s.match_id=ml.match_id AND s.side='csa'
                AND s.player_in_id=ml.player_id
            )
          )
        GROUP BY ml.player_id
      ),
      goals AS (
        SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
        FROM match_goals mg
        JOIN matches m ON m.id=mg.match_id
        WHERE m.season='2023' AND mg.side='csa' AND mg.is_own_goal=false
          AND mg.scorer_player_id IS NOT NULL
        GROUP BY mg.scorer_player_id
      )
      SELECT a.player_id, a.appearances, coalesce(g.goals,0) AS goals
      FROM apps a
      LEFT JOIN goals g ON g.player_id=a.player_id
    `);
    let upserted = 0;
    for (const s of sheetStats) {
      const { rows: cur } = await client.query(
        `SELECT id, appearances, goals, assists FROM player_season_stats
         WHERE player_id=$1 AND season='2023'`,
        [s.player_id],
      );
      if (cur[0]) {
        await client.query(
          `UPDATE player_season_stats SET
             appearances = GREATEST(appearances, $2),
             goals = GREATEST(goals, $3)
           WHERE id=$1`,
          [cur[0].id, s.appearances, s.goals],
        );
      } else {
        await client.query(
          `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
           VALUES ($1,'2023',$2,$3,0)`,
          [s.player_id, s.appearances, s.goals],
        );
      }
      upserted += 1;
    }
    console.log(`roster sync rows ${upserted}`);
  }

  if (DRY) {
    await client.query("ROLLBACK");
    console.log(`\nDRY RUN ok, would apply ${applied.length}`);
  } else {
    await client.query("COMMIT");
    console.log(`\nDONE applied ${applied.length}`);
  }
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
