/**
 * Generates scripts/data/season-1970-alagoano.mjs
 * Run: node scripts/_gen-1970-data.mjs
 *
 * Campeonato Alagoano 1970 — CSA.
 * Oficial: J21 V9 E5 D7 GP25 GC13.
 *
 * Disambiguação Zé Luiz na fonte:
 * - Goleiro → sempre "Zé Luiz" (cadastro #1783, era 1970/72 ≠ década de 80)
 * - Volante/meia → sempre "Zé Luiz II" (cadastro volante #1179)
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
const MAGLIONE = "Maglione Sales";

/** Goleiro (fonte: Zé Luiz / Zé Luiz I / Zé Luiz II no gol) */
const ZE_GK = "Zé Luiz";
/** Volante (fonte: Zé Luiz / Zé Luiz I / Zé Luiz II no meio) */
const ZE_MID = "Zé Luiz II";

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
  date: "1970-04-05",
  phase: "1º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: PAJU,
  referee: "Dirceu Arruda",
  ...lineup(
    [
      ZE_GK,
      "Catatau",
      "Dida",
      "Givaldo",
      "Erivaldo",
      "Ratinho",
      "Erik",
      "Petruce",
      "Salê",
      "Geo",
      "Ricardo",
    ],
    [
      { out: "Ratinho", in: "Tadeu" },
      { out: "Geo", in: "Roberto" },
    ],
  ),
  goals: [{ name: "Geo" }, { name: "Tadeu" }],
});

add({
  date: "1970-04-12",
  phase: "1º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: LEAHY,
  referee: "Rubens Cerqueira",
  ...lineup(
    [
      ZE_GK,
      "Ciro",
      "Dida",
      "Givaldo",
      "Erivaldo",
      "Tadeu",
      "Erik",
      "Ratinho",
      "Valfrido",
      "Salê",
      "Ricardo",
    ],
    [
      { out: "Erik", in: "Zé Leite" },
      { out: "Ratinho", in: "Petruce" },
    ],
  ),
  goals: [{ name: "Tadeu" }, { name: "Salê" }, { name: "Valfrido" }],
});

add({
  date: "1970-04-19",
  phase: "1º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: MUTANGE,
  referee: "Sebastião Canuto",
  ...lineup(
    [
      ZE_GK,
      "Ciro",
      "Dida",
      "Paranhos",
      "Erivaldo",
      "Tadeu",
      "Erik",
      "Ratinho",
      "Valfrido",
      "Salê",
      "Ricardo",
    ],
    [
      { out: "Erivaldo", in: "Barbosa" },
      { out: "Erik", in: "Zé Leite" },
    ],
  ),
  goals: [{ name: "Tadeu" }, { name: "Tadeu" }],
});

add({
  date: "1970-05-03",
  phase: "1º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: MUTANGE,
  referee: "Rubens Cerqueira",
  ...lineup(
    [
      ZE_GK,
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      "Erik",
      "Ratinho",
      "Salê",
      "Valfrido",
      "Ricardo",
    ],
    [{ out: "Ciro", in: "Erivaldo" }],
  ),
  goals: [{ name: "Tadeu" }],
});

add({
  date: "1970-05-10",
  phase: "1º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: EDSON,
  referee: "Sebastião Canuto",
  ...lineup(
    [
      ZE_GK,
      "Ciro",
      "Dida",
      "Paranhos",
      "Erivaldo",
      "Zé Leite",
      "Erik",
      "Ratinho",
      "Tadeu",
      "Salê",
      "Ricardo",
    ],
    [{ out: "Tadeu", in: "Valfrido" }],
  ),
  goals: [{ name: "Tadeu" }],
});

add({
  date: "1970-05-17",
  phase: "1º turno",
  opponent: "Guarany-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: PAJU,
  referee: "José Ferreira",
});

add({
  date: "1970-05-31",
  phase: "1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 2,
  stadium: PAJU,
  referee: "Sebastião Canuto",
  ...lineup(
    [
      ZE_GK,
      "Ciro",
      "Givaldo",
      "Paranhos",
      "Erivaldo",
      "Zé Leite",
      "Mário",
      "Ratinho",
      "Tadeu",
      "Salê",
      "Ricardo",
    ],
    [
      { out: "Mário", in: ZE_MID },
      { out: "Salê", in: "Geo" },
    ],
  ),
});

