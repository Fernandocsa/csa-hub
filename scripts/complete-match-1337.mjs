/**
 * Complete match #1337 ficha: stadium, referee, phase/round, CSA sheet.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1337;
const OPPONENT_ID = 126;

const STARTERS = [
  { name: "Yago Oliveira", shirt: 12, position: "Goleiro" },
  { name: "Caio Hila", shirt: 2, position: null },
  { name: "Félix Jorge", shirt: 3, position: null },
  { name: "Rayan", shirt: 4, position: null },
  { name: "Ailton Santos", shirt: 60, position: null },
  { name: "Camacho", shirt: 5, position: null },
  { name: "Kayllan", shirt: 8, position: null },
  { name: "Dudu Figueiredo", shirt: 10, position: null },
  { name: "Matheus Melo", shirt: 30, position: null },
  { name: "Fabricio Bigode", shirt: 15, position: null },
  { name: "Rian Santana", shirt: 11, position: null },
];

const BENCH = [
  { name: "Lucas Silva", shirt: 23 },
  { name: "Everton Heleno", shirt: 80 },
  { name: "Ronaldo Mendes", shirt: 7 },
  { name: "Kaike", shirt: 6 },
  { name: "Wesley (Cadu)", shirt: 18, displayAs: "Wesley" },
  { name: "Arthur Silveira", shirt: 22 },
  { name: "Marcos Ytalo", shirt: 17 },
  { name: "Mikael", shirt: 13 },
  { name: "Marlon Lopes", shirt: 20 },
  { name: "Gustavo", shirt: 27 },
  { name: "Lucas Lima", shirt: 9 },
  { name: "Matheus Souza", shirt: 70 },
];

try {
  await client.query("BEGIN");

  // Stadium
  let stadiumId;
  const existingStad = await client.query(
    `SELECT id FROM stadiums WHERE name ILIKE '19 de Outubro' LIMIT 1`,
  );
  if (existingStad.rows[0]) {
    stadiumId = existingStad.rows[0].id;
    console.log("STADIUM_EXISTS", stadiumId);
  } else {
    const ins = await client.query(
      `INSERT INTO stadiums (name, city, state, country, capacity)
       VALUES ($1, $2, $3, NULL, NULL) RETURNING id, name, city, state`,
      ["19 de Outubro", "Ijuí", "RS"],
    );
    stadiumId = ins.rows[0].id;
    console.log("STADIUM_CREATED", ins.rows[0]);
  }

  await client.query(
    `UPDATE opponents SET home_stadium_id = $1 WHERE id = $2`,
    [stadiumId, OPPONENT_ID],
  );
  console.log("OPPONENT_HOME_STADIUM_LINKED", { opponentId: OPPONENT_ID, stadiumId });

  // Referee
  let refereeId;
  const existingRef = await client.query(
    `SELECT id FROM referees WHERE name ILIKE 'Michelangelo Martins Júnior' LIMIT 1`,
  );
  if (existingRef.rows[0]) {
    refereeId = existingRef.rows[0].id;
    console.log("REF_EXISTS", refereeId);
  } else {
    const ins = await client.query(
      `INSERT INTO referees (name, state) VALUES ($1, NULL) RETURNING id, name`,
      ["Michelangelo Martins Júnior"],
    );
    refereeId = ins.rows[0].id;
    console.log("REF_CREATED", ins.rows[0]);
  }

  // Update match meta
  const upd = await client.query(
    `UPDATE matches SET
       stadium_id = $1,
       referee_id = $2,
       phase = $3,
       round = $4
     WHERE id = $5
     RETURNING id, match_date, phase, round, stadium_id, referee_id, manager_id,
               goals_for, goals_against, result, home_away`,
    [stadiumId, refereeId, "Oitavas de Final", "Ida", MATCH_ID],
  );
  console.log("MATCH_UPDATED", upd.rows[0]);

  // Resolve players
  async function resolvePlayer(name) {
    const { rows } = await client.query(
      `SELECT id, name, position FROM players WHERE name = $1 LIMIT 1`,
      [name],
    );
    if (!rows[0]) throw new Error(`player not found: ${name}`);
    return rows[0];
  }

  // Clear existing sheet
  await client.query(`DELETE FROM match_goals WHERE match_id = $1`, [MATCH_ID]);
  await client.query(`DELETE FROM match_cards WHERE match_id = $1`, [MATCH_ID]);
  await client.query(`DELETE FROM match_substitutions WHERE match_id = $1`, [MATCH_ID]);
  await client.query(
    `DELETE FROM match_lineups WHERE match_id = $1 AND side = 'csa'`,
    [MATCH_ID],
  );

  const lineupIdByPlayer = new Map();
  let sort = 0;

  for (const s of STARTERS) {
    const p = await resolvePlayer(s.name);
    const pos = s.position ?? p.position ?? null;
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
       VALUES ($1,'csa',$2,$3,'starter',$4,$5,$6)
       RETURNING id, player_id, player_name, shirt_number, role, position`,
      [MATCH_ID, p.id, p.name, s.shirt, pos, sort++],
    );
    lineupIdByPlayer.set(p.id, rows[0].id);
  }

  for (const b of BENCH) {
    const p = await resolvePlayer(b.name);
    const display = b.displayAs ?? p.name;
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
       VALUES ($1,'csa',$2,$3,'bench',$4,$5,$6)
       RETURNING id, player_id, player_name, shirt_number, role`,
      [MATCH_ID, p.id, display, b.shirt, p.position ?? null, sort++],
    );
    lineupIdByPlayer.set(p.id, rows[0].id);
  }

  const cards = [
    { name: "Rayan", minute: 11, injury: null },
    { name: "Kayllan", minute: 71, injury: null },
    { name: "Yago Oliveira", minute: 90, injury: 2 },
  ];
  for (const c of cards) {
    const p = await resolvePlayer(c.name);
    const lineupId = lineupIdByPlayer.get(p.id);
    await client.query(
      `INSERT INTO match_cards
         (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
       VALUES ($1,'csa','yellow',$2,$3,$4,$5,$6)`,
      [MATCH_ID, lineupId, p.id, p.name, c.minute, c.injury],
    );
  }

  const subs = [
    { out: "Dudu Figueiredo", in: "Lucas Silva", minute: 46, injury: null },
    { out: "Fabricio Bigode", in: "Everton Heleno", minute: 75, injury: null },
    { out: "Rian Santana", in: "Ronaldo Mendes", minute: 87, injury: null },
    { out: "Kayllan", in: "Kaike", minute: 90, injury: 4 },
    { out: "Matheus Melo", in: "Wesley (Cadu)", minute: 90, injury: 4 },
  ];
  for (const s of subs) {
    const outP = await resolvePlayer(s.out);
    const inP = await resolvePlayer(s.in);
    await client.query(
      `INSERT INTO match_substitutions
         (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
          player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
       VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        MATCH_ID,
        lineupIdByPlayer.get(outP.id),
        outP.id,
        outP.name,
        lineupIdByPlayer.get(inP.id),
        inP.id,
        s.in === "Wesley (Cadu)" ? "Wesley" : inP.name,
        s.minute,
        s.injury,
      ],
    );
  }

  await client.query("COMMIT");
  console.log("COMMIT_OK");

  // Summary
  const { rows: summary } = await client.query(
    `SELECT m.id, m.match_date::date AS date, m.season, m.goals_for, m.goals_against,
            m.result, m.home_away, m.phase, m.round,
            o.name AS opponent, c.name AS competition,
            s.name AS stadium, s.city AS stadium_city, s.state AS stadium_state,
            o.home_stadium_id,
            mgr.name AS manager, r.name AS referee
     FROM matches m
     JOIN opponents o ON o.id = m.opponent_id
     JOIN competitions c ON c.id = m.competition_id
     LEFT JOIN stadiums s ON s.id = m.stadium_id
     LEFT JOIN managers mgr ON mgr.id = m.manager_id
     LEFT JOIN referees r ON r.id = m.referee_id
     WHERE m.id = $1`,
    [MATCH_ID],
  );
  const { rows: lineups } = await client.query(
    `SELECT role, shirt_number, player_name, position
     FROM match_lineups WHERE match_id=$1 AND side='csa'
     ORDER BY CASE role WHEN 'starter' THEN 0 ELSE 1 END, sort_order`,
    [MATCH_ID],
  );
  const { rows: cardRows } = await client.query(
    `SELECT player_name, minute, injury_time_minute, card_type FROM match_cards WHERE match_id=$1 ORDER BY minute, injury_time_minute NULLS FIRST`,
    [MATCH_ID],
  );
  const { rows: subRows } = await client.query(
    `SELECT player_out_name, player_in_name, minute, injury_time_minute
     FROM match_substitutions WHERE match_id=$1
     ORDER BY minute, injury_time_minute NULLS FIRST`,
    [MATCH_ID],
  );
  const { rows: goalRows } = await client.query(
    `SELECT count(*)::int AS n FROM match_goals WHERE match_id=$1`,
    [MATCH_ID],
  );

  console.log("=== SUMMARY ===");
  console.log(JSON.stringify({
    match: summary[0],
    starters: lineups.filter((l) => l.role === "starter"),
    bench: lineups.filter((l) => l.role === "bench"),
    cards: cardRows,
    substitutions: subRows,
    goals: goalRows[0].n,
  }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
