/**
 * Preflight: check 2026-07-19 match + duplicate match_date values.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

try {
  const date = "2026-07-19";
  const { rows: sameDay } = await pool.query(
    `SELECT m.id, m.match_date, m.result, m.home_away, m.goals_for, m.goals_against,
            o.name AS opponent, c.name AS competition
     FROM matches m
     JOIN opponents o ON o.id = m.opponent_id
     JOIN competitions c ON c.id = m.competition_id
     WHERE m.match_date = $1`,
    [date],
  );
  console.log("MATCHES_ON_DATE", JSON.stringify(sameDay, null, 2));

  const { rows: dups } = await pool.query(`
    SELECT match_date, count(*)::int AS n, array_agg(id ORDER BY id) AS ids
    FROM matches
    GROUP BY match_date
    HAVING count(*) > 1
    ORDER BY match_date DESC
    LIMIT 20
  `);
  console.log("DUPLICATE_DATES_COUNT", dups.length);
  if (dups.length) console.log("DUPLICATE_DATES_SAMPLE", JSON.stringify(dups, null, 2));

  const { rows: entities } = await pool.query(`
    SELECT
      (SELECT id FROM opponents WHERE name ILIKE '%São Luiz%Ijuí%' OR name ILIKE '%Sao Luiz%Ijui%' LIMIT 1) AS opponent_id,
      (SELECT name FROM opponents WHERE name ILIKE '%São Luiz%Ijuí%' OR name ILIKE '%Sao Luiz%Ijui%' LIMIT 1) AS opponent_name,
      (SELECT id FROM competitions WHERE name ILIKE '%Série D%' OR name ILIKE '%Serie D%' ORDER BY id LIMIT 1) AS competition_id,
      (SELECT name FROM competitions WHERE name ILIKE '%Série D%' OR name ILIKE '%Serie D%' ORDER BY id LIMIT 1) AS competition_name,
      (SELECT id FROM managers WHERE name ILIKE '%Moacir%' LIMIT 1) AS manager_id,
      (SELECT name FROM managers WHERE name ILIKE '%Moacir%' LIMIT 1) AS manager_name,
      (SELECT id FROM stadiums WHERE name ILIKE '%19 de Outubro%' LIMIT 1) AS stadium_id,
      (SELECT id FROM referees WHERE name ILIKE '%Michelangelo%' LIMIT 1) AS referee_id
  `);
  console.log("ENTITIES", entities[0]);

  // player name lookups for sheet
  const names = [
    "Yago Oliveira", "Caio Hila", "Félix Jorge", "Felix Jorge", "Rayan",
    "Ailton Santos", "Camacho", "Kayllan", "Dudu Figueiredo", "Matheus Melo",
    "Fabrício Bigode", "Fabricio Bigode", "Rian Santana",
    "Lucas Silva", "Everton Heleno", "Ronaldo Mendes", "Kaike", "Wesley",
    "Arthur Silveira", "Marcos Ytalo", "Mikael", "Marlon Lopes", "Gustavo",
    "Lucas Lima", "Matheus Souza",
  ];
  const { rows: players } = await pool.query(
    `SELECT id, name, position FROM players WHERE name = ANY($1::text[]) ORDER BY name`,
    [names],
  );
  console.log("PLAYERS_FOUND", players.length, players.map((p) => `#${p.id} ${p.name}`).join("; "));

  const missing = names.filter(
    (n) =>
      !players.some((p) => p.name === n) &&
      !(n === "Felix Jorge" && players.some((p) => p.name === "Félix Jorge")) &&
      !(n === "Fabricio Bigode" && players.some((p) => p.name === "Fabrício Bigode")),
  );
  console.log("PLAYERS_MISSING_EXACT", missing);
} finally {
  await pool.end();
}
