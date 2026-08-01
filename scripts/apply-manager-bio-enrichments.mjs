/**
 * Apply manager bio enrichments from scripts/data/enrich-managers-*.json
 *
 * Complete = full_name + birth_date + nationality + birth_city + birth_state
 * Fills null/empty fields only (does not overwrite existing non-empty values,
 * except birth_country "BRA" → "Brasil" and casing of full_name when empty).
 * Does NOT set verification_status=verified (human review).
 *
 * Usage: node scripts/apply-manager-bio-enrichments.mjs [--dry-run]
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

function isComplete(m) {
  return (
    m.full_name &&
    String(m.full_name).trim() &&
    m.birth_date &&
    m.nationality &&
    String(m.nationality).trim() &&
    m.birth_city &&
    String(m.birth_city).trim() &&
    m.birth_state &&
    String(m.birth_state).trim()
  );
}

function loadEnrichmentFiles() {
  const files = readdirSync(dataDir).filter(
    (f) =>
      f.startsWith("enrich-managers-") &&
      f.endsWith(".json") &&
      !f.includes("doubt"),
  );
  const byId = new Map();
  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(dataDir, f), "utf8"));
    const list = Array.isArray(raw) ? raw : raw.managers ?? raw.data ?? [];
    for (const row of list) {
      if (!row?.id || row.confidence === "low") continue;
      const id = Number(row.id);
      const prev = byId.get(id);
      if (prev) {
        const merged = { ...prev, ...row, _file: f };
        for (const key of [
          "fullName",
          "full_name",
          "birthDate",
          "birth_date",
          "birthCity",
          "birth_city",
          "birthState",
          "birth_state",
          "birthCountry",
          "birth_country",
          "nationality",
          "isDeceased",
          "is_deceased",
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

function normalizeCountry(c) {
  if (!c) return null;
  const t = String(c).trim();
  if (/^(bra|brasil|brazil)$/i.test(t)) return "Brasil";
  return t;
}

try {
  const { byId, files } = loadEnrichmentFiles();
  console.log(`files: ${files.join(", ") || "(none)"}`);
  console.log(`enrichment rows: ${byId.size}`);

  const report = { updated: [], skippedComplete: [], skippedMissing: [], errors: [] };

  if (!dryRun) await client.query("BEGIN");

  for (const [id, e] of byId) {
    const { rows } = await client.query(
      `SELECT id, name, full_name, nationality, birth_date::text AS birth_date,
              birth_city, birth_state, birth_country, is_deceased, verification_status
       FROM managers WHERE id = $1`,
      [id],
    );
    const cur = rows[0];
    if (!cur) {
      report.skippedMissing.push({ id, name: e.name });
      continue;
    }
    if (isComplete(cur) && normalizeCountry(cur.birth_country) === "Brasil") {
      // Still allow is_deceased / birth_country BRA fix
      const wantsDeceased =
        (e.isDeceased ?? e.is_deceased) === true && cur.is_deceased === false;
      const wantsCountryFix =
        cur.birth_country &&
        normalizeCountry(cur.birth_country) === "Brasil" &&
        cur.birth_country !== "Brasil";
      if (!wantsDeceased && !wantsCountryFix) {
        report.skippedComplete.push({ id, name: cur.name });
        continue;
      }
    }

    const fullName = e.fullName ?? e.full_name ?? null;
    const birthDate = e.birthDate ?? e.birth_date ?? null;
    const birthCity = e.birthCity ?? e.birth_city ?? null;
    const birthState = e.birthState ?? e.birth_state ?? null;
    const birthCountry = normalizeCountry(e.birthCountry ?? e.birth_country ?? "Brasil");
    const nationality = e.nationality ?? "Brasil";
    const isDeceased = e.isDeceased ?? e.is_deceased ?? null;

    if (!fullName || !birthDate) {
      report.errors.push({
        id,
        name: cur.name,
        reason: "enrichment missing required fields (need fullName, birthDate)",
      });
      continue;
    }

    const patch = {
      full_name: cur.full_name?.trim() ? cur.full_name : fullName,
      birth_date: cur.birth_date || birthDate,
      birth_city: cur.birth_city?.trim() ? cur.birth_city : birthCity,
      birth_state: cur.birth_state?.trim() ? cur.birth_state : birthState,
      birth_country: normalizeCountry(cur.birth_country) || birthCountry,
      nationality: cur.nationality?.trim() ? cur.nationality : nationality,
      is_deceased:
        isDeceased === true || isDeceased === false ? isDeceased : cur.is_deceased,
    };

    // Prefer fixing BRA → Brasil even when other fields exist
    if (cur.birth_country && normalizeCountry(cur.birth_country) === "Brasil") {
      patch.birth_country = "Brasil";
    }

    if (!dryRun) {
      await client.query(
        `UPDATE managers SET
           full_name = $2,
           birth_date = $3,
           birth_city = $4,
           birth_state = $5,
           birth_country = $6,
           nationality = $7,
           is_deceased = $8
         WHERE id = $1`,
        [
          id,
          patch.full_name,
          patch.birth_date,
          patch.birth_city,
          patch.birth_state,
          patch.birth_country,
          patch.nationality,
          patch.is_deceased,
        ],
      );
    }

    report.updated.push({
      id,
      name: cur.name,
      from: e._file,
      fullName: patch.full_name,
      birthDate: patch.birth_date,
    });
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
        updatedSample: report.updated.slice(0, 20),
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