// ——— 2º turno ———
add({
  date: "1970-07-12",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: MUTANGE,
  referee: "Dirceu Arruda",
  attendance: 1386,
  manager: MAGLIONE,
  ...lineup(
    [
      ZE_GK, // fonte: Zé Luiz I
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      ZE_MID, // fonte: Zé Luiz II
      "Ratinho",
      "Roberto",
      "Salê",
      "Ricardo",
    ],
    [
      { out: ZE_MID, in: "Erik" },
      { out: "Ratinho", in: "Petruce" },
    ],
  ),
  goals: [
    { name: "Roberto" },
    { name: "Roberto" },
    { name: "Tadeu" },
    { name: "Tadeu" },
  ],
});

add({
  date: "1970-07-19",
  phase: "2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: MUTANGE,
  referee: "Sebastião Canuto",
  manager: MAGLIONE,
  ...lineup(
    [
      "Zé Galego",
      "Ciro",
      "Dida",
      "Paranhos",
      "Catatau",
      "Tadeu",
      ZE_MID, // fonte: Zé Luiz
      "Petruce",
      "Roberto",
      "Salê",
      "Ricardo",
    ],
    [
      { out: "Tadeu", in: "Erik" },
      { out: "Salê", in: "Valfrido" },
    ],
  ),
  goals: [
    { name: "Tadeu", penalty: true },
    { name: "Roberto" },
    { name: "Roberto" },
  ],
});

add({
  date: "1970-07-26",
  phase: "2º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: MUTANGE,
  referee: "Dirceu Arruda",
  attendance: 1545,
  manager: MAGLIONE,
  ...lineup(
    [
      ZE_GK, // fonte: Zé Luiz II (gol)
      "Catatau",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      ZE_MID, // fonte: Zé Luiz
      "Petruce",
      "Roberto",
      "Salê",
      "Ricardo",
    ],
    [
      { out: ZE_MID, in: "Erik" },
      { out: "Salê", in: "Piranha" },
    ],
  ),
  goals: [
    { name: "Roberto" },
    { name: "Roberto" },
    { name: "Barbosa" },
    { name: "Ricardo" },
  ],
});

add({
  date: "1970-08-08",
  phase: "2º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: MUTANGE,
  referee: "Claudionor Tenório",
  attendance: 1096,
  manager: MAGLIONE,
  ...lineup(
    [
      ZE_GK, // fonte: Zé Luiz II
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      ZE_MID, // fonte: Zé Luiz I
      "Petruce",
      "Roberto",
      "Salê",
      "Canhoteiro",
    ],
    [
      { out: "Salê", in: "Piranha" },
      { out: "Canhoteiro", in: "Ricardo" },
    ],
  ),
  goals: [{ name: "Tadeu", penalty: true }],
});

add({
  date: "1970-08-16",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: FUMEI,
  referee: "Sebastião Canuto",
  manager: MAGLIONE,
  ...lineup(
    [
      ZE_GK,
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      ZE_MID, // fonte: Zé Luiz (meio)
      "Ratinho",
      "Piranha",
      "Roberto",
      "Canhoteiro",
    ],
    [{ out: ZE_MID, in: "Erik" }],
  ),
  goals: [{ name: "Piranha" }],
});

add({
  date: "1970-08-22",
  phase: "2º turno",
  opponent: "Guarany-AL",
  ha: "home",
  gf: 0,
  ga: 2,
  stadium: MUTANGE,
  referee: "Edvan Tenório",
});

add({
  date: "1970-08-30",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: PAJU,
  referee: "Edvan Tenório",
  manager: MAGLIONE,
  ...lineup(
    [
      ZE_GK,
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Erik",
      ZE_MID,
      "Ratinho",
      "Valfrido",
      "Piranha",
      "Canhoteiro",
    ],
    [
      { out: "Paranhos", in: "Tadeu" },
      { out: "Valfrido", in: "Roberto" },
    ],
  ),
  goals: [{ name: "Piranha" }, { name: "Roberto" }],
});

// ——— Decisão do 2º turno ———
add({
  date: "1970-09-06",
  phase: "Decisão do 2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: PAJU,
  referee: "Sebastião Canuto",
  manager: MAGLIONE,
  ...lineup(
    [
      ZE_GK, // fonte: Zé Luiz II
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      ZE_MID, // fonte: Zé Luiz I
      "Ratinho",
      "Valfrido",
      "Piranha",
      "Canhoteiro",
    ],
    [
      { out: ZE_MID, in: "Erik" },
      { out: "Valfrido", in: "Roberto" },
    ],
  ),
});

