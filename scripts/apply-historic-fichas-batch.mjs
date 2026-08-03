/**
 * Enrich/apply historic CSA fichas batch (CSA-only; opponent XI ignored).
 * Usage: node scripts/apply-historic-fichas-batch.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { SHEETS } from "./data/historic-fichas-batch.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
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

const FORCE_ID = {
  // known from existing lineups / seasons
  "osmar barao": 1055,
  dick: 781,
  zezinho: 536,
  vilmario: 1155,
  "jorge siri": 931,
  rommel: 495,
  romel: 495,
  jacozinho: 907,
  adilton: 654,
  nilson: 1713,
  "jorge luiz": 1728,
  "jorge luis": 1728,
  wilson: 1168, // goleiro 87-89
  douglas: 792,
  "luis carlos": 1672,
  "paulo marcos": 1066,
  lucas: 958,
  irles: 901,
  "ze pedro": 1182,
  chico: 551,
  "mario sergio": 1001,
  frank: 850,
  baiano: 692,
  geraldo: 868, // lateral 76-83
  "helcio jacare": 889,
  "helio sururu": 531,
};

/** Map ficha names → possible lineup/DB name keys */
const NAME_ALIASES = {
  luisao: ["luizao", "luisao"],
  "helcio jacare": ["elcio", "helcio jacare", "helcio"],
  "helio sururu": ["helio", "helio sururu"],
  helio: ["helio", "helio sururu"],
  frazao: ["frazao", "luiz frazao"],
  "luis paulo": ["luis paulo", "luiz paulo"],
  "luiz paulo": ["luis paulo", "luiz paulo"],
  ditinho: ["ditinho", "ditinho souza"],
  "alberto carioca": ["alberto carioca", "alberto"],
  alberto: ["alberto carioca", "alberto"],
  romel: ["rommel", "romel"],
  rommel: ["rommel", "romel"],
  "ademir pereira": ["ademir pereira", "ademir"],
  ademir: ["ademir pereira", "ademir"],
  "edson silva": ["edson silva"],
};

const CREATE_META = {
  sigismundo: { name: "Sigismundo", position: "Goleiro", forceNew: true },
};

const STADIUM_ALIAS = {
  "estadio rei pele": "Estádio Rei Pelé (Trapichão)",
  "rei pele": "Estádio Rei Pelé (Trapichão)",
  mineirao: "Mineirão",
  amigao: "Amigão",
  maracana: "Maracanã",
  "marechal hermes": "Marechal Hermes",
  "estadio beira rio": "Estádio Beira-Rio",
  "beira rio": "Estádio Beira-Rio",
};

const playerCache = new Map();
const createdPlayers = [];

async function ensureCsaPlayer(raw) {
  const key = norm(raw);
  if (playerCache.has(key)) return playerCache.get(key);

  if (FORCE_ID[key]) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
      FORCE_ID[key],
    ]);
    if (!rows[0]) throw new Error(`FORCE_ID missing ${raw}`);
    playerCache.set(key, rows[0]);
    return rows[0];
  }

  // Prefer name already on any of these match lineups
  const { rows: onSheet } = await client.query(
    `SELECT DISTINCT p.id, p.name
     FROM players p
     JOIN match_lineups ml ON ml.player_id=p.id
     WHERE ml.match_id = ANY($1::int[])
       AND lower(p.name) = lower($2)
     LIMIT 1`,
    [SHEETS.map((s) => s.matchId).filter(Boolean), raw],
  );
  if (onSheet[0]) {
    playerCache.set(key, onSheet[0]);
    return onSheet[0];
  }

  const { rows: byName } = await client.query(
    `SELECT id, name FROM players WHERE lower(name)=lower($1) ORDER BY id LIMIT 5`,
    [raw],
  );
  if (byName.length === 1) {
    playerCache.set(key, byName[0]);
    return byName[0];
  }

  // fuzzy norm match among candidates with nearby seasons
  const { rows: all } = await client.query(`SELECT id, name FROM players`);
  const soft = all.find((p) => norm(p.name) === key);
  if (soft) {
    playerCache.set(key, soft);
    return soft;
  }

  const meta = CREATE_META[key];
  if (!meta) throw new Error(`Unresolved CSA player: "${raw}" (${key})`);
  if (DRY) {
    const stub = { id: -createdPlayers.length - 1, name: meta.name };
    createdPlayers.push(stub);
    console.log("PLAYER_WOULD_CREATE", stub);
    playerCache.set(key, stub);
    return stub;
  }
  const ins = await client.query(
    `INSERT INTO players (name, position, nationality, nationality_flag, verification_status)
     VALUES ($1,$2,'Brasil','🇧🇷','unverified') RETURNING id, name`,
    [meta.name, meta.position],
  );
  createdPlayers.push(ins.rows[0]);
  console.log("PLAYER_CREATED", ins.rows[0]);
  playerCache.set(key, ins.rows[0]);
  return ins.rows[0];
}

