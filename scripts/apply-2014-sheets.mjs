/**
 * Enrich existing 2014 matches with sheets/meta from season-2014-sheets.csv.
 * Confirmed reuses (user): Daniel Costa #53, Jeferson Maranhense #117,
 * Pantera #81, Josimar #151, Breno #1191. Other nicknames create new players.
 *
 * Usage: node scripts/apply-2014-sheets.mjs [--dry]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");

loadEnvFromDotenv(".env");
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

function fixPlayerName(n) {
  return String(n)
    .trim()
    .replace(/^Jefferson Maranhense$/i, "Jeferson Maranhense");
}

function parseNestedSubs(inner) {
  inner = inner.trim();
  if (!inner) return [];
  if (!inner.includes("(")) return [[null, fixPlayerName(inner)]];
  const m = inner.match(/^(.+?)\s*\((.+)\)$/);
  if (!m) return [[null, fixPlayerName(inner)]];
  const starter = fixPlayerName(m[1].trim());
  const rest = m[2].trim();
  if (!rest) return [[starter, null]];
  if (rest.includes("(")) {
    const m2 = rest.match(/^(.+?)\s*\((.+)\)$/);
    if (m2) {
      return [
        [starter, fixPlayerName(m2[1].trim())],
        [fixPlayerName(m2[1].trim()), fixPlayerName(m2[2].trim())],
      ];
    }
  }
  return [[starter, fixPlayerName(rest)]];
}

function parseLineupField(raw) {
  const starters = [];
  const subs = [];
  if (!raw?.trim()) return { starters, subs };
  for (const sec of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
    if (sec.includes("(")) {
      const pairs = parseNestedSubs(sec);
      if (pairs[0]?.[0]) starters.push(pairs[0][0]);
      for (const [out, inn] of pairs) if (out && inn) subs.push([out, inn]);
    } else {
      starters.push(fixPlayerName(sec));
    }
  }
  return { starters, subs };
}

function parseGoalsCsa(raw) {
  const goals = [];
  let ownGoals = 0;
  if (!raw?.trim()) return { goals, ownGoals };
  for (const part of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
    if (/\(contra/i.test(part)) {
      ownGoals += 1;
      continue;
    }
    const m = part.match(/^(.+?)\s*\((\d+)\)\s*$/);
    if (m) {
      const name = fixPlayerName(m[1].trim());
      for (let i = 0; i < Number(m[2]); i++) goals.push({ p: name });
    } else {
      goals.push({ p: fixPlayerName(part) });
    }
  }
  return { goals, ownGoals };
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const header = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvLine(lines[i]);
    const obj = {};
    for (let c = 0; c < header.length; c++) obj[header[c]] = cols[c] ?? "";
    rows.push(obj);
  }
  return rows;
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseScore(score) {
  const m = String(score).match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!m) throw new Error(`bad score ${score}`);
  return { gf: Number(m[1]), ga: Number(m[2]) };
}

function parseHomeAway(v) {
  const s = String(v).trim().toUpperCase();
  if (s === "C") return "home";
  if (s === "V") return "away";
  throw new Error(`bad home_away ${v}`);
}

function parseRef(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return { name: null, state: null };
  const m = t.match(/^(.*?)(?:-([A-Z]{2}))?$/);
  return { name: (m?.[1] ?? t).trim(), state: m?.[2] ?? null };
}

function parseStadium(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return { name: null, city: null, state: null };
  const m = s.match(/^(.*?)\s*-\s*(.+)-([A-Z]{2})$/);
  if (m) return { name: m[1].trim(), city: m[2].trim(), state: m[3] };
  return { name: s, city: null, state: null };
}

function cleanCoach(name) {
  return String(name ?? "")
    .replace(/\s*\(Interino\)\s*/i, "")
    .trim();
}

/** Confirmed by user — reuse these IDs. */
const FORCE_ID = {
  "daniel costa": 53,
  "jeferson maranhense": 117,
  "jefferson maranhense": 117,
  pantera: 81,
  josimar: 151,
  breno: 1191,
};

