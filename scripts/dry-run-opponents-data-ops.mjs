/**
 * Dry-run for:
 * 1) Auto-fill opponents.state from trailing -UF name suffix
 * 2) Merge duplicate "7 de Setembro-AL" → "Sete de Setembro-AL"
 *
 * READ-ONLY — no writes.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const BRAZIL_UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

function detectUfFromName(name) {
  const m = name.trim().match(/-\s*([A-Za-z]{2})\s*$/);
  if (!m) return null;
  const uf = m[1].toUpperCase();
  return BRAZIL_UFS.has(uf) ? uf : null;
}

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
const u = new URL(url);
const ssl = /supabase|neon|railway|amazonaws/i.test(u.hostname)
  ? { rejectUnauthorized: false }
  : undefined;
const pool = new pg.Pool({ connectionString: url, ssl });

try {
  // ── Operation 1: suffix → state ──────────────────────────────────────────
  console.log("=".repeat(72));
  console.log("DRY-RUN 1: Preencher opponents.state a partir do sufixo -UF no name");
  console.log("=".repeat(72));

  const { rows: allOpponents } = await pool.query(`
    SELECT id, name, city, state, home_stadium_id
    FROM opponents
    ORDER BY name
  `);

  const withSuffix = [];
  const wouldUpdate = [];
  const alreadyCorrect = [];
  const conflict = [];
  const noSuffix = [];

  for (const o of allOpponents) {
    const detected = detectUfFromName(o.name);
    if (!detected) {
      noSuffix.push(o);
      continue;
    }
    withSuffix.push({ ...o, detectedUf: detected });

    const current = o.state?.trim().toUpperCase() || null;
    if (!current) {
      wouldUpdate.push({ ...o, detectedUf: detected, action: "SET state" });
    } else if (current === detected) {
      alreadyCorrect.push({ ...o, detectedUf: detected, action: "SKIP (já correto)" });
    } else {
      conflict.push({
        ...o,
        detectedUf: detected,
        action: "CONFLICT (state diferente do sufixo)",
      });
    }
  }

  console.log(`\nTotal adversários: ${allOpponents.length}`);
  console.log(`Com sufixo -UF válido no name: ${withSuffix.length}`);
  console.log(`  → Seriam atualizados (state vazio): ${wouldUpdate.length}`);
  console.log(`  → Já corretos (state = sufixo): ${alreadyCorrect.length}`);
  console.log(`  → Conflito (state preenchido ≠ sufixo): ${conflict.length}`);
  console.log(`Sem sufixo -UF detectável: ${noSuffix.length}`);

  console.log("\n--- Amostra: seriam atualizados (até 30) ---");
  for (const o of wouldUpdate.slice(0, 30)) {
    console.log(`  id=${o.id}  "${o.name}"  → state=${o.detectedUf}`);
  }
  if (wouldUpdate.length > 30) {
    console.log(`  ... e mais ${wouldUpdate.length - 30}`);
  }

  if (conflict.length > 0) {
    console.log("\n--- Conflitos (NÃO seriam alterados automaticamente) ---");
    for (const o of conflict) {
      console.log(
        `  id=${o.id}  "${o.name}"  state atual=${o.state}  sufixo=${o.detectedUf}`,
      );
    }
  }

  if (alreadyCorrect.length > 0) {
    console.log("\n--- Já corretos (state = sufixo, sem alteração) ---");
    for (const o of alreadyCorrect) {
      console.log(`  id=${o.id}  "${o.name}"  state=${o.state}`);
    }
  }

  if (noSuffix.length > 0) {
    console.log("\n--- Sem sufixo -UF detectável ---");
    for (const o of noSuffix) {
      console.log(`  id=${o.id}  "${o.name}"  state=${o.state ?? "(vazio)"}`);
    }
  }

  // ── Operation 2: merge duplicates ────────────────────────────────────────
  console.log("\n" + "=".repeat(72));
  console.log('DRY-RUN 2: Mesclar "7 de Setembro-AL" → "Sete de Setembro-AL"');
  console.log("=".repeat(72));

  const KEEP_NAME = "Sete de Setembro-AL";
  const DISCARD_NAME = "7 de Setembro-AL";

  const { rows: dupRows } = await pool.query(
    `SELECT o.*, s.name AS stadium_name, s.city AS stadium_city, s.state AS stadium_state
     FROM opponents o
     LEFT JOIN stadiums s ON s.id = o.home_stadium_id
     WHERE o.name = $1 OR o.name = $2
     ORDER BY o.name`,
    [KEEP_NAME, DISCARD_NAME],
  );

  if (dupRows.length === 0) {
    console.log("\nNenhum registro encontrado com esses nomes exatos.");
  } else {
    for (const o of dupRows) {
      const { rows: matchRows } = await pool.query(
        `SELECT COUNT(*)::int AS cnt FROM matches WHERE opponent_id = $1`,
        [o.id],
      );
      const matchCount = matchRows[0].cnt;

      console.log(`\n--- id=${o.id}  name="${o.name}" ---`);
      console.log(`  city:            ${o.city ?? "(vazio)"}`);
      console.log(`  state:           ${o.state ?? "(vazio)"}`);
      console.log(`  home_stadium_id: ${o.home_stadium_id ?? "(vazio)"}`);
      if (o.home_stadium_id) {
        console.log(
          `  estádio:         ${o.stadium_name} (${o.stadium_city ?? "?"}/${o.stadium_state ?? "?"})`,
        );
      }
      console.log(`  partidas:        ${matchCount}`);
    }

    const keep = dupRows.find((r) => r.name === KEEP_NAME);
    const discard = dupRows.find((r) => r.name === DISCARD_NAME);

    if (!keep || !discard) {
      console.log("\n⚠ Falta um dos dois registros:");
      if (!keep) console.log(`  Não encontrado: "${KEEP_NAME}"`);
      if (!discard) console.log(`  Não encontrado: "${DISCARD_NAME}"`);
    } else {
      const { rows: discardMatches } = await pool.query(
        `SELECT id, match_date, season, goals_for, goals_against, result, home_away
         FROM matches WHERE opponent_id = $1
         ORDER BY match_date
         LIMIT 10`,
        [discard.id],
      );

      console.log("\n--- Plano de mesclagem (se aprovado) ---");
      console.log(`  Manter:    id=${keep.id}  "${keep.name}"`);
      console.log(`  Descartar: id=${discard.id}  "${discard.name}"`);
      console.log(
        `  Reatribuir ${discardMatches.length > 0 ? "(amostra abaixo)" : ""} partidas de opponent_id=${discard.id} → ${keep.id}`,
      );

      const { rows: totalDiscard } = await pool.query(
        `SELECT COUNT(*)::int AS cnt FROM matches WHERE opponent_id = $1`,
        [discard.id],
      );
      console.log(`  Total partidas a reatribuir: ${totalDiscard[0].cnt}`);

      const preserve = [];
      if (discard.city && !keep.city) preserve.push(`city="${discard.city}" (só no descartado)`);
      if (discard.state && !keep.state) preserve.push(`state="${discard.state}" (só no descartado)`);
      if (discard.home_stadium_id && !keep.home_stadium_id) {
        preserve.push(
          `home_stadium_id=${discard.home_stadium_id} "${discard.stadium_name}" (só no descartado)`,
        );
      }
      if (keep.city && discard.city && keep.city !== discard.city) {
        preserve.push(`city conflito: keep="${keep.city}" vs discard="${discard.city}"`);
      }
      if (keep.state && discard.state && keep.state !== discard.state) {
        preserve.push(`state conflito: keep="${keep.state}" vs discard="${discard.state}"`);
      }
      if (keep.home_stadium_id && discard.home_stadium_id && keep.home_stadium_id !== discard.home_stadium_id) {
        preserve.push(
          `estádio conflito: keep=${keep.home_stadium_id} vs discard=${discard.home_stadium_id}`,
        );
      }

      if (preserve.length === 0) {
        console.log("  Dados exclusivos a preservar do descartado: nenhum");
      } else {
        console.log("  Dados a considerar na mesclagem:");
        for (const p of preserve) console.log(`    - ${p}`);
      }

      if (discardMatches.length > 0) {
        console.log("\n  Amostra de partidas do registro descartado:");
        for (const m of discardMatches) {
          console.log(
            `    match id=${m.id}  ${m.match_date}  ${m.season}  ${m.goals_for}-${m.goals_against} (${m.result}, ${m.home_away})`,
          );
        }
        if (totalDiscard[0].cnt > discardMatches.length) {
          console.log(`    ... e mais ${totalDiscard[0].cnt - discardMatches.length}`);
        }
      }
    }
  }

  console.log("\n" + "=".repeat(72));
  console.log("FIM DO DRY-RUN — nenhuma alteração foi aplicada.");
  console.log("=".repeat(72));
} finally {
  await pool.end();
}
