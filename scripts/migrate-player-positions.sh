#!/usr/bin/env bash
# Migrate players.position codes → Portuguese labels.
# Default: dry-run (no writes). Pass --apply to update production.
#
# FW → Atacante
# GK → Goleiro
# DF → Zagueiro
# MF → Meia
#
# Leaves Portuguese labels (Goleiro, Zagueiro, Lateral, Volante, Meia, Atacante,
# Lateral Direito, Lateral Esquerdo) untouched.
set -euo pipefail
cd "$(dirname "$0")/.."

APPLY=0
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --dry-run) APPLY=0 ;;
    -h|--help)
      echo "Usage: $0 [--dry-run|--apply]"
      exit 0
      ;;
  esac
done

set -a
# shellcheck disable=SC1091
source .env
set +a

export APPLY
node --input-type=module <<'NODE'
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
  }
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

const MAPPINGS = [
  { from: "FW", to: "Atacante" },
  { from: "GK", to: "Goleiro" },
  { from: "DF", to: "Zagueiro" },
  { from: "MF", to: "Meia" },
];

const apply = process.env.APPLY === "1";

try {
  console.log(apply ? "=== APPLY mode ===" : "=== DRY-RUN (no writes) ===");
  console.log("");

  const { rows: dist } = await pool.query(`
    SELECT COALESCE(position, '(null)') AS position, COUNT(*)::int AS n
    FROM players
    GROUP BY position
    ORDER BY n DESC, position
  `);
  console.log("Current position distribution:");
  for (const r of dist) console.log(`  ${r.position}: ${r.n}`);
  console.log("");

  let totalWouldChange = 0;
  for (const { from, to } of MAPPINGS) {
    const { rows } = await pool.query(
      `SELECT id, name, position FROM players WHERE position = $1 ORDER BY name`,
      [from],
    );
    console.log(`${from} → ${to}: ${rows.length} jogador(es)`);
    for (const r of rows.slice(0, 15)) {
      console.log(`  - #${r.id} ${r.name}`);
    }
    if (rows.length > 15) console.log(`  ... e mais ${rows.length - 15}`);
    totalWouldChange += rows.length;
  }

  console.log("");
  console.log(`Total a converter: ${totalWouldChange}`);

  if (!apply) {
    console.log("");
    console.log("Dry-run only. Re-run with --apply to update.");
    process.exit(0);
  }

  console.log("");
  console.log("Applying updates...");
  let updated = 0;
  for (const { from, to } of MAPPINGS) {
    const res = await pool.query(
      `UPDATE players SET position = $1 WHERE position = $2`,
      [to, from],
    );
    console.log(`  ${from} → ${to}: ${res.rowCount} row(s)`);
    updated += res.rowCount ?? 0;
  }
  console.log(`Done. Updated ${updated} player(s).`);
} finally {
  await pool.end();
}
NODE
