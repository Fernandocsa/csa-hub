/**
 * Enrich existing 2016 matches with sheets/meta from season-2016-sheets.csv.
 * Does NOT insert new matches.
 *
 * Usage: node scripts/apply-2016-sheets.mjs [--dry]
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
    .replace(/\bSorim\b/gi, "Sorin")
    .replace(/\bJean Cleber\b/gi, "Jean Cléber")
    .replace(/\bJeferson Maranhense\b/gi, "Jefferson Maranhense")
    .replace(/\bBruno Santa Rosa\b/gi, "Santa Rosa")
    .replace(/\bThiago dos Santos\b/gi, "Thiago Santos")
    .replace(/\bJoão Paulo Penha\b/gi, "João Paulo Penha")
    .replace(/\bCleyton\b/gi, "Cleyton Lima")
    .replace(/\bChoco\b/gi, "Henrique Choco")
    .replace(/\bRomário\b/gi, "Zé Romário")
    .replace(/\bRonaldo\b/gi, "Ronaldo Caetano")
    .replace(/\bDenilson\b/gi, "Denilson");
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
  const sections = raw.split(";").map((s) => s.trim()).filter(Boolean);
  for (const sec of sections) {
    let tok = sec.trim();
    if (!tok) continue;
    if (tok.includes("(")) {
      const pairs = parseNestedSubs(tok);
      const starter = pairs[0]?.[0];
      if (starter) starters.push(starter);
      for (const [out, inn] of pairs) {
        if (out && inn) subs.push([out, inn]);
      }
    } else {
      starters.push(fixPlayerName(tok));
    }
  }
  return { starters, subs };
}

/** "Didira; Bismarck (2); Rafael Oliveira" → [{p, n}] */
function parseGoalsCsa(raw) {
  const goals = [];
  if (!raw?.trim()) return goals;
  for (const part of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(.+?)\s*\((\d+)\)\s*$/);
    if (m) {
      const name = fixPlayerName(m[1].trim());
      const n = Number(m[2]);
      for (let i = 0; i < n; i++) goals.push({ p: name });
    } else {
      goals.push({ p: fixPlayerName(part) });
    }
  }
  return goals;
}

function parseCsv(text) {
  const rows = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const header = parseCsvLine(lines[0]);
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
  if (s === "C" || s === "HOME") return "home";
  if (s === "V" || s === "AWAY") return "away";
  throw new Error(`bad home_away ${v}`);
}

function parseRef(raw) {
  const m = String(raw ?? "").trim().match(/^(.*?)(?:-([A-Z]{2}))?$/);
  return { name: (m?.[1] ?? raw).trim(), state: m?.[2] ?? null };
}

function parseStadium(raw) {
  const s = String(raw ?? "").trim();
  const m = s.match(/^(.*?)\s*-\s*(.+)-([A-Z]{2})$/);
  if (m) return { name: m[1].trim(), city: m[2].trim(), state: m[3] };
  return { name: s, city: null, state: null };
}

const FORCE_ID = {
  jeferson: 82,
  pantera: 81,
  rafinha: 23,
  "leandro souza": 59,
  "douglas marques": 112,
  panda: 115,
  "jean cleber": 105,
  "jean cléber": 105,
  "henrique choco": 57,
  choco: 57,
  sorin: 95,
  didira: 5,
  "cleyton lima": 87,
  cleyton: 87,
  kauhan: 121,
  bismarck: 99,
  "rafael oliveira": 77,
  "luis soares": 100,
  "luís soares": 100,
  hudson: 83,
  "david dener": 69,
  "thiago santos": 54,
  "joao paulo penha": 629,
  "joão paulo penha": 629,
  walter: 61,
  "david oliveira": 123,
  "ze romario": 114,
  "zé romário": 114,
  romario: 114,
  "santa rosa": 103,
  "bruno santa rosa": 103,
  escobar: 75,
  xandao: 52,
  "xandão": 52,
  denilson: 88,
  "marcos antonio": 78,
  "marcos antônio": 78,
  "jefferson maranhense": 117,
  "jeferson maranhense": 117,
  "everton heleno": 104,
  "marcelo nicacio": 102,
  "marcelo nicácio": 102,
  rayro: 58,
  "jonatas obina": 84,
  "jônatas obina": 84,
  kate: 101,
  "katê": 101,
  kelvin: 113,
  "leandro cardoso": 98,
  azul: 72,
  washington: 73,
  elizeu: 110,
  "ronaldo caetano": 51,
  ronaldo: 51,
};

const SPELL_TO_DB = {
  "cleyton lima": "Cleyton Lima",
  "henrique choco": "Henrique Choco",
  "joao paulo penha": "João Paulo",
  "joão paulo penha": "João Paulo",
  "ze romario": "Zé Romário",
  "zé romário": "Zé Romário",
  "santa rosa": "Santa Rosa",
  "jefferson maranhense": "Jefferson Maranhense",
};

