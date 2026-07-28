/**
 * One-shot: migrate next_match singleton → matches.status='scheduled', then clear next_match.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const { rows: nmRows } = await pool.query(
  `SELECT id, opponent, match_date, competition, home_away, stadium, opponent_id, match_id
   FROM next_match WHERE id = 1`,
);

if (nmRows.length === 0) {
  console.log("next_match empty — nothing to migrate");
  await pool.end();
  process.exit(0);
}

const nm = nmRows[0];
console.log("next_match row:", nm);

let matchId = nm.match_id != null ? Number(nm.match_id) : null;

if (matchId) {
  const exists = await pool.query(`SELECT id, status FROM matches WHERE id = $1`, [matchId]);
  if (exists.rows.length === 0) {
    console.log(`matchId=${matchId} missing — will create new scheduled row`);
    matchId = null;
  } else {
    await pool.query(
      `UPDATE matches
       SET status = 'scheduled',
           goals_for = NULL,
           goals_against = NULL,
           result = 'unknown'
       WHERE id = $1`,
      [matchId],
    );
    console.log(`Updated matches.id=${matchId} → status=scheduled`);
  }
}

if (!matchId) {
  let opponentId = nm.opponent_id != null ? Number(nm.opponent_id) : null;
  if (!opponentId && nm.opponent) {
    const o = await pool.query(
      `SELECT id FROM opponents WHERE lower(name) = lower($1) LIMIT 1`,
      [nm.opponent],
    );
    opponentId = o.rows[0]?.id ?? null;
  }
  if (!opponentId) {
    throw new Error(`Cannot resolve opponent for next_match (${nm.opponent})`);
  }

  let competitionId = null;
  if (nm.competition) {
    const c = await pool.query(
      `SELECT id FROM competitions WHERE lower(name) = lower($1) LIMIT 1`,
      [nm.competition],
    );
    competitionId = c.rows[0]?.id ?? null;
  }
  if (!competitionId) {
    throw new Error(`Cannot resolve competition for next_match (${nm.competition})`);
  }

  let stadiumId = null;
  if (nm.stadium) {
    const s = await pool.query(
      `SELECT id FROM stadiums WHERE lower(name) = lower($1) LIMIT 1`,
      [nm.stadium],
    );
    stadiumId = s.rows[0]?.id ?? null;
  }

  const season = String(nm.match_date).slice(0, 4);
  const homeAway = nm.home_away === "away" ? "away" : nm.home_away === "neutral" ? "neutral" : "home";

  const inserted = await pool.query(
    `INSERT INTO matches (
       match_date, season, opponent_id, competition_id, stadium_id,
       home_away, goals_for, goals_against, result, status,
       is_friendly, is_walkover, own_goals_for_count
     ) VALUES ($1,$2,$3,$4,$5,$6,NULL,NULL,'unknown','scheduled',false,false,0)
     RETURNING id`,
    [nm.match_date, season, opponentId, competitionId, stadiumId, homeAway],
  );
  matchId = inserted.rows[0].id;
  console.log(`Created matches.id=${matchId} as scheduled`);
}

await pool.query(`DELETE FROM next_match`);
console.log("Cleared next_match table");

const check = await pool.query(
  `SELECT id, match_date, status FROM matches WHERE id = $1`,
  [matchId],
);
console.log("Migrated fixture:", check.rows[0]);

const nextPublic = await pool.query(
  `SELECT m.id, m.match_date, o.name AS opponent
   FROM matches m
   JOIN opponents o ON o.id = m.opponent_id
   WHERE m.status = 'scheduled' AND m.match_date >= CURRENT_DATE
   ORDER BY m.match_date ASC, m.id ASC
   LIMIT 1`,
);
console.log("Public next-match would be:", nextPublic.rows[0] ?? null);

await pool.end();
console.log("MIGRATE_NEXT_MATCH_PASS");
