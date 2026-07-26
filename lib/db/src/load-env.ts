import { config } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let loaded = false;

function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}

/**
 * Loads workspace-root `.env` into process.env.
 * Does not override variables that are already set (Replit / shell / CI win).
 */
export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;

  const startDir = path.dirname(fileURLToPath(import.meta.url));
  const root = findMonorepoRoot(startDir);
  config({ path: path.join(root, ".env") });
}
