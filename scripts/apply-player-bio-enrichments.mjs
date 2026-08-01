/**
 * Apply player bio enrichments from scripts/data/enrich-*.json
 *
 * Only updates incomplete players (missing any of full_name/birth_date/position/preferred_foot).
 * Fills null/empty fields; overwrites position/birth_year when enrichment is high-confidence.
 * Does NOT set verification_status=verified (human review).
 *
 * Usage: node scripts/apply-player-bio-enrichments.mjs [--dry-run]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
const dryRun = process.argv.includes("--dry-run");

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

function isComplete(p) {
  return (
    p.full_name &&
    String(p.full_name).trim() &&
    p.birth_date &&
    p.position &&
    String(p.position).trim() &&
    p.preferred_foot &&
    String(p.preferred_foot).trim()
  );
}

function parseBirthYear(birthDate) {
  if (!birthDate || typeof birthDate !== "string") return null;
  const y = Number(birthDate.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

function loadEnrichmentFiles() {
  const files = readdirSync(dataDir).filter(
    (f) => f.startsWith("enrich-") && f.endsWith(".json") && !f.includes("doubt"),
  );
  const byId = new Map();
  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(dataDir, f), "utf8"));
    const list = Array.isArray(raw) ? raw : raw.players ?? raw.data ?? [];
    for (const row of list) {
      if (!row?.id || row.confidence === "low") continue;
      const id = Number(row.id);
      const prev = byId.get(id);
      // Later files win, but keep preferredFoot/fullName/etc. if the newer row omits them
      if (prev) {
        const merged = { ...prev, ...row, _file: f };
        for (const key of [
          "preferredFoot",
          "preferred_foot",
          "fullName",
          "full_name",
          "position",
          "birthDate",
          "birth_date",
          "birthCity",
          "birth_city",
          "birthState",
          "birth_state",
          "heightCm",
          "height_cm",
          "weightKg",
          "weight_kg",
          "nationality",
        ]) {
          const nextVal = row[key];
          const prevVal = prev[key];
          if ((nextVal == null || nextVal === "") && prevVal != null && prevVal !== "") {
            merged[key] = prevVal;
          }
        }
        byId.set(id, merged);
      } else {
        byId.set(id, { ...row, _file: f });
      }
    }
  }
  return { byId, files };
}

try {
  const { byId, files } = loadEnrichmentFiles();
  console.log(`files: ${files.join(", ") || "(none)"}`);
  console.log(`enrichment rows: ${byId.size}`);

  const report = { updated: [], skippedComplete: [], skippedMissing: [], errors: [] };

  if (!dryRun) await client.query("BEGIN");

  for (const [id, e] of byId) {
    const { rows } = await client.query(
      `SELECT id, name, full_name, position, birth_date::text AS birth_date,
              birth_year, birth_city, birth_state, preferred_foot,
              nationality, height_cm, weight_kg, verification_status
       FROM players WHERE id = $1`,
      [id],
    );
    const cur = rows[0];
    if (!cur) {
      report.skippedMissing.push({ id, name: e.name });
      continue;
    }
    if (isComplete(cur)) {
      report.skippedComplete.push({ id, name: cur.name });
      continue;
    }

    const fullName = e.fullName ?? e.full_name ?? null;
    const position = e.position ?? null;
    const preferredFoot = e.preferredFoot ?? e.preferred_foot ?? null;
    const birthDate = e.birthDate ?? e.birth_date ?? null;
    const birthCity = e.birthCity ?? e.birth_city ?? null;
    const birthState = e.birthState ?? e.birth_state ?? null;
    const nationality = e.nationality ?? null;
    const heightCm = e.heightCm ?? e.height_cm ?? null;
    const weightKg = e.weightKg ?? e.weight_kg ?? null;
    const birthYear = parseBirthYear(birthDate) ?? e.birthYear ?? e.birth_year ?? null;

    if (!fullName || !position || !birthDate) {
      report.errors.push({
        id,
        name: cur.name,
        reason: "enrichment missing required fields (need fullName, position, birthDate)",
        e,
      });
      continue;
    }
    if (preferredFoot && !["destro", "canhoto", "ambidestro"].includes(preferredFoot)) {
      report.errors.push({ id, name: cur.name, reason: `bad foot ${preferredFoot}` });
      continue;
    }

    const patch = {
      full_name: cur.full_name?.trim() ? cur.full_name : fullName,
      position: position,
      preferred_foot: cur.preferred_foot?.trim()
        ? cur.preferred_foot
        : preferredFoot || null,
      birth_date: cur.birth_date || birthDate,
      birth_year: cur.birth_year || birthYear,
      birth_city: cur.birth_city?.trim() ? cur.birth_city : birthCity,
      birth_state: cur.birth_state?.trim() ? cur.birth_state : birthState,
      nationality: cur.nationality?.trim() ? cur.nationality : nationality,
      height_cm: cur.height_cm ?? heightCm,
      weight_kg: cur.weight_kg ?? weightKg,
    };

    // Skip if nothing new would be written toward completeness
    if (
      cur.full_name?.trim() &&
      cur.birth_date &&
      cur.position?.trim() &&
      cur.preferred_foot?.trim()
    ) {
      report.skippedComplete.push({ id, name: cur.name });
      continue;
    }

    if (!dryRun) {
      await client.query(
        `UPDATE players SET
           full_name = $2,
           position = $3,
           preferred_foot = $4,
           birth_date = $5,
           birth_year = COALESCE($6, birth_year),
           birth_city = $7,
           birth_state = $8,
           nationality = COALESCE($9, nationality),
           height_cm = COALESCE($10, height_cm),
           weight_kg = COALESCE($11, weight_kg)
         WHERE id = $1`,
        [
          id,
          patch.full_name,
          patch.position,
          patch.preferred_foot,
          patch.birth_date,
          patch.birth_year,
          patch.birth_city,
          patch.birth_state,
          patch.nationality,
          patch.height_cm,
          patch.weight_kg,
        ],
      );
    }

    report.updated.push({ id, name: cur.name, from: e._file, fullName: patch.full_name });
  }

  if (!dryRun) await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        dryRun,
        updated: report.updated.length,
        skippedComplete: report.skippedComplete.length,
        skippedMissing: report.skippedMissing.length,
        errors: report.errors.length,
        errorSamples: report.errors.slice(0, 10),
        updatedSample: report.updated.slice(0, 15),
      },
      null,
      2,
    ),
  );
} catch (e) {
  if (!dryRun) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
