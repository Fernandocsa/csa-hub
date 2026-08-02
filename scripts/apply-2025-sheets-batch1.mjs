/**
 * Apply CSA 2025 match sheets — batch 1 (Jan: games 1–6).
 * Gustavinho → Gustavo Cabral #399 (user confirmed).
 * Confiança keeps DB date 2025-01-21 (#1266).
 *
 * Usage: node scripts/apply-2025-sheets-batch1.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

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

function parseMinute(raw) {
  const s = String(raw).trim();
  const m = s.match(/^(\d+)(?:\+(\d+))?$/);
  if (!m) throw new Error(`Bad minute: ${raw}`);
  return { minute: Number(m[1]), injury: m[2] ? Number(m[2]) : null };
}

const FORCE_ID = {
  georgemy: 434,
  cedric: 40,
  "eduardo biazus": 404,
  betao: 439,
  roberto: 398,
  brayann: 378,
  "gustavo nicola": 371,
  gustavinho: 399, // Gustavo Cabral
  "gustavo cabral": 399,
  buga: 387,
  "guilherme cachoeira": 423,
  "igor bahia": 416,
  enzo: 414,
  "enzo santos": 414,
  vander: 411,
  "tiago marques": 367,
  alvaro: 383,
  wanderson: 441,
  silas: 254,
  robinho: 493,
  klenisson: 437,
  raphinha: 407,
};

const created = [];
const playerCache = new Map();

async function resolvePlayer(rawName) {
  const name = String(rawName).trim();
  const key = norm(name);
  if (playerCache.has(key)) return playerCache.get(key);

  if (Object.prototype.hasOwnProperty.call(FORCE_ID, key)) {
    const id = FORCE_ID[key];
    const { rows } = await client.query(
      `SELECT id, name FROM players WHERE id=$1`,
      [id],
    );
    if (!rows[0]) throw new Error(`FORCE_ID missing player #${id} for ${name}`);
    playerCache.set(key, rows[0]);
    return rows[0];
  }

  const { rows } = await client.query(
    `SELECT id, name FROM players
     WHERE translate(lower(name), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') = $1
     ORDER BY id`,
    [key],
  );
  if (rows.length === 1) {
    playerCache.set(key, rows[0]);
    return rows[0];
  }
  if (rows.length > 1) {
    throw new Error(`Ambiguous player "${name}": ${rows.map((r) => `#${r.id}`).join(", ")}`);
  }

  if (DRY) {
    const fake = { id: -created.length - 1, name };
    created.push({ name, dry: true });
    playerCache.set(key, fake);
    return fake;
  }

  const { rows: ins } = await client.query(
    `INSERT INTO players (name, nationality, verification_status)
     VALUES ($1, 'Brasil', 'unverified') RETURNING id, name`,
    [name],
  );
  created.push(ins[0]);
  playerCache.set(key, ins[0]);
  return ins[0];
}

function scorersText(goals) {
  const counts = new Map();
  for (const g of goals) {
    const n = g.name;
    counts.set(n, (counts.get(n) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([n, c]) => (c > 1 ? `${n} ${c}` : n))
    .join(", ");
}

const GAMES = [
  {
    id: 1253,
    label: "CSA 1x0 Barcelona de Ilhéus",
    managerId: 10,
    starters: [
      "Georgemy",
      "Cedric",
      "Eduardo Biazus",
      "Betão",
      "Roberto",
      "Brayann",
      "Gustavo Nicola",
      "Gustavinho",
      "Buga",
      "Guilherme Cachoeira",
      "Igor Bahia",
    ],
    subs: [
      { out: "Roberto", in: "Enzo", minute: 46 },
      { out: "Buga", in: "Vander", minute: 66 },
      { out: "Igor Bahia", in: "Tiago Marques", minute: 66 },
      { out: "Gustavinho", in: "Álvaro", minute: 78 },
      { out: "Brayann", in: "Wellington Nunes", minute: 86 },
    ],
    goals: [
      { name: "Guilherme Cachoeira", minute: "18", assist: "Buga" },
    ],
    cards: [
      { name: "Roberto", type: "yellow", minute: "43" },
      { name: "Betão", type: "yellow", minute: "69" },
      { name: "Vander", type: "yellow", minute: "70" },
      { name: "Vander", type: "red", minute: "89" }, // 2º amarelo
    ],
  },
  {
    id: 1254,
    label: "CSA 1x0 Maracanã",
    managerId: 10,
    starters: [
      "Georgemy",
      "Cedric",
      "Betão",
      "Wanderson",
      "Roberto",
      "Gustavo Nicola",
      "Brayann",
      "Gustavinho",
      "Buga",
      "Igor Bahia",
      "Guilherme Cachoeira",
    ],
    subs: [
      { out: "Roberto", in: "Enzo", minute: 4 },
      { out: "Brayann", in: "Álvaro", minute: 46 },
      { out: "Buga", in: "Silas", minute: 62 },
      { out: "Gustavinho", in: "Tiago Marques", minute: 78 },
      { out: "Igor Bahia", in: "Robinho", minute: 78 },
    ],
    goals: [
      { name: "Igor Bahia", minute: "48", assist: "Cedric" },
    ],
    cards: [
      { name: "Guilherme Cachoeira", type: "yellow", minute: "37" },
      { name: "Betão", type: "yellow", minute: "64" },
      { name: "Georgemy", type: "yellow", minute: "71" },
    ],
  },
  {
    id: 1255,
    label: "CSA 3x0 CSE",
    managerId: 10,
    starters: [
      "Georgemy",
      "Cedric",
      "Betão",
      "Wanderson",
      "Enzo",
      "Gustavo Nicola",
      "Brayann",
      "Gustavinho",
      "Buga",
      "Tiago Marques",
      "Guilherme Cachoeira",
    ],
    subs: [
      { out: "Buga", in: "Vander", minute: 46 },
      { out: "Guilherme Cachoeira", in: "Álvaro", minute: 62 },
      { out: "Brayann", in: "Klenisson", minute: 82 },
      { out: "Gustavinho", in: "Robinho", minute: 82 },
      { out: "Tiago Marques", in: "Wellington Nunes", minute: 88 },
    ],
    goals: [
      { name: "Guilherme Cachoeira", minute: "2", assist: "Brayann" },
      { name: "Brayann", minute: "76", penalty: true },
      { name: "Álvaro", minute: "90+1" },
    ],
    cards: [
      { name: "Buga", type: "yellow", minute: "27" },
      { name: "Vander", type: "yellow", minute: "51" },
    ],
  },
  {
    id: 1257,
    label: "CSA 2x0 Murici",
    managerId: 10,
    starters: [
      "Georgemy",
      "Cedric",
      "Betão",
      "Wanderson",
      "Enzo",
      "Gustavo Nicola",
      "Brayann",
      "Gustavinho",
      "Buga",
      "Tiago Marques",
      "Guilherme Cachoeira",
    ],
    subs: [
      { out: "Gustavinho", in: "Vander", minute: 46 },
      { out: "Buga", in: "Álvaro", minute: 46 },
      { out: "Tiago Marques", in: "Igor Bahia", minute: 66 },
      { out: "Guilherme Cachoeira", in: "Robinho", minute: 70 },
      { out: "Brayann", in: "Wellington Nunes", minute: 81 },
    ],
    goals: [
      { name: "Tiago Marques", minute: "48", assist: "Guilherme Cachoeira" },
      { name: "Tiago Marques", minute: "61" },
    ],
    cards: [
      { name: "Guilherme Cachoeira", type: "yellow", minute: "45+3" },
    ],
  },
  {
    id: 1266,
    label: "CSA 2x1 Confiança",
    managerId: 10,
    starters: [
      "Georgemy",
      "Cedric",
      "Betão",
      "Wanderson",
      "Enzo",
      "Gustavo Nicola",
      "Vander",
      "Brayann",
      "Álvaro",
      "Igor Bahia",
      "Guilherme Cachoeira",
    ],
    subs: [
      { out: "Cedric", in: "Raphinha", minute: 66 },
      { out: "Álvaro", in: "Silas", minute: 66 },
      { out: "Enzo", in: "Buga", minute: 74 },
      { out: "Igor Bahia", in: "Tiago Marques", minute: 74 },
      { out: "Brayann", in: "Wellington Nunes", minute: 89 },
    ],
    goals: [
      { name: "Igor Bahia", minute: "8", assist: "Cedric" },
      { name: "Igor Bahia", minute: "13", assist: "Guilherme Cachoeira" },
    ],
    oppGoals: [{ name: "Rodriguinho", minute: "21" }],
    cards: [
      { name: "Álvaro", type: "yellow", minute: "37" },
      { name: "Enzo", type: "yellow", minute: "69" },
      { name: "Igor Bahia", type: "yellow", minute: "72" },
      { name: "Brayann", type: "yellow", minute: "78" },
    ],
  },
  {
    id: 1258,
    label: "CRB 2x3 CSA",
    managerId: 10,
    starters: [
      "Georgemy",
      "Cedric",
      "Betão",
      "Wanderson",
      "Roberto",
      "Gustavo Nicola",
      "Vander",
      "Brayann",
      "Igor Bahia",
      "Tiago Marques",
      "Guilherme Cachoeira",
    ],
    subs: [
      { out: "Gustavo Nicola", in: "Buga", minute: 46 },
      { out: "Igor Bahia", in: "Álvaro", minute: 60 },
      { out: "Cedric", in: "Raphinha", minute: 72 },
      { out: "Brayann", in: "Gustavinho", minute: 72 },
      { out: "Roberto", in: "Silas", minute: 88 },
    ],
    goals: [
      { name: "Guilherme Cachoeira", minute: "22" },
      { name: "Tiago Marques", minute: "30", assist: "Guilherme Cachoeira" },
      { name: "Tiago Marques", minute: "79", assist: "Raphinha" },
    ],
    oppGoals: [
      { name: "Rafinha", minute: "35" },
      { name: "Miranda", minute: "71" },
    ],
    cards: [
      { name: "Gustavo Nicola", type: "yellow", minute: "39" },
      { name: "Igor Bahia", type: "yellow", minute: "43" },
      { name: "Betão", type: "yellow", minute: "58" },
      { name: "Vander", type: "yellow", minute: "68" },
    ],
  },
];

const applied = [];

try {
  await client.query("BEGIN");

  // Fill empty weight for Gustavo Cabral from user bio
  await client.query(
    `UPDATE players SET weight_kg = COALESCE(weight_kg, 76) WHERE id = 399`,
  );

  for (const g of GAMES) {
    const { rows: matchRows } = await client.query(
      `SELECT id, goals_for, goals_against,
              (SELECT count(*)::int FROM match_lineups ml WHERE ml.match_id=m.id AND ml.side='csa') AS lineup_n
       FROM matches m WHERE id=$1`,
      [g.id],
    );
    const match = matchRows[0];
    if (!match) throw new Error(`Match not found: ${g.id} (${g.label})`);
    if (match.lineup_n > 0) {
      throw new Error(`Match #${g.id} already has ${match.lineup_n} CSA lineup rows`);
    }

    const expectedFor = g.goals.length;
    const expectedAgainst = (g.oppGoals || []).length;
    if (match.goals_for !== expectedFor || match.goals_against !== expectedAgainst) {
      throw new Error(
        `Score mismatch #${g.id}: DB ${match.goals_for}x${match.goals_against} vs sheet ${expectedFor}x${expectedAgainst}`,
      );
    }

    const scorers = scorersText(g.goals);

    if (!DRY) {
      await client.query(
        `UPDATE matches SET manager_id=$2, scorers=$3 WHERE id=$1`,
        [g.id, g.managerId, scorers],
      );

      await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [g.id]);
      await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [g.id]);
      await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [g.id]);
      await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [g.id]);
    }

    const lineupByPlayer = new Map();
    let sort = 0;

    for (const name of g.starters) {
      const p = await resolvePlayer(name);
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
          [g.id, p.id, p.name, sort++],
        );
        lineupByPlayer.set(p.id, rows[0].id);
      } else {
        lineupByPlayer.set(p.id, sort++);
      }
    }

    const benchNames = [];
    for (const s of g.subs) {
      if (!benchNames.includes(s.in)) benchNames.push(s.in);
    }
    for (const name of benchNames) {
      const p = await resolvePlayer(name);
      if (lineupByPlayer.has(p.id)) continue;
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [g.id, p.id, p.name, sort++],
        );
        lineupByPlayer.set(p.id, rows[0].id);
      } else {
        lineupByPlayer.set(p.id, sort++);
      }
    }

    for (const goal of g.goals) {
      const p = await resolvePlayer(goal.name);
      const t = parseMinute(goal.minute);
      let assistId = null;
      let assistName = null;
      let assistLineup = null;
      if (goal.assist) {
        const a = await resolvePlayer(goal.assist);
        assistId = a.id;
        assistName = a.name;
        assistLineup = lineupByPlayer.get(a.id) ?? null;
      }
      if (!DRY) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, assist_lineup_id, assist_player_id, assist_name, is_penalty)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            g.id,
            lineupByPlayer.get(p.id) ?? null,
            p.id,
            p.name,
            t.minute,
            t.injury,
            assistLineup,
            assistId,
            assistName,
            !!goal.penalty,
          ],
        );
      }
    }

    for (const goal of g.oppGoals || []) {
      const t = parseMinute(goal.minute);
      if (!DRY) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty)
           VALUES ($1,'opponent',NULL,NULL,$2,$3,$4,$5)`,
          [g.id, goal.name, t.minute, t.injury, !!goal.penalty],
        );
      }
    }

    for (const card of g.cards) {
      const p = await resolvePlayer(card.name);
      const t = parseMinute(card.minute);
      if (!DRY) {
        await client.query(
          `INSERT INTO match_cards
             (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7)`,
          [
            g.id,
            card.type,
            lineupByPlayer.get(p.id) ?? null,
            p.id,
            p.name,
            t.minute,
            t.injury,
          ],
        );
      }
    }

    for (const s of g.subs) {
      const outP = await resolvePlayer(s.out);
      const inP = await resolvePlayer(s.in);
      if (!DRY) {
        await client.query(
          `INSERT INTO match_substitutions
             (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
              player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,NULL)`,
          [
            g.id,
            lineupByPlayer.get(outP.id) ?? null,
            outP.id,
            outP.name,
            lineupByPlayer.get(inP.id) ?? null,
            inP.id,
            inP.name,
            s.minute,
          ],
        );
      }
    }

    applied.push({
      id: g.id,
      label: g.label,
      starters: g.starters.length,
      bench: benchNames.length,
      goals: g.goals.length,
      oppGoals: (g.oppGoals || []).length,
      cards: g.cards.length,
      subs: g.subs.length,
      scorers,
    });
  }

  if (DRY) {
    await client.query("ROLLBACK");
    console.log(JSON.stringify({ dry: true, created, applied }, null, 2));
  } else {
    await client.query("COMMIT");
    console.log(JSON.stringify({ ok: true, created, applied }, null, 2));
  }
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
