import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const names = [
  "Yago Oliveira",
  "Caio Hila",
  "Félix Jorge",
  "Rayan",
  "Ailton Santos",
  "Camacho",
  "Kayllan",
  "Dudu Figueiredo",
  "Matheus Melo",
  "Fabricio Bigode",
  "Fabrício Bigode",
  "Rian Santana",
  "Lucas Silva",
  "Everton Heleno",
  "Ronaldo Mendes",
  "Kaike",
  "Wesley (Cadu)",
  "Arthur Silveira",
  "Marcos Ytalo",
  "Mikael",
  "Marlon Lopes",
  "Gustavo",
  "Lucas Lima",
  "Matheus Souza",
];
const { rows } = await pool.query(
  `SELECT id, name, position FROM players WHERE name = ANY($1::text[]) ORDER BY name`,
  [names],
);
console.log(JSON.stringify(rows, null, 2));
const miss = names.filter((n) => !rows.some((r) => r.name === n));
console.log("MISSING", miss);

const { rows: cols } = await pool.query(`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_name IN ('match_lineups','match_cards','match_substitutions','match_goals','stadiums','referees')
  ORDER BY table_name, ordinal_position
`);
console.log("COLS", JSON.stringify(cols, null, 2));
await pool.end();
