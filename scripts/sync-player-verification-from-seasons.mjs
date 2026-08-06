/**
 * Align player verification seals with season stats verification:
 * a player may only be verified if EVERY CSA lineup season is in a
 * stats_fully_verified season. Also verify exclusive players of those seasons.
 *
 * Usage:
 *   node scripts/sync-player-verification-from-seasons.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const VERIFIED_BY = "Portal Marujo";
const pool = createPgPool();
const c = await pool.connect();

try {
  console.log(DRY ? "DRY" : "APPLY");

  const { rows: verifiedSeasons } = await c.query(`
    SELECT year
    FROM seasons
    WHERE stats_fully_verified = true
    ORDER BY year
  `);
  const years = verifiedSeasons.map((r) => Number(r.year));
  console.log("verified seasons:", years.join(", ") || "(none)");
  if (!years.length) throw new Error("no stats_fully_verified seasons");

  const yearTexts = years.map(String);

  // Players with any CSA lineup, and whether all seasons are verified
  const { rows: players } = await c.query(
    `
    WITH seasons_by_player AS (
      SELECT l.player_id,
             array_agg(DISTINCT m.season ORDER BY m.season) AS seasons
      FROM match_lineups l
      JOIN matches m ON m.id = l.match_id
      WHERE l.side = 'csa' AND l.player_id IS NOT NULL
      GROUP BY l.player_id
    )
    SELECT p.id, p.name, p.verification_status, s.seasons,
           (s.seasons <@ $1::text[]) AS all_verified
    FROM seasons_by_player s
    JOIN players p ON p.id = s.player_id
    ORDER BY p.name
    `,
    [yearTexts],
  );

  const shouldBeVerified = players.filter((p) => p.all_verified);
  const shouldBeUnverified = players.filter((p) => !p.all_verified);

  const toVerify = shouldBeVerified.filter(
    (p) => p.verification_status !== "verified",
  );
  const toUnverify = shouldBeUnverified.filter(
    (p) => p.verification_status === "verified",
  );
  const alreadyOk = shouldBeVerified.filter(
    (p) => p.verification_status === "verified",
  );
  const alreadyUnverified = shouldBeUnverified.filter(
    (p) => p.verification_status !== "verified",
  );

  console.log(`players with CSA lineups: ${players.length}`);
  console.log(`  eligible (all seasons verified): ${shouldBeVerified.length}`);
  console.log(`    already verified: ${alreadyOk.length}`);
  console.log(`    to verify: ${toVerify.length}`);
  console.log(`  ineligible (has unverified season): ${shouldBeUnverified.length}`);
  console.log(`    already unverified: ${alreadyUnverified.length}`);
  console.log(`    to unverify: ${toUnverify.length}`);

  // Summarize eligible by season fingerprint
  const bySig = new Map();
  for (const p of shouldBeVerified) {
    const sig = (p.seasons || []).join(",");
    bySig.set(sig, (bySig.get(sig) || 0) + 1);
  }
  console.log("eligible season fingerprints:");
  for (const [sig, n] of [...bySig.entries()].sort()) {
    console.log(`  [${sig || "(empty)"}]: ${n}`);
  }

  console.log("\nto verify (sample up to 40):");
  for (const p of toVerify.slice(0, 40)) {
    console.log(`  #${p.id} ${p.name} | ${(p.seasons || []).join(",")}`);
  }
  if (toVerify.length > 40) console.log(`  ... +${toVerify.length - 40} more`);

  console.log("\nto unverify (sample up to 40):");
  for (const p of toUnverify.slice(0, 40)) {
    console.log(`  #${p.id} ${p.name} | ${(p.seasons || []).join(",")}`);
  }
  if (toUnverify.length > 40) console.log(`  ... +${toUnverify.length - 40} more`);

  if (DRY) {
    console.log("\nDRY — no writes");
  } else {
    await c.query("BEGIN");

    let unverified = 0;
    if (toUnverify.length) {
      const upd = await c.query(
        `
        UPDATE players
        SET verification_status = 'unverified',
            verified_at = NULL,
            verified_by = NULL
        WHERE id = ANY($1::int[])
          AND verification_status = 'verified'
        RETURNING id
        `,
        [toUnverify.map((p) => p.id)],
      );
      unverified = upd.rowCount ?? 0;
    }

    let verified = 0;
    if (toVerify.length) {
      const upd = await c.query(
        `
        UPDATE players
        SET verification_status = 'verified',
            verified_at = now(),
            verified_by = $2
        WHERE id = ANY($1::int[])
          AND verification_status IS DISTINCT FROM 'verified'
        RETURNING id
        `,
        [toVerify.map((p) => p.id), VERIFIED_BY],
      );
      verified = upd.rowCount ?? 0;
    }

    await c.query("COMMIT");
    console.log(`\nCOMMIT ok — verified ${verified}, unverified ${unverified}`);

    // Spot-check Brayann + a 2026-only player
    const check = await c.query(
      `
      SELECT p.id, p.name, p.verification_status,
             (SELECT array_agg(DISTINCT m.season ORDER BY m.season)
              FROM match_lineups l JOIN matches m ON m.id=l.match_id
              WHERE l.player_id=p.id AND l.side='csa') AS seasons
      FROM players p
      WHERE p.id IN (378, 367)
         OR p.name ILIKE 'Brayann'
      ORDER BY p.id
      `,
    );
    console.log("spot-check:", check.rows);
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
