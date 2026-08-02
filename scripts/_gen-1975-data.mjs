/**
 * Generates scripts/data/season-1975-alagoano.mjs
 * Run: node scripts/_gen-1975-data.mjs
 *
 * CSA tricampeão de turnos 1975; técnico Laerte Dória.
 * Jogo 25/05/1975 (Guarany) anulado — excludeFromStats; remarcação 04/06.
 * Contagem oficial (exclui anulado): J24 V21 E2 D1 GP66 GC7.
 * Soma de todos os placares listados: J25 (inclui anulado).
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const MOREIRA = "Manoel Moreira";
const LEAHY = "Estádio Alfredo Leahy";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const ARGEMIRO = "Estádio Argemiro Cavalcante";
const EDSON = "Estádio Édson Amaro";
const MGR = "Laerte Dória";

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

/** @type {any[]} */
const GAMES = [];

function add(g) {
  GAMES.push({ manager: MGR, ...g });
}

// ——— 1ª fase do 1º turno ———
add({
  date: "1975-04-06",
  phase: "1ª fase do 1º turno",
  opponent: "Dínamo-AL",
  ha: "away",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Túlio Jatobá",
  attendance: 1589,
  revenue: 11366,
  revenueText: revText(11366),
  goals: [
    { name: "Ênio Oliveira" },
    { name: "Misso" },
    { name: "Hélio" },
    { name: "Ademir" },
  ],
});

add({
  date: "1975-04-13",
  phase: "1ª fase do 1º turno",
  opponent: "Canavieiro-AL",
  ha: "away",
  gf: 0,
  ga: 2,
  stadium: MOREIRA,
  referee: "Petrúcio Bezerra",
  note:
    "Única derrota do CSA; gols Misso e Bira (Canavieiro); expulsões Valdeci (CSA) e Geo (Canavieiro)",
});

add({
  date: "1975-04-20",
  phase: "1ª fase do 1º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Rubens Cerqueira",
});

add({
  date: "1975-04-27",
  phase: "1ª fase do 1º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: LEAHY,
  referee: "Pedro Rufino",
  goals: [{ name: "Hélio" }, { name: "Ademir" }, { name: "Misso" }],
});

add({
  date: "1975-05-01",
  phase: "1ª fase do 1º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Rufino",
  goals: [{ name: "Jorge Siri", minute: 59 }],
});

// ——— Quadrangular do 1º turno ———
add({
  date: "1975-05-04",
  phase: "Quadrangular do 1º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Carlos Costa",
  attendance: 12149,
  revenue: 122555,
  revenueText: revText(122555),
  ...lineup(
    [
      "Rafael",
      "Espinoza",
      "Valmir",
      "Zé Preta",
      "Valdeci",
      "Maurício",
      "Soareste",
      "Muçurica",
      "Ênio Oliveira",
      "Hélio",
      "Ademir",
    ],
    [{ out: "Ênio Oliveira", in: "Jorge Nunes" }],
  ),
  goals: [{ name: "Hélio" }, { name: "Espinoza" }],
  note: "Gol Ari (CRB); expulsão Soareste",
});

add({
  date: "1975-05-07",
  phase: "Quadrangular do 1º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Rufino",
  attendance: 5500,
  revenue: 40941,
  revenueText: revText(40941),
  goals: [{ name: "Ferretti" }, { name: "Ênio Oliveira" }],
  note: "Expulsão Vergetti (Ferroviário); Ferretti estreante",
});

add({
  date: "1975-05-11",
  phase: "Quadrangular do 1º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Túlio Jatobá",
  attendance: 3619,
  revenue: 25663,
  revenueText: revText(25663),
  ...lineup(
    [
      "Rafael",
      "Espinoza",
      "Valmir",
      "Zé Preta",
      "Valdeci",
      "Maurício",
      "Paulo Sérgio",
      "Ferretti",
      "Ênio Oliveira",
      "Hélio",
      "Sérgio",
    ],
    [
      { out: "Valdeci", in: "Tadeu" },
      { out: "Maurício", in: "Soareste" },
    ],
  ),
  goals: [
    { name: "Ferretti", minute: 7 },
    { name: "Hélio", minute: 71 },
    { name: "Ênio Oliveira", minute: 75 },
  ],
});

