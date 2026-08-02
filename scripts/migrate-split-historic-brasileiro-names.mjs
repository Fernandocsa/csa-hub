/**
 * Split Taça de Ouro / Taça de Prata / Copa João Havelange out of
 * modern Campeonato Brasileiro Série A/B competition rows.
 * SQL: lib/db/sql/migrate-split-historic-brasileiro-names.sql
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  console.log("=== migrate-split-historic-brasileiro-names ===");
  const sql = readFileSync(
    "lib/db/sql/migrate-split-historic-brasileiro-names.sql",
    "utf8",
  );
  await pool.query(sql);

  const { rows: comps } = await pool.query(
    `SELECT id, name, type FROM competitions
     WHERE name IN ('Taça de Ouro', 'Taça de Prata', 'Copa João Havelange')
     ORDER BY name`,
  );
  assert(comps.length === 3, `expected 3 competitions, got ${comps.length}`);
  const byName = Object.fromEntries(comps.map((c) => [c.name, c]));
  for (const c of comps) {
    assert(c.type === "league", `${c.name} type=${c.type}`);
    console.log(`OK competition id=${c.id} "${c.name}" type=${c.type}`);
  }

  const checks = [
    {
      name: "Taça de Prata",
      seasons: ["1980"],
      expected: 2,
      forbiddenComp: "Campeonato Brasileiro Série B",
    },
    {
      name: "Taça de Ouro",
      seasons: ["1981", "1983", "1986"],
      expected: 5,
      forbiddenComp: "Campeonato Brasileiro Série A",
    },
    {
      name: "Copa João Havelange",
      seasons: ["2000"],
      expected: 17,
      forbiddenComp: "Campeonato Brasileiro Série B",
    },
  ];

  for (const check of checks) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       WHERE c.name = $1 AND m.season = ANY($2::text[])`,
      [check.name, check.seasons],
    );
    assert(
      rows[0].cnt === check.expected,
      `${check.name}: expected ${check.expected} matches, got ${rows[0].cnt}`,
    );

    const { rows: leftover } = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       WHERE c.name = $1 AND m.season = ANY($2::text[])`,
      [check.forbiddenComp, check.seasons],
    );
    assert(
      leftover[0].cnt === 0,
      `${check.forbiddenComp} still has ${leftover[0].cnt} matches in ${check.seasons.join(",")}`,
    );

    const { rows: scs } = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM season_competition_stats scs
       JOIN competitions c ON c.id = scs.competition_id
       WHERE c.name = $1 AND scs.season = ANY($2::text[])`,
      [check.name, check.seasons],
    );
    assert(
      scs[0].cnt === check.seasons.length,
      `${check.name}: expected ${check.seasons.length} scs rows, got ${scs[0].cnt}`,
    );

    console.log(
      `OK ${check.name}: matches=${rows[0].cnt} scs=${scs[0].cnt} id=${byName[check.name].id}`,
    );
  }

  // 1992 Série B must remain untouched
  const { rows: sb1992 } = await pool.query(
    `SELECT COUNT(*)::int AS cnt
     FROM matches m
     JOIN competitions c ON c.id = m.competition_id
     WHERE c.name = 'Campeonato Brasileiro Série B' AND m.season = '1992'`,
  );
  assert(sb1992[0].cnt === 14, `1992 Série B expected 14, got ${sb1992[0].cnt}`);
  console.log(`OK 1992 Série B untouched: ${sb1992[0].cnt}`);

  console.log("=== split historic brasileiro names PASSED ===");
} finally {
  await pool.end();
}
