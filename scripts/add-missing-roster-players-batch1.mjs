/**
 * Create unambiguous missing roster players (ages from published elencos).
 * Does NOT touch names that need user confirmation (see script comments).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

/** @type {{ name: string, position: string, birthYear: number, seasons: string[], fullName?: string|null }[]} */
const CREATE = [
  // 2016 — no name collision
  { name: "Evandrízio", position: "Goleiro", birthYear: 2016 - 22, seasons: ["2016"] },
  { name: "Carlão", position: "Goleiro", birthYear: 2016 - 30, seasons: ["2016"] },
  { name: "Camutanga", position: "Zagueiro", birthYear: 2016 - 22, seasons: ["2016"] },
  { name: "Gabriel Yan", position: "Lateral Esquerdo", birthYear: 2016 - 21, seasons: ["2016"] },
  { name: "Guerra", position: "Zagueiro", birthYear: 2016 - 22, seasons: ["2016"] },
  { name: "Marcinho Guerreiro", position: "Meia", birthYear: 2016 - 35, seasons: ["2016"] },
  { name: "Walfrido", position: "Meia", birthYear: 2016 - 21, seasons: ["2016"] },
  { name: "Lucas Limão", position: "Meia", birthYear: 2016 - 25, seasons: ["2016"] },
  { name: "Pedro Gusmão", position: "Atacante", birthYear: 2016 - 24, seasons: ["2016"] },
  { name: "Manoel Chuva", position: "Atacante", birthYear: 2016 - 22, seasons: ["2016"] },
  { name: "Taubaté", position: "Atacante", birthYear: 2016 - 24, seasons: ["2016"] },
  { name: "Damião", position: "Atacante", birthYear: 2016 - 22, seasons: ["2016"] },
  // 2018 — no collision
  { name: "Tallison", position: "Goleiro", birthYear: 2018 - 20, seasons: ["2018"] },
  { name: "Toinho", position: "Zagueiro", birthYear: 2018 - 19, seasons: ["2018"] },
  { name: "Lucas Surcin", position: "Meia", birthYear: 2018 - 20, seasons: ["2018"] }, // age from list "Da Silva 20" group if Surcin≈; WAIT need verify
  { name: "Mascote", position: "Meia", birthYear: null, seasons: ["2018"] }, // need age — skip if null
];

// Fix: don't invent Lucas Surcin age without source. Check comments - Lucas Surcin was in not-on list.
// Remove Surcin/Mascote if age unknown — user lists had Da Silva 20, not necessarily Surcin.
// From 2018 script comment only names. Skip Surcin/Mascote until ages known.

const CREATE_SAFE = CREATE.filter(
  (p) => p.name !== "Lucas Surcin" && p.name !== "Mascote" && p.birthYear != null,
);

/** Link existing player to season (0 apps if new row). */
const LINK = [
  { id: 111, name: "Alexandre Cajuru", season: "2019" }, // exists; was missing from 2019 roster
];

async function ensureSeason(playerId, season) {
  const { rows } = await client.query(
    `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
     VALUES ($1, $2, 0, 0, 0)
     ON CONFLICT (player_id, season) DO NOTHING
     RETURNING id, player_id, season, appearances`,
    [playerId, season],
  );
  if (rows[0]) return { ...rows[0], created: true };
  const ex = await client.query(
    `SELECT id, player_id, season, appearances FROM player_season_stats
     WHERE player_id=$1 AND season=$2`,
    [playerId, season],
  );
  return { ...ex.rows[0], created: false };
}

try {
  await client.query("BEGIN");
  const created = [];
  const linked = [];

  for (const p of CREATE_SAFE) {
    const exists = await client.query(
      `SELECT id, name FROM players WHERE lower(name) = lower($1)`,
      [p.name],
    );
    if (exists.rows.length) {
      throw new Error(`Refusing create — name exists: ${JSON.stringify(exists.rows)}`);
    }
    const { rows } = await client.query(
      `INSERT INTO players (
         name, full_name, position, secondary_positions, nationality,
         birth_year, birth_country
       ) VALUES ($1, NULL, $2, '{}'::text[], 'Brasil', $3, 'Brasil')
       RETURNING id, name, position, birth_year`,
      [p.name, p.position, p.birthYear],
    );
    const player = rows[0];
    const seasons = [];
    for (const s of p.seasons) {
      seasons.push(await ensureSeason(player.id, s));
    }
    created.push({ player, seasons });
  }

  for (const l of LINK) {
    const { rows: pl } = await client.query(
      `SELECT id, name FROM players WHERE id=$1`,
      [l.id],
    );
    if (!pl[0] || pl[0].name !== l.name) {
      throw new Error(`Link mismatch ${l.id} ${l.name}: ${JSON.stringify(pl[0])}`);
    }
    linked.push({ player: pl[0], season: await ensureSeason(l.id, l.season) });
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, created, linked }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
