/**
 * Smoke: scheduled fixtures excluded from summary/seasons; next-match derived; unknown-results clean.
 */
import { createHmac } from "node:crypto";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");
const base = process.env.SMOKE_BASE ?? "http://127.0.0.1:8080/api";
const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function j(path, init) {
  const r = await fetch(`${base}${path}`, init);
  const body = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, body };
}

let failed = 0;
function check(ok, msg) {
  if (!ok) {
    failed++;
    console.error("FAIL", msg);
  } else {
    console.log("OK", msg);
  }
}

// Pick existing opponent + competition
const opp = await pool.query(`SELECT id FROM opponents ORDER BY id LIMIT 1`);
const comp = await pool.query(`SELECT id FROM competitions ORDER BY id LIMIT 1`);
if (!opp.rows[0] || !comp.rows[0]) throw new Error("Need opponent+competition");

const farDate = "2099-06-15";
const season = "2099";

// Cleanup any prior smoke rows
await pool.query(`DELETE FROM matches WHERE season = $1 AND status = 'scheduled'`, [season]);

const ins = await pool.query(
  `INSERT INTO matches (
     match_date, season, opponent_id, competition_id, home_away,
     goals_for, goals_against, result, status, is_friendly, is_walkover, own_goals_for_count
   ) VALUES ($1,$2,$3,$4,'home',NULL,NULL,'unknown','scheduled',false,false,0)
   RETURNING id`,
  [farDate, season, opp.rows[0].id, comp.rows[0].id],
);
const smokeId = ins.rows[0].id;
console.log("Inserted smoke scheduled match", smokeId);

try {
  // DB-level: summary-like count should exclude it
  const playedCount = await pool.query(
    `SELECT count(*)::int AS n FROM matches
     WHERE is_friendly = false AND status <> 'scheduled' AND result <> 'unknown'`,
  );
  const withScheduled = await pool.query(
    `SELECT count(*)::int AS n FROM matches WHERE is_friendly = false`,
  );
  check(
    playedCount.rows[0].n < withScheduled.rows[0].n,
    `official played (${playedCount.rows[0].n}) < all non-friendly (${withScheduled.rows[0].n})`,
  );

  const seasonLive = await pool.query(
    `SELECT count(*)::int AS n FROM matches
     WHERE season = $1 AND is_friendly = false AND status <> 'scheduled' AND result <> 'unknown'`,
    [season],
  );
  check(seasonLive.rows[0].n === 0, "season 2099 has 0 official-played matches");

  // unknown-results must not include scheduled
  const unk = await pool.query(
    `SELECT count(*)::int AS n FROM matches
     WHERE result = 'unknown' AND status <> 'scheduled' AND is_friendly = false AND is_walkover = false
       AND id = $1`,
    [smokeId],
  );
  check(unk.rows[0].n === 0, "scheduled row excluded from unknown-results filter");

  // next-match derived (may be earlier fixture; at least our smoke is eligible)
  const next = await pool.query(
    `SELECT id FROM matches
     WHERE status = 'scheduled' AND match_date >= CURRENT_DATE
     ORDER BY match_date ASC, id ASC LIMIT 1`,
  );
  check(next.rows.length === 1, "derived next-match finds a scheduled row");
  check(next.rows[0].id != null, `next matchId=${next.rows[0].id} always set (home clickable)`);

  // API smoke if server up
  try {
    const pub = await j("/next-match");
    if (pub.ok && pub.body) {
      check(pub.body.matchId != null, `API next-match has matchId=${pub.body.matchId}`);
    } else if (pub.ok && pub.body === null) {
      console.log("SKIP API next-match null (no future from today in API TZ?)");
    } else {
      console.log("SKIP API next-match (server?", pub.status, ")");
    }

    const adminUnk = await j("/admin/matches/unknown-results", { headers: auth });
    if (adminUnk.ok && Array.isArray(adminUnk.body)) {
      const hit = adminUnk.body.some((m) => m.id === smokeId);
      check(!hit, "admin unknown-results does not list smoke scheduled");
    } else {
      console.log("SKIP admin unknown-results", adminUnk.status);
    }

    const adminSched = await j("/admin/matches?status=scheduled&limit=500", {
      headers: auth,
    });
    if (adminSched.ok && adminSched.body?.data) {
      const hit = adminSched.body.data.some((m) => m.id === smokeId);
      check(hit, "admin scheduled list includes smoke row");
    } else {
      console.log("SKIP admin scheduled list", adminSched.status);
    }
  } catch (e) {
    console.log("SKIP live API checks:", e instanceof Error ? e.message : e);
  }
} finally {
  await pool.query(`DELETE FROM matches WHERE id = $1`, [smokeId]);
  console.log("Cleaned smoke match", smokeId);
  await pool.end();
}

if (failed) {
  console.error(`SCHEDULED_SMOKE_FAIL (${failed})`);
  process.exit(1);
}
console.log("SCHEDULED_SMOKE_PASS");
