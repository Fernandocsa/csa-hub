/**
 * Merge Denis Ribeiro Serafim (#43) → Denis da Silva Ribeiro Serafim (#52).
 * Same person; keep fuller name + AL state.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const KEEP_ID = 52;
const DISCARD_ID = 43;
const KEEP_NAME = "Denis da Silva Ribeiro Serafim";
const DISCARD_NAME = "Denis Ribeiro Serafim";

try {
  await client.query("BEGIN");

  const keep = await client.query(
    `SELECT id, name, state FROM referees WHERE id = $1`,
    [KEEP_ID],
  );
  const discard = await client.query(
    `SELECT id, name, state FROM referees WHERE id = $1`,
    [DISCARD_ID],
  );
  if (!keep.rows[0]) throw new Error(`keep id=${KEEP_ID} missing`);
  if (!discard.rows[0]) throw new Error(`discard id=${DISCARD_ID} missing`);
  if (keep.rows[0].name !== KEEP_NAME) {
    throw new Error(`keep name mismatch: ${keep.rows[0].name}`);
  }
  if (discard.rows[0].name !== DISCARD_NAME) {
    throw new Error(`discard name mismatch: ${discard.rows[0].name}`);
  }

  const beforeKeep = await client.query(
    `SELECT count(*)::int AS n FROM matches WHERE referee_id = $1`,
    [KEEP_ID],
  );
  const beforeDiscard = await client.query(
    `SELECT count(*)::int AS n FROM matches WHERE referee_id = $1`,
    [DISCARD_ID],
  );

  const moved = await client.query(
    `UPDATE matches SET referee_id = $1 WHERE referee_id = $2`,
    [KEEP_ID, DISCARD_ID],
  );

  // Prefer AL on keep if missing
  if (!keep.rows[0].state && discard.rows[0].state) {
    await client.query(`UPDATE referees SET state = $2 WHERE id = $1`, [
      KEEP_ID,
      discard.rows[0].state,
    ]);
  }

  const del = await client.query(
    `DELETE FROM referees WHERE id = $1 RETURNING id, name`,
    [DISCARD_ID],
  );

  const afterKeep = await client.query(
    `SELECT count(*)::int AS n FROM matches WHERE referee_id = $1`,
    [KEEP_ID],
  );
  const orphan = await client.query(
    `SELECT count(*)::int AS n FROM matches WHERE referee_id = $1`,
    [DISCARD_ID],
  );
  if (orphan.rows[0].n !== 0) throw new Error("orphan matches remain on discard");

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        keep: keep.rows[0],
        discarded: del.rows[0],
        matchesBefore: {
          keep: beforeKeep.rows[0].n,
          discard: beforeDiscard.rows[0].n,
        },
        matchesMoved: moved.rowCount,
        matchesAfterKeep: afterKeep.rows[0].n,
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
