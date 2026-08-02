/**
 * Generates scripts/data/season-1972-alagoano.mjs
 * Run: node scripts/_gen-1972-data.mjs
 *
 * Campeonato Alagoano 1972 — CSA.
 * Jogo 04/06 vs São Domingos anulado (falta de energia); remarcado 07/06.
 * Contagem oficial (exclui anulado): J31 V16 E9 D6 GP57 GC34.
 * Datas de jan–fev/1973 entram na season 1972.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const EDSON = "Estádio Édson Amaro";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const PEDRINHO = "Pedrinho Rodrigues";

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
  date: "1972-02-27",
  phase: "1º turno",
  opponent: "Dínamo-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Rubens Cerqueira",
  goals: [{ name: "Fernando Carlos" }, { name: "Ricardo" }],
});

add({
  date: "1972-03-12",
  phase: "1º turno",
  opponent: "Guarany-AL",
  ha: "home",
  gf: 4,
  ga: 1,
  stadium: REI,
  referee: "Luís Digerson",
  attendance: 703,
  goals: [
    { name: "Cardosinho" },
    { name: "Valter" },
    { name: "Manoelzinho II" },
    { name: "Soareste" },
  ],
});

add({
  date: "1972-03-26",
  phase: "1º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: FUMEI,
  referee: "José Queiroz",
  manager: PEDRINHO,
  ...lineup(
    [
      "Zé Luiz",
      "Erivaldo",
      "Paranhos",
      "Bibiu",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Valter",
      "Manoelzinho II",
      "Arnaldo",
      "Adeíldo",
    ],
    [
      { out: "Arnaldo", in: "Fernando Carlos" },
      { out: "Adeíldo", in: "Manoelzinho I" },
    ],
  ),
  goals: [{ name: "Manoelzinho I", penalty: true }],
});

add({
  date: "1972-04-02",
  phase: "1º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Claudionor Tenório",
  goals: [{ name: "Fernando Carlos" }],
});

add({
  date: "1972-04-16",
  phase: "1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "José Queiroz",
  attendance: 3644,
  goals: [{ name: "Freitas" }, { name: "Soareste" }],
});

add({
  date: "1972-04-23",
  phase: "1º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 1,
  ga: 3,
  stadium: REI,
  referee: "José Queiroz",
  goals: [{ name: "Dudu" }],
});

add({
  date: "1972-05-07",
  phase: "1º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Carlos Costa (RJ)",
  attendance: 24166,
  manager: PEDRINHO,
  ...lineup(
    [
      "Zé Luiz",
      "Teco",
      "Bibiu",
      "Paranhos",
      "Jaminho",
      "Valter",
      "Mário",
      "Manoelzinho",
      "Fernando Carlos",
      "Freitas",
      "Adeíldo",
    ],
    [
      { out: "Mário", in: "Arnaldo" },
      { out: "Adeíldo", in: "Cardosinho" },
    ],
  ),
  goals: [
    {
      name: "Ronaldo Brito",
      ownGoal: true,
      ownGoalDirection: "for",
    },
  ],
});

// ——— 2º turno ———
add({
  date: "1972-05-14",
  phase: "2º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: EDSON,
  referee: "Sebastião Canuto",
  goals: [{ name: "Arnaldo" }],
});

add({
  date: "1972-05-21",
  phase: "2º turno",
  opponent: "Dínamo-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Dirceu Arruda",
  attendance: 2037,
  goals: [{ name: "Freitas" }, { name: "Jurinha" }],
});

add({
  date: "1972-05-28",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 6,
  ga: 2,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 2095,
  manager: PEDRINHO,
  ...lineup(
    [
      "Zé Luiz",
      "Teco",
      "Bibiu",
      "Orlando",
      "Jaminho",
      "Valter",
      "Mário",
      "Manoelzinho",
      "Giraldo",
      "Jurinha",
      "Freitas",
    ],
    [
      { out: "Jaminho", in: "Erivaldo" },
      { out: "Mário", in: "Arnaldo" },
    ],
  ),
  goals: [
    { name: "Giraldo" },
    { name: "Giraldo" },
    { name: "Jurinha" },
    { name: "Jurinha" },
    { name: "Freitas" },
    { name: "Freitas" },
  ],
});

add({
  date: "1972-06-04",
  phase: "2º turno (jogo anulado)",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "José Queiroz",
  goals: [{ name: "Jurinha" }, { name: "Jurinha" }],
  excludeFromStats: true,
  note: "Partida interrompida aos 27' do 2ºT por falta de energia; posteriormente anulada. Remarcada em 07/06/1972",
});

add({
  date: "1972-06-07",
  phase: "2º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "José Queiroz Irmão",
  goals: [{ name: "Manoelzinho" }, { name: "Freitas" }],
  note: "Remarcação do jogo anulado em 04/06/1972",
});

add({
  date: "1972-06-18",
  phase: "2º turno",
  opponent: "Guarany-AL",
  ha: "home",
  gf: 2,
  ga: 2,
  stadium: REI,
  referee: "Rubens Cerqueira",
  goals: [{ name: "Jurinha" }, { name: "Jurinha" }],
});

add({
  date: "1972-06-21",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "José Queiroz",
});

add({
  date: "1972-07-01",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Carlos Costa (RJ)",
  goals: [{ name: "Freitas" }],
});

// ——— 3º turno ———
add({
  date: "1972-07-08",
  phase: "3º turno",
  opponent: "Guarany-AL",
  ha: "away",
  gf: 5,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  goals: [
    { name: "Jurinha" },
    { name: "Jurinha" },
    { name: "Mário" },
    { name: "Freitas" },
    { name: "Dudu" },
  ],
});

add({
  date: "1972-07-19",
  phase: "3º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "José Queiroz",
  goals: [{ name: "Dudu" }, { name: "Paranhos" }],
});

add({
  date: "1972-07-23",
  phase: "3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Claudionor Tenório",
  attendance: 3602,
  goals: [{ name: "Giraldo" }],
});

add({
  date: "1972-08-09",
  phase: "3º turno",
  opponent: "Dínamo-AL",
  ha: "home",
  gf: 7,
  ga: 1,
  stadium: REI,
  referee: "Murilo Maciel",
  goals: [
    { name: "Giraldo" },
    { name: "Giraldo" },
    { name: "Giraldo" },
    { name: "Jurinha" },
    { name: "Jurinha" },
    { name: "Jurinha" },
    { name: "Jurinha" },
  ],
});

add({
  date: "1972-08-13",
  phase: "3º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "José Queiroz",
});

add({
  date: "1972-08-23",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  ...lineup(
    [
      "Zé Luiz",
      "Teco",
      "Bibiu",
      "Paranhos",
      "Jaminho",
      "Valter",
      "Mário",
      "Manoelzinho",
      "Giraldo",
      "Freitas",
      "Adeíldo",
    ],
    [
      { out: "Valter", in: "Arnaldo" },
      { out: "Giraldo", in: "Dudu" },
    ],
  ),
  goals: [
    { name: "Manoelzinho" },
    { name: "Manoelzinho" },
    { name: "Freitas" },
    { name: "Mário" },
  ],
});

add({
  date: "1972-08-27",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 2,
  stadium: REI,
  referee: "Nivaldo da Costa (RJ)",
  goals: [{ name: "Dudu" }],
});

// ——— 4º turno (jan–fev/1973, season 1972) ———
add({
  date: "1973-01-21",
  phase: "4º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 2,
  stadium: REI,
  referee: "Sebastião Canuto",
  goals: [{ name: "Giraldo" }, { name: "Giraldo" }],
});

add({
  date: "1973-01-24",
  phase: "4º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Rubens Cerqueira",
  goals: [{ name: "Soareste" }],
});

add({
  date: "1973-01-28",
  phase: "4º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 3,
  stadium: REI,
  referee: "Rubens Cerqueira",
  goals: [{ name: "Fernando Carlos" }],
});

add({
  date: "1973-01-31",
  phase: "4º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 1,
  ga: 4,
  stadium: REI,
  referee: "Dirceu Arruda",
  goals: [{ name: "Adeíldo" }],
});

add({
  date: "1973-02-04",
  phase: "4º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Paulo Soares",
  goals: [{ name: "Batoré" }],
});

add({
  date: "1973-02-07",
  phase: "4º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 3,
  ga: 3,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 2396,
  goals: [
    { name: "Giraldo" },
    { name: "Giraldo" },
    { name: "Fernando Carlos" },
  ],
});

// ——— Supercampeonato ———
add({
  date: "1973-02-11",
  phase: "Supercampeonato",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
});

add({
  date: "1973-02-18",
  phase: "Supercampeonato",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 3,
  stadium: REI,
  referee: "Luiz Carlos Félix (RJ)",
  ...lineup(
    [
      "Zé Galego",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Fernando Carlos",
      "Giraldo",
      "Adeíldo",
    ],
    [
      { out: "Dudu", in: "Batoré" },
      { out: "Adeíldo", in: "Beto" },
    ],
  ),
});

add({
  date: "1973-02-21",
  phase: "Supercampeonato",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  goals: [{ name: "Beto" }, { name: "Otávio" }],
});

add({
  date: "1973-02-25",
  phase: "Supercampeonato",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 1,
  stadium: REI,
  referee: "José Marçal Filho (RJ)",
  manager: "Jorge Vasconcelos",
  ...lineup(
    [
      "Zé Galego",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Soareste",
      "Batoré",
      "Giraldo",
      "Jurinha",
      "Fernando Carlos",
      "Jairo",
    ],
    [
      { out: "Jurinha", in: "Dudu" },
      { out: "Jairo", in: "Otávio" },
    ],
  ),
  note: "Jorge Vasconcelos desligou-se do time depois da partida",
});

// Validate counts
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

const header = `/** Campeonato Alagoano 1972 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * Jogo de 04/06/1972 (São Domingos) anulado — excludeFromStats; remarcação em 07/06.
 * Contagem oficial (exclui anulado): J${counted.length} V${w} E${d} D${l} GP${gp} GC${gc}.
 * Datas de jan–fev/1973 entram na season 1972.
 * Zé Luiz goleiro ≠ goleiro Zé Luiz da década de 1980.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1972;

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

const out = resolve(__dirname, "data/season-1972-alagoano.mjs");
writeFileSync(out, header, "utf8");
console.log("wrote", out);
