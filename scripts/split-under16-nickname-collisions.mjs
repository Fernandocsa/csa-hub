/**
 * Split nickname collisions: modern player identity wrongly linked to older seasons
 * where they would have been under 16.
 *
 * Usage: node scripts/split-under16-nickname-collisions.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const client = await pool.connect();

/** @type {{ keepId: number, seasons: string[], newName: string, position: string, note: string }[]} */
const SPLITS = [
  {
    keepId: 819,
    seasons: ["1980"],
    newName: "Esquerdinha",
    position: "Meia",
    note: "Homônimo 1980 (não Rogério Fonseca da Silva, n.1970)",
  },
  {
    keepId: 70,
    seasons: ["1987"],
    newName: "Edinho",
    position: "Meia",
    note: "Homônimo 1987 (não Edimo Ferreira Campos, n.1983)",
  },
  {
    keepId: 370,
    seasons: ["2001"],
    newName: "Marlon",
    position: "Meia",
    note: "Homônimo 2001 (não Marlon Silva Lacorte, n.1997)",
  },
  {
    keepId: 200,
    seasons: ["2006"],
    newName: "Warley",
    position: "Atacante",
    note: "Homônimo 2006 (não Warley Leandro da Silva, n.1999)",
  },
  {
    keepId: 1571,
    seasons: ["2006"],
    newName: "Acácio",
    position: "Lateral",
    note: "Homônimo 2006 (não Cícero Acácio Araújo Lima Filho, n.1993)",
  },
];

async function moveSeasonRefs(fromId, toId, toName, seasons) {
  const seasonList = seasons;
  // lineups in those seasons
  const { rows: lineups } = await client.query(
    `SELECT ml.id FROM match_lineups ml
     JOIN matches m ON m.id=ml.match_id
     WHERE ml.player_id=$1 AND ml.side='csa' AND m.season::text = ANY($2::text[])`,
    [fromId, seasonList],
  );
  const lineupIds = lineups.map((r) => r.id);

  if (!DRY && lineupIds.length) {
    await client.query(
      `UPDATE match_lineups SET player_id=$2, player_name=$3 WHERE id = ANY($1::int[])`,
      [lineupIds, toId, toName],
    );
  }

  // goals / assists / cards / subs / captain for matches in those seasons
  if (!DRY) {
    await client.query(
      `UPDATE match_goals g SET scorer_player_id=$2, scorer_name=$3
       FROM matches m
       WHERE g.match_id=m.id AND g.scorer_player_id=$1
         AND m.season::text = ANY($4::text[])`,
      [fromId, toId, toName, seasonList],
    );
    await client.query(
      `UPDATE match_goals g SET assist_player_id=$2, assist_name=$3
       FROM matches m
       WHERE g.match_id=m.id AND g.assist_player_id=$1
         AND m.season::text = ANY($4::text[])`,
      [fromId, toId, toName, seasonList],
    );
    await client.query(
      `UPDATE match_cards c SET player_id=$2, player_name=$3
       FROM matches m
       WHERE c.match_id=m.id AND c.player_id=$1
         AND m.season::text = ANY($4::text[])`,
      [fromId, toId, toName, seasonList],
    );
    await client.query(
      `UPDATE match_substitutions s SET player_out_id=$2, player_out_name=$3
       FROM matches m
       WHERE s.match_id=m.id AND s.player_out_id=$1
         AND m.season::text = ANY($4::text[])`,
      [fromId, toId, toName, seasonList],
    );
    await client.query(
      `UPDATE match_substitutions s SET player_in_id=$2, player_in_name=$3
       FROM matches m
       WHERE s.match_id=m.id AND s.player_in_id=$1
         AND m.season::text = ANY($4::text[])`,
      [fromId, toId, toName, seasonList],
    );
    await client.query(
      `UPDATE matches SET captain_player_id=$2
       WHERE captain_player_id=$1 AND season::text = ANY($3::text[])`,
      [fromId, toId, seasonList],
    );

    // move season stats rows
    for (const season of seasonList) {
      const { rows: fromStat } = await client.query(
        `SELECT appearances, goals, assists FROM player_season_stats
         WHERE player_id=$1 AND season=$2`,
        [fromId, season],
      );
      if (!fromStat[0]) continue;
      const { rows: exist } = await client.query(
        `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [toId, season],
      );
      if (exist[0]) {
        await client.query(
          `UPDATE player_season_stats SET
             appearances = GREATEST(appearances, $1),
             goals = GREATEST(goals, $2),
             assists = GREATEST(assists, $3)
           WHERE id=$4`,
          [
            fromStat[0].appearances,
            fromStat[0].goals,
            fromStat[0].assists,
            exist[0].id,
          ],
        );
        await client.query(
          `DELETE FROM player_season_stats WHERE player_id=$1 AND season=$2`,
          [fromId, season],
        );
      } else {
        await client.query(
          `UPDATE player_season_stats SET player_id=$2 WHERE player_id=$1 AND season=$3`,
          [fromId, toId, season],
        );
      }
    }
  }

  return { lineupCount: lineupIds.length };
}

try {
  if (!DRY) await client.query("BEGIN");
  const report = [];

  for (const split of SPLITS) {
    const { rows: keepRows } = await client.query(
      `SELECT id, name, full_name, birth_year FROM players WHERE id=$1`,
      [split.keepId],
    );
    if (!keepRows[0]) throw new Error(`missing keep ${split.keepId}`);

    // count what moves
    const { rows: cnt } = await client.query(
      `SELECT count(*)::int AS n FROM match_lineups ml
       JOIN matches m ON m.id=ml.match_id
       WHERE ml.player_id=$1 AND m.season::text = ANY($2::text[])`,
      [split.keepId, split.seasons],
    );

    let newId;
    if (DRY) {
      newId = -split.keepId;
      console.log("WOULD_CREATE", split.newName, "for seasons", split.seasons, "from", split.keepId, "lineups", cnt[0].n);
    } else {
      const ins = await client.query(
        `INSERT INTO players
           (name, position, nationality, nationality_flag, verification_status)
         VALUES ($1,$2,'Brasil','🇧🇷','unverified')
         RETURNING id, name`,
        [split.newName, split.position],
      );
      newId = ins.rows[0].id;
      console.log("CREATED", ins.rows[0], split.note);
    }

    const moved = await moveSeasonRefs(
      split.keepId,
      newId,
      split.newName,
      split.seasons,
    );
    report.push({
      keepId: split.keepId,
      keepName: keepRows[0].name,
      keepFull: keepRows[0].full_name,
      newId,
      seasons: split.seasons,
      lineupsMoved: moved.lineupCount,
      note: split.note,
    });
  }

  if (!DRY) await client.query("COMMIT");
  console.log(DRY ? "DRY OK" : "OK");
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
