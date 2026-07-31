/**
 * Re-apply only Fortaleza away 2018-11-06 sheet from season-2018-games.mjs (n:55).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES, convertMinute, norm } from "./data/season-2018-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");

const FORCE_ID = {
  rafinha: 23,
  edinho: 70,
  michel: 55,
  "michel douglas": 55,
  giva: 515,
  yuri: 154,
  "yuri lara": 154,
  caique: 640,
  walter: 605,
  "john lennon": 131,
  "jhon lennon": 131,
};

const SPELL_TO_DB = {
  echeverria: "Eduardo Echeverría",
  "echeverría": "Eduardo Echeverría",
  leandro: "Leandro Souza",
  daniel: "Daniel Costa",
};

try {
  await client.query("BEGIN");

  const { rows: allPlayers } = await client.query(`SELECT id, name FROM players`);
  const byNorm = new Map();
  for (const p of allPlayers) {
    const k = norm(p.name);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(p);
  }

  async function resolvePlayer(name) {
    const key = norm(name);
    if (FORCE_ID[key] != null) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
        FORCE_ID[key],
      ]);
      if (!rows[0]) throw new Error(`FORCE_ID missing ${name}`);
      return rows[0];
    }
    if (SPELL_TO_DB[key]) {
      const hits = byNorm.get(norm(SPELL_TO_DB[key])) ?? [];
      if (hits.length === 1) return hits[0];
      const exact = allPlayers.find((p) => p.name === SPELL_TO_DB[key]);
      if (exact) return exact;
    }
    const direct = byNorm.get(key) ?? [];
    if (direct.length === 1) return direct[0];
    if (direct.length > 1) {
      throw new Error(`ambiguous ${name}: ${direct.map((p) => `#${p.id}`).join(",")}`);
    }
    // soft contains
    const soft = allPlayers.filter(
      (p) => norm(p.name).includes(key) || key.includes(norm(p.name)),
    );
    if (soft.length === 1) return soft[0];
    throw new Error(`unresolved ${name}`);
  }

  const g = GAMES.find((x) => x.n === 55);
  if (!g) throw new Error("game n:55 missing");

  const { rows: matches } = await client.query(
    `
    SELECT m.id FROM matches m
    JOIN opponents o ON o.id = m.opponent_id
    WHERE m.season = '2018' AND m.match_date = $1::date
      AND (lower(o.name) LIKE '%fortaleza%')
    `,
    [g.date],
  );
  if (matches.length !== 1) throw new Error(`match find ${matches.length}`);
  const matchId = matches[0].id;

  console.log(`match #${matchId} ${g.date} Fortaleza`);
  console.log("starters", g.starters);
  console.log("subs", g.subs);

  if (!DRY) {
    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [matchId]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1 AND side='csa'`, [matchId]);
    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1 AND side='csa'`, [
      matchId,
    ]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [matchId]);

    const lineupIdByPlayer = new Map();
    let sort = 0;
    for (const name of g.starters) {
      const p = await resolvePlayer(name);
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
        [matchId, p.id, p.name, sort++],
      );
      lineupIdByPlayer.set(p.id, rows[0].id);
    }
    for (const [, inn] of g.subs) {
      const p = await resolvePlayer(inn);
      if (lineupIdByPlayer.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [matchId, p.id, p.name, sort++],
      );
      lineupIdByPlayer.set(p.id, rows[0].id);
    }

    const subMinutes = {
      "Didira|Pio": 33,
      "Matheus Lopes|Neto Berola": 62,
      "Dawhan|Jhon Cley": 74,
      "Hugo Cabral|Walter": 82,
    };
    for (const [outName, inName] of g.subs) {
      const outP = await resolvePlayer(outName);
      const inP = await resolvePlayer(inName);
      const minute = subMinutes[`${outName}|${inName}`] ?? 0;
      await client.query(
        `INSERT INTO match_substitutions
           (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
            player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,NULL)`,
        [
          matchId,
          lineupIdByPlayer.get(outP.id) ?? null,
          outP.id,
          outP.name,
          lineupIdByPlayer.get(inP.id) ?? null,
          inP.id,
          inP.name,
          minute,
        ],
      );
    }

    // Yellow cards from sheet: Xandão 7', Juan 34'
    for (const [name, minute] of [
      ["Xandão", 7],
      ["Juan", 34],
    ]) {
      const p = await resolvePlayer(name);
      await client.query(
        `INSERT INTO match_cards
           (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
         VALUES ($1,'csa','yellow',$2,$3,$4,$5,NULL)`,
        [matchId, lineupIdByPlayer.get(p.id) ?? null, p.id, p.name, minute],
      );
    }

    await client.query(
      `UPDATE matches SET manager_id = (SELECT id FROM managers WHERE lower(name)='marcelo cabo' LIMIT 1)
       WHERE id=$1`,
      [matchId],
    );
  }

  // quick roster bump for Walter appearance if needed
  if (!DRY) {
    const { rows: apps } = await client.query(
      `
      SELECT p.id, p.name, count(*)::int apps
      FROM match_lineups ml
      JOIN matches m ON m.id = ml.match_id
      JOIN players p ON p.id = ml.player_id
      WHERE m.season = '2018' AND ml.side = 'csa'
        AND p.id = ANY($1::int[])
      GROUP BY p.id, p.name
      `,
      [[605 /* Walter */]],
    );
    for (const a of apps) {
      await client.query(
        `
        INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
        VALUES ($1,'2018',$2,0,0)
        ON CONFLICT (player_id, season) DO UPDATE
          SET appearances = EXCLUDED.appearances
        `,
        [a.id, a.apps],
      );
      console.log("synced apps", a.name, a.apps);
    }
  }

  if (DRY) {
    await client.query("ROLLBACK");
    console.log("DRY ok — rolled back");
  } else {
    await client.query("COMMIT");
    console.log("applied");
  }
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