try {
  await client.query("BEGIN");

  const csvPath = join(__dirname, "data", "season-2016-sheets.csv");
  const games = parseCsv(readFileSync(csvPath, "utf8")).map((row, idx) => {
    const { gf, ga } = parseScore(row.score);
    const ha = parseHomeAway(row.home_away);
    const { starters, subs } = parseLineupField(row.lineup);
    const goals = parseGoalsCsa(row.goals_csa);
    const stad = parseStadium(row.stadium);
    return {
      n: idx + 1,
      date: row.date,
      competition: row.competition,
      phase: row.phase || null,
      round: row.round || null,
      opponent: row.opponent,
      ha,
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
      coach: row.coach,
    };
  });

  console.log(`parsed ${games.length} games`);

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
        `INSERT INTO referees (name, state) VALUES ($1, $2) RETURNING id, name`,
        [name, state],
      );
      console.log("+ ref", ins.rows[0]);
      rows = ins.rows;
    } else if (state && !DRY) {
      await client.query(
        `UPDATE referees SET state = COALESCE(state, $2) WHERE id=$1`,
        [rows[0].id, state],
      );
    }
    refCache.set(key, rows[0]);
    return rows[0];
  }

  const { rows: allStadiums } = await client.query(`SELECT id, name FROM stadiums`);
  async function resolveStadium(name, city, state) {
    if (!name) return null;
    const key = norm(name);
    const hits = allStadiums.filter(
      (s) => norm(s.name).includes(key) || key.includes(norm(s.name)),
    );
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

  async function resolvePlayer(name) {
    const key = norm(name);
    if (FORCE_ID[key] != null) {
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
      // João Paulo Penha forced above; generic João Paulo ambiguous
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

  // Preflight resolve
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
    console.log(`preflight ok: ${names.size} players, ${games.length} games`);
  }

  const { rows: dbMatches } = await client.query(`
    SELECT m.id, m.match_date::text AS d, o.name AS opp, c.name AS comp,
           m.home_away, m.goals_for, m.goals_against
    FROM matches m
    JOIN opponents o ON o.id = m.opponent_id
    JOIN competitions c ON c.id = m.competition_id
    WHERE m.season = '2016' AND m.is_friendly = false
  `);

  function oppKeyOf(name) {
    return norm(name).split(/[-\s]/)[0];
  }

  function findMatch(g) {
    const sameDate = dbMatches.filter((m) => m.d.slice(0, 10) === g.date);
    if (sameDate.length === 1) return sameDate[0];
    const oppKey = oppKeyOf(g.opponent);
    const hit = sameDate.filter((m) => {
      const on = norm(m.opp);
      return on.includes(oppKey) || oppKey.includes(on.split(/[-\s]/)[0]);
    });
    if (hit.length === 1) return hit[0];
    const byScore = (hit.length ? hit : sameDate).filter(
      (m) => Number(m.goals_for) === g.gf && Number(m.goals_against) === g.ga,
    );
    if (byScore.length === 1) return byScore[0];

    // Date mismatch fallback: opponent + score (+ home_away)
    const byOppScore = dbMatches.filter((m) => {
      const on = norm(m.opp);
      const ok =
        on.includes(oppKey) || oppKey.includes(on.split(/[-\s]/)[0]);
      return (
        ok &&
        Number(m.goals_for) === g.gf &&
        Number(m.goals_against) === g.ga &&
        m.home_away === g.ha
      );
    });
    if (byOppScore.length === 1) {
      console.warn(
        `~ date mismatch n=${g.n} csv=${g.date} db=${byOppScore[0].d.slice(0, 10)} ${g.opponent}`,
      );
      return byOppScore[0];
    }
    throw new Error(
      `match not found n=${g.n} ${g.date} ${g.opponent} candidates=${sameDate.map((m) => m.id + ":" + m.opp).join(",")}`,
    );
  }

  let applied = 0;
  for (const g of games) {
    const match = findMatch(g);
    if (Number(match.goals_for) !== g.gf || Number(match.goals_against) !== g.ga) {
      console.warn(
        `! score mismatch #${match.id} db=${match.goals_for}x${match.goals_against} csv=${g.gf}x${g.ga}`,
      );
    }
    const mgr = resolveManager(g.coach);
    const ref = await resolveRef(g.referee);
    const stadiumId = await resolveStadium(g.stadium, g.stadiumCity, g.stadiumState);
    const scorers = g.goals.map((x) => x.p).join(", ") || null;

    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           match_date=$2::date,
           manager_id=$3,
           referee_id=$4,
           stadium_id=COALESCE($5, stadium_id),
           attendance=$6,
           attendance_paid=$7,
           gross_revenue=COALESCE($8, gross_revenue),
           phase=$9,
           round=$10,
           scorers=$11
         WHERE id=$1`,
        [
          match.id,
          g.date,
          mgr.id,
          ref.id > 0 ? ref.id : null,
          stadiumId,
          g.attendance,
          g.attendance_paid,
          g.revenue,
          g.phase,
          g.round,
          scorers,
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

      // Goals without minutes → minute 0 placeholder (same as 2020 unknown-min pattern for subs)
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
      `* n=${g.n} #${match.id} ${g.date} ${g.opponent} starters=${g.starters.length} subs=${g.subs.length} goals=${g.goals.length}`,
    );
  }

  // Link ida/volta pairs where obvious
  if (!DRY) {
    const pairs = [
      ["2016-04-20", "2016-04-24"], // Murici SF
      ["2016-05-01", "2016-05-08"], // CRB Final
      ["2016-07-24", "2016-07-31"], // Parnahyba 2ª fase
      ["2016-08-14", "2016-08-21"], // Altos
      ["2016-08-27", "2016-09-04"], // Ituano
      ["2016-09-11", "2016-09-18"], // São Bento
      ["2016-09-25", "2016-10-01"], // Volta Redonda
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
    console.log(`DRY ok — would apply ${applied} games`);
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