// ——— 1ª fase do 2º turno ———
add({
  date: "1975-05-21",
  phase: "1ª fase do 2º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 12,
  ga: 0,
  stadium: REI,
  referee: "Túlio Jatobá",
  attendance: 1558,
  revenue: 11695,
  revenueText: revText(11695),
  ...lineup(
    [
      "Rafael",
      "Espinoza",
      "Valmir",
      "Zé Preta",
      "Tadeu",
      "Maurício",
      "Soareste",
      "Ênio Oliveira",
      "Jorge Nunes",
      "Hélio",
      "Sérgio",
    ],
    [
      { out: "Espinoza", in: "Mendes" },
      { out: "Tadeu", in: "Valdeci" },
    ],
  ),
  goals: [
    { name: "Hélio" },
    { name: "Hélio" },
    { name: "Hélio" },
    { name: "Soareste" },
    { name: "Soareste" },
    { name: "Ênio Oliveira" },
    { name: "Ênio Oliveira" },
    { name: "Jorge Nunes" },
    { name: "Jorge Nunes" },
    { name: "Tadeu" },
    { name: "Maurício" },
    { name: "Sérgio" },
  ],
  note: "Maior goleada do Trapichão até então",
});

add({
  date: "1975-05-25",
  phase: "2º turno (jogo anulado)",
  opponent: "Guarany-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  revenue: 17133,
  revenueText: revText(17133),
  goals: [{ name: "Hélio" }, { name: "Maurício" }],
  excludeFromStats: true,
  note:
    "Partida interrompida por falta de energia; remarcada em 04/06/1975",
});

add({
  date: "1975-05-29",
  phase: "1ª fase do 2º turno",
  opponent: "Santa Cruz-AL",
  ha: "away",
  gf: 4,
  ga: 1,
  stadium: ARGEMIRO,
});

add({
  date: "1975-06-01",
  phase: "1ª fase do 2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 6,
  ga: 1,
  stadium: REI,
  referee: "Rubens Cerqueira",
  attendance: 3988,
  revenue: 30015,
  revenueText: revText(30015),
  goals: [
    { name: "Ferretti" },
    { name: "Ferretti" },
    { name: "Ferretti" },
    { name: "Ferretti" },
    { name: "Hélio" },
    { name: "Hélio" },
  ],
  note: "Gol Alberto pênalti (Ferroviário); expulsão Ênio (Ferroviário)",
});

add({
  date: "1975-06-04",
  phase: "1ª fase do 2º turno",
  opponent: "Guarany-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 2191,
  revenue: 16804,
  revenueText: revText(16804),
  goals: [{ name: "Hélio" }, { name: "Jorge Nunes" }],
  note: "Remarcação do jogo anulado em 25/05/1975",
});

add({
  date: "1975-06-08",
  phase: "1ª fase do 2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 20387,
  revenue: 218905,
  revenueText: revText(218905),
  ...lineup(
    [
      "Rafael",
      "Tadeu",
      "Geraldo",
      "Zé Preta",
      "Valdeci",
      "Roberto Menezes",
      "Soareste",
      "Sérgio Galocha",
      "Ênio Oliveira",
      "Ferretti",
      "Hélio",
    ],
    [{ out: "Sérgio Galocha", in: "Jorge Nunes" }],
  ),
  goals: [{ name: "Ferretti" }],
  note: "Expulsão Ademir (CRB)",
});

// ——— Quadrangular do 2º turno ———
add({
  date: "1975-06-11",
  phase: "Quadrangular do 2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Rubens Cerqueira",
  goals: [{ name: "Torino" }, { name: "Ferretti" }],
  note: "Expulsão Ferretti; jogo preliminar",
});

add({
  date: "1975-06-15",
  phase: "Quadrangular do 2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Túlio Jatobá",
  attendance: 6031,
  revenue: 45961,
  revenueText: revText(45961),
  goals: [{ name: "Torino" }],
  note: "Gol Alcides (Penedense)",
});

add({
  date: "1975-06-18",
  phase: "Quadrangular do 2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "José de Assis Aragão",
  attendance: 8343,
  revenue: 92660,
  revenueText: revText(92660),
});

// ——— 1ª fase do 3º turno ———
add({
  date: "1975-06-29",
  phase: "1ª fase do 3º turno",
  opponent: "Guarany-AL",
  ha: "away",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Túlio Jatobá",
  attendance: 1970,
  revenue: 15120,
  revenueText: revText(15120),
  goals: [
    { name: "Ênio Oliveira" },
    { name: "Ênio Oliveira" },
    { name: "Hélio" },
    { name: "Jorge Siri" },
  ],
});