try {
  await client.query("BEGIN");

  const csvPath = join(__dirname, "data", "season-2014-sheets.csv");
  const games = parseCsv(readFileSync(csvPath, "utf8")).map((row, idx) => {
    const { gf, ga } = parseScore(row.score);
    const { starters, subs } = parseLineupField(row.lineup);
    const { goals, ownGoals } = parseGoalsCsa(row.goals_csa);
    const stad = parseStadium(row.stadium);
    return {
      n: idx + 1,
      date: row.date,
      phase: row.phase || null,
      round: row.round || null,
      opponent: row.opponent,
      ha: parseHomeAway(row.home_away),
      gf,
      ga,
      stadium: stad.name,
      stadiumCity: stad.city,
      stadiumState: stad.state,
      referee: row.referee,
      attendance_paid: row.attendance_paid ? Number(row.attendance_paid) : null,
      attendance: row.attendance_total ? Number(row.attendance_total) : null,
      revenue: row.revenue ? Number(row.revenue) : null,
      starters,
      subs,
      goals,
      ownGoals,
      coach: cleanCoach(row.coach),
    };
  });
  console.log(`parsed ${games.length} games`);
  for (const g of games) {
    if (g.starters.length && g.starters.length !== 11) {
      console.warn(
        `WARN n=${g.n} ${g.date} ${g.opponent}: ${g.starters.length} starters (expected 11)`,
      );
    }
  }

  const { rows: mgrRows } = await client.query(`SELECT id, name FROM managers`);
  function resolveManager(name) {
    const key = norm(name);
    const hit = mgrRows.find((m) => norm(m.name) === key);
    if (hit) return hit;
    const soft = mgrRows.filter(
      (m) => norm(m.name).includes(key) || key.includes(norm(m.name)),
    );
    if (soft.length === 1) return soft[0];
    throw new Error(`manager not found: ${name}`);
  }

  const refCache = new Map();
  async function resolveRef(raw) {
    const { name, state } = parseRef(raw);
    if (!name) return null;
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
        const fake = { id: -1, name };
        refCache.set(key, fake);
        return fake;
      }
      const ins = await client.query(
        `INSERT INTO referees (name, state) VALUES ($1,$2) RETURNING id, name`,
        [name, state],
      );
      console.log("+ ref", ins.rows[0]);
      rows = ins.rows;
    }
    refCache.set(key, rows[0]);
    return rows[0];
  }

  const { rows: allStadiums } = await client.query(`SELECT id, name FROM stadiums`);
  const STADIUM_FORCE = {
    "estadio coaracy da mata fonseca": 22,
    "coaracy da mata fonseca": 22,
    "coaracy da mata": 22,
    fumeirao: 22,
    "estadio do morumbi": null, // resolve by name
    morumbi: null,
  };
  async function resolveStadium(name, city, state) {
    if (!name) return null;
    const key = norm(name);
    if (STADIUM_FORCE[key] != null) return STADIUM_FORCE[key];
    const stripped = key.replace(/^estadio\s+(do\s+)?/, "");
    if (STADIUM_FORCE[stripped] != null) return STADIUM_FORCE[stripped];
    const hits = allStadiums.filter((s) => {
      const sn = norm(s.name);
      return (
        sn.includes(key) ||
        key.includes(sn) ||
        sn.includes(stripped) ||
        stripped.includes(sn.replace(/\s*\(.*\)\s*/g, "").trim())
      );
    });
    if (hits.length >= 1) {
      hits.sort((a, b) => a.name.length - b.name.length);
      return hits[0].id;
    }
    if (DRY) {
      console.log("would create stadium", name, city, state);
      return null;
    }
    const ins = await client.query(
      `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil') RETURNING id, name`,
      [name, city, state],
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

  async function ensureSeason2014(playerId) {
    if (DRY) return;
    const { rows } = await client.query(
      `SELECT id FROM player_season_stats WHERE player_id=$1 AND season='2014'`,
      [playerId],
    );
    if (!rows[0]) {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,'2014',0,0,0)`,
        [playerId],
      );
    }
  }

  /** Players created in this run (by normalized nickname). */
  const createdThisRun = new Map();

  async function resolvePlayer(name) {
    const key = norm(name);
    if (FORCE_ID[key] != null) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
        FORCE_ID[key],
      ]);
      if (!rows[0]) throw new Error(`FORCE_ID missing ${name} → ${FORCE_ID[key]}`);
      await ensureSeason2014(rows[0].id);
      return rows[0];
    }

    // Reuse player created earlier in this same apply run.
    if (createdThisRun.has(key)) {
      return createdThisRun.get(key);
    }

    // Reuse if already has a 2014 season row under this exact nickname
    // (idempotent re-run), but never invent links to other-era namesakes.
    const sameName = playersByNorm.get(key) ?? [];
    for (const p of sameName) {
      const { rows } = await client.query(
        `SELECT 1 FROM player_season_stats WHERE player_id=$1 AND season='2014'`,
        [p.id],
      );
      if (rows[0]) {
        createdThisRun.set(key, p);
        return p;
      }
    }

    if (DRY) {
      console.log("would create player", name);
      const fake = { id: -Math.abs(key.length + name.charCodeAt(0)), name };
      createdThisRun.set(key, fake);
      return fake;
    }
    const ins = await client.query(
      `INSERT INTO players (name, nationality, verification_status)
       VALUES ($1,'Brasil','unverified') RETURNING id, name`,
      [name],
    );
    console.log("+ player", ins.rows[0]);
    const p = ins.rows[0];
    if (!playersByNorm.has(key)) playersByNorm.set(key, []);
    playersByNorm.get(key).push(p);
    allPlayers.push(p);
    createdThisRun.set(key, p);
    await ensureSeason2014(p.id);
    return p;
  }

  {
    const names = new Set();
    for (const g of games) {
      resolveManager(g.coach);
      for (const s of g.starters) names.add(s);
      for (const [a, b] of g.subs) {
        names.add(a);
        names.add(b);
      }
      for (const x of g.goals) names.add(x.p);
    }
    for (const n of names) await resolvePlayer(n);
    console.log(`preflight ok: ${names.size} players`);
  }

  const { rows: dbMatches } = await client.query(`
    SELECT m.id, m.match_date::text AS d, o.name AS opp, m.home_away,
           m.goals_for, m.goals_against
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    WHERE m.season='2014' AND m.is_friendly=false
  `);

  function findMatch(g) {
    const sameDate = dbMatches.filter((m) => m.d.slice(0, 10) === g.date);
    if (sameDate.length === 1) return sameDate[0];
    const oppKey = norm(g.opponent).split(/[-\s]/)[0];
    const hit = sameDate.filter((m) => {
      const on = norm(m.opp);
      return on.includes(oppKey) || oppKey.includes(on.split(/[-\s]/)[0]);
    });
    if (hit.length === 1) return hit[0];
    const byScore = (hit.length ? hit : sameDate).filter(
      (m) => Number(m.goals_for) === g.gf && Number(m.goals_against) === g.ga,
    );
    if (byScore.length === 1) return byScore[0];
    throw new Error(
      `match not found n=${g.n} ${g.date} ${g.opponent} candidates=${sameDate.map((m) => `${m.id}:${m.opp}`).join(",")}`,
    );
  }

  let applied = 0;
  for (const g of games) {
    const match = findMatch(g);
    const mgr = resolveManager(g.coach);
    const ref = await resolveRef(g.referee);
    const stadiumId = await resolveStadium(g.stadium, g.stadiumCity, g.stadiumState);
    const scorers =
      [
        ...g.goals.map((x) => x.p),
        ...(g.ownGoals > 0 ? Array(g.ownGoals).fill("GPF") : []),
      ].join(", ") || null;

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
           scorers=$10,
           own_goals_for_count=$11
         WHERE id=$1`,
        [
          match.id,
          mgr.id,
          ref?.id > 0 ? ref.id : null,
          stadiumId,
          g.attendance,
          g.attendance_paid,
          g.revenue,
          g.phase,
          g.round,
          scorers,
          g.ownGoals,
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
      for (const [, inn] of g.subs) if (!benchNames.includes(inn)) benchNames.push(inn);
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
        const p = await resolvePlayer(goal.p);
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute, injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,0,NULL)`,
          [match.id, lineupIdByPlayer.get(p.id) ?? null, p.id, p.name],
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

    applied++;
    console.log(
      `* n=${g.n} #${match.id} ${g.date} ${g.opponent} starters=${g.starters.length} subs=${g.subs.length} goals=${g.goals.length} og=${g.ownGoals} coach=${g.coach}`,
    );
  }

  if (!DRY) {
    const pairs = [
      ["2014-02-16", "2014-02-25"], // Nordeste quartas Sport
      ["2014-03-12", "2014-04-09"], // Copa BR São Paulo
      ["2014-03-19", "2014-03-22"], // Alagoano Santa Rita
    ];
    for (const [d1, d2] of pairs) {
      const a = dbMatches.find((m) => m.d.slice(0, 10) === d1);
      const b = dbMatches.find((m) => m.d.slice(0, 10) === d2);
      if (a && b) {
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [a.id, b.id]);
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [b.id, a.id]);
      }
    }
  }

  if (DRY) {
    await client.query("ROLLBACK");
    console.log(`DRY ok — would apply ${applied}`);
  } else {
    await client.query("COMMIT");
    console.log(`applied ${applied} games`);
  }
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
