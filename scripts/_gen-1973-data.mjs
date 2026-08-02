/**
 * Generates scripts/data/season-1973-alagoano.mjs
 * Run: node scripts/_gen-1973-data.mjs
 *
 * CSA vice-campeão 1973; técnico Maglione Sales; CRB campeão geral.
 * Soma dos placares: J24 V13 E8 D3 GP38 GC17.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const LEAHY = "Estádio Alfredo Leahy";
const EDSON = "Estádio Édson Amaro";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const MGR = "Maglione Sales";

function lineup(starters, subs = []) {
  return {
    starters,
    entered: subs.map((s) => s.in),
    subs,
  };
}

function revText(n) {
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Cr$ ${formatted},00`;
}

function nCrText(n) {
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `NCr$ ${formatted},00`;
}

/** @type {any[]} */
const GAMES = [];

function add(g) {
  GAMES.push({ manager: MGR, ...g });
}

// ——— 1º turno ———
add({
  date: "1973-04-11",
  phase: "1º turno",
  opponent: "Guarany-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Luiz Digérson",
  attendance: 490,
  revenue: 6105,
  revenueText: nCrText(6105),
  goals: [
    { name: "Giraldo", minute: 25 },
    { name: "Giraldo", minute: 57 },
    { name: "Beto", minute: 60 },
  ],
});

add({
  date: "1973-04-15",
  phase: "1º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: LEAHY,
  referee: "Murilo Maciel",
  attendance: 1165,
  revenue: 3949,
  revenueText: nCrText(3949),
});

add({
  date: "1973-04-22",
  phase: "1º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 786,
  revenue: 7491,
  revenueText: nCrText(7491),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Soareste",
      "Batoré",
      "Otávio",
      "Dudu",
      "Giraldo",
      "Misso",
    ],
  ),
  goals: [{ name: "Soareste", minute: 19 }],
  note:
    "Gol Edmilson (Ferroviário) 31'; expulsões Jorge (Ferroviário) e Soareste (CSA)",
});

add({
  date: "1973-04-25",
  phase: "1º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Dirceu Arruda",
  attendance: 920,
  revenue: 8395,
  revenueText: nCrText(8395),
  ...lineup(
    [
      "Zé Galego",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Roberto",
      "Manoelzinho",
      "Giraldo",
      "Misso",
      "Otávio",
    ],
    [
      { out: "Misso", in: "Batoré" },
      { out: "Otávio", in: "Beto" },
    ],
  ),
  goals: [
    { name: "Misso", minute: 21 },
    { name: "Giraldo", minute: 76 },
  ],
});

add({
  date: "1973-05-06",
  phase: "1º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 0,
  ga: 2,
  stadium: EDSON,
  referee: "Rubens Cerqueira",
  revenue: 10560,
  revenueText: revText(10560),
  ...lineup(
    [
      "Zé Galego",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Batoré",
      "Otávio",
      "Misso",
      "Giraldo",
    ],
  ),
  note:
    "Gols Ailton 23' e Aldemir 55' (CSE); expulsões Misso (CSA) e Lourival (CSE)",
});

add({
  date: "1973-05-13",
  phase: "1º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "Dirceu Arruda",
  goals: [
    { name: "Manoelzinho", minute: 39 },
    { name: "Giraldo", minute: 55 },
    { name: "Giraldo", minute: 80 },
  ],
  note: "Gol Fernando Carlos 50' (São Domingos)",
});

add({
  date: "1973-05-16",
  phase: "1º turno",
  opponent: "Dínamo-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Claudionor Tenório",
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Fernando",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Misso",
      "Batoré",
      "Otávio",
    ],
    [
      { out: "Misso", in: "Beto" },
      { out: "Batoré", in: "Zé Roberto" },
    ],
  ),
  goals: [
    { name: "Otávio", minute: 51 },
    { name: "Batoré", minute: 54 },
  ],
});

add({
  date: "1973-05-20",
  phase: "1º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 9482,
  revenue: 43560,
  revenueText: revText(43560),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Batoré",
      "Otávio",
      "Giraldo",
      "Misso",
      "Luís Mário",
    ],
    [
      { out: "Otávio", in: "Manoelzinho" },
      { out: "Luís Mário", in: "Soareste" },
    ],
  ),
  goals: [{ name: "Giraldo", minute: 60 }],
  note: "Gol Orlandinho (CRB) 52'; CRB campeão do 1º turno",
});

// ——— 2º turno ———
add({
  date: "1973-05-30",
  phase: "2º turno",
  opponent: "Dínamo-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Dirceu Arruda",
  attendance: 73,
  revenue: 4321,
  revenueText: nCrText(4321),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Batoré",
      "Giraldo",
      "Otávio",
    ],
    [
      { out: "Dudu", in: "Zé Roberto" },
      { out: "Otávio", in: "Luís Mário" },
    ],
  ),
  goals: [
    { name: "Giraldo", minute: 18 },
    {
      name: "Edmilson",
      minute: 25,
      ownGoal: true,
      ownGoalDirection: "for",
    },
    { name: "Giraldo", minute: 28 },
  ],
  note:
    "Fonte lista Otávio duas vezes; omitido Batoré→Otávio (escalação: Manoelzinho, Batoré, Giraldo, Otávio no ataque)",
});

