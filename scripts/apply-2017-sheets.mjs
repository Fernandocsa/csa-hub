/**
 * APPLY CSA 2017 match sheets (52 official games: Série C 24, Alagoano 19,
 * Copa do Nordeste 8 [6 group + 2 Parnahyba pré-Nordeste-2018], Copa do Brasil 1)
 * + meta (attendance/renda/phase/round/stadiums/penalties).
 * Official matches (season=2017, is_friendly=false) already exist in DB;
 * this script only attaches sheets/meta to them (no INSERT for matches).
 * Own goals FOR CSA (e.g. Pablo/Fortaleza final ida) are tracked via
 * own_goals_for_count only — never resolved as CSA players, never inserted
 * into match_goals.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES, convertMinute, norm } from "./data/season-2017-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");
const SEASON = "2017";

// Disambiguate players with duplicate/short/spelling-variant names in the paste.
const FORCE_ID = {
  cassiano: 611, // Cassiano Juvêncio da Silva (Atacante, 2017); DB #79 is Cassiano Dias Moreira (2019, unrelated split)
  edinho: 610, // Francisco Edson Moreira da Silva (Ponta Esquerda, 2017); DB #70 is Edimo Ferreira Campos (2018 Volante, unrelated split)
  michel: 55, // Michel Douglas (Atacante) — distinct from Michel Schmöller (#91), spelled out separately in paste
  rafinha: 23, // Rafael Chagas Machado (2017 starter); #538 is Rafael Baldini Massola (unrelated, 2021/2024)
  raul: 63, // Raul Diogo Souza Rocha (Lateral Esquerdo); #601 is Raul Jonas Steffens (GK, unrelated 2021)
  mota: 62, // Willis Mota (GK); #245 is Bruno Mota (unrelated, Meia)
  maxuell: 89, // Maxuell Samurai (bare "Maxuell")
  denilson: 88, // Denilson (Zagueiro, 1988); #290 is Denílson (1995, unrelated)
  caique: 640, // DB spells "Caiquec" (Meia, 1987); distinct from Caíque #86 (GK, 1997, no 2017 apps)
  cleyton: 87, // Cleyton Lima (bare "Cleyton" throughout paste)
};

// Players truly absent from the DB (verified via preflight — not resolvable
// by exact/fuzzy name match, no FORCE_ID candidate either).
const CREATE_PLAYERS = {
  "luis ricardo": { name: "Luís Ricardo", position: "Atacante" },
};

const MANAGER_ALIASES = {};

const STADIUM_MAP = {
  "rei pele": { prefer: ["rei pele"] },
  "gerson amaral": { prefer: ["gerson amaral"] },
  frasqueirao: { prefer: ["frasqueirao"] },
  "edson matias": { prefer: ["edson matias"] },
  "jose gomes da costa": { prefer: ["jose gomes"] },
  "coaracy da mata fonseca": { prefer: ["coaracy da mata"] },
  "cornelio de barros": { prefer: ["cornelio de barros"] },
  mangueirao: { prefer: ["mangueirao"] },
  pantanal: { prefer: ["pantanal"] },
  "antonio guimaraes de almeida": { prefer: ["antonio de almeida"] },
  "walter ribeiro": { prefer: ["walter ribeiro"] },
  "lourival baptista": { prefer: ["lourival baptista"] },
  "arena castelao": { prefer: ["castelao"], cityHint: "fortaleza" },
  castelao: { prefer: ["castelao"], cityHint: "sao luis" },
};

function parseRef(raw) {
  const m = String(raw ?? "").trim().match(/^(.*?)(?:-([A-Z]{2}))?$/);
  return { name: (m?.[1] ?? raw).trim(), state: m?.[2] ?? null };
}

function phaseRoundFor(g) {
  return { phase: g.phase ?? null, round: g.round || null };
}

function ownGoalsCount(g) {
  return Array.isArray(g.ownGoalsFor) ? g.ownGoalsFor.length : 0;
}

function scorersText(g) {
  const parts = g.goals.map((x) => x.p);
  if (ownGoalsCount(g) > 0) parts.unshift("GPF");
  return parts.join(", ") || null;
}

try {
  await client.query("BEGIN");

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
        const plain = hits.find(
          (s) => !norm(s.name).includes("sao luis") && !norm(s.name).includes("luis"),
        );
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

    if (DRY) {
      console.log("would create stadium generic", name, cityUf);
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
  const createdPlayerCache = new Map();

  async function resolvePlayer(name) {
    const key = norm(name);

    if (FORCE_ID[key] != null) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
        FORCE_ID[key],
      ]);
      if (!rows[0]) throw new Error(`FORCE_ID missing ${name}`);
      return rows[0];
    }

    const direct = playersByNorm.get(key) ?? [];
    if (direct.length === 1) return direct[0];
    if (direct.length > 1) {
      throw new Error(
        `player ambiguous: ${name} → ${direct.map((p) => `#${p.id} ${p.name}`).join(", ")}`,
      );
    }

    if (CREATE_PLAYERS[key]) {
      if (createdPlayerCache.has(key)) return createdPlayerCache.get(key);
      const spec = CREATE_PLAYERS[key];
      if (DRY) {
        console.log("would create player", spec.name, spec.position);
        const fake = { id: -1, name: spec.name };
        createdPlayerCache.set(key, fake);
        return fake;
      }
      const ins = await client.query(
        `INSERT INTO players (name, position, nationality, secondary_positions)
         VALUES ($1, $2, 'Brasil', '{}'::text[]) RETURNING id, name`,
        [spec.name, spec.position ?? null],
      );
      console.log("+ player", ins.rows[0]);
      createdPlayerCache.set(key, ins.rows[0]);
      playersByNorm.set(key, [ins.rows[0]]);
      return ins.rows[0];
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

  function compHintFor(comp) {
    if (comp === "Alagoano") return "campeonato alagoano";
    if (comp === "Nordeste") return "copa do nordeste";
    if (comp === "Copa do Brasil") return "copa do brasil";
    return "serie c";
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
    const compHint = compHintFor(g.comp);
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
    const og = ownGoalsCount(g);
    const att = g.gatesClosed ? null : (g.att ?? null);
    const attP = g.gatesClosed ? null : (g.attP ?? null);
    const renda = g.gatesClosed ? null : (g.renda ?? null);
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
           own_goals_for_count=$10,
           scorers=$11,
           penalties_for=COALESCE($12, penalties_for),
           penalties_against=COALESCE($13, penalties_against)
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
          og,
          scorersText(g),
          pensFor,
          pensAgainst,
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
      phase: g.phase ?? null,
      round: g.round || null,
      mgr: mgr.name,
      goals: g.goals.length,
      og,
      subs: g.subs.filter((s) => s[0] && s[1]).length,
    });
    console.log(
      `* n=${g.n} #${match.id} ${g.date} [${g.comp}${g.phase ? "/" + g.phase : ""}] ${g.opp} mgr=${mgr.name} goals=${g.goals.length} og=${og} subs=${applied[applied.length - 1].subs}${pensFor != null ? ` pens=${pensFor}x${pensAgainst}` : ""}`,
    );
  }

  // Link related legs generically: any (comp, phase, opp) bucket with exactly
  // two applied games on "Jogo de ida"/"Jogo de volta" rounds is a two-leg tie
  // (Alagoano SF/Final, Parnahyba, Série C QF/SF/Final).
  const legBuckets = new Map();
  for (const a of applied) {
    if (a.round !== "Jogo de ida" && a.round !== "Jogo de volta") continue;
    const key = `${a.comp}|${a.phase}|${norm(a.opp)}`;
    if (!legBuckets.has(key)) legBuckets.set(key, []);
    legBuckets.get(key).push(a);
  }
  let linked = 0;
  for (const [key, legs] of legBuckets) {
    if (legs.length !== 2) {
      console.warn(`! leg bucket ${key} has ${legs.length} games (expected 2), skipping link`);
      continue;
    }
    const [a, b] = legs;
    if (!DRY) {
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
        a.matchId,
        b.matchId,
      ]);
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
        b.matchId,
        a.matchId,
      ]);
    }
    console.log(`* related ${a.matchId}↔${b.matchId} (${key})`);
    linked += 1;
  }
  console.log(`linked ${linked} two-leg tie(s)`);

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
