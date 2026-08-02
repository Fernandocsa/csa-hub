/**
 * Generates scripts/data/season-1985-alagoano.mjs
 * Run: node scripts/_gen-1985-data.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const LEAHY = "Estádio Alfredo Leahy";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const MOREIRA = "Manoel Moreira";
const M1 = "Fidélis";
const M2 = "Ronaldo Alves";
const M3 = "Velha";

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

// ——— 1º turno — 1ª fase ———
add({
  date: "1985-05-26",
  phase: "1º turno — 1ª fase",
  opponent: "CRB-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 7870,
  revenue: 31935000,
  revenueText: "Cr$ 31.935.000,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Zezinho",
      "Zé Carlos II",
      "Veiga",
      "Josenílton",
      "Zé Carlos",
      "Frank",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Zé Carlos II", in: "Gílson" },
      { out: "Josenílton", in: "Batista" },
    ],
  ),
  goals: [
    { name: "Veiga", minute: 41, ownGoal: true, ownGoalDirection: "against" },
    { name: "Zé Carlos", minute: 53 },
    { name: "Luizão", minute: 89 },
  ],
  note: "Expulsões Café e Zé Carlos (CSA); Pedrinho e Fanta (CRB)",
});

add({
  date: "1985-05-30",
  phase: "1º turno — 1ª fase",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Manoel Cavalcante",
  attendance: 1762,
  revenue: 7103000,
  revenueText: "Cr$ 7.103.000,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Zezinho",
      "Zé Carlos II",
      "Veiga",
      "Josenílton",
      "Zé Carlos",
      "Frank",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Zé Carlos II", in: "Gílson" },
      { out: "Josenílton", in: "Batista" },
    ],
  ),
  goals: [
    { name: "Luizão", minute: 27 },
    { name: "Gílson", minute: 28 },
    { name: "Frank", minute: 74 },
    { name: "Frank", minute: 75 },
  ],
  note: "Expulsão Sabará (São Domingos) 60'",
});

add({
  date: "1985-06-09",
  phase: "1º turno — 1ª fase",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: LEAHY,
  referee: "Josival Pedro",
  attendance: 4715,
  revenue: 5405000,
  revenueText: "Cr$ 5.405.000,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Batista",
      "Zezinho",
      "Zé Carlos II",
      "Veiga",
      "Josenílton",
      "Sidão",
      "Gílson",
      "Frank",
      "Jacozinho",
    ],
    [{ out: "Gílson", in: "Zé Carlos" }],
  ),
});

add({
  date: "1985-06-15",
  phase: "1º turno — 1ª fase",
  opponent: "ASA-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Zezinho",
      "Zé Carlos II",
      "Veiga",
      "Josenílton",
      "Zé Carlos",
      "Gílson",
      "Frank",
      "Jacozinho",
    ],
    [{ out: "Gílson", in: "Luizão" }],
  ),
  goals: [
    { name: "Josenílton", minute: 28 },
    { name: "Jacozinho", minute: 85 },
    { name: "Palmito", minute: 89, ownGoal: true, ownGoalDirection: "for" },
  ],
});

// Semifinal
add({
  date: "1985-06-20",
  phase: "Semifinal 1º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 3,
  ga: 2,
  stadium: REI,
  referee: "Manoel Cavalcante",
  attendance: 2357,
  revenue: 9538000,
  revenueText: "Cr$ 9.538.000,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Zezinho",
      "Zé Carlos II",
      "Veiga",
      "Toninho Vanusa",
      "Zé Carlos",
      "Miguelzinho",
      "Sidão",
      "Jacozinho",
    ],
    [
      { out: "Toninho Vanusa", in: "João" },
      { out: "Miguelzinho", in: "Gílson" },
    ],
  ),
  goals: [
    { name: "Sidão", minute: 0 },
    { name: "Gílson", minute: 91 },
    { name: "Zé Carlos", minute: 92 },
  ],
  note: "TN: Sidão (CSA) e Careca (Capelense); prorrogação: Santos (Capelense), Gílson e Zé Carlos (CSA). Sem vantagem; ET 30 min.",
});

// Decisão 1º
add({
  date: "1985-06-27",
  phase: "Decisão 1º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Marcelo Ronaldson",
  attendance: 14671,
  revenue: 62841000,
  revenueText: "Cr$ 62.841.000,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Josival",
      "Zezinho",
      "Veiga",
      "Zé Carlos",
      "Josenílton",
      "Miguelzinho",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Miguelzinho", in: "Frank" },
      { out: "Luizão", in: "Doia" },
    ],
  ),
  goals: [
    { name: "Veiga", minute: 40 },
    { name: "Luizão", minute: 56 },
  ],
  note: "Gol CRB: Jorginho 64'; expulsões Zezinho (CSA); Pedrinho e Rogério (CRB). CSA campeão do 1º turno.",
});

// ——— 2º turno ———
add({
  date: "1985-08-11",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: FUMEI,
  referee: "João Monteiro",
  attendance: 2680,
  revenue: 11651000,
  revenueText: "Cr$ 11.651.000,00",
  manager: M2,
  ...lineup([
    "Zé Luiz",
    "Carlos Alberto",
    "Café",
    "Vininho",
    "Zezinho",
    "Veiga",
    "Zé Carlos",
    "Josenílton",
    "Gílson",
    "Frank",
    "Toninho Vanusa",
  ]),
  goals: [{ name: "Gílson", minute: 43 }],
  note: "Gol ASA: Berinho 41'; expulsões Palmito (ASA) e Veiga (CSA)",
});

add({
  date: "1985-08-18",
  phase: "2º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Juarez Inácio",
  attendance: 1878,
  revenue: 8659000,
  revenueText: "Cr$ 8.659.000,00",
  manager: M2,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Vininho",
      "Zezinho",
      "João Neto",
      "Zé Carlos",
      "Sidão",
      "Frank",
      "Doia",
      "Gílson",
    ],
    [{ out: "Frank", in: "Bel" }],
  ),
});

add({
  date: "1985-08-21",
  phase: "2º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Marcelo Costa",
  attendance: 1416,
  revenue: 6553000,
  revenueText: "Cr$ 6.553.000,00",
  manager: M2,
  goals: [
    { name: "Josenílton", minute: 45 },
    { name: "Zé Carlos", minute: 47 },
    { name: "Josenílton", minute: 79 },
  ],
  note: "Escalação não informada",
});

add({
  date: "1985-08-25",
  phase: "2º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: FUMEI,
  referee: "Josival Pedro",
  attendance: 1588,
  revenue: 7166000,
  revenueText: "Cr$ 7.166.000,00",
  manager: M2,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Josival",
      "Zé Carlos II",
      "Veiga",
      "João Neto",
      "Josenílton",
      "Gílson",
      "Zé Carlos",
      "Bel",
    ],
    [
      { out: "João Neto", in: "Batista" },
      { out: "Bel", in: "Toninho Vanusa" },
    ],
  ),
  goals: [{ name: "Josenílton", minute: 52 }],
  note: "Juca Sampaio em reformas — jogo no Fumeirão; expulsão Carlos Alberto (CSA)",
});

add({
  date: "1985-09-01",
  phase: "2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 4,
  ga: 2,
  stadium: REI,
  referee: "Ronaldo Nunes",
  attendance: 1637,
  revenue: 6521000,
  revenueText: "Cr$ 6.521.000,00",
  manager: M2,
  ...lineup(
    [
      "Joel",
      "Zezinho",
      "Café",
      "Josival",
      "Zé Carlos II",
      "Veiga",
      "Zé Carlos",
      "Josenílton",
      "Gílson",
      "Doia",
      "Toninho Vanusa",
    ],
    [{ out: "Doia", in: "Sidão" }],
  ),
  goals: [
    { name: "Doia", minute: 8 },
    { name: "Josenílton", minute: 31 },
    { name: "Veiga", minute: 40, ownGoal: true, ownGoalDirection: "against" },
    { name: "Toninho Vanusa", minute: 62 },
    { name: "Josenílton", minute: 70 },
  ],
  note: "Gol Penedense: Dado 80' (+ Veiga gc)",
});

add({
  date: "1985-09-04",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Ednélson Dias",
  attendance: 1459,
  revenue: 5861000,
  revenueText: "Cr$ 5.861.000,00",
  manager: M2,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Josival",
      "Zezinho",
      "Veiga",
      "Zé Carlos",
      "Josenílton",
      "Gílson",
      "Doia",
      "Toninho Vanusa",
    ],
    [
      { out: "Veiga", in: "Sidão" },
      { out: "Josenílton", in: "João Neto" },
    ],
  ),
  goals: [
    { name: "Doia", minute: 23 },
    { name: "Josenílton", minute: 36 },
    { name: "Zé Carlos", minute: 59, penalty: true },
  ],
});

add({
  date: "1985-09-08",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 12646,
  revenue: 64568000,
  revenueText: "Cr$ 64.568.000,00",
  manager: M2,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Vininho",
      "Zezinho",
      "Veiga",
      "Zé Carlos",
      "Josenílton",
      "Mário Tilico",
      "Sidão",
      "Gílson",
    ],
    [
      { out: "Zé Carlos", in: "Josival" },
      { out: "Gílson", in: "Toninho Vanusa" },
    ],
  ),
  note: "Expulsão Vininho (CSA)",
});

// ——— Quadrangular 2º ———
add({
  date: "1985-09-15",
  phase: "Quadrangular 2º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "João Monteiro",
  manager: M3,
  note: "Escalação/gols detalhados não informados",
});

add({
  date: "1985-09-19",
  phase: "Quadrangular 2º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Ernani Jonas",
  attendance: 3349,
  revenue: 13979000,
  revenueText: "Cr$ 13.979.000,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Josival",
      "Zezinho",
      "Toninho Vanusa",
      "Zé Carlos",
      "Josenílton",
      "Mário Tilico",
      "Júlio César",
      "Ditinho",
    ],
    [
      { out: "Zé Carlos", in: "Gílson" },
      { out: "Mário Tilico", in: "João Neto" },
    ],
  ),
  goals: [{ name: "Mário Tilico", minute: 21 }],
});

add({
  date: "1985-09-22",
  phase: "Quadrangular 2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Carlos César Rosa Martins",
  attendance: 15942,
  revenue: 87252000,
  revenueText: "Cr$ 87.252.000,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Sidão",
      "Josenílton",
      "Mário Tilico",
      "Júlio César",
      "Ditinho",
    ],
    [
      { out: "Zé Luiz", in: "Vino" },
      { out: "Ditinho", in: "Toninho Vanusa" },
    ],
  ),
  note: "Expulsões Mário Tilico e Josenílton (CSA); Paulo César (CRB). CSA campeão do 2º turno.",
});

// ——— 3º turno ———
add({
  date: "1985-09-29",
  phase: "3º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "João Monteiro",
  attendance: 2575,
  revenue: 10715000,
  revenueText: "Cr$ 10.715.000,00",
  manager: M3,
  ...lineup(
    [
      "Vino",
      "Dorval",
      "Batista",
      "Miro",
      "Carlos Alberto",
      "Veiga",
      "Betão",
      "Toninho Vanusa",
      "Gílson",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Borges", in: "Júlio César" },
      { out: "Ditinho", in: "Carlinhos" },
    ],
  ),
  goals: [
    { name: "Betão", minute: 28 },
    { name: "Ditinho", minute: 44 },
    { name: "Borges", minute: 53 },
    { name: "Betão", minute: 89 },
  ],
});

add({
  date: "1985-10-06",
  phase: "3º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: LEAHY,
  referee: "Josival Pedro",
  attendance: 1903,
  revenue: 4109000,
  revenueText: "Cr$ 4.109.000,00",
  manager: M3,
  ...lineup(
    [
      "Vino",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Betão",
      "Josenílton",
      "Mário Tilico",
      "Júlio César",
      "Ditinho",
    ],
    [{ out: "Mário Tilico", in: "Gílson" }],
  ),
  goals: [{ name: "Mário Tilico", minute: 45 }],
  note: "Expulsão Joãozinho (Penedense)",
});

add({
  date: "1985-10-13",
  phase: "3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 6,
  ga: 0,
  stadium: REI,
  referee: "Manoel Cavalcante",
  attendance: 3186,
  revenue: 16419000,
  revenueText: "Cr$ 16.419.000,00",
  manager: M3,
  ...lineup(
    [
      "Vino",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Betão",
      "Josenílton",
      "Mário Tilico",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Betão", in: "Carlinhos" },
      { out: "Borges", in: "Júlio César" },
    ],
  ),
  goals: [
    { name: "Josenílton", minute: 16 },
    { name: "Borges", minute: 24 },
    { name: "Borges", minute: 36 },
    { name: "Borges", minute: 46 },
    { name: "Josenílton", minute: 56 },
    { name: "Peri", minute: 66, ownGoal: true, ownGoalDirection: "for" },
  ],
});

add({
  date: "1985-10-16",
  phase: "3º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 5,
  ga: 1,
  stadium: REI,
  referee: "Ernani Jonas",
  attendance: 2433,
  revenue: 10221000,
  revenueText: "Cr$ 10.221.000,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Betão",
      "Toninho Vanusa",
      "Mário Tilico",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Carlos Alberto", in: "Dorval" },
      { out: "Veiga", in: "Carlinhos" },
    ],
  ),
  goals: [
    { name: "Betão", minute: 36 },
    { name: "Borges", minute: 50 },
    { name: "Betão", minute: 70 },
    { name: "Toninho Vanusa", minute: 76 },
    { name: "Toninho Vanusa", minute: 87 },
  ],
  note: "Gol Ferroviário: Erivaldo 66'",
});

add({
  date: "1985-10-20",
  phase: "3º turno",
  opponent: "Capelense-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: MOREIRA,
  referee: "Josival Pedro",
  attendance: 2537,
  revenue: 12685000,
  revenueText: "Cr$ 12.685.000,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Betão",
      "Josenílton",
      "Mário Tilico",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Veiga", in: "Toninho Vanusa" },
      { out: "Mário Tilico", in: "Frank" },
    ],
  ),
  goals: [{ name: "Mário Tilico", minute: 33 }],
  note: "Gol Capelense: Dudu (pênalti) 47' 1T",
});

add({
  date: "1985-10-27",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 1,
  ga: 2,
  stadium: REI,
  referee: "Juarez Inácio",
  attendance: 6171,
  revenue: 32760000,
  revenueText: "Cr$ 32.760.000,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Betão",
      "Josenílton",
      "Mário Tilico",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Carlos Alberto", in: "Toninho Vanusa" },
      { out: "Borges", in: "Júlio César" },
    ],
  ),
  goals: [{ name: "Josenílton", minute: 46 }],
  note: "Única derrota do CSA em 1985. Gols ASA: Berinho (pênalti) 61', Pitico 75'; expulsão Disco (ASA)",
});

add({
  date: "1985-11-03",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Pedro Carlos Bregalda",
  attendance: 12259,
  revenue: 75441000,
  revenueText: "Cr$ 75.441.000,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Batista",
      "Miro",
      "Zezinho",
      "Toninho Vanusa",
      "Betão",
      "Josenílton",
      "Mário Tilico",
      "Júlio César",
      "Ditinho",
    ],
    [
      { out: "Toninho Vanusa", in: "Carlinhos" },
      { out: "Júlio César", in: "Frank" },
    ],
  ),
  goals: [{ name: "Betão", minute: 85 }],
  note: "Partida remarcada; gol CRB: Fanta 35'",
});

// Decisão 3º
add({
  date: "1985-11-10",
  phase: "Decisão 3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 4,
  ga: 1,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 14379,
  revenue: 80911000,
  revenueText: "Cr$ 80.911.000,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Josival",
      "Zezinho",
      "Veiga",
      "Betão",
      "Josenílton",
      "Mário Tilico",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Veiga", in: "Carlinhos" },
      { out: "Betão", in: "Frank" },
    ],
  ),
  goals: [
    { name: "Ditinho", minute: 16 },
    { name: "Borges", minute: 53 },
    { name: "Borges", minute: 77 },
    { name: "Betão", minute: 85 },
  ],
  note: "Gol ASA: Berinho 60'; expulsões Buá e goleiro Évio (ASA). CSA campeão do 3º turno.",
});

// ——— Superturno ———
add({
  date: "1985-11-17",
  phase: "Superturno final",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 4,
  ga: 2,
  stadium: REI,
  referee: "Juarez Inácio",
  attendance: 3980,
  revenue: 21296000,
  revenueText: "Cr$ 21.296.000,00",
  manager: M3,
  ...lineup(
    [
      "Vino",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Carlinhos",
      "Josenílton",
      "Mário Tilico",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Miro", in: "Josival" },
      { out: "Veiga", in: "Frank" },
    ],
  ),
  goals: [
    { name: "Carlinhos", minute: 13 },
    { name: "Carlos Alberto", minute: 68 },
    { name: "Borges", minute: 72 },
    { name: "Carlos Alberto", minute: 79 },
  ],
  note: "Gols Penedense: Badé 4' e 14'; expulsão Vanderley (Penedense)",
});

add({
  date: "1985-11-21",
  phase: "Superturno final",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 5,
  ga: 0,
  stadium: REI,
  referee: "Manoel Cavalcante",
  attendance: 2680,
  revenue: 14168000,
  revenueText: "Cr$ 14.168.000,00",
  manager: M3,
  ...lineup(
    [
      "Vino",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Betão",
      "Josenílton",
      "Mário Tilico",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Josenílton", in: "Carlinhos" },
      { out: "Ditinho", in: "Júlio César" },
    ],
  ),
  goals: [
    { name: "Mário Tilico", minute: 0 },
    { name: "Betão", minute: 0 },
    { name: "Josenílton", minute: 0 },
    { name: "Borges", minute: 45 },
    { name: "Betão", minute: 45, penalty: true },
  ],
  note: "1ºT: Mário Tilico, Betão, Josenílton; 2ºT: Borges, Betão (pênalti). Expulsões Sílvio, Maraca e Márcio (São Domingos)",
});

add({
  date: "1985-11-27",
  phase: "Superturno final",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 6163,
  revenue: 33790000,
  revenueText: "Cr$ 33.790.000,00",
  manager: M3,
  ...lineup(
    [
      "Vino",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Betão",
      "Josenílton",
      "Mário Tilico",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Mário Tilico", in: "Frank" },
      { out: "Ditinho", in: "Gílson" },
    ],
  ),
  goals: [
    { name: "Betão", minute: 29 },
    {
      name: "Jorge Reis",
      minute: 52,
      ownGoal: true,
      ownGoalDirection: "for",
    },
  ],
});

add({
  date: "1985-12-01",
  phase: "Superturno final",
  opponent: "ASA-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Ronaldo Nunes",
  attendance: 9256,
  revenue: 84730000,
  revenueText: "Cr$ 84.730.000,00",
  manager: M3,
  ...lineup(
    [
      "Vino",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Betão",
      "Josenílton",
      "Frank",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Josenílton", in: "Toninho Vanusa" },
      { out: "Frank", in: "Carlinhos" },
    ],
  ),
  note: "Jogo do título — empate assegurou o campeonato (com bônus dos 3 turnos)",
});

add({
  date: "1985-12-08",
  phase: "Superturno final",
  opponent: "CRB-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "João Monteiro",
  attendance: 3442,
  revenue: 30370000,
  revenueText: "Cr$ 30.370.000,00",
  manager: M3,
  ...lineup(
    [
      "Vino",
      "Carlos Alberto",
      "Café",
      "Miro",
      "Zezinho",
      "Veiga",
      "Betão",
      "Josenílton",
      "Mário Tilico",
      "Borges",
      "Ditinho",
    ],
    [
      { out: "Café", in: "Batista" },
      { out: "Mário Tilico", in: "Gílson" },
    ],
  ),
  goals: [
    { name: "Borges", minute: 26 },
    { name: "Borges", minute: 69 },
  ],
  note: "Expulsões Fanta e Paulo César (CRB)",
});

let v = 0,
  e = 0,
  d = 0,
  gf = 0,
  ga = 0;
for (const x of GAMES) {
  gf += x.gf;
  ga += x.ga;
  if (x.gf > x.ga) v++;
  else if (x.gf < x.ga) d++;
  else e++;
}
console.log({ n: GAMES.length, v, e, d, gf, ga });

const header = `/** Campeonato Alagoano 1985 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA campeão estadual (venceu os 3 turnos + superturno).
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; prorrogação ≈ 91+.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1985;

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
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = `;

const out = resolve(__dirname, "data", "season-1985-alagoano.mjs");
writeFileSync(out, header + JSON.stringify(GAMES, null, 2) + ";\n", "utf8");
console.log("wrote", out);
