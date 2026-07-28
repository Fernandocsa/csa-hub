/**
 * Report near-duplicate referees and stadiums (read-only).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stripStadiumNoise(n) {
  return norm(n)
    .replace(/\b(estadio|arena|campo|complexo|municipal|parque)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const { rows: referees } = await pool.query(
  `SELECT r.id, r.name, r.state,
          (SELECT count(*)::int FROM matches m WHERE m.referee_id = r.id) AS matches
   FROM referees r ORDER BY r.name`,
);
const { rows: stadiums } = await pool.query(
  `SELECT s.id, s.name, s.city,
          (SELECT count(*)::int FROM matches m WHERE m.stadium_id = s.id) AS matches
   FROM stadiums s ORDER BY s.name`,
);

console.log("=== ÁRBITROS: possíveis duplicatas ===");
const refPairs = [];
for (let i = 0; i < referees.length; i++) {
  for (let j = i + 1; j < referees.length; j++) {
    const a = referees[i];
    const b = referees[j];
    const na = norm(a.name);
    const nb = norm(b.name);
    if (na === nb) {
      refPairs.push({ a, b, why: "nome idêntico" });
      continue;
    }
    const ta = na.split(" ").filter((t) => t.length > 2);
    const tb = new Set(nb.split(" ").filter((t) => t.length > 2));
    const shared = ta.filter((t) => tb.has(t));
    if (shared.length >= 3 || (shared.length >= 2 && ta[0] === [...tb][0])) {
      refPairs.push({ a, b, why: `tokens: ${shared.join(", ")}` });
    }
  }
}
if (!refPairs.length) console.log("(nenhuma)");
for (const p of refPairs) {
  console.log(
    `#${p.a.id} "${p.a.name}" (${p.a.matches}) ↔ #${p.b.id} "${p.b.name}" (${p.b.matches}) — ${p.why}`,
  );
}

console.log("\n=== ESTÁDIOS: possíveis duplicatas ===");
const stPairs = [];
for (let i = 0; i < stadiums.length; i++) {
  for (let j = i + 1; j < stadiums.length; j++) {
    const a = stadiums[i];
    const b = stadiums[j];
    const na = stripStadiumNoise(a.name);
    const nb = stripStadiumNoise(b.name);
    if (!na || !nb) continue;
    if (na === nb || na.includes(nb) || nb.includes(na)) {
      stPairs.push({ a, b, why: na === nb ? "núcleo idêntico" : "um contém o outro" });
      continue;
    }
    const ta = na.split(" ").filter((t) => t.length > 2);
    const tb = new Set(nb.split(" ").filter((t) => t.length > 2));
    const shared = ta.filter((t) => tb.has(t));
    if (shared.length >= 2) {
      stPairs.push({ a, b, why: `tokens: ${shared.join(", ")}` });
    }
  }
}
if (!stPairs.length) console.log("(nenhuma)");
for (const p of stPairs) {
  console.log(
    `#${p.a.id} "${p.a.name}" (${p.a.matches}j) ↔ #${p.b.id} "${p.b.name}" (${p.b.matches}j) — ${p.why}`,
  );
}

const check = await pool.query(
  `SELECT id, name FROM stadiums WHERE id IN (14, 22) OR name ILIKE '%fumeir%' OR name ILIKE '%coarac%'`,
);
console.log("\n=== Pós-merge Coaracy/Fumeirão ===");
console.log(check.rows);

await pool.end();
