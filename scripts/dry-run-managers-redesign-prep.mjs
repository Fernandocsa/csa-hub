/**
 * Dry-run only (READ-ONLY):
 * A) Seed plan for managers with stored_* and zero matches (Option 1)
 * B) Deletion candidates: zero matches + no meaningful stored games
 *    + badge/match safety checks
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

function parseSeasons(raw) {
  if (raw == null || String(raw).trim() === "") return [];
  return String(raw)
    .split(/[,;/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickSeasonYear(row) {
  const seasons = parseSeasons(row.seasons);
  if (seasons.length === 1) {
    return { season: seasons[0], rule: "single_seasons_value" };
  }
  if (seasons.length > 1) {
    return { season: seasons[0], rule: "first_of_multi_seasons" };
  }
  if (row.start_year != null) {
    return { season: String(row.start_year), rule: "start_year_fallback" };
  }
  if (row.end_year != null) {
    return { season: String(row.end_year), rule: "end_year_fallback" };
  }
  return { season: null, rule: "UNRESOLVED" };
}

try {
  console.log("=== A) MIGRAÇÃO DOS 65 (Opção 1) — dry-run ===\n");

  const { rows: seedCandidates } = await pool.query(`
    WITH linked AS (
      SELECT manager_id, count(*)::int AS match_count
      FROM matches
      WHERE manager_id IS NOT NULL
      GROUP BY manager_id
    )
    SELECT
      m.id, m.name, m.start_year, m.end_year, m.seasons,
      m.stored_games, m.stored_wins, m.stored_draws, m.stored_losses,
      m.stored_goals_for, m.stored_goals_against, m.stats_source
    FROM managers m
    LEFT JOIN linked l ON l.manager_id = m.id
    WHERE COALESCE(l.match_count, 0) = 0
      AND (
        m.stored_games IS NOT NULL
        OR m.stored_wins IS NOT NULL
        OR m.stored_draws IS NOT NULL
        OR m.stored_losses IS NOT NULL
        OR m.stored_goals_for IS NOT NULL
        OR m.stored_goals_against IS NOT NULL
      )
    ORDER BY m.name
  `);

  const planned = seedCandidates.map((r) => {
    const pick = pickSeasonYear(r);
    return {
      id: r.id,
      name: r.name,
      seasonsRaw: r.seasons,
      startYear: r.start_year,
      endYear: r.end_year,
      stored: {
        J: r.stored_games,
        V: r.stored_wins,
        E: r.stored_draws,
        D: r.stored_losses,
        GP: r.stored_goals_for,
        GC: r.stored_goals_against,
      },
      ...pick,
    };
  });

  const byRule = {};
  let unresolved = 0;
  for (const p of planned) {
    byRule[p.rule] = (byRule[p.rule] ?? 0) + 1;
    if (!p.season) unresolved += 1;
  }

  console.log("TOTAL_TO_SEED", planned.length);
  console.log("BY_RULE", JSON.stringify(byRule, null, 2));
  console.log("UNRESOLVED", unresolved);

  const examples = [
    ...planned.filter((p) => p.rule === "single_seasons_value").slice(0, 6),
    ...planned.filter((p) => p.rule === "first_of_multi_seasons").slice(0, 6),
    ...planned.filter((p) => p.rule === "start_year_fallback").slice(0, 3),
    ...planned.filter((p) => p.rule === "UNRESOLVED").slice(0, 3),
  ];

  console.log("\nEXAMPLES (" + examples.length + "):");
  for (const e of examples) {
    console.log(
      [
        `#${e.id} ${e.name}`,
        `seasons="${e.seasonsRaw ?? ""}"`,
        `years=${e.startYear ?? "?"}-${e.endYear ?? "?"}`,
        `→ season="${e.season}" (${e.rule})`,
        `J/V/E/D=${e.stored.J}/${e.stored.V}/${e.stored.E}/${e.stored.D}`,
        `GP/GC=${e.stored.GP}/${e.stored.GC}`,
        `source=manual`,
      ].join(" | "),
    );
  }

  console.log("\n=== B) EXCLUSÃO — dry-run ===\n");

  const named = [
    "Márcio Araújo",
    "Jonilson Veloso",
    "Léo Condé",
    "Evandro Guimarães",
    "Dado Cavalcanti",
    "Sérgio Soares",
    "Paulo César Carpegiani",
    "Daniel Paulista",
    "Luizinho Vieira",
    "Moisés Egert",
    "Felipe Surian",
    "Guto Ferreira",
  ];

  const { rows: zeroStoredZeroMatches } = await pool.query(`
    WITH linked AS (
      SELECT manager_id, count(*)::int AS match_count
      FROM matches
      WHERE manager_id IS NOT NULL
      GROUP BY manager_id
    )
    SELECT
      m.id, m.name, m.nationality, m.start_year, m.end_year, m.seasons,
      m.stored_games, m.stored_wins, m.stored_draws, m.stored_losses,
      m.stored_goals_for, m.stored_goals_against,
      COALESCE(l.match_count, 0)::int AS match_count
    FROM managers m
    LEFT JOIN linked l ON l.manager_id = m.id
    WHERE COALESCE(l.match_count, 0) = 0
      AND COALESCE(m.stored_games, 0) = 0
      AND COALESCE(m.stored_wins, 0) = 0
      AND COALESCE(m.stored_draws, 0) = 0
      AND COALESCE(m.stored_losses, 0) = 0
      AND COALESCE(m.stored_goals_for, 0) = 0
      AND COALESCE(m.stored_goals_against, 0) = 0
    ORDER BY m.name
  `);

  // Also find named people even if they don't match zero-stored filter
  const { rows: namedRows } = await pool.query(
    `
    SELECT m.id, m.name, m.stored_games,
      (SELECT count(*)::int FROM matches WHERE manager_id = m.id) AS match_count
    FROM managers m
    WHERE m.name = ANY($1::text[])
    ORDER BY m.name
  `,
    [named],
  );

  const ids = zeroStoredZeroMatches.map((r) => r.id);
  let badgeRows = [];
  if (ids.length > 0) {
    const br = await pool.query(
      `
      SELECT entity_id, id AS badge_id, label, source
      FROM entity_badges
      WHERE entity_type = 'manager' AND entity_id = ANY($1::int[])
      ORDER BY entity_id, id
    `,
      [ids],
    );
    badgeRows = br.rows;
  }

  const badgesByManager = new Map();
  for (const b of badgeRows) {
    if (!badgesByManager.has(b.entity_id)) badgesByManager.set(b.entity_id, []);
    badgesByManager.get(b.entity_id).push(b);
  }

  const safeToDelete = [];
  const blockedBadges = [];
  const blockedMatches = [];

  for (const r of zeroStoredZeroMatches) {
    const badges = badgesByManager.get(r.id) ?? [];
    const manualBadges = badges.filter((b) => b.source === "manual");
    if (r.match_count > 0) {
      blockedMatches.push(r);
      continue;
    }
    if (manualBadges.length > 0) {
      blockedBadges.push({ ...r, manualBadges });
      continue;
    }
    safeToDelete.push({
      id: r.id,
      name: r.name,
      seasons: r.seasons,
      years: `${r.start_year ?? "?"}-${r.end_year ?? "?"}`,
      autoBadges: badges.filter((b) => b.source === "auto").length,
    });
  }

  console.log("NAMED_LOOKUP (from your list):");
  for (const n of named) {
    const hit = namedRows.find((r) => r.name === n);
    if (!hit) console.log(`  MISSING_IN_DB: ${n}`);
    else
      console.log(
        `  #${hit.id} ${hit.name} | matches=${hit.match_count} | stored_games=${hit.stored_games ?? "null"}`,
      );
  }

  const namedMissingFromDelete = named.filter(
    (n) => !safeToDelete.some((d) => d.name === n) && !blockedBadges.some((d) => d.name === n),
  );

  console.log("\nSAFE_TO_DELETE_COUNT", safeToDelete.length);
  console.log("BLOCKED_MANUAL_BADGES", blockedBadges.length);
  console.log("BLOCKED_HAS_MATCHES", blockedMatches.length);

  console.log("\nSAFE_TO_DELETE LIST:");
  for (const d of safeToDelete) {
    const flagged = named.includes(d.name) ? " [named]" : "";
    console.log(
      `  #${d.id} ${d.name}${flagged} | years=${d.years} | seasons=${d.seasons ?? "-"} | autoBadges=${d.autoBadges}`,
    );
  }

  if (blockedBadges.length) {
    console.log("\nBLOCKED (manual badges) — do NOT auto-delete:");
    for (const b of blockedBadges) {
      console.log(
        `  #${b.id} ${b.name} | badges=${b.manualBadges.map((x) => `${x.label}(#${x.badge_id})`).join("; ")}`,
      );
    }
  }

  if (blockedMatches.length) {
    console.log("\nBLOCKED (has matches) — do NOT delete:");
    for (const b of blockedMatches) {
      console.log(`  #${b.id} ${b.name} | matches=${b.match_count}`);
    }
  }

  // Named people who are NOT in safe delete (have stored games or matches)
  console.log("\nNAMED_NOT_IN_SAFE_DELETE:");
  for (const n of named) {
    const inSafe = safeToDelete.find((d) => d.name === n);
    if (inSafe) continue;
    const row = namedRows.find((r) => r.name === n);
    if (!row) console.log(`  ${n} — not found in managers`);
    else
      console.log(
        `  ${n} — kept (matches=${row.match_count}, stored_games=${row.stored_games ?? "null"})`,
      );
  }

  console.log("\nDRY_RUN_COMPLETE — no writes performed");
} finally {
  await pool.end();
}
