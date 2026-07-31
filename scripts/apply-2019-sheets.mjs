/**
 * APPLY CSA 2019 match sheets (62 games from paste: Amistoso, Alagoano, Nordeste,
 * Copa do Brasil, Série A) + meta.
 * Amistoso games are friendlies not yet in `matches` — find-or-insert them under a
 * generic "Amistoso" competition (type=friendly), is_friendly=true.
 * Official matches (season=2019, is_friendly=false) already exist in DB (59 rows);
 * this script only attaches sheets/meta to them (no INSERT for official matches).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES, convertMinute, norm } from "./data/season-2019-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");
const SEASON = "2019";

const FORCE_ID = {
  cassiano: 79, // vs #611 Cassiano
  rafinha: 23, // vs #538 Rafinha
  robinho: 196, // vs #492/#493 Robinho
  regis: 201, // "Régis" bare -> Régis Souza (vs unrelated #582 "Régis")
  fabricio: 198, // "Fabricio"/"Fabrício" -> Fabrício Santana (vs unrelated #251 "Fabrício")
  "fabrício": 198,
  "jonatan gomez": 192, // -> Jonathan Gómez (DB spells with "h")
  "jonatan gómez": 192,
  "jean kleber": 105, // -> Jean Cléber (DB spells with C)
  "jean kléber": 105,
  "joao vitor": 24,
  "joão vitor": 24,
};

const SPELL_TO_DB = {
  leo: "Léo Santos",
  "léo": "Léo Santos",
  rony: "Rony Fernandes",
  safira: "Alisson Safira",
  hiago: "Hiago Ramiro",
  euller: "Euller Silva",
  ramon: "Ramon",
  "ramon siqueira": "Ramon",
};

const CREATE_PLAYERS = [
  { name: "Joelson", position: null },
  { name: "Lucas Rafael", position: null },
];

const MANAGER_ALIASES = {
  "marcelo cabo": "marcelo cabo",
  "argel fucks": "argel fuchs",
  jacozinho: "jacozinho",
};

const STADIUM_MAP = {
  "rei pele": { prefer: ["rei pele", "trapichao"] },
  arruda: { prefer: ["arruda"] },
  albertao: { prefer: ["albertao"] },
  "arena castelao": { prefer: ["castelao"], cityHint: "fortaleza" },
  castelao: { prefer: ["castelao"], cityHint: "sao luis" },
  almeidao: {
    prefer: ["almeidao"],
    create: { name: "Estádio Almeidão", city: "João Pessoa", state: "PB" },
  },
  "mane garrincha": {
    prefer: ["mane garrincha"],
    create: { name: "Arena Mané Garrincha", city: "Brasília", state: "DF" },
  },
  corinthians: {
    prefer: ["corinthians"],
    create: { name: "Arena Corinthians", city: "São Paulo", state: "SP" },
  },
  "kleber andrade": {
    prefer: ["kleber andrade"],
    create: { name: "Estádio Kléber Andrade", city: "Cariacica", state: "ES" },
  },
  morumbi: {
    prefer: ["morumbi"],
    create: { name: "Estádio do Morumbi", city: "São Paulo", state: "SP" },
  },
  pacaembu: {
    prefer: ["pacaembu"],
    create: { name: "Estádio do Pacaembu", city: "São Paulo", state: "SP" },
  },
  "vila belmiro": {
    prefer: ["vila belmiro"],
    create: { name: "Estádio Vila Belmiro", city: "Santos", state: "SP" },
  },
  "serra dourada": {
    prefer: ["serra dourada"],
    create: { name: "Estádio Serra Dourada", city: "Goiânia", state: "GO" },
  },
  baixada: {
    prefer: ["baixada"],
    create: { name: "Arena da Baixada", city: "Curitiba", state: "PR" },
  },
  "gremio": {
    prefer: ["gremio"],
    create: { name: "Arena do Grêmio", city: "Porto Alegre", state: "RS" },
  },
  maracana: {
    prefer: ["maracana"],
    create: { name: "Estádio Maracanã", city: "Rio de Janeiro", state: "RJ" },
  },
};

function parseRef(raw) {
  const m = String(raw ?? "").trim().match(/^(.*?)(?:-([A-Z]{2}))?$/);
  return { name: (m?.[1] ?? raw).trim(), state: m?.[2] ?? null };
}

function phaseRoundFor(g) {
  return { phase: g.phase ?? null, round: g.round || null };
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
    if (!raw) return { id: null, name: null };
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
          (s) => norm(s.name).includes("sao luis") || norm(s.name).includes("luis"),
        );
        if (sl) return sl.id;
      }
      if (cityHint.includes("fortaleza")) {
        const ft = hits.find(
          (s) => norm(s.name).includes("fortaleza") || norm(s.name).includes("arena castelao"),
        );
        if (ft) return ft.id;
        const plain = hits.find((s) => !norm(s.name).includes("sao luis") && !norm(s.name).includes("luis"));
        if (plain) return plain.id;
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

  async function resolvePlayer(name) {
    const key = norm(name);

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

  // Pre-resolve (preflight) — fail loudly on any unresolved/ambiguous name.
  {
    const names = new Set();
    for (const g of GAMES) {
      resolveManager(g.mgr);
      for (const s of g.starters) names.add(s);
      for (const [a, b] of g.subs) {
        if (a) names.add(a);
        if (b) names.add(b);
      }
      for (const x of g.goals) names.add(x.p);
    }
    for (const n of names) await resolvePlayer(n);
    console.log(`resolved ${names.size} players, managers ok, games=${GAMES.length}`);
  }

  // Official matches already exist in DB for season=2019, is_friendly=false.
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
        : g.comp === "Nordeste"
          ? "nordeste"
          : g.comp === "Copa do Brasil"
            ? "copa do brasil"
            : g.comp === "Série A"
              ? "serie a"
              : "";
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

  // "Amistoso" competition — find or create (type=friendly), reused for all 3 friendlies.
  async function resolveAmistosoCompetition() {
    const { rows } = await client.query(
      `SELECT id, name FROM competitions WHERE lower(name)=lower($1)`,
      ["Amistoso"],
    );
    if (rows[0]) return rows[0].id;
    if (DRY) {
      console.log("would create competition 'Amistoso' (type=friendly)");
      return -1;
    }
    const ins = await client.query(
      `INSERT INTO competitions (name, type) VALUES ($1, 'friendly') RETURNING id, name`,
      ["Amistoso"],
    );
    console.log("+ competition", ins.rows[0]);
    return ins.rows[0].id;
  }

  async function resolveOpponent(name) {
    const { rows } = await client.query(
      `SELECT id, name FROM opponents WHERE lower(name)=lower($1)`,
      [name],
    );
    if (rows[0]) return rows[0].id;
    const like = await client.query(
      `SELECT id, name FROM opponents WHERE lower(name) LIKE lower($1)`,
      [`${name.split("-")[0].trim()}%`],
    );
    if (like.rows.length === 1) return like.rows[0].id;
    if (DRY) {
      console.log("would create opponent", name);
      return -1;
    }
    const ins = await client.query(
      `INSERT INTO opponents (name) VALUES ($1) RETURNING id, name`,
      [name],
    );
    console.log("+ opponent", ins.rows[0]);
    return ins.rows[0].id;
  }

  // Find-or-insert a friendly match (Amistoso games are not in `matches` yet).
  async function findOrCreateFriendly(g, amistosoCompId) {
    const { rows } = await client.query(
      `
      SELECT m.id, m.match_date::text AS d, o.name AS opp, m.home_away, m.goals_for, m.goals_against
      FROM matches m
      JOIN opponents o ON o.id=m.opponent_id
      WHERE m.match_date=$1 AND m.is_friendly=true
      `,
      [g.date],
    );
    if (rows[0]) return rows[0];
    if (DRY) {
      console.log(`would INSERT friendly match ${g.date} ${g.opp} (${g.ha}) ${g.gf}-${g.ga}`);
      return { id: -1, d: g.date, opp: g.opp, home_away: g.ha, goals_for: g.gf, goals_against: g.ga };
    }
    const opponentId = await resolveOpponent(g.opp);
    const result = g.gf > g.ga ? "win" : g.gf < g.ga ? "loss" : "draw";
    const ins = await client.query(
      `
      INSERT INTO matches
        (match_date, season, opponent_id, goals_for, goals_against, result, home_away,
         competition_id, is_walkover, is_friendly, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,true,'played')
      RETURNING id
      `,
      [g.date, SEASON, opponentId, g.gf, g.ga, result, g.ha, amistosoCompId],
    );
    console.log(`+ friendly match #${ins.rows[0].id} ${g.date} ${g.opp}`);
    return { id: ins.rows[0].id, d: g.date, opp: g.opp, home_away: g.ha };
  }

  const amistosoCompId = await resolveAmistosoCompetition();

  const applied = [];

  for (const g of GAMES) {
    const match =
      g.comp === "Amistoso" ? await findOrCreateFriendly(g, amistosoCompId) : findMatch(g);
    const mgr = resolveManager(g.mgr);
    const ref = await resolveRef(g.ref);
    const stadiumId = await resolveStadium(g.stadium, g.cityUf);
    const pr = phaseRoundFor(g);
    const att = g.att ?? null;
    const attP = g.attP ?? null;
    const renda = g.renda ?? null;

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
          ref.id != null && ref.id > 0 ? ref.id : null,
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
        if (inn && !benchNames.includes(inn)) benchNames.push(inn);
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
        if (!outName || !inName) continue;
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
      comp: g.comp,
      mgr: mgr.name,
      goals: g.goals.length,
      subs: g.subs.filter((s) => s[0] && s[1]).length,
    });
    console.log(
      `* n=${g.n} #${match.id} ${g.date} [${g.comp}] ${g.opp} mgr=${mgr.name} goals=${g.goals.length} subs=${applied[applied.length - 1].subs}`,
    );
  }

  if (!DRY) {
    const { rows: sheetStats } = await client.query(
      `
      WITH apps AS (
        SELECT ml.player_id,
          count(DISTINCT ml.match_id)::int AS appearances
        FROM match_lineups ml
        JOIN matches m ON m.id=ml.match_id
        WHERE m.season=$1 AND m.is_friendly=false AND ml.side='csa' AND ml.player_id IS NOT NULL
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
        WHERE m.season=$1 AND m.is_friendly=false AND mg.side='csa' AND mg.is_own_goal=false
          AND mg.scorer_player_id IS NOT NULL
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
        await client.query(
          `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
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
    console.log(`roster sync (official matches only) rows ${upserted}`);
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
