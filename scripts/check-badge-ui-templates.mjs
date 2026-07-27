import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(
  "artifacts/portal-marujo/src/lib/manual-badge-templates.ts",
  "utf8",
);
const ui = readFileSync(
  "artifacts/portal-marujo/src/components/AdminEntityBadges.tsx",
  "utf8",
);

assert.match(src, /"acesso"/);
assert.match(src, /"heroi_do_acesso"/);
assert.match(src, /"gol_do_titulo"/);
assert.match(src, /"gol_historico"/);
assert.match(src, /MANAGER_TEMPLATES.*= \["campeao"\]/);
assert.match(src, /templateNeedsMatch/);
assert.match(ui, /AdminMatchSearch/);
assert.match(ui, /\/admin\/matches\/search/);
assert.match(ui, /templateNeedsMatch\(template\)/);
assert.match(ui, /matchId/);
assert.match(ui, /Prévia/);

const playerBlock = src.match(
  /export const PLAYER_TEMPLATES[\s\S]*?= \[([\s\S]*?)\];/,
)?.[1];
assert.ok(playerBlock);
const playerTemplates = [...playerBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
assert.deepEqual(playerTemplates, [
  "cria_do_mutange",
  "garcom",
  "artilheiro",
  "artilheiro_comp",
  "campeao",
  "acesso",
  "heroi_do_acesso",
  "gol_do_titulo",
  "gol_historico",
]);

console.log("OK UI source contract");
console.log("player templates:", playerTemplates.join(", "));
console.log("manager templates: campeao only");
console.log("AdminEntityBadges includes match search combobox");
