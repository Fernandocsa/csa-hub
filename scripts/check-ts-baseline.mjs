/**
 * Compare current `tsc --noEmit` errors to a baseline allowlist.
 *
 * Existing TS7030 / similar debt is allowed. CI fails when a new signature
 * appears or an existing signature's count grows (the multiGoalTitle class of
 * bug). Counts may shrink without updating the file.
 *
 *   node scripts/check-ts-baseline.mjs
 *   node scripts/check-ts-baseline.mjs --update
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const baselinePath = join(root, "scripts", "ts-error-baseline.json");
const tsc = join(root, "node_modules", "typescript", "bin", "tsc");

const PROJECTS = [
  { args: ["--build", "--pretty", "false"], label: "libs" },
  {
    args: ["-p", "artifacts/api-server/tsconfig.json", "--noEmit", "--pretty", "false"],
    label: "api-server",
  },
  {
    args: [
      "-p",
      "artifacts/portal-marujo/tsconfig.json",
      "--noEmit",
      "--pretty",
      "false",
    ],
    label: "portal-marujo",
  },
  {
    args: [
      "-p",
      "artifacts/mockup-sandbox/tsconfig.json",
      "--noEmit",
      "--pretty",
      "false",
    ],
    label: "mockup-sandbox",
  },
  {
    args: ["-p", "scripts/tsconfig.json", "--noEmit", "--pretty", "false"],
    label: "scripts",
  },
];

const ERROR_RE = /^(.*)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

function toPosix(file) {
  const rel = relative(root, file.startsWith(root) ? file : join(root, file));
  return rel.split(sep).join("/");
}

function collectErrors() {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const project of PROJECTS) {
    const result = spawnSync(process.execPath, [tsc, ...project.args], {
      cwd: root,
      encoding: "utf8",
    });
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    for (const line of output.split(/\r?\n/)) {
      const m = line.match(ERROR_RE);
      if (!m) continue;
      const file = toPosix(m[1].trim());
      const code = m[4];
      const message = m[5].trim();
      const key = `${file}|${code}|${message}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

const update = process.argv.includes("--update");
const current = collectErrors();
const total = Object.values(current).reduce((n, c) => n + c, 0);

if (update) {
  writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        comment:
          "Legacy tsc errors allowed until they are fixed. CI fails on new signatures or higher counts. Re-run with --update after cleaning errors.",
        total,
        signatures: current,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Wrote ${Object.keys(current).length} signatures (${total} errors) to scripts/ts-error-baseline.json`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error("Missing scripts/ts-error-baseline.json. Run with --update.");
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const allowed = baseline.signatures ?? {};
const newOrGrown = [];
for (const [key, count] of Object.entries(current)) {
  const prev = allowed[key] ?? 0;
  if (count > prev) {
    newOrGrown.push({ key, prev, count, delta: count - prev });
  }
}

const remaining = Object.keys(allowed).filter((key) => !(key in current));
if (remaining.length > 0) {
  console.log(
    `Baseline shrunk: ${remaining.length} signature(s) gone (run --update to record).`,
  );
}

if (newOrGrown.length > 0) {
  console.error("Typecheck gate failed — new or increased tsc errors:");
  for (const row of newOrGrown.slice(0, 40)) {
    console.error(`  +${row.delta} ${row.key} (was ${row.prev}, now ${row.count})`);
  }
  if (newOrGrown.length > 40) {
    console.error(`  … ${newOrGrown.length - 40} more`);
  }
  console.error(
    "Fix the errors, or if they are known debt: node scripts/check-ts-baseline.mjs --update",
  );
  process.exit(1);
}

console.log(
  `Typecheck gate ok — ${total} baseline error(s), ${Object.keys(current).length} signatures, no new ones.`,
);
