/**
 * APPLY CSA 2018 match sheets (58 official games: Alagoano 12, Nordeste 6,
 * Copa do Brasil 2, Série B 38) + meta (attendance/renda/phase/round/stadiums).
 * Official matches (season=2018, is_friendly=false) already exist in DB;
 * this script only attaches sheets/meta to them (no INSERT for matches).
 * Own goals FOR CSA (e.g. Nino/Criciúma, Leandro Amaro/Oeste, Caique Baiano/ASA)
 * are tracked via own_goals_for_count only — never resolved as CSA players,
 * never inserted into match_goals.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES, convertMinute, norm } from "./data/season-2018-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");
const SEASON = "2018";

// Disambiguate players with duplicate/short/spelling-variant names in the paste.
const FORCE_ID = {
  mota: 62, // Willis Mota (bare "Mota" GK, matches pre-existing 2018 app=17 stat)
  michel: 55, // Michel Douglas (bare "Michel" striker; also explicit "Michel Douglas" once)
  "michel douglas": 55,
  talisson: 144, // Talisson Calcinha
  leandro: 59, // bare "Leandro" in Atlético-GO lineup -> Leandro Souza
  caique: 640, // DB spells "Caiquec"
  rony: 158, // Rony Fernandes
  alemao: 138, // Alemão Júnior
  felipe: 133, // Felipe Garcia (GK, bare "Felipe" from round 20 on)
  maxuell: 89, // Maxuell Samurai
  "johnatan vital": 140, // DB spells just "Vital"
  giva: 515, // vs #141 Giva (unrelated, 2021-2022 player)
  rafinha: 23, // vs #538 Rafinha (unrelated)
  yuri: 154, // Yuri Lara (bare "Yuri" volante)
  daniel: 53, // bare "Daniel" (Nordeste R6 sub) -> Daniel Costa, per context "Yago (Daniel)"
  echeverria: 126, // Eduardo Echeverría (also spelled "Echeverría")
  edinho: 70, // vs #610 Edinho (unrelated split)
  walter: 605, // vs #61 Walter (unrelated)
  "jhon lennon": 131, // John Lennon (Nordeste section spells "Jhon")
  "john lennon": 131,
};

const MANAGER_ALIASES = {
  "flavio araujo": "flavio araujo",
  jacozinho: "jacozinho",
  "marcelo cabo": "marcelo cabo",
};

const STADIUM_MAP = {
  "rei pele": { prefer: ["rei pele", "trapichao"] },
  coaracy: { prefer: ["coaracy"] },
  "coaracy da mata fonseca": { prefer: ["coaracy"] },
  cafe: { prefer: ["estadio do cafe", "do cafe"] },
  "arena castelao": { prefer: ["castelao"], cityHint: "fortaleza" },
  castelao: { prefer: ["castelao"], cityHint: "sao luis" },
  heriberto: { prefer: ["heriberto"] },
  "heriberto hulse": { prefer: ["heriberto"] },
  "moises lucarelli": { prefer: ["moises lucarelli", "lucarelli"] },
  "serra dourada": { prefer: ["serra dourada"] },
  barueri: { prefer: ["barueri"] },
  "arena barueri": { prefer: ["barueri"] },
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
    const og = ownGoalsCount(g);
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
           own_goals_for_count=$10,
           scorers=$11
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
      og,
      subs: g.subs.filter((s) => s[0] && s[1]).length,
    });
    console.log(
      `* n=${g.n} #${match.id} ${g.date} [${g.comp}] ${g.opp} mgr=${mgr.name} goals=${g.goals.length} og=${og} subs=${applied[applied.length - 1].subs}`,
    );
  }

  // Link Alagoano semifinal/final legs.
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
