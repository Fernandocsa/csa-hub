import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const YEAR = process.argv[2] || "2025";

const { rows: cols } = await pool.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name='player_season_stats' AND column_name='shirt_number'
`);
const { rows: uq } = await pool.query(`
  SELECT conname FROM pg_constraint WHERE conname='player_season_stats_player_season_uidx'
`);

const { rows: sample } = await pool.query(
  `SELECT pss.id, p.name, pss.appearances, pss.goals, pss.assists, pss.shirt_number
   FROM player_season_stats pss
   JOIN players p ON p.id = pss.player_id
   WHERE pss.season = $1
   ORDER BY pss.appearances DESC
   LIMIT 5`,
  [YEAR],
);

// Set a shirt on first row then clear (smoke write)
if (sample[0]) {
  await pool.query(
    `UPDATE player_season_stats SET shirt_number = 9 WHERE id = $1`,
    [sample[0].id],
  );
  const { rows: check } = await pool.query(
    `SELECT shirt_number FROM player_season_stats WHERE id = $1`,
    [sample[0].id],
  );
  await pool.query(
    `UPDATE player_season_stats SET shirt_number = NULL WHERE id = $1`,
    [sample[0].id],
  );
  console.log(
    JSON.stringify(
      {
        shirtColumn: !!cols[0],
        uniqueConstraint: !!uq[0],
        sampleBeforeWrite: sample,
        writeRead: check[0]?.shirt_number,
      },
      null,
      2,
    ),
  );
} else {
  console.log(JSON.stringify({ shirtColumn: !!cols[0], uniqueConstraint: !!uq[0], sample: [] }));
}

await pool.end();