async function ensureReferee(name, state = null) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  if (DRY) return { id: -1, name };
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,$2) RETURNING id, name`,
    [name, state],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM managers`);
  const hit = all.find((m) => norm(m.name) === norm(name));
  if (hit) return hit;
  // Walmir → Valmir Louruz
  if (norm(name).includes("walmir") || norm(name).includes("valmir louruz")) {
    const v = all.find((m) => norm(m.name) === "valmir louruz");
    if (v) return v;
  }
  if (DRY) return { id: -1, name };
  const ins = await client.query(
    `INSERT INTO managers (name, nationality, verification_status)
     VALUES ($1,'Brasil','unverified') RETURNING id, name`,
    [name],
  );
  console.log("MANAGER_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureStadium(name) {
  if (!name) return null;
  const aliased = STADIUM_ALIAS[norm(name)] ?? name;
  let { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name=$1`, [aliased]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const hit = all.find((s) => norm(s.name) === norm(aliased));
  if (hit) return hit;
  const soft = all.find(
    (s) =>
      norm(s.name).includes(norm(aliased)) || norm(aliased).includes(norm(s.name)),
  );
  if (soft) return soft;
  if (DRY) return { id: -1, name: aliased };
  const ins = await client.query(
    `INSERT INTO stadiums (name, country) VALUES ($1,'Brasil') RETURNING id, name`,
    [aliased],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
}

function scorersText(csaGoals = []) {
  const counts = new Map();
  for (const g of csaGoals) {
    if (g.ownGoalFor) continue;
    counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
  }
  const parts = [...counts.entries()].map(([n, c]) => (c > 1 ? `${n} (${c})` : n));
  const ogs = csaGoals.filter((g) => g.ownGoalFor).map((g) => `${g.name} (contra)`);
  const all = [...parts, ...ogs];
  return all.length ? all.join(", ") : null;
}

async function loadLineupMap(matchId) {
  const { rows } = await client.query(
    `SELECT id, player_id, player_name FROM match_lineups WHERE match_id=$1 AND side='csa'`,
    [matchId],
  );
  const byPlayerId = new Map();
  const byName = new Map();
  for (const r of rows) {
    byPlayerId.set(r.player_id, r.id);
    byName.set(norm(r.player_name), { lineupId: r.id, playerId: r.player_id, name: r.player_name });
  }
  return { byPlayerId, byName, rows };
}

async function resolveOnSheet(raw, lineupMap) {
  const key = norm(raw);
  const aliasKeys = NAME_ALIASES[key] ?? [key];

  for (const ak of aliasKeys) {
    if (lineupMap.byName.has(ak)) {
      const hit = lineupMap.byName.get(ak);
      return { id: hit.playerId, name: hit.name, lineupId: hit.lineupId };
    }
  }

  // soft: any lineup name that equals alias or contains key / is contained
  for (const [nk, hit] of lineupMap.byName.entries()) {
    for (const ak of aliasKeys) {
      if (nk === ak || nk.includes(ak) || ak.includes(nk)) {
        return { id: hit.playerId, name: hit.name, lineupId: hit.lineupId };
      }
    }
  }

  const p = await ensureCsaPlayer(raw);
  return { id: p.id, name: p.name, lineupId: lineupMap.byPlayerId.get(p.id) ?? null };
}

try {
  if (!DRY) await client.query("BEGIN");

  const applied = [];

  for (const sheet of SHEETS) {
    let matchId = sheet.matchId;
    if (!matchId) {
      const { rows } = await client.query(
        `SELECT id FROM matches WHERE match_date::date=$1 ORDER BY id LIMIT 1`,
        [sheet.date],
      );
      matchId = rows[0]?.id;
    }
    if (!matchId) throw new Error(`Match not found ${sheet.date}`);

    const { rows: mrows } = await client.query(
      `SELECT id, is_friendly, goals_for FROM matches WHERE id=$1`,
      [matchId],
    );
    const match = mrows[0];

    const stadium = sheet.stadium ? await ensureStadium(sheet.stadium) : null;
    const referee = sheet.referee
      ? await ensureReferee(sheet.referee, sheet.refereeState ?? null)
      : null;
    const manager = sheet.manager ? await ensureManager(sheet.manager) : null;
    const scorers = scorersText(sheet.csaGoals ?? []);

    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           stadium_id = COALESCE($2, stadium_id),
           referee_id = COALESCE($3, referee_id),
           manager_id = COALESCE($4, manager_id),
           attendance = COALESCE($5, attendance),
           gross_revenue_text = COALESCE($6, gross_revenue_text),
           phase = COALESCE($7, phase),
           scorers = COALESCE($8, scorers),
           home_away = COALESCE($9, home_away)
         WHERE id=$1`,
        [
          matchId,
          stadium?.id ?? null,
          referee?.id ?? null,
          manager?.id ?? null,
          sheet.attendance ?? null,
          sheet.revenueText ?? null,
          sheet.phase ?? null,
          scorers,
          sheet.homeAway ?? null,
        ],
      );
    }

    let lineupMap = await loadLineupMap(matchId);
    const needLineup =
      sheet.forceLineup ||
      lineupMap.rows.length === 0 ||
      ((sheet.starters?.length ?? 0) > 0 && lineupMap.rows.length === 0);

    if (needLineup && (sheet.starters?.length ?? 0) > 0) {
      if (!DRY) {
        await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [matchId]);
        await client.query(`DELETE FROM match_cards WHERE match_id=$1 AND side='csa'`, [
          matchId,
        ]);
        await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [
          matchId,
        ]);
      }
      let sort = 0;
      const map = new Map();
      for (const name of sheet.starters) {
        const p = await ensureCsaPlayer(name);
        if (map.has(p.id)) continue;
        if (!DRY) {
          const { rows } = await client.query(
            `INSERT INTO match_lineups
               (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
             VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
            [matchId, p.id, p.name, sort++],
          );
          map.set(p.id, rows[0].id);
        } else map.set(p.id, sort++);
      }
      for (const s of sheet.subs ?? []) {
        const p = await ensureCsaPlayer(s.in);
        if (map.has(p.id)) continue;
        if (!DRY) {
          const { rows } = await client.query(
            `INSERT INTO match_lineups
               (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
             VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
            [matchId, p.id, p.name, sort++],
          );
          map.set(p.id, rows[0].id);
        } else map.set(p.id, sort++);
      }
      for (const s of sheet.subs ?? []) {
        const outP = await ensureCsaPlayer(s.out);
        const inP = await ensureCsaPlayer(s.in);
        if (!DRY) {
          await client.query(
            `INSERT INTO match_substitutions
               (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
                player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
             VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,NULL)`,
            [
              matchId,
              map.get(outP.id) ?? null,
              outP.id,
              outP.name,
              map.get(inP.id) ?? null,
              inP.id,
              inP.name,
              s.minute ?? 0,
            ],
          );
        }
      }
      lineupMap = await loadLineupMap(matchId);
      if (DRY) {
        // rebuild fake map for dry goal linking
        lineupMap = { byPlayerId: map, byName: new Map(), rows: [] };
      }
    }

    // Replace goals for this match (CSA + opponent) to attach minutes
    const hasGoals =
      (sheet.csaGoals?.length ?? 0) > 0 || (sheet.oppGoals?.length ?? 0) > 0;
    if (hasGoals) {
      if (!DRY) {
        await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [matchId]);
      }
      for (const g of sheet.csaGoals ?? []) {
        if (g.ownGoalFor) {
          if (!DRY) {
            await client.query(
              `INSERT INTO match_goals
                 (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
                  minute, injury_time_minute, is_penalty, is_own_goal, own_goal_direction)
               VALUES ($1,'csa',NULL,NULL,$2,$3,NULL,false,true,'for')`,
              [matchId, g.name, g.minute ?? 0],
            );
          }
          continue;
        }
        let p;
        try {
          p = await resolveOnSheet(g.name, lineupMap);
        } catch {
          p = await ensureCsaPlayer(g.name);
          p = { id: p.id, name: p.name, lineupId: null };
        }
        if (!DRY) {
          await client.query(
            `INSERT INTO match_goals
               (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
                minute, injury_time_minute, is_penalty, is_own_goal)
             VALUES ($1,'csa',$2,$3,$4,$5,NULL,$6,false)`,
            [
              matchId,
              p.lineupId ?? null,
              p.id,
              p.name,
              g.minute ?? 0,
              !!g.penalty,
            ],
          );
        }
      }
      for (const g of sheet.oppGoals ?? []) {
        if (!DRY) {
          await client.query(
            `INSERT INTO match_goals
               (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
                minute, injury_time_minute, is_penalty, is_own_goal)
             VALUES ($1,'opponent',NULL,NULL,$2,$3,NULL,$4,false)`,
            [matchId, g.name, g.minute ?? 0, !!g.penalty],
          );
        }
      }
      const ogFor = (sheet.csaGoals ?? []).filter((g) => g.ownGoalFor).length;
      if (ogFor && !DRY) {
        await client.query(`UPDATE matches SET own_goals_for_count=$2 WHERE id=$1`, [
          matchId,
          ogFor,
        ]);
      }
    }

    // Cards: replace for this match (both sides named in sheet)
    const hasCards =
      (sheet.csaYellows?.length ?? 0) +
        (sheet.csaReds?.length ?? 0) +
        (sheet.oppYellows?.length ?? 0) +
        (sheet.oppReds?.length ?? 0) >
      0;
    if (hasCards) {
      if (!DRY) {
        await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [matchId]);
      }
      async function addCard(side, type, name, minute = 0) {
        let lineupId = null;
        let playerId = null;
        let playerName = name;
        if (side === "csa") {
          try {
            const p = await resolveOnSheet(name, lineupMap);
            lineupId = p.lineupId;
            playerId = p.id;
            playerName = p.name;
          } catch {
            /* name-only card */
          }
        }
        if (!DRY) {
          await client.query(
            `INSERT INTO match_cards
               (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NULL)`,
            [matchId, side, type, lineupId, playerId, playerName, minute],
          );
        }
      }
      for (const n of sheet.csaYellows ?? []) await addCard("csa", "yellow", n);
      for (const n of sheet.csaReds ?? []) {
        // Remi expelled 44' 2T vs Vasco (1981-03-19)
        const minute = norm(n) === "remi" ? 89 : 0;
        await addCard("csa", "red", n, minute);
      }
      for (const n of sheet.oppYellows ?? []) await addCard("opponent", "yellow", n);
      for (const n of sheet.oppReds ?? []) {
        const minute = norm(n) === "mendonca" ? 51 : 0; // 6' 2T
        await addCard("opponent", "red", n, minute);
      }
    }

    applied.push({
      id: matchId,
      date: sheet.date,
      friendly: !!match.is_friendly,
      lineupForced: !!needLineup,
      goals: (sheet.csaGoals?.length ?? 0) + (sheet.oppGoals?.length ?? 0),
      cards:
        (sheet.csaYellows?.length ?? 0) +
        (sheet.csaReds?.length ?? 0) +
        (sheet.oppYellows?.length ?? 0) +
        (sheet.oppReds?.length ?? 0),
      referee: sheet.referee ?? null,
      attendance: sheet.attendance ?? null,
    });
  }

  // Soft sync season stats only for non-friendly matches touched (appearances untouched if lineup kept)
  if (!DRY) {
    // no full season sync — goals already on match; optional light touch skipped to avoid overwriting floors
  }

  if (!DRY) await client.query("COMMIT");
  console.log(DRY ? "DRY OK" : "OK");
  console.log("applied", applied.length);
  console.log(applied);
  console.log("createdPlayers", createdPlayers);
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
