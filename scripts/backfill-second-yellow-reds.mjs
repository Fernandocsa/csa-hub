/**
 * Backfill: for every CSA player with 2+ yellows in a match, ensure a red
 * exists at the second yellow's minute (second-yellow expulsion).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

function sameClock(a, b) {
  return (
    (a.minute ?? 200) === (b.minute ?? 200) &&
    (a.injury_time_minute ?? 0) === (b.injury_time_minute ?? 0)
  );
}

function compareClock(a, b) {
  const am = a.minute ?? 200;
  const bm = b.minute ?? 200;
  if (am !== bm) return am - bm;
  return (a.injury_time_minute ?? 0) - (b.injury_time_minute ?? 0);
}

const matchFilter = process.argv[2] ? Number(process.argv[2]) : null;

try {
  const cards = await pool.query(
    `SELECT id, match_id, player_id, player_name, card_type, minute, injury_time_minute, lineup_id
     FROM match_cards
     WHERE side = 'csa' AND player_id IS NOT NULL
       ${matchFilter != null && Number.isFinite(matchFilter) ? "AND match_id = $1" : ""}
     ORDER BY match_id, player_id, minute NULLS LAST, id`,
    matchFilter != null && Number.isFinite(matchFilter) ? [matchFilter] : [],
  );

  const byMatchPlayer = new Map();
  for (const row of cards.rows) {
    const key = `${row.match_id}:${row.player_id}`;
    let bucket = byMatchPlayer.get(key);
    if (!bucket) {
      bucket = { matchId: row.match_id, playerId: row.player_id, yellows: [], reds: [] };
      byMatchPlayer.set(key, bucket);
    }
    if (row.card_type === "yellow") bucket.yellows.push(row);
    else if (row.card_type === "red") bucket.reds.push(row);
  }

  let added = 0;
  for (const bucket of byMatchPlayer.values()) {
    if (bucket.yellows.length < 2) continue;
    const sorted = [...bucket.yellows].sort(compareClock);
    const second = sorted[1];
    if (bucket.reds.some((r) => sameClock(r, second))) continue;

    await pool.query(
      `INSERT INTO match_cards
         (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
       VALUES ($1, 'csa', 'red', $2, $3, $4, $5, $6)`,
      [
        bucket.matchId,
        second.lineup_id,
        bucket.playerId,
        second.player_name,
        second.minute,
        second.injury_time_minute,
      ],
    );
    added += 1;
    console.log(
      `match ${bucket.matchId}: red for ${second.player_name} (#${bucket.playerId}) at ${second.minute}${
        second.injury_time_minute != null ? `+${second.injury_time_minute}` : ""
      }'`,
    );
  }
  console.log(`Done. Added ${added} red card(s).`);
} finally {
  await pool.end();
}
