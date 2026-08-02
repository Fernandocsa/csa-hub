/**
 * Complement Alagoano 2026 sheets for matches without fichas:
 * 1305 CSE, 1306 Cruzeiro, 1307 CRB SF Ida, 1308 CRB SF Volta.
 * Skips 1302–1304 (already have CSA sheets).
 * Does not change score/date/competition/opponent.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
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
  robinho: 493,
  lucao: 486,
  "lucas serafini": 469,
  "ramon batista": null, // resolve by name
  ciel: 447,
  wellerson: 471,
  "fabricio bigode": 463,
  kaike: 455,
  "rian santana": 460,
  "marlon lopes": 473,
  samuel: 458,
};

const SPELL = {
  "ciel 99": "Ciel",
  ciel: "Ciel",
  wellerson: "Wellerson",
  "wéllerson": "Wellerson",
  kaike: "Kaike",
  "kaíke": "Kaike",
  "fabricio bigode": "Fabricio Bigode",
  "fabrício bigode": "Fabricio Bigode",
  ramon: "Ramon Batista",
  "ramon batista": "Ramon Batista",
  "ryan santana": "Rian Santana",
  "ryan bonfim": "Rian Santana",
  marlon: "Marlon Lopes",
  "cristal": "Crystopher",
  crystopher: "Crystopher",
  "chrystopher": "Crystopher",
  "vinicius barata": "Vinícius Barata",
  "vinícius barata": "Vinícius Barata",
  "vinicius nunes": "Vinícius Barata",
  "vinícius nunes": "Vinícius Barata",
};

const GAMES = [
  {
    id: 1305,
    label: "CSE 0x1 CSA",
    phase: "1ª Fase",
    round: "6ª rodada",
    stadium: "Estádio Juca Sampaio",
    referee: { name: "Jonata de Souza Gouveia", state: "AL" },
    attendance: null,
    csaStarters: [
      "Wellerson",
      "Marcos Ytalo",
      "Lucão",
      "Rayan",
      "Kaike",
      "Kayllan",
      "Fabricio Bigode",
      "Dudu Figueiredo",
      "Matheus Souza",
      "Buba",
      "Ciel",
    ],
    csaSubs: [
      { out: "Matheus Souza", in: "Ramon Batista", minute: 60 },
      { out: "Dudu Figueiredo", in: "Ronaldo Mendes", minute: 66 },
      { out: "Marcos Ytalo", in: "Lucas Serafini", minute: 80 },
      { out: "Ramon Batista", in: "Matheus Melo", minute: 80 },
    ],
    csaGoals: [{ name: "Ciel", minute: 41, penalty: true }],
    csaCards: [
      { name: "Buba", type: "yellow", minute: 72 },
      { name: "Lucas Serafini", type: "yellow", minute: 90, injury: 1 },
    ],
    oppStarters: [
      "Jeferson",
      "John Lenon",
      "Eduardo Leite",
      "Rafael Vaz",
      "Carlos Henrique",
      "Claudevan",
      "Jean Cléber",
      "Héctor Bustamante",
      "Pedro Júnior",
      "Michel Douglas",
      "Luiz Paulo",
    ],
    oppSubs: [
      { out: "John Lenon", in: "Edvelton", minute: 49 },
      { out: "Michel Douglas", in: "Tarcísio", minute: 59 },
      { out: "Pedro Júnior", in: "Thiago", minute: 59 },
      { out: "Carlos Henrique", in: "Jefinho", minute: 87 },
    ],
    oppGoals: [],
    oppCards: [],
    scorers: "Ciel",
  },
  {
    id: 1306,
    label: "CSA 2x0 Cruzeiro",
    phase: "1ª Fase",
    round: "7ª rodada",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: { name: "Denis da Silva Ribeiro Serafim", state: "AL" },
    attendance: 3982,
    csaStarters: [
      "Wellerson",
      "Marcos Ytalo",
      "Lucão",
      "Rayan",
      "Kaike",
      "Kayllan",
      "Fabricio Bigode",
      "Dudu Figueiredo",
      "Matheus Souza",
      "Buba",
      "Ciel",
    ],
    csaSubs: [
      { out: "Dudu Figueiredo", in: "Matheus Melo", minute: 46 },
      { out: "Matheus Souza", in: "Ronaldo Mendes", minute: 46 },
      { out: "Marcos Ytalo", in: "Rian Santana", minute: 75 },
      { out: "Fabricio Bigode", in: "Robinho", minute: 83 },
      { out: "Buba", in: "Samuel", minute: 83 },
    ],
    csaGoals: [
      { name: "Buba", minute: 20 },
      { name: "Ronaldo Mendes", minute: 58 },
    ],
    csaCards: [
      { name: "Ronaldo Mendes", type: "yellow", minute: 51 },
      { name: "Kayllan", type: "yellow", minute: 0 },
    ],
    oppStarters: [
      "Diogo",
      "Kaique",
      "Wesley",
      "Isaac",
      "Pedro Lucas",
      "Jeferson Mendes",
      "Sousinha",
      "Danilo",
      "Lucão",
      "Caíque Valdivia",
      "Estevam",
    ],
    oppSubs: [
      { out: "Estevam", in: "Ruan", minute: 68 },
      { out: "Danilo", in: "Fabrício", minute: 73 },
      { out: "Sousinha", in: "Samuel", minute: 73 },
    ],
    oppGoals: [],
    oppCards: [
      { name: "Isaac", type: "yellow", minute: 0 },
      { name: "Jeferson Mendes", type: "yellow", minute: 54 },
    ],
    scorers: "Buba, Ronaldo Mendes",
  },
  {
    id: 1307,
    label: "CRB 2x0 CSA SF Ida",
    phase: "Semifinal",
    round: "Ida",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: { name: "Ramon Abatti Abel", state: "SC" },
    attendance: null, // CSA away — do not set attendance
    csaStarters: [
      "Wellerson",
      "Marcos Ytalo",
      "Lucão",
      "Rayan",
      "Kaike",
      "Kayllan",
      "Fabricio Bigode",
      "Dudu Figueiredo",
      "Matheus Souza",
      "Buba",
      "Ciel",
    ],
    csaSubs: [
      { out: "Matheus Souza", in: "Ronaldo Mendes", minute: 68 },
      { out: "Marcos Ytalo", in: "Rian Santana", minute: 68 },
      { out: "Ronaldo Mendes", in: "Robinho", minute: 76 },
      { out: "Dudu Figueiredo", in: "Matheus Melo", minute: 76 },
      { out: "Buba", in: "Samuel", minute: 86 },
    ],
    csaGoals: [],
    csaCards: [{ name: "Marcos Ytalo", type: "yellow", minute: 0 }],
    oppStarters: [
      "Matheus Albino",
      "Hereda",
      "Henri",
      "Fábio Alemão",
      "Lucas Lovat",
      "Crystopher",
      "Pedro Castro",
      "Danielzinho",
      "Dadá Belmonte",
      "Douglas Baggio",
      "Mikael",
    ],
    oppSubs: [
      { out: "Danielzinho", in: "João Neto", minute: 63 },
      { out: "Pedro Castro", in: "Luizão", minute: 76 },
      { out: "Douglas Baggio", in: "Vinícius Barata", minute: 76 },
      { out: "Dadá Belmonte", in: "Wallace", minute: 86 },
    ],
    oppGoals: [
      { name: "Mikael", minute: 51 },
      { name: "Crystopher", minute: 90 },
    ],
    oppCards: [
      { name: "Douglas Baggio", type: "yellow", minute: 0 },
      { name: "Crystopher", type: "yellow", minute: 0 },
      { name: "Mikael", type: "red", minute: 58 },
    ],
    scorers: null,
  },
  {
    id: 1308,
    label: "CSA 0x2 CRB SF Volta",
    phase: "Semifinal",
    round: "Volta",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: { name: "Wilton Pereira Sampaio", state: "GO" },
    attendance: 9932,
    csaStarters: [
      "Wellerson",
      "Marcos Ytalo",
      "Marlon Lopes",
      "Rayan",
      "Kaike",
      "Kayllan",
      "Robinho",
      "Fabricio Bigode",
      "Matheus Melo",
      "Buba",
      "Ciel",
    ],
    csaSubs: [
      { out: "Marcos Ytalo", in: "Lucas Serafini", minute: 26 },
      { out: "Matheus Melo", in: "Dudu Figueiredo", minute: 46 },
      { out: "Marlon Lopes", in: "Rian Santana", minute: 46 },
      { out: "Robinho", in: "Matheus Souza", minute: 46 },
      { out: "Buba", in: "Samuel", minute: 72 },
    ],
    csaGoals: [],
    csaCards: [
      { name: "Wellerson", type: "yellow", minute: 19 },
      { name: "Robinho", type: "yellow", minute: 43 },
      { name: "Fabricio Bigode", type: "yellow", minute: 55 },
    ],
    oppStarters: [
      "Matheus Albino",
      "Hereda",
      "Henri",
      "Fábio Alemão",
      "Lucas Lovat",
      "Crystopher",
      "Pedro Castro",
      "Danielzinho",
      "Dadá Belmonte",
      "Douglas Baggio",
      "João Neto",
    ],
    oppSubs: [
      { out: "Pedro Castro", in: "Luizão", minute: 60 },
      { out: "Douglas Baggio", in: "Vinícius Barata", minute: 60 },
      { out: "Buba", in: "Samuel", minute: 72 }, // ignore — CRB side wrong; fixed below
      { out: "João Neto", in: "Luiz Phellype", minute: 72 },
      { out: "Lucas Lovat", in: "Wallace", minute: 72 },
      { out: "Danielzinho", in: "Geovane", minute: 75 },
    ],
    oppGoals: [
      { name: "Douglas Baggio", minute: 21, penalty: true },
      { name: "Vinícius Barata", minute: 67 },
    ],
    oppCards: [
      { name: "Matheus Albino", type: "yellow", minute: 12 },
      { name: "Douglas Baggio", type: "yellow", minute: 25 },
      { name: "Danielzinho", type: "yellow", minute: 43 },
      { name: "Lucas Lovat", type: "yellow", minute: 55 },
      { name: "Vinícius Barata", type: "yellow", minute: 68 },
    ],
    scorers: null,
  },
];

// Fix accidental wrong opp sub on 1308
GAMES[3].oppSubs = [
  { out: "Pedro Castro", in: "Luizão", minute: 60 },
  { out: "Douglas Baggio", in: "Vinícius Barata", minute: 60 },
  { out: "João Neto", in: "Luiz Phellype", minute: 72 },
  { out: "Lucas Lovat", in: "Wallace", minute: 72 },
  { out: "Danielzinho", in: "Geovane", minute: 75 },
];

try {
  await client.query("BEGIN");

  async function ensureReferee(ref) {
    let { rows } = await client.query(
      `SELECT id, name, state FROM referees WHERE lower(name)=lower($1) LIMIT 1`,
      [ref.name],
    );
    if (!rows[0]) {
      // accent-insensitive soft match
      const all = await client.query(`SELECT id, name, state FROM referees`);
      const hit = all.rows.find((r) => norm(r.name) === norm(ref.name));
      if (hit) rows = [hit];
    }
    if (!rows[0]) {
      const ins = await client.query(
        `INSERT INTO referees (name, state) VALUES ($1, $2) RETURNING id, name, state`,
        [ref.name, ref.state ?? null],
      );
      rows = ins.rows;
      console.log("REF_CREATED", rows[0]);
    } else if (ref.state) {
      await client.query(
        `UPDATE referees SET state=COALESCE(state, $2) WHERE id=$1`,
        [rows[0].id, ref.state],
      );
    }
    return rows[0];
  }

  async function ensureStadium(name) {
    let { rows } = await client.query(
      `SELECT id, name FROM stadiums WHERE name=$1 LIMIT 1`,
      [name],
    );
    if (!rows[0]) {
      const all = await client.query(`SELECT id, name FROM stadiums`);
      const hit = all.rows.find(
        (s) => norm(s.name).includes(norm(name).slice(0, 12)) || norm(name).includes(norm(s.name).slice(0, 12)),
      );
      if (hit) return hit;
      throw new Error(`stadium not found: ${name}`);
    }
    return rows[0];
  }

  const playerCache = new Map();
  async function resolveCsaPlayer(raw) {
    const mapped = SPELL[norm(raw)] ?? raw;
    const key = norm(mapped);
    if (playerCache.has(key)) return playerCache.get(key);
    if (FORCE_ID[key]) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
        FORCE_ID[key],
      ]);
      if (!rows[0]) throw new Error(`FORCE_ID miss ${raw}`);
      playerCache.set(key, rows[0]);
      return rows[0];
    }
    let { rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [mapped]);
    if (!rows[0]) {
      ({ rows } = await client.query(`SELECT id, name FROM players WHERE lower(name)=lower($1)`, [
        mapped,
      ]));
    }
    if (!rows[0]) {
      const { rows: all } = await client.query(`SELECT id, name FROM players`);
      const hits = all.filter((p) => norm(p.name) === key);
      if (hits.length === 1) rows = hits;
    }
    if (!rows[0]) throw new Error(`CSA player unresolved: ${raw}`);
    playerCache.set(key, rows[0]);
    return rows[0];
  }

  const applied = [];

  for (const g of GAMES) {
    // Guard: skip if CSA sheet already present
    const { rows: existing } = await client.query(
      `SELECT count(*)::int AS n FROM match_lineups WHERE match_id=$1 AND side='csa'`,
      [g.id],
    );
    if (existing[0].n > 0) {
      console.log("SKIP_HAS_SHEET", g.id, g.label, existing[0].n);
      continue;
    }

    const stadium = await ensureStadium(g.stadium);
    const referee = await ensureReferee(g.referee);

    const metaParams = [stadium.id, referee.id, g.phase, g.round, g.scorers, g.id];
    if (g.attendance != null) {
      await client.query(
        `UPDATE matches SET
           stadium_id=$1, referee_id=$2, phase=$3, round=$4, scorers=$5, attendance=$6
         WHERE id=$7
           AND goals_for IS NOT DISTINCT FROM goals_for
         RETURNING id`,
        [stadium.id, referee.id, g.phase, g.round, g.scorers, g.attendance, g.id],
      );
      // simpler update
      await client.query(
        `UPDATE matches SET stadium_id=$1, referee_id=$2, phase=$3, round=$4, scorers=$5, attendance=$6
         WHERE id=$7`,
        [stadium.id, referee.id, g.phase, g.round, g.scorers, g.attendance, g.id],
      );
    } else {
      await client.query(
        `UPDATE matches SET stadium_id=$1, referee_id=$2, phase=$3, round=$4, scorers=$5
         WHERE id=$6`,
        [stadium.id, referee.id, g.phase, g.round, g.scorers, g.id],
      );
    }

    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [g.id]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [g.id]);
    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [g.id]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [g.id]);

    const csaLineup = new Map();
    const oppLineup = new Map(); // by name
    let sort = 0;

    for (const name of g.csaStarters) {
      const p = await resolveCsaPlayer(name);
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
        [g.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    const benchNames = [];
    for (const s of g.csaSubs) {
      if (!benchNames.includes(s.in)) benchNames.push(s.in);
    }
    for (const name of benchNames) {
      const p = await resolveCsaPlayer(name);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [g.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    let oppSort = 0;
    for (const name of g.oppStarters) {
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'opponent',NULL,$2,'starter',NULL,NULL,$3) RETURNING id`,
        [g.id, name, oppSort++],
      );
      oppLineup.set(norm(name), rows[0].id);
    }
    const oppBench = [];
    for (const s of g.oppSubs) {
      if (!oppBench.includes(s.in)) oppBench.push(s.in);
    }
    for (const name of oppBench) {
      if (oppLineup.has(norm(name))) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'opponent',NULL,$2,'bench',NULL,NULL,$3) RETURNING id`,
        [g.id, name, oppSort++],
      );
      oppLineup.set(norm(name), rows[0].id);
    }

    for (const goal of g.csaGoals) {
      const p = await resolveCsaPlayer(goal.name);
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute, injury_time_minute, is_penalty)
         VALUES ($1,'csa',$2,$3,$4,$5,NULL,$6)`,
        [g.id, csaLineup.get(p.id) ?? null, p.id, p.name, goal.minute, !!goal.penalty],
      );
    }
    for (const goal of g.oppGoals) {
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute, injury_time_minute, is_penalty)
         VALUES ($1,'opponent',$2,NULL,$3,$4,NULL,$5)`,
        [
          g.id,
          oppLineup.get(norm(goal.name)) ?? null,
          goal.name,
          goal.minute,
          !!goal.penalty,
        ],
      );
    }

    for (const card of g.csaCards) {
      const p = await resolveCsaPlayer(card.name);
      await client.query(
        `INSERT INTO match_cards
           (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,$5,$6,$7)`,
        [
          g.id,
          card.type,
          csaLineup.get(p.id) ?? null,
          p.id,
          p.name,
          card.minute,
          card.injury ?? null,
        ],
      );
    }
    for (const card of g.oppCards) {
      await client.query(
        `INSERT INTO match_cards
           (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
         VALUES ($1,'opponent',$2,$3,NULL,$4,$5,NULL)`,
        [g.id, card.type, oppLineup.get(norm(card.name)) ?? null, card.name, card.minute],
      );
    }

    for (const s of g.csaSubs) {
      const outP = await resolveCsaPlayer(s.out);
      const inP = await resolveCsaPlayer(s.in);
      await client.query(
        `INSERT INTO match_substitutions
           (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
            player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,NULL)`,
        [
          g.id,
          csaLineup.get(outP.id) ?? null,
          outP.id,
          outP.name,
          csaLineup.get(inP.id) ?? null,
          inP.id,
          inP.name,
          s.minute,
        ],
      );
    }
    for (const s of g.oppSubs) {
      await client.query(
        `INSERT INTO match_substitutions
           (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
            player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
         VALUES ($1,'opponent',$2,NULL,$3,$4,NULL,$5,$6,NULL)`,
        [
          g.id,
          oppLineup.get(norm(s.out)) ?? null,
          s.out,
          oppLineup.get(norm(s.in)) ?? null,
          s.in,
          s.minute,
        ],
      );
    }

    applied.push({
      id: g.id,
      label: g.label,
      attendance: g.attendance,
      csaStarters: g.csaStarters.length,
      csaSubs: g.csaSubs.length,
      csaGoals: g.csaGoals.length,
      oppStarters: g.oppStarters.length,
    });
    console.log("APPLIED", g.id, g.label);
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, applied }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
