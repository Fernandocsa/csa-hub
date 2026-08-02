/**
 * Generates scripts/data/season-1969-alagoano.mjs
 * Run: node scripts/_gen-1969-data.mjs
 *
 * Campeonato Alagoano 1969 — CSA.
 * Oficial: J12 V6 E4 D2 GP23 GC10.
 * Zé Luiz / Zé Luís na fonte = volante (#1179); goleiro titular = Zé Galego.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAJU = "Pajuçara";
const MUTANGE = "Estádio do Mutange";
const LEAHY = "Estádio Alfredo Leahy";
const EDSON = "Estádio Édson Amaro";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const PINGUELA = "Pinguela";
/** Volante (fonte: Zé Luiz / Zé Luís) */
const ZE_MID = "Zé Luís";

function lineup(starters, subs = []) {
  return {
    starters,
    entered: subs.map((s) => s.in),
    subs,
  };
}

/** @type {any[]} */
const GAMES = [];
function add(g) {
  GAMES.push(g);
}

// ——— 1º turno ———
add({
  date: "1969-03-16",
  phase: "1º turno",
  opponent: "Guarany-AL",
  ha: "away",
  gf: 2,
  ga: 1,
  stadium: PAJU,
  referee: "José Amaro",
  goals: [{ name: "Duda" }, { name: "Duda" }],
});

add({
  date: "1969-03-23",
  phase: "1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: MUTANGE,
  referee: "Rubens Cerqueira",
  manager: PINGUELA,
  ...lineup(
    [
      "Zé Galego",
      "Ciro",
      "Dida",
      "Tadeu",
      "Erivaldo",
      ZE_MID,
      "Erik",
      "Ratinho",
      "Giraldo",
      "Duda",
      "Petruce",
    ],
    [{ out: "Erik", in: "Edmílson" }],
  ),
  goals: [{ name: "Giraldo" }, { name: "Duda" }],
});

add({
  date: "1969-03-30",
  phase: "1º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: FUMEI,
  referee: "Rubens Cerqueira",
  manager: PINGUELA,
  ...lineup([
    "Zé Galego",
    "Catatau",
    "Dida",
    "Tadeu",
    "Erivaldo",
    "Barbosa",
    "Petruce",
    "Giraldo",
    "Duda",
    "Deo",
    "Geo",
  ]),
});

add({
  date: "1969-04-06",
  phase: "1º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: null,
  referee: "Rubens Cerqueira",
  goals: [{ name: "Zé Luís" }, { name: "Geo" }],
});

add({
  date: "1969-04-13",
  phase: "1º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: LEAHY,
  referee: "Paulo Soares",
});

add({
  date: "1969-04-20",
  phase: "1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 2,
  stadium: PAJU,
  referee: "Paulo Soares",
  manager: PINGUELA,
  ...lineup(
    [
      "Zé Galego",
      "Ciro",
      "Dida",
      "Tadeu",
      "Barbosa",
      ZE_MID,
      "Erik",
      "Geo",
      "Giraldo",
      "Tonho Lima",
      "Deo",
    ],
    [
      { out: "Geo", in: "Petruce" },
      { out: "Tonho Lima", in: "Alderico" },
    ],
  ),
});

// ——— 2º turno ———
add({
  date: "1969-05-04",
  phase: "2º turno",
  opponent: "Guarany-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: PAJU,
  note: "Gols do CSA não informados na fonte",
});

add({
  date: "1969-05-11",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 2,
  stadium: PAJU,
  referee: "Paulo Soares",
  manager: PINGUELA,
  ...lineup(
    [
      "Zé Galego",
      "Ciro",
      "Paranhos",
      "Tadeu",
      "Barbosa",
      ZE_MID,
      "Erik",
      "Ratinho",
      "Giraldo",
      "Jairo",
      "Petruce",
    ],
    [{ out: "Petruce", in: "Cabeludo" }],
  ),
  goals: [{ name: "Jairo" }, { name: "Zé Luís" }],
});

add({
  date: "1969-05-25",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: PAJU,
  referee: "Rubens Cerqueira",
  goals: [{ name: "Giraldo" }, { name: "Giraldo" }],
});

add({
  date: "1969-06-01",
  phase: "2º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 3,
  ga: 3,
  stadium: EDSON,
  referee: "Paulo Soares",
  manager: PINGUELA,
  ...lineup(
    [
      "Zé Galego",
      "Ciro",
      "Dida",
      "Tadeu",
      "Barbosa",
      ZE_MID,
      "Erik",
      "Ratinho",
      "Giraldo",
      "Deo",
      "Cabeludo",
    ],
    [
      { out: "Ratinho", in: "Geo" },
      { out: "Cabeludo", in: "Alderico" },
    ],
  ),
  goals: [
    { name: "Deda", ownGoal: true, ownGoalDirection: "for" },
    { name: "Giraldo" },
    { name: "Ratinho" },
  ],
});

add({
  date: "1969-06-08",
  phase: "2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 6,
  ga: 0,
  stadium: PAJU,
  referee: "Lourival Ferreira",
  goals: [
    { name: "Zé Luís" },
    { name: "Deo" },
    { name: "Deo" },
    { name: "Deo" },
    { name: "Giraldo" },
    { name: "Giraldo" },
  ],
});

add({
  date: "1969-06-15",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: PAJU,
  referee: "Dirceu Arruda",
  manager: PINGUELA,
  ...lineup(
    [
      "Zé Galego",
      "Ciro",
      "Paranhos",
      "Tadeu",
      "Barbosa",
      ZE_MID,
      "Erik",
      "Ratinho",
      "Giraldo",
      "Deo",
      "Petruce",
    ],
    [{ out: "Deo", in: "Alderico" }],
  ),
  goals: [{ name: "Alderico" }],
});

const counted = GAMES.filter((g) => !g.excludeFromStats);
let w = 0,
  d = 0,
  l = 0,
  gp = 0,
  gc = 0;
for (const g of counted) {
  if (g.gf > g.ga) w++;
  else if (g.gf < g.ga) l++;
  else d++;
  gp += g.gf;
  gc += g.ga;
}
console.log(
  `lista=${GAMES.length} contados=${counted.length} V${w} E${d} D${l} GP${gp} GC${gc}`,
);

const header = `/** Campeonato Alagoano 1969 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * Contagem oficial: J${counted.length} V${w} E${d} D${l} GP${gp} GC${gc}.
 * Zé Luiz / Zé Luís na fonte = volante (#1179); goleiro = Zé Galego.
 * ownGoalDirection: "for" = GPF.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1969;

/**
 * @typedef {{
 *   date: string;
 *   phase: string;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number;
 *   ga: number;
 *   stadium?: string|null;
 *   referee?: string|null;
 *   attendance?: number|null;
 *   revenue?: number|null;
 *   revenueText?: string|null;
 *   manager?: string|null;
 *   starters?: string[];
 *   entered?: string[];
 *   subs?: { out: string; in: string; minute?: number|null }[];
 *   goals?: {
 *     name: string;
 *     minute?: number|null;
 *     penalty?: boolean;
 *     ownGoal?: boolean;
 *     ownGoalDirection?: "for"|"against";
 *     side?: "csa"|"opponent";
 *   }[];
 *   note?: string;
 *   excludeFromStats?: boolean;
 *   officialResult?: "win"|"draw"|"loss";
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = ${JSON.stringify(GAMES, null, 2)};
`;

const out = resolve(__dirname, "data/season-1969-alagoano.mjs");
writeFileSync(out, header, "utf8");
console.log("wrote", out);
