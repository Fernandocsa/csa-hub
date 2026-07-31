/**
 * Sync season goals/assists from published season totals.
 * Only updates player_season_stats; does not invent match-sheet events.
 *
 * 2021 / 2022 / 2024 → assists
 * 2023 → goals
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

/** @type {{ season: string, field: 'assists'|'goals', rows: { id: number, name: string, value: number }[], clearOthers?: boolean }} */
const SPECS = [
  {
    season: "2021",
    field: "assists",
    clearOthers: true,
    rows: [
      { id: 32, name: "Gabriel", value: 9 },
      { id: 264, name: "Ernandes", value: 5 },
      { id: 255, name: "Iury Castilho", value: 5 },
      { id: 15, name: "Dellatorre", value: 5 },
      { id: 246, name: "Marco Túlio", value: 4 },
      { id: 45, name: "Renato Cajá", value: 4 },
      { id: 30, name: "Cristovam", value: 3 },
      { id: 263, name: "Ítalo", value: 3 },
      { id: 215, name: "Norberto", value: 3 },
      { id: 47, name: "Geovane", value: 2 },
      { id: 245, name: "Bruno Mota", value: 2 },
      { id: 230, name: "Nádson", value: 2 },
      { id: 271, name: "Clayton", value: 1 },
      { id: 265, name: "Éverton Silva", value: 1 },
      { id: 5, name: "Didira", value: 1 },
      { id: 154, name: "Yuri Lara", value: 1 }, // source: Yuri
      { id: 254, name: "Silas", value: 1 },
      { id: 273, name: "Kevyn", value: 1 },
      { id: 1, name: "Rodrigo Pimpão", value: 1 },
      { id: 222, name: "Tito", value: 1 },
      { id: 260, name: "Vitor Costa", value: 1 },
      { id: 252, name: "Ryan Gonzales", value: 1 }, // source: Ryan Gonzalez
    ],
  },
  {
    season: "2022",
    field: "assists",
    clearOthers: true,
    rows: [
      { id: 276, name: "Osvaldo", value: 7 },
      { id: 248, name: "Yann Rolim", value: 5 },
      { id: 37, name: "Diego Renan", value: 5 },
      { id: 32, name: "Gabriel", value: 4 },
      { id: 299, name: "Lucas Barcelos", value: 4 },
      { id: 256, name: "Rodrigo Rodrigues", value: 4 },
      { id: 5, name: "Didira", value: 4 },
      { id: 246, name: "Marco Túlio", value: 3 },
      { id: 282, name: "Lucas Marques", value: 3 },
      { id: 294, name: "Lourenço", value: 2 },
      { id: 285, name: "Igor Inocêncio", value: 2 },
      { id: 283, name: "Douglas", value: 2 },
      { id: 245, name: "Bruno Mota", value: 2 },
      { id: 300, name: "Edson Lucas", value: 1 }, // source: Edson
      { id: 291, name: "Werley", value: 1 },
      { id: 293, name: "Wellington Nascimento", value: 1 }, // source: Wellington
      { id: 284, name: "Luiz Beserra", value: 1 }, // source: Luiz Henrique
      { id: 264, name: "Ernandes", value: 1 },
    ],
  },
  {
    season: "2023",
    field: "goals",
    clearOthers: true,
    rows: [
      { id: 326, name: "Tomas Bastos", value: 8 },
      { id: 348, name: "Gabriel Taliari", value: 7 },
      { id: 347, name: "Kaio Nunes", value: 3 },
      { id: 492, name: "Robinho", value: 3 },
      { id: 311, name: "Jean Carlo", value: 2 },
      { id: 52, name: "Xandão", value: 2 },
      { id: 358, name: "Thiaguinho", value: 2 },
      { id: 327, name: "Jô", value: 2 },
      { id: 108, name: "Celsinho", value: 2 },
      { id: 314, name: "Júnior Todinho", value: 1 },
      { id: 312, name: "João Felipe", value: 1 },
      { id: 107, name: "Thales", value: 1 },
      { id: 355, name: "Elvis", value: 1 },
      { id: 351, name: "Ruan", value: 1 },
      { id: 337, name: "Dedé", value: 1 },
      { id: 353, name: "Iago Teles", value: 1 },
      { id: 313, name: "Luis Felipe", value: 1 }, // source: Luís Felipe
      { id: 320, name: "Marciel", value: 1 },
      { id: 360, name: "Pará", value: 1 },
      { id: 322, name: "Rodriguinho", value: 1 },
      { id: 283, name: "Douglas", value: 1 },
    ],
  },
  {
    season: "2024",
    field: "assists",
    clearOthers: true,
    rows: [
      { id: 398, name: "Roberto", value: 3 },
      { id: 378, name: "Brayann", value: 3 },
      { id: 282, name: "Lucas Marques", value: 3 },
      { id: 602, name: "Marquinhos", value: 3 },
      { id: 399, name: "Gustavo Cabral", value: 2 }, // source: Gustavinho
      { id: 407, name: "Raphinha", value: 2 },
      { id: 405, name: "Gustavo Xuxa", value: 2 },
      { id: 350, name: "Eduardo", value: 2 },
      { id: 395, name: "Juninho Valoura", value: 2 },
      { id: 334, name: "Erik", value: 2 },
      { id: 387, name: "Buga", value: 1 },
      { id: 381, name: "Guilherme Dal Pian", value: 1 }, // source: Dal Pian
      { id: 370, name: "Marlon", value: 1 },
      { id: 377, name: "Pedro Favela", value: 1 },
      { id: 367, name: "Tiago Marques", value: 1 },
      { id: 404, name: "Eduardo Biazus", value: 1 },
      // Marcinho (#509) ensured below — not on original import roster
    ],
  },
];