// ——— 3º turno ———
add({
  date: "1970-09-13",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: PAJU,
  referee: "Rubens Cerqueira",
  manager: MAGLIONE,
  ...lineup(
    [
      ZE_GK, // fonte: Zé Luiz II
      "Ciro",
      "Dida",
      "Givaldo",
      "Barbosa",
      ZE_MID, // fonte: Zé Luiz I
      "Erik",
      "Ratinho",
      "Roberto",
      "Lelé",
      "Canhoteiro",
    ],
    [
      { out: "Erik", in: "Tadeu" },
      { out: "Lelé", in: "Piranha" },
    ],
  ),
  goals: [{ name: "Roberto" }],
});

add({
  date: "1970-09-17",
  phase: "3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 0,
  ga: 1,
  stadium: PAJU,
  referee: "Dirceu Arruda",
  manager: MAGLIONE,
  ...lineup(
    [
      ZE_GK, // fonte: Zé Luiz II
      "Catatau",
      "Dida",
      "Tadeu",
      "Barbosa",
      "Erik",
      ZE_MID, // fonte: Zé Luiz I
      "Ratinho",
      "Roberto",
      "Lelé",
      "Canhoteiro",
    ],
    [
      { out: "Tadeu", in: "Givaldo" },
      { out: "Lelé", in: "Piranha" },
    ],
  ),
});

add({
  date: "1970-09-20",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: PAJU,
  referee: "Edvan Tenório",
  manager: MAGLIONE,
  ...lineup(
    [
      "Zé Galego",
      "Catatau",
      "Dida",
      "Givaldo",
      "Barbosa",
      ZE_MID, // fonte: Zé Luiz I
      "Tadeu",
      "Ratinho",
      "Valfrido",
      "Lelé",
      "Canhoteiro",
    ],
    [
      { out: "Tadeu", in: "Erik" },
      { out: "Valfrido", in: "Roberto" },
    ],
  ),
  note: "Fonte lista Dida (Tadeu) e meio Zé Luiz I e Tadeu (Erik); mantido Tadeu titular no meio com Erik entrando (evita Tadeu em duas posições)",
});

add({
  date: "1970-09-27",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 0,
  ga: 1,
  stadium: PAJU,
  referee: "Sebastião Canuto",
  attendance: 2738,
  manager: MAGLIONE,
  ...lineup(
    [
      "Zé Galego",
      "Catatau",
      "Givaldo",
      "Tadeu",
      "Erivaldo",
      ZE_MID, // fonte: Zé Luiz
      "Erik",
      "Ratinho",
      "Lelé",
      "Valfrido",
      "Canhoteiro",
    ],
    [
      { out: "Erik", in: "Caroço" },
      { out: "Valfrido", in: "Roberto" },
    ],
  ),
});

add({
  date: "1970-09-30",
  phase: "3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: PAJU,
  referee: "Luiz Digerson",
});

add({
  date: "1970-10-04",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 1,
  stadium: PAJU,
  referee: "Sebastião Canuto",
  manager: MAGLIONE,
  ...lineup(
    [
      "Zé Galego",
      "Catatau",
      "Paranhos",
      "Givaldo",
      "Barbosa",
      "Ratinho",
      ZE_MID, // fonte: Zé Luiz
      "Caroço",
      "Piranha",
      "Roberto",
      "Canhoteiro",
    ],
    [{ out: "Givaldo", in: "Erivaldo" }],
  ),
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

const header = `/** Campeonato Alagoano 1970 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * Contagem oficial: J${counted.length} V${w} E${d} D${l} GP${gp} GC${gc}.
 * Zé Luiz (goleiro) = cadastro da era 1970/72 (#1783), ≠ década de 80.
 * Zé Luiz II = volante/meia (fonte às vezes Zé Luiz / Zé Luiz I no meio).
 * Erik/Eric unificados como Erik na planilha; import mapeia para Eric #813.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1970;

/**
 * @typedef {{
 *   date: string;
 *   phase: string;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number;
 *   ga: number;
 *   stadium: string;
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

const out = resolve(__dirname, "data/season-1970-alagoano.mjs");
writeFileSync(out, header, "utf8");
console.log("wrote", out);