add({
  date: "1973-06-06",
  phase: "2º turno",
  opponent: "Guarany-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Severino Cavalcante",
  attendance: 152,
  revenue: 4536,
  revenueText: nCrText(4536),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Batoré",
      "Manoelzinho",
      "Giraldo",
      "Otávio",
    ],
    [
      { out: "Batoré", in: "Misso" },
      { out: "Manoelzinho", in: "Beto" },
    ],
  ),
  goals: [
    { name: "Otávio", minute: 25 },
    { name: "Misso", minute: 64 },
  ],
});

add({
  date: "1973-06-10",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: FUMEI,
  referee: "Rubens Cerqueira",
  revenue: 3565,
  revenueText: revText(3565),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Soareste",
      "Manoelzinho",
      "Otávio",
      "Zé Roberto",
      "Giraldo",
      "Misso",
    ],
    [{ out: "Soareste", in: "Beto" }],
  ),
  note: "Expulsões Paulo (ASA) e Bibiu (CSA)",
});

add({
  date: "1973-06-17",
  phase: "2º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Rubens Cerqueira",
  attendance: 5003,
  revenue: 23560,
  revenueText: nCrText(23560),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Zé Roberto",
      "Batoré",
      "Manoelzinho",
      "Giraldo",
      "Dudu",
      "Otávio",
    ],
    [
      { out: "Zé Roberto", in: "Misso" },
      { out: "Manoelzinho", in: "Beto" },
    ],
  ),
  goals: [{ name: "Misso", minute: 87 }],
  note: "Gol Ademir (São Domingos) 88'",
});

add({
  date: "1973-06-24",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  revenue: 15379,
  revenueText: revText(15379),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Otávio",
      "Batoré",
      "Geraldo",
      "Luís Mário",
    ],
    [
      { out: "Batoré", in: "Manoelzinho" },
      { out: "Geraldo", in: "Misso" },
    ],
  ),
  goals: [{ name: "Misso", minute: 91 }],
});

add({
  date: "1973-06-27",
  phase: "2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Dirceu Arruda",
  attendance: 361,
  revenue: 6092,
  revenueText: nCrText(6092),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Roberto",
      "Otávio",
      "Misso",
      "Batoré",
      "Luís Mário",
    ],
    [
      { out: "Jaminho", in: "Fernando" },
      { out: "Luís Mário", in: "Manoelzinho" },
    ],
  ),
  goals: [{ name: "Otávio", minute: 60 }],
});

add({
  date: "1973-07-04",
  phase: "2º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Luiz Digérson",
  attendance: 3454,
  revenue: 14422,
  revenueText: revText(14422),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Roberto",
      "Manoelzinho",
      "Misso",
      "Giraldo",
      "Luís Mário",
    ],
    [
      { out: "Jaminho", in: "Batoré" },
      { out: "Manoelzinho", in: "Otávio" },
    ],
  ),
  goals: [
    { name: "Giraldo", minute: 33 },
    { name: "Giraldo", minute: 36 },
    { name: "Dudu", minute: 60 },
    { name: "Luís Mário", minute: 70 },
  ],
});

add({
  date: "1973-07-08",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 3,
  stadium: REI,
  referee: "Gilberto Ferreira",
  attendance: 22045,
  revenue: 106356,
  revenueText: nCrText(106356),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Roberto",
      "Manoelzinho",
      "Misso",
      "Giraldo",
      "Luís Mário",
    ],
    [
      { out: "Zé Roberto", in: "Batoré" },
      { out: "Luís Mário", in: "Otávio" },
    ],
  ),
  note:
    "Gols Haroldo 54' e 80', Silva 72' (CRB); expulsão Jaminho; CRB campeão do 2º turno",
});

// ——— 3º turno ———
add({
  date: "1973-07-15",
  phase: "3º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 7320,
  revenue: 34305,
  revenueText: nCrText(34305),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Lourival",
      "Zé Leite",
      "Dudu",
      "Manoelzinho",
      "Batoré",
      "Giraldo",
      "Luís Mário",
    ],
    [{ out: "Giraldo", in: "Misso" }],
  ),
  goals: [
    { name: "Batoré", minute: 14 },
    { name: "Dudu", minute: 42 },
    { name: "Batoré", minute: 87 },
  ],
  note: "Gol Pires 52' (São Domingos)",
});

add({
  date: "1973-07-18",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Severino Cavalcante",
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Zé Leite",
      "Dudu",
      "Manoelzinho",
      "Giraldo",
      "Misso",
      "Luís Mário",
    ],
    [
      { out: "Zé Leite", in: "Lourival" },
      { out: "Luís Mário", in: "Otávio" },
    ],
  ),
  goals: [
    { name: "Manoelzinho", minute: 55 },
    { name: "Giraldo", minute: 66 },
  ],
  note: "Gol Tião (ASA) 84'; ASA revoltado com a arbitragem",
});

