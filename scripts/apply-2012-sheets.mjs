/**
 * Enrich existing 2012 matches with sheets/meta from season-2012-sheets.csv.
 * Creates missing players (by nickname) and syncs player_season_stats.
 *
 * Usage: node scripts/apply-2012-sheets.mjs [--dry]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");
const SEASON = "2012";

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
  let s = String(n).trim();
  s = s
    .replace(/\bRafael Araujo\b/gi, "Rafael Araújo")
    .replace(/\bAndré Luis\b/gi, "André Luiz")
    .replace(/\bPaulinho Marília\b/gi, "Paulinho Marilia")
    .replace(/\bWagner\b/gi, "Wagnér")
    .replace(/\bJefferson\b/gi, "Jeferson");
  if (norm(s) === "rafael") s = "Rafael Araújo";
  return s;
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
    if (/\(contra\)/i.test(part)) {
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
  return {
    gf: Number(m[1]),
    ga: Number(m[2]),
    penalties_for: null,
    penalties_against: null,
  };
}

function parseHomeAway(v) {
  const s = String(v).trim().toUpperCase();
  if (s === "C") return "home";
  if (s === "V" || s === "A") return "away";
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

/** Confirmed reuses only. */
const FORCE_ID = {
  flavio: 485,
  ronaldo: 468,
  "paulinho macaiba": 491,
  "adriano gabiru": 656,
  alisson: 1564,
  adalberto: 1584,
  celico: 1586,
  claudinho: 1590,
  cleberson: 1600,
  fabiano: 1194,
  "jucemar gaucho": 1596,
  kel: 1605,
  leandrinho: 1582,
  leandro: 1583,
  levi: 1593,
  maxwell: 1625,
  roberio: 1588,
  rony: 1202,
  sinval: 1621,
  washington: 1601,
  wilson: 1614, // Wilson Jr 2013 = Wilson dos Santos Januário
};

/** CSV date → also accept these DB dates */
const DATE_ALIASES = {};

/** Bios to apply on create / enrich known IDs */
const BIOS = {
  wilson: {
    name: "Wilson",
    fullName: "Wilson dos Santos Januário",
    birthDate: "1993-11-04",
    birthCity: null,
    birthState: "AL",
    birthCountry: "Brasil",
    nationality: "Brasil",
    position: "Meia Ofensivo",
    preferredFoot: "destro",
  },
  jeferson: {
    name: "Jeferson",
    fullName: "Jefferson Sandes Marques Monteiro",
    birthDate: "1989-03-04",
    birthCountry: "Brasil",
    nationality: "Brasil",
    position: "Lateral Esquerdo",
    secondaryPositions: ["Zagueiro"],
    preferredFoot: "canhoto",
    heightCm: 184,
    weightKg: 72,
  },
  warley: {
    name: "Warley",
    fullName: "Warley Moreira dos Santos",
    birthDate: "1977-05-21",
    birthCity: "Belo Horizonte",
    birthState: "MG",
    birthCountry: "Brasil",
    nationality: "Brasil",
    position: "Ponta Direita",
    secondaryPositions: ["Ponta Esquerda"],
    preferredFoot: "destro",
    heightCm: 167,
    weightKg: 70,
  },
  safira: {
    name: "Safira",
    fullName: "Anderson Pelegrini Safira",
    birthDate: "1983-07-20",
    birthCity: "Terra Boa",
    birthState: "PR",
    birthCountry: "Brasil",
    nationality: "Brasil",
    position: "Meia Ofensivo",
    preferredFoot: "canhoto",
    heightCm: 182,
    weightKg: 69,
  },
  wagner: {
    name: "Wagnér",
    fullName: "Wagner Marco da Silva Gomes",
    birthDate: "1993-07-10",
    birthCity: "Maceió",
    birthState: "AL",
    birthCountry: "Brasil",
    nationality: "Brasil",
    position: "Meia Ofensivo",
    secondaryPositions: ["Centroavante"],
    preferredFoot: "destro",
    heightCm: 180,
    weightKg: 69,
  },
  "paulinho marilia": {
    name: "Paulinho Marilia",
    fullName: "Paulo Francisco Zamaia Matias",
    birthDate: "1980-09-02",
    birthCity: "Tupã",
    birthState: "SP",
    birthCountry: "Brasil",
    nationality: "Brasil",
    position: "Atacante",
    preferredFoot: "destro",
    heightCm: 180,
    weightKg: 75,
  },
  jucemar: {
    name: "Jucemar",
    fullName: "Jucemar Luiz Domingos Ambrózio",
    birthDate: "1980-07-29",
    birthCity: "Criciúma",
    birthState: "SC",
    birthCountry: "Brasil",
    nationality: "Brasil",
    position: "Lateral Direito",
    preferredFoot: "destro",
    heightCm: 176,
    weightKg: 70,
    isDeceased: true,
  },
};