try {
  await client.query("BEGIN");
  const report = [];

  // Ensure Marcinho has 2024 season row (present in sheets, missing from import roster)
  {
    const MARCINHO = 509;
    const { rows: p } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
      MARCINHO,
    ]);
    if (!p[0] || p[0].name !== "Marcinho") {
      throw new Error(`Marcinho #509 missing`);
    }
    const { rows: lineups } = await client.query(
      `SELECT count(*)::int AS n FROM match_lineups ml
       JOIN matches m ON m.id = ml.match_id
       WHERE ml.player_id=$1 AND m.season='2024'`,
      [MARCINHO],
    );
    const { rows: goals } = await client.query(
      `SELECT count(*)::int AS n FROM match_goals g
       JOIN matches m ON m.id = g.match_id
       WHERE g.scorer_player_id=$1 AND m.season='2024'`,
      [MARCINHO],
    );
    const apps = lineups[0].n;
    const g = goals[0].n;
    const upsert = await client.query(
      `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
       VALUES ($1, '2024', $2, $3, 1)
       ON CONFLICT (player_id, season) DO UPDATE
         SET assists = 1
       RETURNING id, player_id, season, appearances, goals, assists`,
      [MARCINHO, apps, g],
    );
    report.push({ ensureMarcinho2024: upsert.rows[0] });
    SPECS.find((s) => s.season === "2024").rows.push({
      id: MARCINHO,
      name: "Marcinho",
      value: 1,
    });
  }

  for (const spec of SPECS) {
    const wanted = new Map(spec.rows.map((r) => [r.id, r]));

    // validate roster membership + names
    for (const r of spec.rows) {
      const { rows } = await client.query(
        `SELECT p.id, p.name, pss.${spec.field} AS current
         FROM player_season_stats pss
         JOIN players p ON p.id = pss.player_id
         WHERE pss.season=$1 AND p.id=$2`,
        [spec.season, r.id],
      );
      if (!rows[0]) throw new Error(`${spec.season}: missing ${r.id} ${r.name}`);
      if (rows[0].name !== r.name) {
        throw new Error(
          `${spec.season}: name mismatch id=${r.id} db="${rows[0].name}" expected="${r.name}"`,
        );
      }
    }

    const changes = [];

    for (const r of spec.rows) {
      const { rows: before } = await client.query(
        `SELECT ${spec.field} AS v FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [r.id, spec.season],
      );
      const from = before[0].v;
      if (from === r.value) {
        changes.push({ id: r.id, name: r.name, from, to: r.value, changed: false });
        continue;
      }
      await client.query(
        `UPDATE player_season_stats SET ${spec.field}=$1 WHERE player_id=$2 AND season=$3`,
        [r.value, r.id, spec.season],
      );
      changes.push({ id: r.id, name: r.name, from, to: r.value, changed: true });
    }

    let cleared = [];
    if (spec.clearOthers) {
      const ids = [...wanted.keys()];
      const { rows: extras } = await client.query(
        `SELECT p.id, p.name, pss.${spec.field} AS v
         FROM player_season_stats pss
         JOIN players p ON p.id = pss.player_id
         WHERE pss.season=$1
           AND pss.${spec.field} > 0
           AND NOT (p.id = ANY($2::int[]))
         ORDER BY p.name`,
        [spec.season, ids],
      );
      for (const e of extras) {
        await client.query(
          `UPDATE player_season_stats SET ${spec.field}=0 WHERE player_id=$1 AND season=$2`,
          [e.id, spec.season],
        );
        cleared.push({ id: e.id, name: e.name, from: e.v, to: 0 });
      }
    }

    report.push({
      season: spec.season,
      field: spec.field,
      updated: changes.filter((c) => c.changed),
      unchanged: changes.filter((c) => !c.changed).map((c) => c.name),
      cleared,
    });
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, report }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
