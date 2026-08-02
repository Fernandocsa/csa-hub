/**
 * Apply CSA 1999 complementary sheets for Copa do Brasil, Nordeste, Conmebol, Série C.
 * Usage: node scripts/apply-1999-other-sheets.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  SEASON,
  MATCH_FIXES,
  SHEETS,
  RELATED_PAIRS,
} from "./data/season-1999-other-sheets.mjs";

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

function resultOf(gf, ga) {
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

const FORCE_ID = {
  mazinho: 1013,
  fabinho: 828,
  mimi: 535,
  otavio: 1057,
  otávio: 1057,
  williams: 1164,
  willams: 1164,
  willian: 1165,
  wiliam: 1165,
  wilian: 1165,
  william: 1165,
  "luiz carlos": 962,
  "luis carlos": 962,
  "luís carlos": 962,
  wanderley: 1839,
  vanderley: 1839,
  jeferson: 1841,
  everaldo: 1842,
  nailson: 1843,
  naílson: 1843,
  leo: 1844,
  léo: 1844,
  leonardo: 1845,
  erly: 1846,
  andre: 1847,
  andré: 1847,
  pastor: 1848,
  "fabinho goiano": 1849,
  reinaldo: 1850,
  genilson: 1838,
  genílson: 1838,
  souza: 1840,
};

const CREATE_META = {
  aldori: { name: "Aldori", position: "Zagueiro", forceNew: true },
  "da silva": { name: "Da Silva", position: "Zagueiro", forceNew: true },
  ramon: { name: "Ramon", position: "Lateral Esquerdo", forceNew: true },
  gustavo: { name: "Gustavo", position: "Atacante", forceNew: true },
  volnei: { name: "Volnei", position: "Meia", forceNew: true },
  marcao: { name: "Marcão", position: "Zagueiro", forceNew: true },
  luciano: { name: "Luciano", position: "Meia", forceNew: true },
  "toni capela": { name: "Tôni Capela", position: "Lateral", forceNew: true },
  toni: { name: "Toni", position: "Meia", forceNew: true },
  "bruno alves": { name: "Bruno Alves", position: "Meia", forceNew: true },
  "william souza": { name: "William Souza", position: "Lateral", forceNew: true },
  jivago: { name: "Jivago", position: "Zagueiro", forceNew: true },
  kiko: { name: "Kiko", position: "Atacante", forceNew: true },
  missinho: { name: "Missinho", position: "Atacante", forceNew: true },
  "marcio pereira": { name: "Márcio Pereira", position: "Zagueiro", forceNew: true },
  veloso: { name: "Veloso", position: "Goleiro", forceNew: true },
  "roberto alves": { name: "Roberto Alves", position: "Volante", forceNew: true },
  "fabio magrao": { name: "Fábio Magrão", position: "Meia", forceNew: true },
};

const STADIUM_META = {
  "estadio guillermo soto rosa": {
    name: "Estádio Guillermo Soto Rosa",
    city: "Mérida",
    country: "Venezuela",
  },
  "estadio da colina": { name: "Estádio da Colina", city: "Manaus", state: "AM" },
  "estadio la boutique": {
    name: "Estádio La Boutique",
    city: "Córdoba",
    country: "Argentina",
  },
  "estadio joia da princesa": {
    name: "Estádio Joiá da Princesa",
    city: "Feira de Santana",
    state: "BA",
  },
  "estadio agamenon magalhaes": {
    name: "Estádio Agamenon Magalhães",
    city: "Goiana",
    state: "PE",
  },
  "estadio joao da hora": {
    name: "Estádio João da Hora",
    city: "Aracaju",
    state: "SE",
  },
};

const playerCache = new Map();
const createdPlayers = [];
const compCache = new Map();

async function competitionId(name) {
  if (compCache.has(name)) return compCache.get(name);
  const { rows } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [name]);
  if (!rows[0]) throw new Error(`Missing competition ${name}`);
  compCache.set(name, rows[0].id);
  return rows[0].id;
}

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

  const meta = CREATE_META[key];
  if (!meta) throw new Error(`Unresolved CSA player: "${raw}" (${key})`);

  let { rows } = await client.query(
    `SELECT p.id, p.name
     FROM players p
     JOIN player_season_stats pss ON pss.player_id = p.id
     WHERE p.name = $1 AND pss.season::text = $2
     ORDER BY p.id LIMIT 1`,
    [meta.name, SEASON],
  );

  if (!rows[0]) {
    if (DRY) {
      const fake = { id: -createdPlayers.length - 1, name: meta.name };
      createdPlayers.push(fake);
      playerCache.set(key, fake);
      return fake;
    }
    const ins = await client.query(
      `INSERT INTO players (name, position, nationality, nationality_flag, verification_status)
       VALUES ($1,$2,'Brasil','🇧🇷','unverified') RETURNING id, name`,
      [meta.name, meta.position],
    );
    rows = ins.rows;
    createdPlayers.push(rows[0]);
    console.log("PLAYER_CREATED", rows[0]);
    await client.query(
      `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
       VALUES ($1,$2,0,0,0) ON CONFLICT DO NOTHING`,
      [rows[0].id, SEASON],
    );
  }

  playerCache.set(key, rows[0]);
  playerCache.set(norm(rows[0].name), rows[0]);
  return rows[0];
}

async function ensureReferee(name, state = "AL") {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  if (DRY) return { id: null, name };
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,$2) RETURNING id, name`,
    [name, state],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureStadium(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const hit = all.find((s) => norm(s.name) === norm(name));
  if (hit) return hit;
  const soft = all.find(
    (s) => norm(s.name).includes(norm(name)) || norm(name).includes(norm(s.name)),
  );
  if (soft) return soft;
  const meta = STADIUM_META[norm(name)] ?? {
    name,
    city: null,
    state: "AL",
    country: "Brasil",
  };
  if (DRY) return { id: null, name: meta.name };
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,$4)
     RETURNING id, name`,
    [meta.name, meta.city ?? null, meta.state ?? "AL", meta.country ?? "Brasil"],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM managers`);
  const hit = all.find((m) => norm(m.name) === norm(name));
  if (hit) return hit;
  throw new Error(`Manager missing: ${name}`);
}

function scorersText(csaGoals = []) {
  const counts = new Map();
  for (const g of csaGoals) {
    if (g.ownGoalFor) {
      const label = `${g.name} (gc)`;
      counts.set(label, (counts.get(label) ?? 0) + 1);
      continue;
    }
    counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([n, c]) => (c > 1 ? `${n} (${c})` : n))
    .join(", ") || null;
}

async function syncSeasonFromSheets(season) {
  const { rows: stats } = await client.query(
    `
    WITH played AS (
      SELECT DISTINCT ml.match_id, ml.player_id
      FROM match_lineups ml
      JOIN matches m ON m.id=ml.match_id
      WHERE m.season::text=$1 AND ml.side='csa' AND ml.player_id IS NOT NULL
        AND coalesce(m.is_friendly,false)=false
        AND coalesce(m.status,'played')<>'scheduled'
        AND (
          ml.role='starter'
          OR EXISTS (
            SELECT 1 FROM match_substitutions ms
            WHERE ms.match_id=ml.match_id AND ms.side='csa' AND ms.player_in_id=ml.player_id
          )
        )
    ),
    apps AS (SELECT player_id, count(*)::int AS appearances FROM played GROUP BY player_id),
    goals AS (
      SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
      FROM match_goals mg JOIN matches m ON m.id=mg.match_id
      WHERE m.season::text=$1 AND mg.side='csa' AND mg.scorer_player_id IS NOT NULL
        AND coalesce(mg.is_own_goal,false)=false
        AND coalesce(m.is_friendly,false)=false
        AND coalesce(m.status,'played')<>'scheduled'
      GROUP BY mg.scorer_player_id
    )
    SELECT coalesce(a.player_id,g.player_id) AS player_id,
           coalesce(a.appearances,0)::int AS appearances,
           coalesce(g.goals,0)::int AS goals
    FROM apps a
    FULL OUTER JOIN goals g ON g.player_id=a.player_id
    `,
    [season],
  );

  let updated = 0;
  let inserted = 0;
  for (const s of stats) {
    const { rows: cur } = await client.query(
      `SELECT id, appearances, goals FROM player_season_stats
       WHERE player_id=$1 AND season::text=$2`,
      [s.player_id, season],
    );
    if (cur[0]) {
      if (cur[0].appearances !== s.appearances || cur[0].goals !== s.goals) {
        if (!DRY) {
          await client.query(
            `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
            [cur[0].id, s.appearances, s.goals],
          );
        }
        updated++;
      }
    } else if (!DRY) {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,$2,$3,$4,0)`,
        [s.player_id, season, s.appearances, s.goals],
      );
      inserted++;
    } else inserted++;
  }
  return { players: stats.length, updated, inserted };
}

async function refreshSeasonCompStats(season, competitionId) {
  const { rows: agg } = await client.query(
    `SELECT
       count(*)::int AS games,
       coalesce(sum(case when result='win' then 1 else 0 end),0)::int AS wins,
       coalesce(sum(case when result='draw' then 1 else 0 end),0)::int AS draws,
       coalesce(sum(case when result='loss' then 1 else 0 end),0)::int AS losses,
       coalesce(sum(goals_for),0)::int AS goals_for,
       coalesce(sum(goals_against),0)::int AS goals_against
     FROM matches
     WHERE season::text=$1 AND competition_id=$2
       AND coalesce(is_friendly,false)=false
       AND coalesce(status,'played')<>'scheduled'
       AND result IN ('win','draw','loss')`,
    [season, competitionId],
  );
  const a = agg[0];
  if (!DRY) {
    await client.query(
      `UPDATE season_competition_stats
       SET games=$1, wins=$2, draws=$3, losses=$4, goals_for=$5, goals_against=$6,
           stats_source='calculated', stats_recalculated_at=now()
       WHERE season::text=$7 AND competition_id=$8`,
      [
        a.games,
        a.wins,
        a.draws,
        a.losses,
        a.goals_for,
        a.goals_against,
        season,
        competitionId,
      ],
    );
  }
  return a;
}

try {
  if (!DRY) await client.query("BEGIN");

  const dateAlias = new Map(); // finalDate|compId → matchId (and original)
  const fixes = [];
  for (const fix of MATCH_FIXES) {
    const cid = await competitionId(fix.competition);
    const { rows: found } = await client.query(
      `SELECT id, match_date::date::text AS d, goals_for, goals_against, result,
              home_away, stadium_id, attendance, gross_revenue_text,
              penalties_for, penalties_against, manager_id, phase, round
       FROM matches
       WHERE season::text=$1 AND competition_id=$2 AND match_date::date::text=$3
       LIMIT 1`,
      [SEASON, cid, fix.date],
    );
    if (!found[0]) throw new Error(`Match not found ${fix.competition} ${fix.date}`);
    const m = found[0];
    const stadium = fix.stadium ? await ensureStadium(fix.stadium) : null;
    const manager = fix.manager ? await ensureManager(fix.manager) : null;
    const gf = fix.goalsFor ?? m.goals_for;
    const ga = fix.goalsAgainst ?? m.goals_against;
    const result = resultOf(gf, ga);
    const newDate = fix.newDate ?? m.d;

    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           match_date = $2,
           phase = COALESCE($3, phase),
           round = COALESCE($4, round),
           home_away = COALESCE($5, home_away),
           stadium_id = COALESCE($6, stadium_id),
           goals_for = $7,
           goals_against = $8,
           result = $9,
           attendance = COALESCE($10, attendance),
           gross_revenue_text = COALESCE($11, gross_revenue_text),
           penalties_for = COALESCE($12, penalties_for),
           penalties_against = COALESCE($13, penalties_against),
           manager_id = COALESCE($14, manager_id)
         WHERE id=$1`,
        [
          m.id,
          newDate,
          fix.phase ?? null,
          fix.round ?? null,
          fix.homeAway ?? null,
          stadium?.id ?? null,
          gf,
          ga,
          result,
          fix.attendance ?? null,
          fix.revenueText ?? null,
          fix.penaltiesFor ?? null,
          fix.penaltiesAgainst ?? null,
          manager?.id ?? null,
        ],
      );
    }
    dateAlias.set(`${cid}|${newDate}`, m.id);
    dateAlias.set(`${cid}|${m.d}`, m.id);
    fixes.push({
      id: m.id,
      comp: fix.competition.slice(0, 22),
      from: m.d,
      to: newDate,
      score: `${gf}x${ga}`,
      pen:
        fix.penaltiesFor != null
          ? `${fix.penaltiesFor}x${fix.penaltiesAgainst}`
          : "",
    });
  }

  const applied = [];
  for (const sheet of SHEETS) {
    const cid = await competitionId(sheet.competition);
    let matchId = dateAlias.get(`${cid}|${sheet.date}`);
    if (!matchId) {
      const { rows: found } = await client.query(
        `SELECT id FROM matches
         WHERE season::text=$1 AND competition_id=$2 AND match_date::date::text=$3
         LIMIT 1`,
        [SEASON, cid, sheet.date],
      );
      if (!found[0]) throw new Error(`Sheet match missing ${sheet.competition} ${sheet.date}`);
      matchId = found[0].id;
    }
    const m = { id: matchId, d: sheet.date };

    const referee = await ensureReferee(sheet.referee ?? null, sheet.refereeState ?? "AL");
    const manager = sheet.manager
      ? await ensureManager(
          typeof sheet.manager === "string" ? sheet.manager : "Celso Teixeira",
        )
      : null;
    const scorers = scorersText(sheet.csaGoals);

    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           referee_id = COALESCE($2, referee_id),
           manager_id = COALESCE($3, manager_id),
           scorers = COALESCE($4, scorers)
         WHERE id=$1`,
        [m.id, referee?.id ?? null, manager?.id ?? null, scorers],
      );
    }

    const hasLineup = (sheet.starters?.length ?? 0) > 0;
    const hasGoals =
      (sheet.csaGoals?.length ?? 0) > 0 || (sheet.oppGoals?.length ?? 0) > 0;
    if (!hasLineup && !hasGoals) {
      applied.push({ id: m.id, date: sheet.date, note: "meta-only" });
      continue;
    }

    if (!DRY) {
      await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [m.id]);
      await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [m.id]);
      await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [m.id]);
      await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [m.id]);
    }

    const csaLineup = new Map();
    const oppLineup = new Map();
    let sort = 0;

    for (const name of sheet.starters ?? []) {
      const p = await ensureCsaPlayer(name);
      if (csaLineup.has(p.id)) continue;
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
          [m.id, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      } else csaLineup.set(p.id, sort++);
    }

    for (const s of sheet.subs ?? []) {
      const p = await ensureCsaPlayer(s.in);
      if (csaLineup.has(p.id)) continue;
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [m.id, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      } else csaLineup.set(p.id, sort++);
    }

    let oppSort = 0;
    for (const name of sheet.oppStarters ?? []) {
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'opponent',NULL,$2,'starter',NULL,NULL,$3) RETURNING id`,
          [m.id, name, oppSort++],
        );
        oppLineup.set(norm(name), rows[0].id);
      } else oppLineup.set(norm(name), oppSort++);
    }
    for (const s of sheet.oppSubs ?? []) {
      if (oppLineup.has(norm(s.in))) continue;
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'opponent',NULL,$2,'bench',NULL,NULL,$3) RETURNING id`,
          [m.id, s.in, oppSort++],
        );
        oppLineup.set(norm(s.in), rows[0].id);
      } else oppLineup.set(norm(s.in), oppSort++);
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
            m.id,
            csaLineup.get(outP.id) ?? null,
            outP.id,
            outP.name,
            csaLineup.get(inP.id) ?? null,
            inP.id,
            inP.name,
            s.minute ?? 0,
          ],
        );
      }
    }
    for (const s of sheet.oppSubs ?? []) {
      if (!DRY) {
        await client.query(
          `INSERT INTO match_substitutions
             (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
              player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
           VALUES ($1,'opponent',$2,NULL,$3,$4,NULL,$5,$6,NULL)`,
          [
            m.id,
            oppLineup.get(norm(s.out)) ?? null,
            s.out,
            oppLineup.get(norm(s.in)) ?? null,
            s.in,
            s.minute ?? 0,
          ],
        );
      }
    }

    for (const g of sheet.csaGoals ?? []) {
      const p = await ensureCsaPlayer(g.name);
      if (!csaLineup.has(p.id)) {
        const role = hasLineup ? "bench" : "starter";
        if (!DRY) {
          const { rows } = await client.query(
            `INSERT INTO match_lineups
               (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
             VALUES ($1,'csa',$2,$3,$4,NULL,NULL,$5) RETURNING id`,
            [m.id, p.id, p.name, role, sort++],
          );
          csaLineup.set(p.id, rows[0].id);
        } else csaLineup.set(p.id, sort++);
      }
      if (!DRY) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal)
           VALUES ($1,'csa',$2,$3,$4,$5,NULL,$6,false)`,
          [
            m.id,
            csaLineup.get(p.id) ?? null,
            p.id,
            p.name,
            g.minute ?? 0,
            !!g.penalty,
          ],
        );
      }
    }
    for (const g of sheet.oppGoals ?? []) {
      // Marcelinho Paraíba may be listed as Marcelinho on bench
      const key = norm(g.name);
      const softKey = key.includes("marcelinho") ? "marcelinho" : key;
      if (!DRY) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal)
           VALUES ($1,'opponent',$2,NULL,$3,$4,NULL,$5,false)`,
          [
            m.id,
            oppLineup.get(softKey) ?? oppLineup.get(key) ?? null,
            g.name,
            g.minute ?? 0,
            !!g.penalty,
          ],
        );
      }
    }

    for (const c of sheet.cards ?? []) {
      const side = c.side ?? "csa";
      const minute =
        c.minute != null && Number.isFinite(c.minute) ? c.minute : 0;
      if (!DRY) {
        if (side === "csa") {
          const p = await ensureCsaPlayer(c.name);
          await client.query(
            `INSERT INTO match_cards
               (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
             VALUES ($1,'csa',$2,$3,$4,$5,$6,NULL)`,
            [
              m.id,
              c.type,
              csaLineup.get(p.id) ?? null,
              p.id,
              p.name,
              minute,
            ],
          );
        } else {
          await client.query(
            `INSERT INTO match_cards
               (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
             VALUES ($1,'opponent',$2,$3,NULL,$4,$5,NULL)`,
            [
              m.id,
              c.type,
              oppLineup.get(norm(c.name)) ?? null,
              c.name,
              minute,
            ],
          );
        }
      }
    }

    applied.push({
      id: m.id,
      date: sheet.date,
      comp: sheet.competition.slice(0, 18),
      starters: sheet.starters?.length ?? 0,
      csaGoals: sheet.csaGoals?.length ?? 0,
      oppGoals: sheet.oppGoals?.length ?? 0,
      cards: sheet.cards?.length ?? 0,
    });
  }

  if (!DRY) {
    for (const [comp, a, b] of RELATED_PAIRS) {
      const cid = await competitionId(comp);
      const { rows: ra } = await client.query(
        `SELECT id FROM matches WHERE season=$1 AND competition_id=$2 AND match_date=$3`,
        [SEASON, cid, a],
      );
      const { rows: rb } = await client.query(
        `SELECT id FROM matches WHERE season=$1 AND competition_id=$2 AND match_date=$3`,
        [SEASON, cid, b],
      );
      if (ra[0] && rb[0]) {
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
          ra[0].id,
          rb[0].id,
        ]);
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
          rb[0].id,
          ra[0].id,
        ]);
      }
    }
  }

  const sync = await syncSeasonFromSheets(SEASON);
  const comps = [
    "Copa do Brasil",
    "Copa do Nordeste",
    "Copa Conmebol",
    "Campeonato Brasileiro Série C",
  ];
  const seasonAggs = {};
  for (const c of comps) {
    seasonAggs[c] = await refreshSeasonCompStats(SEASON, await competitionId(c));
  }

  // Manager season stats for Celso Teixeira 1999 if linked
  if (!DRY) {
    const { rows: mgrRows } = await client.query(
      `SELECT manager_id, count(*)::int AS games,
              count(*) FILTER (WHERE result='win')::int AS wins,
              count(*) FILTER (WHERE result='draw')::int AS draws,
              count(*) FILTER (WHERE result='loss')::int AS losses,
              coalesce(sum(goals_for),0)::int AS goals_for,
              coalesce(sum(goals_against),0)::int AS goals_against
       FROM matches
       WHERE season=$1 AND manager_id IS NOT NULL
         AND coalesce(is_friendly,false)=false
         AND coalesce(status,'played')<>'scheduled'
       GROUP BY manager_id`,
      [SEASON],
    );
    for (const s of mgrRows) {
      const ex = await client.query(
        `SELECT id FROM manager_season_stats WHERE manager_id=$1 AND season=$2`,
        [s.manager_id, SEASON],
      );
      if (ex.rows[0]) {
        await client.query(
          `UPDATE manager_season_stats SET
             games=$1,wins=$2,draws=$3,losses=$4,goals_for=$5,goals_against=$6
           WHERE id=$7`,
          [
            s.games,
            s.wins,
            s.draws,
            s.losses,
            s.goals_for,
            s.goals_against,
            ex.rows[0].id,
          ],
        );
      } else {
        await client.query(
          `INSERT INTO manager_season_stats
             (manager_id,season,games,wins,draws,losses,goals_for,goals_against)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            s.manager_id,
            SEASON,
            s.games,
            s.wins,
            s.draws,
            s.losses,
            s.goals_for,
            s.goals_against,
          ],
        );
      }
    }
  }

  if (DRY) console.log("DRY RUN — no writes");
  else {
    await client.query("COMMIT");
    console.log("COMMIT ok");
  }
  console.log("fixes", fixes.length);
  console.table(fixes);
  console.log("createdPlayers", createdPlayers);
  console.log("sync", sync);
  console.log("seasonAggs", seasonAggs);
  console.table(applied);
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