try {
  await client.query("BEGIN");

  const csvPath = join(__dirname, "data", "season-2012-sheets.csv");
  const games = parseCsv(readFileSync(csvPath, "utf8")).map((row, idx) => {
    const { gf, ga, penalties_for, penalties_against } = parseScore(row.score);
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
      penalties_for,
      penalties_against,
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
    if (!raw?.trim()) return { id: null, name: null };
    const { name, state } = parseRef(raw);
    const key = norm(name);
    if (refCache.has(key)) return refCache.get(key);
    let { rows } = await client.query(
      `SELECT id, name FROM referees WHERE lower(name)=lower($1)`,
      [name],
    );
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
  };
  async function resolveStadium(name, city, state) {
    if (!name) return null;
    const key = norm(name);
    if (STADIUM_FORCE[key] != null) return STADIUM_FORCE[key];
    const stripped = key.replace(/^estadio\s+/, "");
    if (STADIUM_FORCE[stripped] != null) return STADIUM_FORCE[stripped];
    const hits = allStadiums.filter((s) => {
      const sn = norm(s.name);
      return sn.includes(key) || key.includes(sn) || sn.includes(stripped);
    });
    if (hits.length >= 1) {
      hits.sort((a, b) => a.name.length - b.name.length);
      return hits[0].id;
    }
    if (DRY) {
      console.log("would create stadium", name);
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

  async function ensureSeason(playerId) {
    if (DRY) return;
    const { rows } = await client.query(
      `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
      [playerId, SEASON],
    );
    if (!rows[0]) {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,$2,0,0,0)`,
        [playerId, SEASON],
      );
    }
  }

  async function applyBio(playerId, bio) {
    if (DRY || !bio) return;
    await client.query(
      `UPDATE players SET
         name = COALESCE($2, name),
         full_name = COALESCE($3, full_name),
         birth_date = COALESCE($4::date, birth_date),
         birth_year = COALESCE($5, birth_year),
         birth_city = COALESCE($6, birth_city),
         birth_state = COALESCE($7, birth_state),
         birth_country = COALESCE($8, birth_country),
         nationality = COALESCE($9, nationality),
         position = COALESCE($10, position),
         secondary_positions = COALESCE($11::text[], secondary_positions),
         preferred_foot = COALESCE($12, preferred_foot),
         height_cm = COALESCE($13, height_cm),
         weight_kg = COALESCE($14, weight_kg),
         is_deceased = COALESCE($15, is_deceased)
       WHERE id = $1`,
      [
        playerId,
        bio.name ?? null,
        bio.fullName ?? null,
        bio.birthDate ?? null,
        bio.birthDate ? Number(bio.birthDate.slice(0, 4)) : null,
        bio.birthCity ?? null,
        bio.birthState ?? null,
        bio.birthCountry ?? "Brasil",
        bio.nationality ?? "Brasil",
        bio.position ?? null,
        bio.secondaryPositions ?? null,
        bio.preferredFoot ?? null,
        bio.heightCm ?? null,
        bio.weightKg ?? null,
        bio.isDeceased ?? null,
      ],
    );
  }

  async function createWithBio(bio) {
    if (DRY) {
      console.log("would create player", bio.name, bio.fullName);
      return { id: -Math.abs(norm(bio.name).length + 1), name: bio.name };
    }
    const ins = await client.query(
      `INSERT INTO players (
         name, full_name, birth_date, birth_year, birth_city, birth_state, birth_country,
         nationality, position, secondary_positions, preferred_foot, height_cm, weight_kg,
         is_deceased, verification_status
       ) VALUES (
         $1,$2,$3::date,$4,$5,$6,$7,$8,$9,COALESCE($10::text[],'{}'::text[]),$11,$12,$13,
         COALESCE($14,false),'unverified'
       ) RETURNING id, name`,
      [
        bio.name,
        bio.fullName ?? null,
        bio.birthDate ?? null,
        bio.birthDate ? Number(bio.birthDate.slice(0, 4)) : null,
        bio.birthCity ?? null,
        bio.birthState ?? null,
        bio.birthCountry ?? "Brasil",
        bio.nationality ?? "Brasil",
        bio.position ?? null,
        bio.secondaryPositions ?? null,
        bio.preferredFoot ?? null,
        bio.heightCm ?? null,
        bio.weightKg ?? null,
        bio.isDeceased ?? false,
      ],
    );
    console.log("+ player", ins.rows[0], bio.fullName ?? "");
    const p = ins.rows[0];
    const key = norm(p.name);
    if (!playersByNorm.has(key)) playersByNorm.set(key, []);
    playersByNorm.get(key).push(p);
    allPlayers.push(p);
    await ensureSeason(p.id);
    return p;
  }

  // Enrich Wilson Jr → Wilson bio
  if (!DRY) {
    await applyBio(1614, BIOS.wilson);
    console.log("* enriched #1614 Wilson");
  }

  // Pre-create named bios that must not collide with wrong exact matches
  const MUST_CREATE = [
    "jeferson",
    "warley",
    "safira",
    "wagner",
    "paulinho marilia",
    "jucemar",
  ];
  const createdByKey = new Map();
  for (const key of MUST_CREATE) {
    const bio = BIOS[key];
    if (!bio) continue;
    // skip if FORCE or already have a 2012 row with this exact name created this run
    if (FORCE_ID[key] != null) continue;
    const existing2012 = [];
    for (const p of playersByNorm.get(key) ?? []) {
      const { rows } = await client.query(
        `SELECT 1 FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [p.id, SEASON],
      );
      if (rows[0]) existing2012.push(p);
    }
    if (existing2012.length === 1) {
      createdByKey.set(key, existing2012[0]);
      await applyBio(existing2012[0].id, bio);
      continue;
    }
    // For these keys, never reuse distant homonyms — always create (or use FORCE)
    const p = await createWithBio(bio);
    createdByKey.set(key, p);
    if (p.id > 0) FORCE_ID[key] = p.id;
  }

  async function resolvePlayer(name) {
    const key = norm(name);
    if (createdByKey.has(key)) {
      const p = createdByKey.get(key);
      if (p.id > 0) await ensureSeason(p.id);
      return p;
    }
    if (FORCE_ID[key] != null) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
        FORCE_ID[key],
      ]);
      if (!rows[0]) throw new Error(`FORCE_ID missing ${name}`);
      await ensureSeason(rows[0].id);
      return rows[0];
    }

    // Reuse only if this exact nickname already has a 2012 season row
    const candidates = playersByNorm.get(key) ?? [];
    for (const p of candidates) {
      const { rows } = await client.query(
        `SELECT 1 FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [p.id, SEASON],
      );
      if (rows[0]) return p;
    }

    // Also reuse if only one candidate already has adjacent 2013 season and same exact name
    // — disabled for safety; create new unless FORCE_ID
    if (DRY) {
      console.log("would create player", name);
      return { id: -Math.abs(key.length + name.charCodeAt(0)), name };
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
    await ensureSeason(p.id);
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
    WHERE m.season=$1 AND m.is_friendly=false
  `, [SEASON]);

  function findMatch(g) {
    const dates = [g.date, ...(DATE_ALIASES[g.date] ?? [])];
    const sameDate = dbMatches.filter((m) => dates.includes(m.d.slice(0, 10)));
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
           own_goals_for_count=$11,
           penalties_for=$12,
           penalties_against=$13
         WHERE id=$1`,
        [
          match.id,
          mgr.id,
          ref.id > 0 ? ref.id : null,
          stadiumId,
          g.attendance,
          g.attendance_paid,
          g.revenue,
          g.phase,
          g.round,
          scorers,
          g.ownGoals,
          g.penalties_for,
          g.penalties_against,
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
      `* n=${g.n} #${match.id} ${g.date} ${g.opponent} starters=${g.starters.length} subs=${g.subs.length} goals=${g.goals.length} og=${g.ownGoals}`,
    );
  }

  if (!DRY) {
    const pairs = [
      ["2012-04-25", "2012-04-28"], // SF 2º turno
      ["2012-05-01", "2012-05-05"], // Final 2º turno
      ["2012-09-01", "2012-09-09"], // Oitavas Série D
    ];
    for (const [d1, d2] of pairs) {
      const dates1 = [d1, ...(DATE_ALIASES[d1] ?? [])];
      const dates2 = [d2, ...(DATE_ALIASES[d2] ?? [])];
      const a = dbMatches.find((m) => dates1.includes(m.d.slice(0, 10)));
      const b = dbMatches.find((m) => dates2.includes(m.d.slice(0, 10)));
      if (a && b) {
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [a.id, b.id]);
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [b.id, a.id]);
      }
    }

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
        WHERE m.season=$1 AND m.is_friendly=false AND mg.side='csa'
          AND coalesce(mg.is_own_goal,false)=false AND mg.scorer_player_id IS NOT NULL
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
        `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
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
