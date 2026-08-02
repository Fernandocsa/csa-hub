/**
 * Verify shirt_number is present in DB for at least one player,
 * then call GET /api/seasons/:year and assert the public payload includes shirtNumber.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const API =
  process.env.API_BASE_URL?.replace(/\/$/, "") ||
  process.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8080/api";

const { rows } = await pool.query(`
  SELECT pss.season, p.id, p.name, pss.shirt_number
  FROM player_season_stats pss
  JOIN players p ON p.id = pss.player_id
  WHERE pss.shirt_number IS NOT NULL
  ORDER BY pss.season DESC, pss.shirt_number
  LIMIT 10
`);

if (rows.length === 0) {
  console.error("FAIL: no player_season_stats rows with shirt_number set");
  await pool.end();
  process.exit(1);
}

const sample = rows[0];
const year = sample.season;
console.log("DB sample with shirt:", {
  season: year,
  id: sample.id,
  name: sample.name,
  shirt_number: sample.shirt_number,
  others: rows.length,
});

const url = `${API}/seasons/${year}`;
let res;
try {
  res = await fetch(url);
} catch (err) {
  console.error("FAIL: could not reach API at", url, String(err));
  await pool.end();
  process.exit(1);
}

if (!res.ok) {
  console.error("FAIL: API", res.status, await res.text());
  await pool.end();
  process.exit(1);
}

const data = await res.json();
const player = (data.players ?? []).find((p) => p.id === sample.id);

if (!player) {
  console.error("FAIL: player", sample.id, "not in public season payload");
  await pool.end();
  process.exit(1);
}

const ok = player.shirtNumber === sample.shirt_number;
console.log(
  JSON.stringify(
    {
      apiUrl: url,
      player: {
        id: player.id,
        name: player.name,
        shirtNumber: player.shirtNumber ?? null,
        seasonAge: player.seasonAge ?? null,
      },
      matchDb: ok,
      playersWithShirt: (data.players ?? []).filter((p) => p.shirtNumber != null).length,
    },
    null,
    2,
  ),
);

await pool.end();
if (!ok) {
  console.error("FAIL: shirtNumber mismatch or missing on public payload");
  process.exit(1);
}
console.log("OK");
