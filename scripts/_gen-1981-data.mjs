/**
 * Generates scripts/data/season-1981-alagoano.mjs
 * Run: node scripts/_gen-1981-data.mjs
 *
 * CSA campeão 1981; técnico Walmir Louruz (canon DB: Valmir Louruz); título antecipado 22/11.
 * Soma dos placares: J36 V27 E6 D3 GP79 GC22 (fases batem).
 * Cabeçalho final da fonte (V28 E6 D2 GP72 GC20) não fecha com a soma.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const MOREIRA = "Manoel Moreira";
const LEAHY = "Estádio Alfredo Leahy";
const JUCA = "Estádio Juca Sampaio";
const NIVALDO = "Estádio José Nivaldo";
const ALOISIO = "Estádio Aloísio Vasconcelos";
const MGR = "Valmir Louruz";

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
  GAMES.push(g);
}

// ——— 1º turno ———
add({
  date: "1981-05-27",
  phase: "1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "João Vilela dos Santos",
  attendance: 4769,
  revenue: 522800,
  revenueText: revText(522800),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Vilmário",
      "Jorge Luiz",
      "Rommel",
      "Jorginho",
      "Adílton",
      "Luís Paulo",
    ],
    [
      { out: "Osmar Barão", in: "Fernando" },
      { out: "Jorge Luiz", in: "Nílson" },
    ],
  ),
  goals: [
    { name: "Luís Paulo", minute: 3 },
    { name: "Jorginho", minute: 13 },
    { name: "Rommel", minute: 59 },
  ],
});

add({
  date: "1981-05-31",
  phase: "1º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  revenue: 432860,
  revenueText: revText(432860),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Vilmário",
      "Jorge Luiz",
      "Rommel",
      "Jorginho",
      "Adílton",
      "Luís Paulo",
    ],
    [
      { out: "Zezinho", in: "Geraldo" },
      { out: "Jorge Luiz", in: "Nílson" },
    ],
  ),
  goals: [
    { name: "Luís Paulo", minute: 31 },
    { name: "Rommel", minute: 74, penalty: true },
  ],
  note: "Gol Alberto (Capelense) 68'",
});

add({
  date: "1981-06-07",
  phase: "1º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 1,
  ga: 2,
  stadium: FUMEI,
  referee: "Abelardo Lucena",
  attendance: 10859,
  revenue: 1192800,
  revenueText: revText(1192800),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Zezinho",
      "Vilmário",
      "Adílton",
      "Rommel",
      "Jorginho",
      "Paraná",
      "Luís Paulo",
    ],
    [{ out: "Paraná", in: "Jorge Luiz" }],
  ),
  goals: [{ name: "Osmar Barão", minute: 30 }],
  note: "Gols ASA: Valmir 14', Zé Carlos 81'",
});

add({
  date: "1981-06-14",
  phase: "1º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 7,
  ga: 0,
  stadium: REI,
  referee: "Juarez Inácio",
  revenue: 484400,
  revenueText: revText(484400),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Osmar Barão",
      "Dick",
      "Geraldo",
      "Ademir",
      "Adílton",
      "Rommel",
      "Jorginho",
      "Paraná",
      "Luís Paulo",
    ],
    [
      { out: "Zé Luiz", in: "Décio" },
      { out: "Dick", in: "Fernando" },
    ],
  ),
  goals: [
    { name: "Luís Paulo", minute: 7 },
    { name: "Rommel", minute: 44, penalty: true },
    { name: "Rommel", minute: 53 },
    { name: "Dick", minute: 57 },
    { name: "Rommel", minute: 76 },
    { name: "Geraldo", minute: 79 },
    { name: "Luís Paulo", minute: 82 },
  ],
});

add({
  date: "1981-06-18",
  phase: "1º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 5,
  ga: 0,
  stadium: REI,
  referee: "José Laércio Teles",
  manager: MGR,
});

add({
  date: "1981-06-21",
  phase: "1º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: LEAHY,
  referee: "Antônio Morais",
  attendance: 3026,
  revenue: 164200,
  revenueText: revText(164200),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Geraldo",
      "Osmar Barão",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Paraná",
      "Luís Paulo",
    ],
    [{ out: "Luís Paulo", in: "Nílson" }],
  ),
  goals: [{ name: "Luís Paulo", minute: 42 }],
  note: "Gol Vavá (Penedense) 10'",
});

add({
  date: "1981-06-28",
  phase: "1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "João Vilela dos Santos",
  attendance: 15916,
  revenue: 1861600,
  revenueText: revText(1861600),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Osmar Barão",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Paraná",
      "Luís Paulo",
    ],
    [
      { out: "Jorginho", in: "Jorge Luiz" },
      { out: "Luís Paulo", in: "Vilmário" },
    ],
  ),
  goals: [{ name: "Paraná", minute: 37 }],
  note:
    "Gol Israel (CRB) 85'; expulsões Américo/Almir (CRB); Osmar Barão/Fernando (CSA)",
});

// ——— Quadrangular do 1º turno ———
add({
  date: "1981-07-02",
  phase: "Quadrangular do 1º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: FUMEI,
  referee: "Sebastião Canuto",
  attendance: 8001,
  revenue: 907650,
  revenueText: revText(907650),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Café",
      "Ronaldo Alves",
      "Zezinho",
      "Vilmário",
      "Adílton",
      "Rommel",
      "Ademir",
      "Paraná",
      "Luís Paulo",
    ],
    [
      { out: "Ademir", in: "Jorginho" },
      { out: "Paraná", in: "Zé Luiz II" },
      { out: "Luís Paulo", in: "Jorge Luiz" },
    ],
  ),
  note: "Expulsão Ademir (CSA) 2ºT",
});

add({
  date: "1981-07-05",
  phase: "Quadrangular do 1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 4,
  stadium: REI,
  referee: "Luiz Carlos Félix",
  attendance: 18481,
  revenue: 2157200,
  revenueText: revText(2157200),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Fernando",
      "Ronaldo Alves",
      "Zezinho",
      "Vilmário",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Paraná",
      "Luís Paulo",
    ],
    [
      { out: "Ronaldo Alves", in: "Café" },
      { out: "Luís Paulo", in: "Zé Luiz II" },
    ],
  ),
  goals: [{ name: "Rommel", minute: 47 }],
  note: "Gols CRB: Lula 19', 25'; Edu 55'; Américo 70'",
});

add({
  date: "1981-07-12",
  phase: "Quadrangular do 1º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  revenue: 189000,
  revenueText: revText(189000),
  manager: MGR,
  ...lineup(
    [
      "Brasília",
      "Antunes",
      "Café",
      "Jerônimo",
      "Geraldo",
      "Veiga",
      "Josenílton",
      "Rommel",
      "Jacozinho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Antunes", in: "Fernando" },
      { out: "Dentinho", in: "Poty" },
    ],
  ),
  goals: [
    { name: "Nílson" },
    { name: "Nílson" },
    { name: "Jorginho" },
    { name: "Geraldo" },
  ],
});

// ——— 2º turno ———
add({
  date: "1981-07-22",
  phase: "2º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Juarez Inácio",
  attendance: 3047,
  revenue: 326500,
  revenueText: revText(326500),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Café",
      "Jerônimo",
      "Geraldo",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Dentinho",
      "Nílson",
    ],
    [{ out: "Nílson", in: "Josenílton" }],
  ),
  goals: [
    { name: "Jerônimo", minute: 32 },
    { name: "Dentinho", minute: 59 },
  ],
  note: "Gol Jorge da Sorte (Capelense) 70'",
});

add({
  date: "1981-07-26",
  phase: "2º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: JUCA,
  referee: "Daniel da Luz",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Café",
      "Jerônimo",
      "Geraldo",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Antunes", in: "Zezinho" },
      { out: "Nílson", in: "Ney" },
    ],
  ),
  goals: [{ name: "Ney", minute: 85 }],
  note: "Tumulto pós-gol; paralisação ~15 min",
});

add({
  date: "1981-08-02",
  phase: "2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 9095,
  revenue: 999150,
  revenueText: revText(999150),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Flávio",
      "Luís Felipe",
      "Jerônimo",
      "Zezinho",
      "Veiga",
      "Ney",
      "Rommel",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Ney", in: "Jorginho" },
      { out: "Jacozinho", in: "Dentinho" },
    ],
  ),
  goals: [
    { name: "Flávio", minute: 42 },
    { name: "Rommel", minute: 85, penalty: true },
  ],
  note: "Gol Furiba (Penedense) 67'",
});

add({
  date: "1981-08-05",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 5,
  ga: 0,
  stadium: REI,
  referee: "Aloísio dos Santos",
  attendance: 4339,
  revenue: 460000,
  revenueText: revText(460000),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Flávio",
      "Luís Felipe",
      "Jerônimo",
      "Zezinho",
      "Veiga",
      "Ney",
      "Rommel",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Flávio", in: "Félix" },
      { out: "Ney", in: "Dentinho" },
    ],
  ),
  goals: [
    { name: "Rommel", minute: 27, penalty: true },
    { name: "Jacozinho", minute: 41 },
    { name: "Rommel", minute: 47 },
    { name: "Freitas", minute: 61 },
    { name: "Freitas", minute: 86 },
  ],
  note: "Expulsão Romário (Ferroviário)",
});

add({
  date: "1981-08-09",
  phase: "2º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 3,
  ga: 1,
  stadium: ALOISIO,
  referee: "Pelópidas Argolo",
  revenue: 156000,
  revenueText: revText(156000),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Flávio",
      "Luís Felipe",
      "Jerônimo",
      "Zezinho",
      "Veiga",
      "Paraná",
      "Jorginho",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Paraná", in: "Dentinho" },
      { out: "Jacozinho", in: "Félix" },
    ],
  ),
  goals: [
    {
      name: "Machado",
      minute: 50,
      ownGoal: true,
      ownGoalDirection: "for",
    },
    { name: "Freitas", minute: 67 },
    { name: "Freitas", minute: 90 },
  ],
  note: "Gol Silva (São Domingos) 16'",
});

add({
  date: "1981-08-16",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Jair Pereira",
  attendance: 12584,
  revenue: 1411200,
  revenueText: revText(1411200),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Flávio",
      "Luís Felipe",
      "Jerônimo",
      "Zezinho",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Zezinho", in: "Félix" },
      { out: "Jacozinho", in: "Ademir" },
    ],
  ),
  goals: [
    { name: "Jorginho", minute: 43 },
    { name: "Rommel", minute: 51, penalty: true },
  ],
  note: "Expulsões Raimundo e Dema (ASA)",
});

add({
  date: "1981-08-23",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "Bráulio Zanotto",
  attendance: 25417,
  revenue: 3191250,
  revenueText: revText(3191250),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Félix",
      "Luís Felipe",
      "Jerônimo",
      "Geraldo",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Geraldo", in: "Antunes" },
      { out: "Freitas", in: "Dentinho" },
    ],
  ),
  goals: [
    { name: "Mug", minute: 38 },
    { name: "Freitas", minute: 75 },
    {
      name: "Paulinho",
      minute: 81,
      ownGoal: true,
      ownGoalDirection: "for",
    },
  ],
  note: "Gol Sabará (CRB) 85'; expulsões Almir (CRB) e Veiga (CSA)",
});

// ——— Quadrangular do 2º turno ———
add({
  date: "1981-08-27",
  phase: "Quadrangular do 2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: FUMEI,
  referee: "Antônio Vieira de Goes",
  manager: MGR,
});

add({
  date: "1981-09-02",
  phase: "Quadrangular do 2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Nei Andrade",
  attendance: 10801,
  revenue: 1225900,
  revenueText: revText(1225900),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Félix",
      "Luís Felipe",
      "Jerônimo",
      "Geraldo",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Jorginho", in: "Ademir" },
      { out: "Mug", in: "Dentinho" },
    ],
  ),
  goals: [{ name: "Rommel", minute: 40 }],
});

add({
  date: "1981-09-13",
  phase: "Quadrangular do 2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Walquir Pimentel",
  attendance: 25866,
  revenue: 3356850,
  revenueText: revText(3356850),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Luís Felipe",
      "Jerônimo",
      "Zezinho",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Dentinho",
      "Mug",
    ],
    [
      { out: "Jacozinho", in: "Ademir" },
      { out: "Dentinho", in: "Freitas" },
    ],
  ),
  goals: [
    {
      name: "Odon",
      minute: 85,
      ownGoal: true,
      ownGoalDirection: "for",
    },
  ],
  note: "Gol Alexandre Bueno (CRB) 90'; expulsão Israel (CRB)",
});

// ——— 3º turno ———
add({
  date: "1981-09-13",
  phase: "3º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Manoel Amaro",
  attendance: 2815,
  revenue: 306600,
  revenueText: revText(306600),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Luís Felipe",
      "Jerônimo",
      "Zezinho",
      "Veiga",
      "Freitas",
      "Ademir",
      "Jorginho",
      "Dentinho",
      "Mug",
    ],
    [{ out: "Dentinho", in: "Paraná" }],
  ),
  goals: [
    { name: "Luís Felipe", minute: 10 },
    { name: "Freitas", minute: 90 },
  ],
  note:
    "Mesma data do 1x1 com CRB no quadrangular do 2º turno (fonte)",
});

add({
  date: "1981-09-20",
  phase: "3º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: NIVALDO,
  referee: "Laércio Ribeiro dos Anjos",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Luís Felipe",
      "Jerônimo",
      "Félix",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Jorginho", in: "Dentinho" },
      { out: "Freitas", in: "Ney" },
    ],
  ),
  goals: [{ name: "Freitas", minute: 73 }],
});

add({
  date: "1981-09-23",
  phase: "3º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Luís Felipe",
      "Jerônimo",
      "Flávio",
      "Veiga",
      "Ney",
      "Rommel",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Ney", in: "Jorginho" },
      { out: "Jacozinho", in: "Ademir" },
    ],
  ),
  goals: [
    { name: "Flávio", minute: 29 },
    { name: "Rommel", minute: 39 },
    { name: "Freitas", minute: 89, penalty: true },
  ],
  note:
    "Preliminar do amistoso Brasil x Irlanda; arrecadação do amistoso Cr$ 19.808.000 / 36.982 (não confundir com renda desta partida)",
});

add({
  date: "1981-09-27",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 5,
  ga: 1,
  stadium: REI,
  referee: "Bartolomeu Lordello",
  attendance: 4548,
  revenue: 506300,
  revenueText: revText(506300),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Luís Felipe",
      "Jerônimo",
      "Flávio",
      "Veiga",
      "Jorginho",
      "Ademir",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Jacozinho", in: "Félix" },
      { out: "Mug", in: "Dentinho" },
    ],
  ),
  goals: [
    { name: "Mug", minute: 10 },
    { name: "Jorginho", minute: 14 },
    { name: "Freitas", minute: 31 },
    { name: "Dentinho", minute: 66 },
    { name: "Flávio", minute: 89 },
  ],
  note: "Gol Zé Carlos (ASA) 24'; expulsões Dema e Gilmar (ASA)",
});

add({
  date: "1981-10-04",
  phase: "3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "José Araújo",
  attendance: 4854,
  revenue: 523280,
  revenueText: revText(523280),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Luís Felipe",
      "Jerônimo",
      "Flávio",
      "Veiga",
      "Paraná",
      "Ademir",
      "Jorginho",
      "Freitas",
      "Dentinho",
    ],
    [
      { out: "Jerônimo", in: "Fernando" },
      { out: "Paraná", in: "Félix" },
    ],
  ),
  goals: [
    { name: "Dentinho", minute: 36 },
    { name: "Dentinho", minute: 76 },
  ],
});

add({
  date: "1981-10-11",
  phase: "3º turno",
  opponent: "Capelense-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: MOREIRA,
  referee: "José Araújo",
  manager: MGR,
});

add({
  date: "1981-10-18",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Maurílio Santiago",
  attendance: 14066,
  revenue: 1630550,
  revenueText: revText(1630550),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Flávio",
      "Luís Felipe",
      "Jerônimo",
      "Geraldo",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Freitas", in: "Dentinho" },
      { out: "Mug", in: "Antunes" },
    ],
  ),
  note: "Expulsão Geraldo (CSA) 55'",
});

// ——— Quadrangular do 3º turno ———
add({
  date: "1981-10-22",
  phase: "Quadrangular do 3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "José Araújo",
  attendance: 5176,
  revenue: 587200,
  revenueText: revText(587200),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Luís Felipe",
      "Jerônimo",
      "Flávio",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
    [
      { out: "Jorginho", in: "Paraná" },
      { out: "Freitas", in: "Dentinho" },
    ],
  ),
  goals: [
    { name: "Flávio", minute: 14 },
    { name: "Dentinho", minute: 50 },
  ],
  note: "Expulsões Edmilson/Cananô (CSE); Flávio (CSA)",
});

add({
  date: "1981-10-27",
  phase: "Quadrangular do 3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Bartolomeu Lordello",
  attendance: 7464,
  revenue: 876050,
  revenueText: revText(876050),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Antunes",
      "Luís Felipe",
      "Jerônimo",
      "Zezinho",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Dentinho",
      "Mug",
    ],
    [
      { out: "Rommel", in: "Ademir" },
      { out: "Jacozinho", in: "Freitas" },
    ],
  ),
  goals: [
    { name: "Dentinho", minute: 15 },
    { name: "Freitas", minute: 29 },
  ],
  note: "Gol Dema (ASA) 23'",
});

add({
  date: "1981-11-01",
  phase: "Quadrangular do 3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Aldemir Vieira Matos",
  manager: MGR,
});

// ——— Superturno final ———
add({
  date: "1981-11-07",
  phase: "Superturno final",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "José Araújo",
  manager: MGR,
  ...lineup(
    [
      "Brasília",
      "Flávio",
      "Luís Felipe",
      "Jerônimo",
      "Geraldo",
      "Veiga",
      "Almir",
      "Jorginho",
      "Freitas",
      "Dentinho",
      "Mug",
    ],
    [
      { out: "Dentinho", in: "Paraná" },
      { out: "Mug", in: "Félix" },
    ],
  ),
  goals: [
    { name: "Dentinho", minute: 6 },
    { name: "Dentinho", minute: 35 },
    { name: "Freitas", minute: 53 },
  ],
  note: "Gol Valmir (Penedense) 30'",
});

add({
  date: "1981-11-15",
  phase: "Superturno final",
  opponent: "ASA-AL",
  ha: "home",
  gf: 4,
  ga: 1,
  stadium: REI,
  referee: "José Araújo",
  revenue: 1004000,
  revenueText: revText(1004000),
  manager: MGR,
  ...lineup(
    [
      "Brasília",
      "Flávio",
      "Luís Felipe",
      "Jerônimo",
      "Geraldo",
      "Veiga",
      "Rommel",
      "Jorginho",
      "Freitas",
      "Dentinho",
      "Mug",
    ],
    [
      { out: "Jerônimo", in: "Félix" },
      { out: "Veiga", in: "Jacozinho" },
    ],
  ),
  goals: [
    { name: "Rommel", minute: 31 },
    { name: "Freitas", minute: 52 },
    { name: "Rommel", minute: 67 },
    { name: "Mug", minute: 76 },
  ],
  note:
    "Gol Neco (ASA) 2'; expulsões Gilmar e Toninho (ASA); torcedor agrediu técnico do ASA",
});

add({
  date: "1981-11-18",
  phase: "Superturno final",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Arnaldo César Coelho",
  attendance: 15418,
  revenue: 2532050,
  revenueText: revText(2532050),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Flávio",
      "Luís Felipe",
      "Félix",
      "Geraldo",
      "Veiga",
      "Rommel",
      "Jorginho",
      "Freitas",
      "Dentinho",
      "Mug",
    ],
    [
      { out: "Rommel", in: "Jacozinho" },
      { out: "Freitas", in: "Ademir" },
    ],
  ),
  goals: [{ name: "Dentinho", minute: 10 }],
});

add({
  date: "1981-11-22",
  phase: "Superturno final — jogo do título antecipado",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 3,
  ga: 1,
  stadium: LEAHY,
  referee: "José Araújo",
  attendance: 5139,
  revenue: 348630,
  revenueText: revText(348630),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Flávio",
      "Luís Felipe",
      "Félix",
      "Geraldo",
      "Veiga",
      "Rommel",
      "Jorginho",
      "Freitas",
      "Dentinho",
      "Mug",
    ],
    [
      { out: "Rommel", in: "Jacozinho" },
      { out: "Freitas", in: "Ademir" },
    ],
  ),
  goals: [
    { name: "Dentinho", minute: 47 },
    { name: "Rommel", minute: 75 },
    { name: "Freitas", minute: 84 },
  ],
  note: "Título alagoano antecipado; gol Careca (Penedense) 9'",
});

add({
  date: "1981-11-25",
  phase: "Superturno final",
  opponent: "ASA-AL",
  ha: "away",
  gf: 0,
  ga: 2,
  stadium: FUMEI,
  referee: "Saul Mendes",
  revenue: 700540,
  revenueText: revText(700540),
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Flávio",
      "Luís Felipe",
      "Dick",
      "Geraldo",
      "Veiga",
      "Ademir",
      "Paraná",
      "Jacozinho",
      "Freitas",
      "Mug",
    ],
  ),
  note: "Gols ASA: Zé Carlos 20', Dema 25'; expulsão Jacozinho (CSA) 2ºT",
});

add({
  date: "1981-11-29",
  phase: "Superturno final",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Anivaldo Seixas Magalhães",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Flávio",
      "Luís Felipe",
      "Jerônimo",
      "Geraldo",
      "Veiga",
      "Ademir",
      "Rommel",
      "Freitas",
      "Dentinho",
      "Mug",
    ],
    [
      { out: "Veiga", in: "Josenílton" },
      { out: "Mug", in: "Paraná" },
    ],
  ),
  goals: [{ name: "Rommel", minute: 75 }],
  note: "Gol Nau (CRB) 46'",
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

console.log("GAMES.length:", GAMES.length);
console.log("tally (soma dos placares):", tally(GAMES));
console.log("cabeçalho final (não fecha): J36 V28 E06 D02 GP72 GC20");
const t = tally(GAMES);
const expected = { n: 36, v: 28, e: 6, d: 2, gf: 72, ga: 20 };
for (const k of Object.keys(expected)) {
  if (t[k] !== expected[k])
    console.log(`MISMATCH ${k}: got ${t[k]} expected ${expected[k]}`);
}

const header = `/** Campeonato Alagoano 1981 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA campeão 1981; técnico Walmir Louruz (canon DB: Valmir Louruz); título antecipado 22/11/1981.
 * Soma dos placares listados: J36 V27 E6 D3 GP79 GC22 (fases batem).
 * Cabeçalho final da fonte (V28 E6 D2 GP72 GC20 / PG66) não fecha com a soma dos jogos.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; "47' do 1°T" = 47 (injury time mantido).
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1981;

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

const out = resolve(__dirname, "data", "season-1981-alagoano.mjs");
writeFileSync(out, header + JSON.stringify(GAMES, null, 2) + ";\n", "utf8");
console.log("wrote", out);
