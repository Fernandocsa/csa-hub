/**
 * Soft-merge duplicate referees: move matches.referee_id, set merged_into_id.
 * Does not delete referee rows. Does not touch Jonata #44 / #173.
 *
 * Usage: node scripts/merge-referees-soft-2026-08.mjs
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

/** keep ← remove */
const MERGES = [
  [120, 185],
  [181, 152],
  [198, 204],
  [110, 202],
  [199, 211],
  [71, 116],
  [223, 388],
  [292, 280],
  [253, 261],
  [320, 296],
  [276, 300],
  [304, 322],
  [182, 225],
  [79, 244],
  [283, 349],
  [243, 356],
  [130, 178],
  [340, 359],
  [346, 369],
];

const KEEP_IDS = MERGES.map(([k]) => k);

try {
  await client.query("BEGIN");

  const { rows: col } = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'referees'
      AND column_name = 'merged_into_id'
  `);
  if (!col.length) {
    throw new Error("referees.merged_into_id missing — run migrate-referees-merged-into-id.mjs first");
  }

  const report = [];

  for (const [keepId, remId] of MERGES) {
    const { rows: refs } = await client.query(
      `SELECT id, name, state, photo_url, merged_into_id,
              (SELECT count(*)::int FROM matches m WHERE m.referee_id = referees.id) AS j
       FROM referees WHERE id = ANY($1::int[])`,
      [[keepId, remId]],
    );
    const keep = refs.find((r) => r.id === keepId);
    const rem = refs.find((r) => r.id === remId);
    if (!keep) throw new Error(`keep #${keepId} missing`);
    if (!rem) throw new Error(`remove #${remId} missing`);
    if (rem.merged_into_id && rem.merged_into_id !== keepId) {
      throw new Error(`#${remId} already merged into #${rem.merged_into_id}`);
    }
    if (keep.merged_into_id) {
      throw new Error(`keep #${keepId} is itself merged into #${keep.merged_into_id}`);
    }

    const beforeKeep = keep.j;
    const beforeRem = rem.j;

    const moved = await client.query(
      `UPDATE matches SET referee_id = $1 WHERE referee_id = $2`,
      [keepId, remId],
    );

    // Move soft entity links if present
    await client.query(
      `UPDATE suggestions SET entity_id = $1
       WHERE entity_type = 'referee' AND entity_id = $2`,
      [keepId, remId],
    );
    await client.query(
      `UPDATE comments SET entity_id = $1
       WHERE entity_type = 'referee' AND entity_id = $2`,
      [keepId, remId],
    );
    await client.query(
      `UPDATE ratings SET entity_id = $1
       WHERE entity_type = 'referee' AND entity_id = $2
         AND NOT EXISTS (
           SELECT 1 FROM ratings x
           WHERE x.entity_type = 'referee' AND x.entity_id = $1 AND x.voter_token = ratings.voter_token
         )`,
      [keepId, remId],
    );
    await client.query(
      `DELETE FROM ratings WHERE entity_type = 'referee' AND entity_id = $1`,
      [remId],
    );

    if (!keep.photo_url && rem.photo_url) {
      await client.query(`UPDATE referees SET photo_url = $2 WHERE id = $1`, [
        keepId,
        rem.photo_url,
      ]);
    }
    if (!keep.state && rem.state) {
      await client.query(`UPDATE referees SET state = $2 WHERE id = $1`, [keepId, rem.state]);
    }

    await client.query(`UPDATE referees SET merged_into_id = $1 WHERE id = $2`, [
      keepId,
      remId,
    ]);

    const { rows: afterRows } = await client.query(
      `SELECT count(*)::int AS j FROM matches WHERE referee_id = $1`,
      [keepId],
    );
    const { rows: orphan } = await client.query(
      `SELECT count(*)::int AS j FROM matches WHERE referee_id = $1`,
      [remId],
    );
    if (orphan[0].j !== 0) throw new Error(`orphan matches on #${remId}`);

    report.push({
      keep: { id: keepId, name: keep.name, beforeJ: beforeKeep, afterJ: afterRows[0].j },
      merged: { id: remId, name: rem.name, beforeJ: beforeRem, matchesMoved: moved.rowCount },
    });
  }

  const { rows: counts } = await client.query(
    `SELECT r.id, r.name, r.state,
            (SELECT count(*)::int FROM matches m WHERE m.referee_id = r.id) AS j
     FROM referees r
     WHERE r.id = ANY($1::int[])
     ORDER BY array_position($1::int[], r.id)`,
    [KEEP_IDS],
  );

  const { rows: stillActive } = await client.query(
    `SELECT id, name, merged_into_id FROM referees
     WHERE id = ANY($1::int[]) AND merged_into_id IS NULL`,
    [MERGES.map(([, r]) => r)],
  );
  if (stillActive.length) {
    throw new Error(`aliases not marked merged: ${JSON.stringify(stillActive)}`);
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, merges: report.length, report, keepCounts: counts }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
