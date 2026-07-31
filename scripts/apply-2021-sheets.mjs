/**
 * APPLY CSA 2021 match sheets (64 games from paste) + meta.
 * Skips Jan/2021 leftover 2020-calendar matches not in GAMES.
 * Marquinhos: #229 Sousa (until 2021-08-09) / #600 Gonçalves (from 2021-08-10).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES, convertMinute, norm } from "./data/season-2021-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");
const SEASON = "2021";

const FORCE_ID = {
  lucao: 9,
  "lucão": 9,
  "giva santos": 141,
  giva: 141,
  yuri: 154, // Yuri Lara
  "yuri lara": 154,
  "yago cesar": 136,
  "yago césar": 136,
  yago: 136,
  "bruno rafael": 217, // Bruno Tesouro
  "bruno tesouro": 217,
  "vinicius santos": 266, // Vinicius José
  "vinícius santos": 266,
  "ryan gonzalez": 252, // Ryan Gonzales
  "ryan gonzales": 252,
  danilo: 207, // Cantionilo
  cantionilo: 207,
  gustavo: 270, // Gustavo Martins
  "gustavo martins": 270,
  "everton silva": 265,
  "éverton silva": 265,
  italo: 263,
  "ítalo": 263,
  nadson: 230,
  "nádson": 230,
  raul: 601, // GK Raul Jonas
  rafinha: 538,
  "joao victor": 213,
  "joão victor": 213,
  "joao paulo": 7,
  "joão paulo": 7,
};

const SPELL_TO_DB = {
  "giva santos": "Giva",
  yuri: "Yuri Lara",
  "yago cesar": "Yago",
  "yago césar": "Yago",
  "bruno rafael": "Bruno Tesouro",
  "vinicius santos": "Vinicius José",
  "ryan gonzalez": "Ryan Gonzales",
  danilo: "Cantionilo",
  gustavo: "Gustavo Martins",
  "everton silva": "Éverton Silva",
  mozart: "Mozart Santos",
  "lucio flavio": "Lucio Flavio",
  "lúcio flávio": "Lucio Flavio",
};

const CREATE_PLAYERS = [
  { name: "João Victor Pinheiro", position: "Goleiro" },
  { name: "José Victor", position: "Goleiro" },
  { name: "Pedro Rocha", position: "Lateral" },
  { name: "Paquetá", position: "Meia" },
];

const MANAGER_ALIASES = {
  mozart: "mozart santos",
  "adriano rodrigues": "adriano rodrigues",
  "bruno pivetti": "bruno pivetti",
  "ney franco": "ney franco",
  "lucio flavio": "lucio flavio",
  "lúcio flávio": "lucio flavio",
};

const STADIUM_MAP = {
  "rei pele": { prefer: ["rei pele", "trapichao"] },
  "coaracy da mata fonseca": { prefer: ["coaracy"] },
  "juca sampaio": { prefer: ["juca sampaio"] },
  "universitario da ufal": {
    prefer: ["universitario", "ufal"],
    create: { name: "Estádio Universitário da UFAL", city: "Maceió", state: "AL" },
  },
  "paulo barreto": {
    prefer: ["paulo barreto"],
    create: { name: "Estádio Paulo Barreto", city: "Lagarto", state: "SE" },
  },
  arruda: { prefer: ["arruda"] },
  "arena castelao": { prefer: ["castelao"], cityHint: "fortaleza" },
  castelao: { prefer: ["castelao"], cityHint: "sao luis" },
  "do junco": {
    prefer: ["junco"],
    create: { name: "Estádio do Junco", city: "Sobral", state: "CE" },
  },
  "edson matias": {
    prefer: ["edson matias"],
    create: { name: "Estádio Edson Matias", city: "Olho d'Água das Flores", state: "AL" },
  },
  "nelson peixoto feijo": { prefer: ["nelson peixoto", "nelsao"] },
  "dos aflitos": { prefer: ["aflitos"] },
  "anibal batista de toledo": {
    prefer: ["anibal", "toledo"],
    create: { name: "Estádio Anibal Batista de Toledo", city: "Aparecida de Goiânia", state: "GO" },
  },
  "moises lucarelli": { prefer: ["moises lucarelli", "lucarelli"] },
  "augusto bauer": { prefer: ["augusto bauer"] },
  "germano kruger": { prefer: ["germano kruger"] },
  engenhao: {
    prefer: ["engenhao", "nilton santos"],
    create: { name: "Estádio Nilton Santos (Engenhão)", city: "Rio de Janeiro", state: "RJ" },
  },
  baenao: {
    prefer: ["baenao"],
    create: { name: "Estádio Baenão", city: "Belém", state: "PA" },
  },
  "lourival baptista": {
    prefer: ["lourival baptista", "batistao"],
    create: { name: "Estádio Lourival Baptista", city: "Aracaju", state: "SE" },
  },
  "bento freitas": {
    prefer: ["bento freitas"],
    create: { name: "Estádio Bento Freitas", city: "Pelotas", state: "RS" },
  },
  "brinco de ouro da princesa": { prefer: ["brinco de ouro"] },
  cafe: { prefer: ["do cafe", "cafe"] },
  "arena independencia": { prefer: ["independencia"] },
  "haile pinheiro": {
    prefer: ["haile pinheiro", "serrinha"],
    create: { name: "Estádio Hailé Pinheiro", city: "Goiânia", state: "GO" },
  },
  "sao januario": { prefer: ["januario"] },
  barradao: { prefer: ["barradao"] },
  ressacada: {
    prefer: ["ressacada"],
    create: { name: "Estádio da Ressacada", city: "Florianópolis", state: "SC" },
  },
  "couto pereira": {
    prefer: ["couto pereira"],
    create: { name: "Estádio Couto Pereira", city: "Curitiba", state: "PR" },
  },
};

function parseRef(raw) {
  const m = String(raw ?? "").trim().match(/^(.*?)(?:-([A-Z]{2}))?$/);
  return { name: (m?.[1] ?? raw).trim(), state: m?.[2] ?? null };
}

function phaseRoundFor(g) {
  return { phase: g.phase ?? null, round: g.round ?? null };
}

try {
  await client.query("BEGIN");

  for (const cp of CREATE_PLAYERS) {
    let { rows } = await client.query(
      `SELECT id, name FROM players WHERE lower(name)=lower($1)`,
      [cp.name],
    );
    if (!rows[0]) {
      if (DRY) {
        console.log("would create player", cp.name);
        FORCE_ID[norm(cp.name)] = -Math.abs(norm(cp.name).length);
      } else {
        ({ rows } = await client.query(
          `INSERT INTO players (name, position) VALUES ($1, $2) RETURNING id, name`,
          [cp.name, cp.position],
        ));
        console.log("+ player", rows[0]);
        FORCE_ID[norm(cp.name)] = rows[0].id;
      }
    } else {
      FORCE_ID[norm(cp.name)] = rows[0].id;
    }
  }
  // José Victor & João Victor Pinheiro treated as distinct unless only one created;
  // if José Victor should share Pinheiro identity, map after create:
  if (FORCE_ID[norm("José Victor")] && FORCE_ID[norm("João Victor Pinheiro")]) {
    // keep separate: Alagoano R1 José Victor vs Copa Alagoas Pinheiro
  }

  const { rows: mgrRows } = await client.query(`SELECT id, name FROM managers`);
  function resolveManager(name) {
    const key = norm(name);
    const want = MANAGER_ALIASES[key] ?? key;
    const hit = mgrRows.find((m) => norm(m.name) === want);
    if (hit) return hit;
    const soft = mgrRows.filter(
      (m) => norm(m.name).includes(want) || want.includes(norm(m.name)),
    );
    if (soft.length === 1) return soft[0];
    throw new Error(`manager not found: ${name}`);
  }

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

  const { rows: allStadiums } = await client.query(`SELECT id, name FROM stadiums`);
  async function resolveStadium(name, cityUf) {
    if (!name) return null;
    const key = norm(name);
    const map = STADIUM_MAP[key];
    const prefers = map?.prefer ?? [key];
    const cityHint = map?.cityHint ?? norm(cityUf ?? "");

    if (key === "castelao" || key === "arena castelao") {
      const hits = allStadiums.filter((s) => norm(s.name).includes("castelao"));
      if (cityHint.includes("sao luis") || cityHint.includes("luis")) {
        const sl = hits.find(
          (s) =>
            norm(s.name).includes("sao luis") ||
            norm(s.name).includes("luis") ||
            norm(s.name).includes("castelao (sao"),
        );
        if (sl) return sl.id;
      }
      if (cityHint.includes("fortaleza")) {
        const ft = hits.find(
          (s) =>
            norm(s.name).includes("fortaleza") ||
            norm(s.name).includes("arena castelao"),
        );
        if (ft) return ft.id;
        if (hits.length === 1) return hits[0].id;
      }
    }

    for (const pref of prefers) {
      const hits = allStadiums.filter((s) => norm(s.name).includes(pref));
      if (hits.length >= 1) {
        hits.sort((a, b) => a.name.length - b.name.length);
        return hits[0].id;
      }
    }

    if (map?.create) {
      if (DRY) {
        console.log("would create stadium", map.create.name);
        return null;
      }
      const ins = await client.query(
        `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil') RETURNING id, name`,
        [map.create.name, map.create.city, map.create.state],
      );
      console.log("+ stadium", ins.rows[0]);
      allStadiums.push(ins.rows[0]);
      return ins.rows[0].id;
    }

    if (DRY) {
      console.log("would create stadium generic", name);
      return null;
    }
    const m = String(cityUf ?? "").match(/^(.+)-([A-Z]{2})$/);
    const ins = await client.query(
      `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil') RETURNING id, name`,
      [
        name.startsWith("Estádio") || name.startsWith("Arena") ? name : `Estádio ${name}`,
        m?.[1] ?? null,
        m?.[2] ?? null,
      ],
    );
    console.log("+ stadium", ins.rows[0]);
    allStadiums.push(ins.rows[0]);
    return ins.rows[0].id;
  }

  const { rows: allPlayers } = await client.query(`SELECT id, name FROM players`);
  const playersByNorm = new Map();
  for (const p of allPlayers) {
    const k = norm(p.name);
    if (!playersByNorm.has(k)) playersByNorm.set(k, []);
    playersByNorm.get(k).push(p);
  }

  async function resolvePlayer(name, game) {
    const key = norm(name);

    // Marquinhos split by date
    if (key === "marquinhos") {
      const id = game.date >= "2021-08-10" ? 600 : 229;
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [id]);
      if (!rows[0]) throw new Error(`Marquinhos id ${id} missing`);
      return rows[0];
    }

    if (FORCE_ID[key] != null) {
      if (FORCE_ID[key] < 0) return { id: FORCE_ID[key], name };
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
        FORCE_ID[key],
      ]);
      if (!rows[0]) throw new Error(`FORCE_ID missing ${name}`);
      return rows[0];
    }

    if (SPELL_TO_DB[key]) {
      const spellKey = norm(SPELL_TO_DB[key]);
      const hits = playersByNorm.get(spellKey) ?? [];
      if (hits.length === 1) return hits[0];
      const exact = allPlayers.find((p) => p.name === SPELL_TO_DB[key]);
      if (exact) return exact;
    }

    const direct = playersByNorm.get(key) ?? [];
    if (direct.length === 1) return direct[0];
    if (direct.length > 1) {
      throw new Error(
        `player ambiguous: ${name} → ${direct.map((p) => `#${p.id} ${p.name}`).join(", ")}`,
      );
    }
    throw new Error(`player unresolved: ${name}`);
  }

  // Pre-resolve
  {
    const names = new Set();
    for (const g of GAMES) {
      resolveManager(g.mgr);
      for (const s of g.starters) names.add(s);
      for (const [a, b] of g.subs) {
        names.add(a);
        names.add(b);
      }
      for (const x of g.goals) names.add(x.p);
    }
    for (const g of GAMES) {
      for (const n of g.starters) await resolvePlayer(n, g);
      for (const [a, b] of g.subs) {
        await resolvePlayer(a, g);
        await resolvePlayer(b, g);
      }
      for (const x of g.goals) await resolvePlayer(x.p, g);
    }
    console.log(`resolved players across ${GAMES.length} games, managers ok`);
  }

  const { rows: dbMatches } = await client.query(
    `
    SELECT m.id, m.match_date::text AS d, o.name AS opp, c.name AS comp, m.home_away,
           m.goals_for, m.goals_against
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    JOIN competitions c ON c.id=m.competition_id
    WHERE m.season=$1 AND m.is_friendly=false
  `,
    [SEASON],
  );

  function findMatch(g) {
    const sameDate = dbMatches.filter((m) => m.d.slice(0, 10) === g.date);
    if (sameDate.length === 1) return sameDate[0];
    const oppKey = norm(g.opp).split("-")[0].trim();
    const hit = sameDate.filter((m) => {
      const on = norm(m.opp);
      return on.includes(oppKey) || oppKey.includes(on.split("-")[0].trim());
    });
    if (hit.length === 1) return hit[0];
    const compHint =
      g.comp === "Alagoano"
        ? "alagoano"
        : g.comp === "Copa Alagoas"
          ? "copa alagoas"
          : g.comp === "Nordeste"
            ? "nordeste"
            : g.comp === "Copa do Brasil"
              ? "copa do brasil"
              : "serie b";
    const pool2 = hit.length ? hit : sameDate;
    const byComp = pool2.filter((m) => norm(m.comp).includes(compHint));
    if (byComp.length === 1) return byComp[0];
    const byScore = pool2.filter(
      (m) => Number(m.goals_for) === g.gf && Number(m.goals_against) === g.ga,
    );
    if (byScore.length === 1) return byScore[0];
    throw new Error(
      `match not found n=${g.n} ${g.date} ${g.opp} candidates=${sameDate.map((m) => m.id + ":" + m.opp + ":" + m.comp).join(",")}`,
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
    const renda = g.gatesClosed ? null : (g.renda ?? null);

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
          g.pensFor ?? null,
          g.pensAgainst ?? null,
          g.goals.map((x) => x.p).join(", ") || null,
        ],
      );

      await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [
        match.id,
      ]);

      const lineupIdByPlayer = new Map();
      let sort = 0;
      for (const name of g.starters) {
        const p = await resolvePlayer(name, g);
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
        const p = await resolvePlayer(name, g);
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
        const p = await resolvePlayer(goal.p, g);
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
        const outP = await resolvePlayer(outName, g);
        const inP = await resolvePlayer(inName, g);
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

  const relatedPairs = [
    [9, 10],
    [11, 12],
  ];
  for (const [a, b] of relatedPairs) {
    const ida = applied.find((x) => x.n === a);
    const volta = applied.find((x) => x.n === b);
    if (ida && volta && !DRY) {
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
        ida.matchId,
        volta.matchId,
      ]);
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
        volta.matchId,
        ida.matchId,
      ]);
      console.log(`* related ${ida.matchId}↔${volta.matchId}`);
    }
  }

  // Mark Alagoano 2021 champion (final volta)
  if (!DRY) {
    const final = applied.find((x) => x.n === 12);
    if (final) {
      const { rows: scs } = await client.query(
        `
        SELECT scs.id FROM season_competition_stats scs
        JOIN competitions c ON c.id=scs.competition_id
        WHERE scs.season=$1 AND c.name ILIKE '%Campeonato Alagoano%'
          AND c.name NOT ILIKE '%2%'
        LIMIT 1
      `,
        [SEASON],
      );
      if (scs[0]) {
        await client.query(
          `UPDATE season_competition_stats
           SET is_champion=true, final_match_id=$2
           WHERE id=$1`,
          [scs[0].id, final.matchId],
        );
        console.log(`* Alagoano 2021 champion final #${final.matchId}`);
      }
    }
  }

  if (!DRY) {
    const { rows: sheetStats } = await client.query(
      `
      WITH apps AS (
        SELECT ml.player_id,
          count(DISTINCT ml.match_id)::int AS appearances
        FROM match_lineups ml
        JOIN matches m ON m.id=ml.match_id
        WHERE m.season=$1 AND ml.side='csa' AND ml.player_id IS NOT NULL
          AND m.match_date >= '2021-01-30'
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
        WHERE m.season=$1 AND mg.side='csa' AND mg.is_own_goal=false
          AND mg.scorer_player_id IS NOT NULL
          AND m.match_date >= '2021-01-30'
        GROUP BY mg.scorer_player_id
      )
      SELECT a.player_id, a.appearances, coalesce(g.goals,0) AS goals
      FROM apps a
      LEFT JOIN goals g ON g.player_id=a.player_id
    `,
      [SEASON],
    );
    let upserted = 0;
    for (const s of sheetStats) {
      const { rows: cur } = await client.query(
        `SELECT id, appearances, goals FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [s.player_id, SEASON],
      );
      if (cur[0]) {
        // Preserve Jan/2020-calendar leftover apps by GREATEST for players who also played then;
        // for pure 2021 sheet players SET from sheets.
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
           VALUES ($1,$2,$3,$4,0)`,
          [s.player_id, SEASON, s.appearances, s.goals],
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
