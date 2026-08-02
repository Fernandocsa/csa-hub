/**
 * APPLY CSA 2024 match sheets (39 games).
 * Decisions: Rafinha≠Raphinha; Robinho#493; Denílson#290; rename Cristian;
 * create missing players+refs; update all managers; new Seletiva competition.
 * Q2–Q5 disregarded per user: apply source as written; Alisson Dantas→Farias;
 * attendance both games; keep Iguatu result=draw; ignore pens.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES, convertMinute, norm } from "./data/season-2024-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const FORCE_ID = {
  robinho: 493,
  denilson: 290, // Denílson
  "alisson dantas": 376, // Alisson Farias
  "alisson farias": 376,
  "yuri sena": 393, // Yuri Reis
};

const CREATE_PLAYERS = ["Marcinho", "Jeffinho", "Clevinho"];

const SPELL_TO_DB = {
  "matues santos": "Matheus Santos",
  "mateus santos": "Matheus Santos",
  marqunhos: "Marquinhos",
  "eduardo biazuus": "Eduardo Biazus",
  denilson: "Denílson",
  "alisson dantas": "Alisson Farias",
  "jean cleber": "Jean Cléber",
  "dal pian": "Guilherme Dal Pian",
  ismael: "Ismael Nunes",
  "vinicius popo": "Vinicius Popó",
  "vinícius popó": "Vinicius Popó",
  cadu: "Wesley (Cadu)",
  "yuri sena": "Yuri Reis",
};

const PHASE_ROUND = {
  1: { phase: "Pré-Copa do Nordeste", round: null },
  2: { phase: null, round: "1ª rodada" },
  3: { phase: null, round: "2ª rodada" },
  4: { phase: null, round: "3ª rodada" },
  5: { phase: null, round: "4ª rodada" },
  6: { phase: null, round: "5ª rodada" },
  7: { phase: null, round: "6ª rodada" },
  8: { phase: null, round: "7ª rodada" },
  9: { phase: null, round: "1ª rodada" },
  10: { phase: null, round: "2ª rodada" },
  11: { phase: null, round: "3ª rodada" },
  12: { phase: null, round: "4ª rodada" },
  13: { phase: null, round: "5ª rodada" },
  14: { phase: null, round: "6ª rodada" },
  15: { phase: "Semifinal", round: "Ida" },
  16: { phase: "Semifinal", round: "Volta" },
  17: { phase: "Final", round: "Ida" },
  18: { phase: "Final", round: "Volta" },
  19: { phase: null, round: "Ida" },
  20: { phase: null, round: "Volta" },
};
for (let i = 21; i <= 39; i++) {
  PHASE_ROUND[i] = { phase: null, round: `${i - 20}ª rodada` };
}

function parseRef(raw) {
  const m = String(raw).trim().match(/^(.*?)(?:-([A-Z]{2}))?$/);
  return { name: (m?.[1] ?? raw).trim(), state: m?.[2] ?? null };
}

async function ensurePlayer(name) {
  const key = norm(name);
  if (FORCE_ID[key]) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [FORCE_ID[key]]);
    if (!rows[0]) throw new Error(`FORCE_ID missing ${name} → ${FORCE_ID[key]}`);
    return rows[0];
  }
  // exact
  let { rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  // alias spelling variants already in DB
  const aliases = {
    "matues santos": "Matheus Santos",
    "mateus santos": "Matheus Santos",
    marqunhos: "Marquinhos",
    "eduardo biazuus": "Eduardo Biazus",
    "cristian de souza": null, // manager
  };
  if (aliases[key]) {
    ({ rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [aliases[key]]));
    if (rows[0]) return rows[0];
  }
  // case-insensitive
  ({ rows } = await client.query(
    `SELECT id, name FROM players WHERE lower(unaccent(name))=lower(unaccent($1))`,
    [name],
  ));
  if (rows.length === 1) return rows[0];
  if (rows.length > 1) {
    // prefer exact accent match then first
    const exact = rows.find((r) => r.name === name);
    if (exact) return exact;
    throw new Error(`ambiguous player ${name}: ${rows.map((r) => r.id).join(",")}`);
  }
  throw new Error(`player not found (create first?): ${name}`);
}

try {
  await client.query("BEGIN");

  const log = [];

  // 1) Rename manager
  const ren = await client.query(
    `UPDATE managers SET name='Cristian de Souza' WHERE id=43 AND name <> 'Cristian de Souza' RETURNING id, name`,
  );
  log.push({ renameManager: ren.rows[0] ?? "already Cristian de Souza or missing" });

  // 2) Competition Seletiva
  let seletivaId;
  {
    const ex = await client.query(
      `SELECT id, name FROM competitions WHERE name ILIKE 'Seletiva da Copa do Brasil' LIMIT 1`,
    );
    if (ex.rows[0]) {
      seletivaId = ex.rows[0].id;
      log.push({ seletiva: "exists", id: seletivaId });
    } else {
      const ins = await client.query(
        `INSERT INTO competitions (name, type) VALUES ('Seletiva da Copa do Brasil', 'cup') RETURNING id, name`,
      );
      seletivaId = ins.rows[0].id;
      log.push({ seletiva: "created", id: seletivaId, name: ins.rows[0].name });
    }
  }

  // 3) Create missing players
  const createdPlayers = [];
  for (const name of CREATE_PLAYERS) {
    const ex = await client.query(`SELECT id, name FROM players WHERE name=$1`, [name]);
    if (ex.rows[0]) {
      createdPlayers.push({ ...ex.rows[0], created: false });
      continue;
    }
    const ins = await client.query(
      `INSERT INTO players (name, nationality, nationality_flag, verification_status)
       VALUES ($1, 'Brasil', '🇧🇷', 'unverified') RETURNING id, name`,
      [name],
    );
    createdPlayers.push({ ...ins.rows[0], created: true });
  }
  log.push({ createdPlayers });

  // 4) Create referees (unique)
  const refMap = new Map(); // norm name → {id,name}
  const createdRefs = [];
  for (const g of GAMES) {
    const { name, state } = parseRef(g.ref);
    const key = norm(name);
    if (refMap.has(key)) continue;
    let { rows } = await client.query(
      `SELECT id, name FROM referees WHERE lower(name)=lower($1) LIMIT 1`,
      [name],
    );
    if (!rows[0]) {
      const ins = await client.query(
        `INSERT INTO referees (name, state) VALUES ($1, $2) RETURNING id, name, state`,
        [name, state],
      );
      rows = ins.rows;
      createdRefs.push(rows[0]);
    } else if (state) {
      await client.query(
        `UPDATE referees SET state=COALESCE(state, $2) WHERE id=$1`,
        [rows[0].id, state],
      );
    }
    refMap.set(key, rows[0]);
  }
  log.push({ createdRefs: createdRefs.length, totalRefs: refMap.size });

  // 5) Manager map
  const mgrByNorm = new Map();
  {
    const { rows } = await client.query(`SELECT id, name FROM managers`);
    for (const m of rows) mgrByNorm.set(norm(m.name), m);
  }
  // alias Cristian
  if (mgrByNorm.has(norm("Cristian de Souza"))) {
    mgrByNorm.set(norm("Cristian de Souza"), mgrByNorm.get(norm("Cristian de Souza")));
  }

  function resolveManager(name) {
    const key = norm(name);
    if (mgrByNorm.has(key)) return mgrByNorm.get(key);
    // soft: cristian souza / de souza
    if (key.includes("cristian")) {
      const hit = [...mgrByNorm.values()].find((m) => norm(m.name).includes("cristian"));
      if (hit) return hit;
    }
    throw new Error(`manager not found: ${name}`);
  }

  // Player resolver cache
  const playerCache = new Map();
  async function resolvePlayer(name) {
    const key = norm(name);
    if (playerCache.has(key)) return playerCache.get(key);

    if (FORCE_ID[key]) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [FORCE_ID[key]]);
      playerCache.set(key, rows[0]);
      return rows[0];
    }

    // Prefer exact name
    let { rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [name]);
    if (rows[0]) {
      playerCache.set(key, rows[0]);
      return rows[0];
    }

    // Known DB spellings / nicknames
    if (SPELL_TO_DB[key]) {
      ({ rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [SPELL_TO_DB[key]]));
      if (rows[0]) {
        playerCache.set(key, rows[0]);
        return rows[0];
      }
    }

    // Accent-insensitive: strip combining marks in SQL via translate-ish compare in JS
    {
      const { rows: all } = await client.query(
        `SELECT id, name FROM players WHERE left(name, 12) ILIKE left($1, 12) || '%' OR name ILIKE $2`,
        [name, `%${name.split(/\s+/)[0]}%`],
      );
      const hits = all.filter((r) => norm(r.name) === key);
      if (hits.length === 1) {
        playerCache.set(key, hits[0]);
        return hits[0];
      }
    }

    // ilike exact fold
    ({ rows } = await client.query(
      `SELECT id, name FROM players WHERE lower(name)=lower($1)`,
      [name],
    ));
    if (rows.length === 1) {
      playerCache.set(key, rows[0]);
      return rows[0];
    }

    // Raphinha must NOT fall through to Rafinha
    if (key === "raphinha") {
      ({ rows } = await client.query(`SELECT id, name FROM players WHERE name='Raphinha'`));
      if (rows[0]) {
        playerCache.set(key, rows[0]);
        return rows[0];
      }
    }
    if (key === "rafinha") {
      ({ rows } = await client.query(`SELECT id, name FROM players WHERE name='Rafinha'`));
      if (rows[0]) {
        playerCache.set(key, rows[0]);
        return rows[0];
      }
    }

    throw new Error(`player unresolved: ${name}`);
  }

  // Load DB matches 2024
  const { rows: dbMatches } = await client.query(`
    SELECT m.id, m.match_date::text AS d, o.name AS opp
    FROM matches m JOIN opponents o ON o.id=m.opponent_id
    WHERE m.season='2024'
  `);

  function findMatch(g) {
    const same = dbMatches.filter((m) => m.d === g.date);
    if (same.length === 1) return same[0];
    const oppKey = norm(g.opp);
    const hit = same.filter((m) => norm(m.opp).includes(oppKey) || oppKey.includes(norm(m.opp).split("-")[0]));
    if (hit.length === 1) return hit[0];
    throw new Error(`match not found for game ${g.n} ${g.date} ${g.opp}`);
  }

  const applied = [];

  for (const g of GAMES) {
    const match = findMatch(g);
    const mgr = resolveManager(g.mgr);
    const ref = refMap.get(norm(parseRef(g.ref).name));
    if (!ref) throw new Error(`ref map miss ${g.ref}`);
    const pr = PHASE_ROUND[g.n] ?? { phase: null, round: null };

    const ownGoals = g.ownGoalsFor ?? 0;
    const att = g.att ?? null;
    const attP = g.attP ?? null;

    // competition override for seletiva games 19-20
    let competitionId = null;
    if (g.n === 19 || g.n === 20) competitionId = seletivaId;

    if (competitionId) {
      await client.query(
        `UPDATE matches SET
           manager_id=$2, referee_id=$3,
           attendance=$4, attendance_paid=$5,
           own_goals_for_count=$6,
           phase=$7, round=$8,
           competition_id=$9,
           scorers=$10
         WHERE id=$1`,
        [
          match.id,
          mgr.id,
          ref.id,
          att,
          attP,
          ownGoals,
          pr.phase,
          pr.round,
          competitionId,
          g.goals.map((x) => x.p).join(", ") || null,
        ],
      );
    } else {
      await client.query(
        `UPDATE matches SET
           manager_id=$2, referee_id=$3,
           attendance=$4, attendance_paid=$5,
           own_goals_for_count=$6,
           phase=$7, round=$8,
           scorers=$9
         WHERE id=$1`,
        [
          match.id,
          mgr.id,
          ref.id,
          att,
          attP,
          ownGoals,
          pr.phase,
          pr.round,
          g.goals.map((x) => x.p).join(", ") || null,
        ],
      );
    }

    // Clear sheet
    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [match.id]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [match.id]);
    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [match.id]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [match.id]);

    const lineupIdByPlayer = new Map();
    let sort = 0;

    // starters
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

    // bench = all subs "in" not already starter
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

    // goals (CSA only; no own goals)
    for (const goal of g.goals) {
      const conv = convertMinute(goal.m, goal.h);
      if (conv.error) throw new Error(conv.error);
      const p = await resolvePlayer(goal.p);
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,$5,$6)`,
        [match.id, lineupIdByPlayer.get(p.id) ?? null, p.id, p.name, conv.minute, conv.injuryTimeMinute],
      );
    }

    // substitutions — minute unknown → 0
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

    applied.push({
      n: g.n,
      matchId: match.id,
      manager: mgr.name,
      referee: ref.name,
      lineups: g.starters.length + benchNames.filter((n) => !g.starters.includes(n)).length,
      goals: g.goals.length,
      subs: g.subs.length,
      ownGoals,
      seletiva: g.n === 19 || g.n === 20,
    });
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, log, appliedCount: applied.length, applied }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
