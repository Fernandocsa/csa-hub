/**
 * Stage A smoke: foreign opponents excluded from by-state / sem-estado.
 */
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9897/api";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("=== Stage A foreign exclude from by-state ===");

const list = await fetch(`${BASE}/opponents/by-state`);
const listData = await list.json();
assert(list.status === 200, `by-state ${list.status}`);
assert(listData.unknown == null, `unknown should be null, got ${JSON.stringify(listData.unknown)}`);
console.log("OK by-state list has no Sem Estado bucket");

const sem = await fetch(`${BASE}/opponents/by-state/sem-estado`);
const semData = await sem.json();
assert(sem.status === 200, "sem-estado detail");
assert(semData.opponentCount === 0, `sem-estado opponents ${semData.opponentCount}`);
assert(semData.matches === 0, `sem-estado matches ${semData.matches}`);
assert(
  !semData.opponents?.some((o) => o.id === 162 || o.id === 163),
  "foreign clubs in sem-estado",
);
console.log("OK sem-estado excludes Talleres-ARG and Estudiantes-VEN");

const foreign = await fetch(`${BASE}/opponents/by-foreign`);
const foreignData = await foreign.json();
assert(foreign.status === 200, "by-foreign");
assert(foreignData.opponents?.some((o) => o.id === 162), "Talleres in by-foreign");
assert(foreignData.opponents?.some((o) => o.id === 163), "Estudiantes in by-foreign");
console.log("OK foreign clubs still in by-foreign");

const nordeste = await fetch(`${BASE}/opponents/by-region/nordeste`);
const nordesteData = await nordeste.json();
assert(nordeste.status === 200, "nordeste region");
assert(nordesteData.matches >= 1000, "nordeste still has matches");
console.log("OK by-region unchanged for Brazilian clubs");

const al = await fetch(`${BASE}/opponents/by-state/AL`);
const alData = await al.json();
assert(al.status === 200, "AL detail");
assert(alData.matches >= 100, "AL still has matches");
console.log("OK UF detail still works");

console.log("=== Stage A foreign by-state exclude smoke PASSED ===");