add({
  date: "1975-07-06",
  phase: "1ª fase do 3º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: FUMEI,
  referee: "Edvaldo Bonfim",
  ...lineup(
    [
      "Rafael",
      "Natal",
      "Geraldo",
      "Zé Preta",
      "Valdeci",
      "Roberto Menezes",
      "Soareste",
      "Jorge Nunes",
      "Ferretti",
      "Hélio",
      "Ênio Oliveira",
    ],
    [
      { out: "Jorge Nunes", in: "Misso" },
      { out: "Ênio Oliveira", in: "Jorge Siri" },
    ],
  ),
  goals: [{ name: "Ênio Oliveira", minute: 58 }],
  note: "Técnico do ASA irritado com a arbitragem",
});

add({
  date: "1975-07-13",
  phase: "1ª fase do 3º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 3819,
  revenue: 28537,
  revenueText: revText(28537),
  goals: [{ name: "Misso" }, { name: "Ferretti", penalty: true }],
  note: "Expulsão Luiz Bodão (Penedense)",
});

add({
  date: "1975-07-20",
  phase: "1ª fase do 3º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 4,
  ga: 0,
  stadium: EDSON,
  referee: "Antônio Morais",
  goals: [
    { name: "Torino" },
    { name: "Zé Preta" },
    { name: "Hélio" },
    { name: "Ênio Oliveira" },
  ],
  note: "Expulsão Marcos Costa (CSE)",
});

add({
  date: "1975-07-27",
  phase: "1ª fase do 3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 15201,
  revenue: 138625,
  revenueText: revText(138625),
  ...lineup(
    [
      "Rafael",
      "Natal",
      "Geraldo",
      "Zé Preta",
      "Rogério",
      "Roberto Menezes",
      "Soareste",
      "Ênio Oliveira",
      "Hélio",
      "Ferretti",
      "Torino",
    ],
    [
      { out: "Soareste", in: "Sérgio Galocha" },
      { out: "Ênio Oliveira", in: "Misso" },
    ],
  ),
  goals: [{ name: "Major", minute: 70 }],
});

// ——— Quadrangular do 3º turno ———
add({
  date: "1975-07-30",
  phase: "Quadrangular do 3º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Pedro Rufino",
  attendance: 3814,
  revenue: 28936,
  revenueText: revText(28936),
  goals: [{ name: "Ferretti" }, { name: "Natal" }, { name: "Ênio Oliveira" }],
});

add({
  date: "1975-08-03",
  phase: "Quadrangular do 3º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  goals: [{ name: "Valdeci" }, { name: "Torino" }, { name: "Ênio Oliveira" }],
  note: "Gol Ventilador (Ferroviário); jogo preliminar",
});

add({
  date: "1975-08-06",
  phase: "Quadrangular do 3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 13604,
  revenue: 147578,
  revenueText: revText(147578),
  ...lineup(
    [
      "Rafael",
      "Natal",
      "Geraldo",
      "Zé Preta",
      "Rogério",
      "Roberto Menezes",
      "Soareste",
      "Torino",
      "Ênio Oliveira",
      "Ferretti",
      "Sérgio",
    ],
    [{ out: "Ênio Oliveira", in: "Jorge Siri" }],
  ),
  goals: [{ name: "Ferretti", minute: 51 }],
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
const tOfficial = tally(GAMES.filter((x) => !x.excludeFromStats));

console.log("GAMES.length:", GAMES.length);
console.log("tally (todos os placares):", tAll);
console.log("excluding excludeFromStats:", tOfficial);

const expectedOfficial = { n: 24, v: 21, e: 2, d: 1, gf: 66, ga: 7 };
for (const k of Object.keys(expectedOfficial)) {
  if (tOfficial[k] !== expectedOfficial[k])
    console.error(
      `MISMATCH official ${k}: got ${tOfficial[k]} expected ${expectedOfficial[k]}`,
    );
}

const header = `/** Campeonato Alagoano 1975 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA tricampeão de turnos 1975; técnico Laerte Dória.
 * Jogo de 25/05/1975 (Guarany) anulado — excludeFromStats; remarcação em 04/06.
 * Contagem oficial (exclui anulado): J24 V21 E2 D1 GP66 GC7.
 * Lista completa: J25 (inclui jogo anulado nos placares brutos).
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 53' do 2ºT = 98.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1975;

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

const out = resolve(__dirname, "data", "season-1975-alagoano.mjs");
writeFileSync(out, header + JSON.stringify(GAMES, null, 2) + ";\n", "utf8");
console.log("wrote", out);
