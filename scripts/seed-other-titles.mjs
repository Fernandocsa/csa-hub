/**
 * Seed miscellaneous CSA titles ("Outros") as champion campaigns.
 * Creates missing competitions; marks is_champion + classification '1º'.
 *
 * Usage: node scripts/seed-other-titles.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();

/** @type {{ name: string, type: string, years: number[], aliases?: string[] }[]} */
const GROUPS = [
  {
    name: "Torneio Pró-Caixa Olímpica",
    type: "state",
    years: [1929],
  },
  {
    name: "Torneio Grande Festival do Futebol",
    type: "state",
    years: [1932],
  },
  {
    name: "Torneio Associação Cultural e Cívica Feminina",
    type: "state",
    years: [1935],
  },
  {
    name: "Copa FAD",
    type: "state",
    years: [1936],
  },
  {
    name: "Taça Mário Lima",
    type: "state",
    years: [1953, 1956],
  },
  {
    name: "Torneio Alagoas-Sergipe",
    type: "regional",
    years: [1967],
  },
  {
    name: "Torneio José Sebastião Bastos",
    type: "state",
    years: [1967],
  },
  {
    name: "Seletivo do Campeonato Brasileiro",
    type: "national",
    years: [1974],
    aliases: ["Torneio Seletivo Brasileiro"],
  },
  {
    name: "Torneio Alfredo Júnior",
    type: "state",
    years: [1975],
  },
  {
    name: "Torneio de São Luís",
    type: "regional",
    years: [1975],
  },
  {
    name: "Torneio Divaldo Suruagy",
    type: "state",
    years: [1977, 1978],
  },
  {
    name: "Troféu Wassil Barbosa",
    type: "state",
    years: [2010],
  },
  {
    name: "Taça Noel Alves",
    type: "state",
    years: [2015],
  },
];

const client = await pool.connect();

async function ensureCompetition(g) {
  const names = [g.name, ...(g.aliases ?? [])];
  const { rows } = await client.query(
    `SELECT id, name, type FROM competitions WHERE name = ANY($1::text[]) ORDER BY id`,
    [names],
  );

  let preferred = rows.find((r) => r.name === g.name);
  if (!preferred && rows[0]) {
    const old = rows[0];
    if (DRY) {
      console.log(`  would rename #${old.id} "${old.name}" → "${g.name}"`);
      preferred = { ...old, name: g.name };
    } else {
      const { rows: renamed } = await client.query(
        `UPDATE competitions SET name = $1, type = COALESCE(type, $2) WHERE id = $3
         RETURNING id, name, type`,
        [g.name, g.type, old.id],
      );
      preferred = renamed[0];
      console.log(`  renamed #${preferred.id}: "${old.name}" → "${g.name}"`);
    }
  }

  if (!preferred) {
    if (DRY) {
      console.log(`  would create competition "${g.name}" (${g.type})`);
      return { id: -1, name: g.name, type: g.type, created: true };
    }
    const { rows: created } = await client.query(
      `INSERT INTO competitions (name, type) VALUES ($1, $2) RETURNING id, name, type`,
      [g.name, g.type],
    );
    preferred = created[0];
    console.log(`  created #${preferred.id} "${preferred.name}" (${preferred.type})`);
    return { ...preferred, created: true };
  }

  if (!preferred.type && !DRY) {
    await client.query(`UPDATE competitions SET type = $1 WHERE id = $2`, [
      g.type,
      preferred.id,
    ]);
  }

  console.log(`  competition #${preferred.id} "${preferred.name}"`);
  return { ...preferred, created: false };
}

async function ensureChampionSeason(competitionId, season) {
  if (competitionId < 0) {
    return "would-insert";
  }
  const { rows } = await client.query(
    `SELECT id, is_champion, classification
     FROM season_competition_stats
     WHERE season = $1 AND competition_id = $2`,
    [season, competitionId],
  );

  if (rows.length === 0) {
    if (!DRY) {
      await client.query(
        `INSERT INTO season_competition_stats
           (season, competition_id, games, wins, draws, losses,
            goals_for, goals_against, classification, is_champion,
            final_match_id, stats_source)
         VALUES ($1, $2, 0, 0, 0, 0, 0, 0, '1º', true, NULL, 'manual')`,
        [season, competitionId],
      );
    }
    return "inserted";
  }

  const row = rows[0];
  if (row.is_champion && row.classification === "1º") {
    return "already";
  }

  if (!DRY) {
    await client.query(
      `UPDATE season_competition_stats
       SET is_champion = true,
           classification = COALESCE(NULLIF(classification, ''), '1º')
       WHERE id = $1`,
      [row.id],
    );
  }
  return "updated";
}

try {
  console.log(DRY ? "DRY" : "APPLY");
  await client.query("BEGIN");

  const summary = [];

  for (const g of GROUPS) {
    console.log(`\n=== ${g.name} (${g.years.join(", ")}) ===`);
    const comp = await ensureCompetition(g);
    for (const year of g.years) {
      const season = String(year);
      const action = await ensureChampionSeason(comp.id, season);
      console.log(`  ${season}: ${action}`);
      summary.push({ competition: g.name, season, action });
    }
  }

  if (DRY) {
    await client.query("ROLLBACK");
    console.log("\nDRY — rolled back");
  } else {
    await client.query("COMMIT");
    console.log("\nCOMMIT ok");
  }

  const counts = summary.reduce((acc, s) => {
    acc[s.action] = (acc[s.action] ?? 0) + 1;
    return acc;
  }, {});
  console.log("summary", counts);

  if (!DRY) {
    const { rows } = await client.query(
      `
      SELECT c.name, array_agg(scs.season ORDER BY scs.season) AS seasons
      FROM season_competition_stats scs
      JOIN competitions c ON c.id = scs.competition_id
      WHERE scs.is_champion
        AND c.name = ANY($1::text[])
      GROUP BY c.name
      ORDER BY min(scs.season::int), c.name
      `,
      [GROUPS.map((g) => g.name)],
    );
    console.log("verified champions:\n", JSON.stringify(rows, null, 2));
    console.log(
      "total champions now",
      (
        await client.query(
          `SELECT count(*)::int n FROM season_competition_stats WHERE is_champion`,
        )
      ).rows[0],
    );
  }
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