add({
  date: "1973-07-22",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Rufino",
  attendance: 13278,
  revenue: 62331,
  revenueText: nCrText(62331),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Leite",
      "Manoelzinho",
      "Giraldo",
      "Soareste",
      "Otávio",
    ],
    [
      { out: "Jaminho", in: "Lourival" },
      { out: "Otávio", in: "Misso" },
    ],
  ),
  goals: [{ name: "Soareste", minute: 78 }],
  note: "Gol Silva (CRB) 90'; fonte cita Manuel → Manoelzinho",
});

add({
  date: "1973-07-25",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 2,
  stadium: REI,
  referee: "Dirceu Arruda",
  attendance: 3165,
  revenue: 15415,
  revenueText: nCrText(15415),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Zé Leite",
      "Soareste",
      "Manoelzinho",
      "Dudu",
      "Giraldo",
      "Misso",
    ],
    [
      { out: "Giraldo", in: "Beto" },
      { out: "Misso", in: "Otávio" },
    ],
  ),
  goals: [
    { name: "Misso", minute: 15 },
    { name: "Giraldo", minute: 37 },
  ],
  note: "Gols Bió 20' e Bié 40' (ASA)",
});

add({
  date: "1973-07-29",
  phase: "3º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Lourival",
      "Zé Leite",
      "Soareste",
      "Manoelzinho",
      "Dudu",
      "Giraldo",
      "Misso",
    ],
    [{ out: "Giraldo", in: "Otávio" }],
  ),
  goals: [
    { name: "Giraldo", minute: 50 },
    { name: "Manoelzinho", minute: 65, penalty: true },
    { name: "Otávio", minute: 89 },
  ],
  note: "Expulsão Isauro (São Domingos)",
});

add({
  date: "1973-08-05",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Romualdo Arppi Filho",
  attendance: 17372,
  revenue: 105635,
  revenueText: revText(105635),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Lourival",
      "Zé Leite",
      "Soareste",
      "Manoelzinho",
      "Dudu",
      "Giraldo",
      "Otávio",
    ],
    [
      { out: "Zé Leite", in: "Batoré" },
      { out: "Otávio", in: "Misso" },
    ],
  ),
  goals: [{ name: "Manoelzinho", minute: 76, penalty: true }],
  note: "Gol Haroldo (CRB) 40'",
});

// ——— Decisão do 3º turno ———
add({
  date: "1973-08-08",
  phase: "Decisão do 3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Nivaldo dos Santos",
  revenue: 67838,
  revenueText: nCrText(67838),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Batoré",
      "Giraldo",
      "Misso",
    ],
  ),
  goals: [{ name: "Giraldo", minute: 20 }],
  note: "CSA campeão do 3º turno; expulsão Major (CRB)",
});

// ——— Decisão do campeonato ———
add({
  date: "1973-08-12",
  phase: "Decisão do campeonato",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 2,
  stadium: REI,
  referee: "José Marçal Filho",
  attendance: 17812,
  revenue: 88931,
  revenueText: nCrText(88931),
  ...lineup(
    [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Giraldo",
      "Misso",
      "Otávio",
    ],
  ),
  goals: [{ name: "Misso", minute: 82 }],
  note:
    "Gols Reinaldo (CRB) 4' 1T e 2º tempo; CRB campeão geral",
});

function tally(games) {
  let v = 0,
    e = 0,
    d = 0,
    gf = 0,
    ga = 0;
  for (const x of games) {
    gf += x.gf;
    ga += x.ga;
    const r =
      x.officialResult ??
      (x.gf > x.ga ? "win" : x.gf < x.ga ? "loss" : "draw");
    if (r === "win") v++;
    else if (r === "loss") d++;
    else e++;
  }
  return { n: games.length, v, e, d, gf, ga };
}

const tAll = tally(GAMES);

console.log("GAMES.length:", GAMES.length);
console.log("tally (todos os placares):", tAll);

const expected = { n: 24, v: 13, e: 8, d: 3, gf: 38, ga: 17 };
for (const k of Object.keys(expected)) {
  if (tAll[k] !== expected[k])
    console.error(`MISMATCH ${k}: got ${tAll[k]} expected ${expected[k]}`);
}

const header = `/** Campeonato Alagoano 1973 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA vice-campeão 1973; técnico Maglione Sales; CRB campeão geral.
 * Soma dos placares: J24 V13 E8 D3 GP38 GC17.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 46' do 2ºT = 91.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1973;

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
export const GAMES = `;

const out = resolve(__dirname, "data", "season-1973-alagoano.mjs");
writeFileSync(out, header + JSON.stringify(GAMES, null, 2) + ";\n", "utf8");
console.log("wrote", out);
