/**
 * Generates scripts/data/season-1980-alagoano.mjs
 * Run: node scripts/_gen-1980-data.mjs
 *
 * CSA campeão 1980 (venceu 1º e 2º turnos; regulamento priorizou turnos sobre PG geral).
 * Minutos: 1ºT = N; 2ºT = 45+N.
 * Soma dos placares do texto: J36 V21 E10 D5 GF63 GC23
 * Classificação oficial: GP66 GC20 (discrepância de 3 gols a favor/contra).
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const MOREIRA = "Manoel Moreira";
const LEAHY = "Estádio Alfredo Leahy";
const JUCA = "Juca Sampaio";
const M1 = "Laerte Dória";
const M2 = "Tadeu Lima";
const M3 = "Alberto Meneses"; // DB: Alberto Meneses (variante de Menezes)

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

// ——— 1º TURNO ———
add({
  date: "1980-06-01",
  phase: "1º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Moacir Serafim",
  attendance: 4169,
  revenue: 263000,
  revenueText: "Cr$ 263.000,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Joca",
      "Miranda",
      "Dick",
      "Luizinho",
      "Alberto Leguelé",
      "Peu",
      "Luiz Carlos",
      "Jorginho",
      "Zé Roberto",
      "Gilmar",
    ],
    [
      { out: "Alberto Leguelé", in: "Alberto Carioca" },
      { out: "Zé Roberto", in: "Rogério" },
    ],
  ),
  goals: [
    { name: "Luizinho", minute: 57 },
    { name: "Peu", minute: 66 },
  ],
});

add({
  date: "1980-06-04",
  phase: "1º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 6,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 2618,
  revenue: 159390,
  revenueText: "Cr$ 159.390,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Miranda",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Ronaldo Alves",
      "Alberto Carioca",
      "Luiz Carlos",
      "Jorginho",
      "Dentinho",
      "Gilmar",
    ],
    [
      { out: "Ronaldo Alves", in: "Alberto Leguelé" },
      { out: "Alberto Carioca", in: "Peu" },
    ],
  ),
  goals: [
    { name: "Dentinho", minute: 34 },
    { name: "Jorginho", minute: 46 },
    { name: "Gilmar", minute: 55 },
    { name: "Alberto Carioca", minute: 57 },
    { name: "Luiz Carlos", minute: 82 },
    { name: "Peu", minute: 85 },
  ],
});

add({
  date: "1980-06-09",
  phase: "1º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 4,
  ga: 3,
  stadium: FUMEI,
  referee: "Wilson Carlos dos Santos",
  attendance: 6096,
  revenue: 407890,
  revenueText: "Cr$ 407.890,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Miranda",
      "Paulinho",
      "Beto",
      "Luizinho",
      "Alberto Leguelé",
      "Alberto Carioca",
      "Luiz Carlos",
      "Jorginho",
      "Dentinho",
      "Gilmar",
    ],
    [{ out: "Alberto Carioca", in: "Peu" }],
  ),
  goals: [
    { name: "Peu", minute: 45 },
    { name: "Jorginho", minute: 46 },
    { name: "Gilmar", minute: 72 },
    { name: "Jorginho", minute: 87 },
  ],
  note: "ASA pagou as despesas com a arbitragem integralmente.",
});

add({
  date: "1980-06-11",
  phase: "1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 3564,
  revenue: 220260,
  revenueText: "Cr$ 220.260,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Miranda",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Alberto Leguelé",
      "Peu",
      "Luiz Carlos",
      "Jorginho",
      "Dentinho",
      "Gilmar",
    ],
    [{ out: "Luizinho", in: "Beto" }],
  ),
  goals: [
    { name: "Peu", minute: 30 },
    { name: "Jorginho", minute: 67 },
    { name: "Dentinho", minute: 75 },
    { name: "Peu", minute: 78 },
  ],
});

add({
  date: "1980-06-16",
  phase: "1º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 5,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 4758,
  revenue: 291410,
  revenueText: "Cr$ 291.410,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Miranda",
      "Paulinho",
      "Dick",
      "Joca",
      "Alberto Leguelé",
      "Peu",
      "Luiz Carlos",
      "Jorginho",
      "Dentinho",
      "Gilmar",
    ],
    [
      { out: "Alberto Leguelé", in: "Ronaldo Alves" },
      { out: "Gilmar", in: "Caneta" },
    ],
  ),
  goals: [
    { name: "Jorginho", minute: 25 },
    { name: "Gilmar", minute: 44 },
    { name: "Peu", minute: 64 },
    { name: "Peu", minute: 70 },
    { name: "Dentinho", minute: 76 },
  ],
  note: "Expulsão do goleiro Adolfo (Ferroviário)",
});

add({
  date: "1980-06-22",
  phase: "1º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 4575,
  revenue: 275500,
  revenueText: "Cr$ 275.500,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Beto",
      "Paulinho",
      "Dick",
      "Joca",
      "Alberto Leguelé",
      "Gilmar",
      "Luiz Carlos",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Alberto Leguelé", in: "Ronaldo Alves" },
      { out: "Gilmar", in: "Alberto" },
    ],
  ),
  goals: [
    { name: "Dentinho", minute: 66 },
    { name: "Dentinho", minute: 77 },
  ],
});

add({
  date: "1980-06-28",
  phase: "1º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 15395,
  revenue: 1018338,
  revenueText: "Cr$ 1.018.338,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Miranda",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Ronaldo Alves",
      "Peu",
      "Luiz Carlos",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Miranda", in: "Joca" },
      { out: "Luiz Carlos", in: "Alberto Leguelé" },
    ],
  ),
  goals: [{ name: "Ronaldo Alves" }, { name: "Peu" }],
});

// ——— QUADRANGULAR 1º ———
add({
  date: "1980-07-06",
  phase: "Quadrangular 1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 5613,
  revenue: 352800,
  revenueText: "Cr$ 352.800,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Joca",
      "Paulinho",
      "Dick",
      "Zezinho",
      "Alberto",
      "Peu",
      "Luiz Carlos",
      "Caneta",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Peu", in: "Raul" },
      { out: "Caneta", in: "Gilmar" },
    ],
  ),
  goals: [{ name: "Luizinho", minute: 70 }],
  note: "Gol Luizinho (não listado na escalação; registrado).",
});

add({
  date: "1980-07-09",
  phase: "Quadrangular 1º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Arnaldo César Coelho",
  attendance: 10643,
  revenue: 692130,
  revenueText: "Cr$ 692.130,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Miranda",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Ronaldo Alves",
      "Peu",
      "Luiz Carlos",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Ronaldo Alves", in: "Alberto Leguelé" },
      { out: "Luiz Carlos", in: "Gilmar" },
    ],
  ),
});

add({
  date: "1980-07-13",
  phase: "Quadrangular 1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "José Teles",
  attendance: 23485,
  revenue: 1582290,
  revenueText: "Cr$ 1.582.290,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Miranda",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Ronaldo Alves",
      "Peu",
      "Luiz Carlos",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Peu", in: "Gilmar" },
      { out: "Nílson", in: "Alberto" },
    ],
  ),
  note: "Expulsões Cícero e Carlinhos (CRB); Luiz Carlos (CSA). CSA campeão 1º turno (melhor campanha na fase).",
});

// ——— 2º TURNO ———
add({
  date: "1980-07-20",
  phase: "2º turno",
  opponent: "Capelense-AL",
  ha: "away",
  gf: 3,
  ga: 1,
  stadium: MOREIRA,
  referee: "Sebastião Canuto",
  manager: M1,
  ...lineup(
    [
      "Juremir",
      "Miranda",
      "Paulinho",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Alberto",
      "Gilmar",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Jorginho", in: "Caneta" },
      { out: "Nílson", in: "Peu" },
    ],
  ),
  goals: [
    { name: "Nílson", minute: 17 },
    { name: "Jorginho", minute: 28 },
    { name: "Dentinho", minute: 76 },
  ],
});

add({
  date: "1980-07-27",
  phase: "2º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 5108,
  revenue: 313930,
  revenueText: "Cr$ 313.930,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Joca",
      "Paulinho",
      "Dick",
      "Zezinho",
      "Alberto",
      "Peu",
      "Luiz Carlos",
      "Nílson",
      "Dentinho",
      "Caneta",
    ],
    [
      { out: "Peu", in: "Raul" },
      { out: "Caneta", in: "Gilmar" },
    ],
  ),
  goals: [{ name: "Raul", minute: 67 }],
});

add({
  date: "1980-08-03",
  phase: "2º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: LEAHY,
  referee: "Sebastião Canuto",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Joca",
      "Paulinho",
      "Dick",
      "Zezinho",
      "Alberto",
      "Peu",
      "Luiz Carlos",
      "Nílson",
      "Dentinho",
      "Caneta",
    ],
    [{ out: "Peu", in: "Gilmar" }],
  ),
  goals: [{ name: "Dentinho", minute: 5 }],
  note: "Fonte lista Caneta (Gilmar) e Peu (Gilmar); mantida só Peu→Gilmar.",
});

add({
  date: "1980-08-13",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 3905,
  revenue: 239600,
  revenueText: "Cr$ 239.600,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Joca",
      "Paulinho",
      "Dick",
      "Zezinho",
      "Alberto",
      "Peu",
      "Gilmar",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Peu", in: "Raul" },
      { out: "Nílson", in: "Luiz Carlos" },
    ],
  ),
  goals: [{ name: "Dentinho" }, { name: "Peu" }],
  note: "Expulsão Zé Carlos (Ferroviário)",
});

add({
  date: "1980-08-17",
  phase: "2º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  revenue: 318000,
  revenueText: "Cr$ 318.000,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Joca",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Miranda",
      "Peu",
      "Alberto",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Miranda", in: "Gilmar" },
      { out: "Dentinho", in: "Raul" },
    ],
  ),
  goals: [
    { name: "Peu", minute: 25 },
    { name: "Peu", minute: 50 },
  ],
});

add({
  date: "1980-08-24",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  revenue: 675320,
  revenueText: "Cr$ 675.320,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Joca",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Miranda",
      "Alberto",
      "Peu",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Alberto", in: "Gilmar" },
      { out: "Dentinho", in: "Raul" },
    ],
  ),
});

add({
  date: "1980-08-31",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 2,
  stadium: REI,
  referee: "Luiz Carlos Félix",
  revenue: 1517000,
  revenueText: "Cr$ 1.517.000,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Joca",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Miranda",
      "Alberto",
      "Peu",
      "Jorginho",
      "Gilmar",
      "Nílson",
    ],
    [{ out: "Miranda", in: "Luiz Carlos" }],
  ),
  goals: [{ name: "Gilmar", minute: 45 }],
});

// ——— QUADRANGULAR 2º ———
add({
  date: "1980-09-07",
  phase: "Quadrangular 2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 10839,
  revenue: 713290,
  revenueText: "Cr$ 713.290,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Paulinho",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Peu",
      "Alberto",
      "Jorginho",
      "Gilmar",
      "Nílson",
    ],
    [
      { out: "Ronaldo Alves", in: "Jorge Luiz" },
      { out: "Alberto", in: "Dentinho" },
    ],
  ),
  goals: [{ name: "Peu", minute: 31, penalty: true }],
});

add({
  date: "1980-09-11",
  phase: "Quadrangular 2º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Manoel Amaro",
  revenue: 292360,
  revenueText: "Cr$ 292.360,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Joca",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Peu",
      "Jorge Luiz",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Ronaldo Alves", in: "Gilmar" },
      { out: "Jorge Luiz", in: "Alberto" },
    ],
  ),
  goals: [
    { name: "Peu", minute: 20 },
    { name: "Peu", minute: 42 },
  ],
});

add({
  date: "1980-09-14",
  phase: "Quadrangular 2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "José Roberto Wright",
  revenue: 1592990,
  revenueText: "Cr$ 1.592.990,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Paulinho",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Alberto",
      "Gilmar",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Gilmar", in: "Peu" },
      { out: "Nílson", in: "Luiz Carlos" },
    ],
  ),
  goals: [
    {
      name: "Flávio",
      minute: 38,
      ownGoal: true,
      ownGoalDirection: "for",
    },
    { name: "Luiz Carlos", minute: 82 },
  ],
  note: "Expulsões Peu e Ronaldo Alves (CSA); Ênio Oliveira e Flávio (CRB). CSA campeão 2º turno.",
});

// ——— 3º TURNO ———
add({
  date: "1980-09-21",
  phase: "3º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Antônio Vieira de Gois",
  attendance: 4278,
  revenue: 263430,
  revenueText: "Cr$ 263.430,00",
  manager: M1,
  ...lineup(
    [
      "Jurandir",
      "Joca",
      "Paulinho",
      "Dick",
      "Zezinho",
      "Sabará",
      "Alberto",
      "Gilmar",
      "Jorginho",
      "Dentinho",
      "Roberval",
    ],
    [
      { out: "Gilmar", in: "Raul" },
      { out: "Dentinho", in: "Caneta" },
    ],
  ),
  note: "CSA passou a custear arbitragem de outras federações no 3º turno.",
});

add({
  date: "1980-09-24",
  phase: "3º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Armindo Tavares",
  attendance: 2674,
  revenue: 163740,
  revenueText: "Cr$ 163.740,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Paulinho",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Sabará",
      "Ronaldo Alves",
      "Peu",
      "Jorginho",
      "Dentinho",
      "Gilmar",
    ],
    [
      { out: "Paulinho", in: "Luizinho" },
      { out: "Ronaldo Alves", in: "Alberto" },
    ],
  ),
  goals: [{ name: "Peu" }, { name: "Peu" }, { name: "Jorginho" }],
});

add({
  date: "1980-10-05",
  phase: "3º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: JUCA,
  referee: "José Carlos de Oliveira",
  revenue: 200060,
  revenueText: "Cr$ 200.060,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Paulinho",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Sabará",
      "Ronaldo Alves",
      "Peu",
      "Jorginho",
      "Zé Roberto",
      "Gilmar",
    ],
    [
      { out: "Peu", in: "Alberto" },
      { out: "Gilmar", in: "Roberval" },
    ],
  ),
  goals: [
    { name: "Ronaldo Alves", minute: 38 },
    { name: "Zé Roberto", minute: 75 },
  ],
});

add({
  date: "1980-10-08",
  phase: "3º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  revenue: 219950,
  revenueText: "Cr$ 219.950,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Paulinho",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Sabará",
      "Ronaldo Alves",
      "Peu",
      "Jorginho",
      "Dentinho",
      "Gilmar",
    ],
    [{ out: "Peu", in: "Roberval" }],
  ),
  goals: [{ name: "Jorginho" }, { name: "Jorginho" }, { name: "Dentinho" }],
});

add({
  date: "1980-10-12",
  phase: "3º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 3703,
  revenue: 218200,
  revenueText: "Cr$ 218.200,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Paulinho",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Sabará",
      "Ronaldo Alves",
      "Peu",
      "Jorginho",
      "Dentinho",
      "Roberval",
    ],
    [
      { out: "Paulinho", in: "Luizinho" },
      { out: "Roberval", in: "Gilmar" },
    ],
  ),
  goals: [
    { name: "Jorginho", minute: 11 },
    { name: "Roberval", minute: 24 },
    { name: "Jorginho", minute: 40 },
  ],
  note: "Fonte lista 3 gols nomeados para placar 4x0. Expulsão Silva (São Domingos).",
});

add({
  date: "1980-10-19",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 0,
  ga: 3,
  stadium: FUMEI,
  referee: "César Virgílio",
  attendance: 12520,
  revenue: 792150,
  revenueText: "Cr$ 792.150,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Paulinho",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Ronaldo Alves",
      "Sabará",
      "Roberval",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Ronaldo Alves", in: "Alberto" },
      { out: "Nílson", in: "Peu" },
    ],
  ),
});

add({
  date: "1980-10-26",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 1,
  stadium: REI,
  referee: "Luiz Carlos Félix",
  attendance: 17236,
  revenue: 1146730,
  revenueText: "Cr$ 1.146.730,00",
  manager: M1,
  ...lineup(
    [
      "Zé Luiz",
      "Paulinho",
      "Paranhos",
      "Ronaldo Alves",
      "Zezinho",
      "Alberto",
      "Sabará",
      "Peu",
      "Roberval",
      "Gilmar",
      "Nílson",
    ],
    [
      { out: "Alberto", in: "Zé Roberto" },
      { out: "Roberval", in: "Dentinho" },
    ],
  ),
  note: "Expulsões Eneias e Osmar Barão (CRB); Paulinho e Dentinho (CSA). Laerte Dória desligado após o jogo.",
});

// ——— QUADRANGULAR 3º ———
add({
  date: "1980-11-02",
  phase: "Quadrangular 3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 1,
  stadium: REI,
  referee: "Arnaldo César Coelho",
  revenue: 1192210,
  revenueText: "Cr$ 1.192.210,00",
  manager: M2,
  ...lineup(
    [
      "Zé Luiz",
      "Zezinho",
      "Paranhos",
      "Dick",
      "Luizinho",
      "Ronaldo Alves",
      "Alberto",
      "Gilmar",
      "Roberval",
      "Zé Roberto",
      "Nílson",
    ],
    [
      { out: "Paranhos", in: "Beto" },
      { out: "Nílson", in: "Peu" },
    ],
  ),
});

add({
  date: "1980-11-05",
  phase: "Quadrangular 3º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 4,
  ga: 2,
  stadium: FUMEI,
  referee: "Manoel Amaro",
  attendance: 6489,
  revenue: 430490,
  revenueText: "Cr$ 430.490,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Beto",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Alberto",
      "Sabará",
      "Peu",
      "Gilmar",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Peu", in: "Luiz Carlos" },
      { out: "Dentinho", in: "Raul" },
    ],
  ),
  goals: [
    { name: "Dentinho", minute: 13 },
    { name: "Gilmar", minute: 30 },
    { name: "Raul", minute: 50 },
    {
      name: "Dick",
      minute: 65,
      ownGoal: true,
      ownGoalDirection: "against",
    },
    { name: "Raul", minute: 90 },
  ],
  note: "Estreia de Alberto Meneses. Dick (contra) para o ASA.",
});

add({
  date: "1980-11-09",
  phase: "Quadrangular 3º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: JUCA,
  referee: "Manoel Amaro",
  revenue: 120000,
  revenueText: "Cr$ 120.000,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Beto",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Sabará",
      "Alberto",
      "Peu",
      "Gilmar",
      "Raul",
      "Nílson",
    ],
    [{ out: "Peu", in: "Ronaldo Alves" }],
  ),
  note: "CRB campeão do 3º turno.",
});

// ——— SUPER TURNO ———
add({
  date: "1980-11-12",
  phase: "Superturno final",
  opponent: "ASA-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: FUMEI,
  referee: "Romualdo Arpi Filho",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Beto",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Ronaldo Alves",
      "Alberto",
      "Sabará",
      "Jorginho",
      "Dentinho",
      "Raul",
    ],
    [
      { out: "Jorginho", in: "Nílson" },
      { out: "Raul", in: "Luiz Carlos" },
    ],
  ),
  goals: [{ name: "Dentinho", minute: 9 }],
  note: "Expulsão Sabará (CSA). CSA +4 PG de bônus (dois turnos); CRB +2 PG.",
});

add({
  date: "1980-11-16",
  phase: "Superturno final",
  opponent: "CSE-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: JUCA,
  referee: "Abelardo Lucena",
  revenue: 201000,
  revenueText: "Cr$ 201.000,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Beto",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Ronaldo Alves",
      "Alberto",
      "Luiz Carlos",
      "Jorginho",
      "Dentinho",
      "Nílson",
    ],
    [
      { out: "Luiz Carlos", in: "Peu" },
      { out: "Nílson", in: "Zé Roberto" },
    ],
  ),
});

add({
  date: "1980-11-19",
  phase: "Superturno final",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 2,
  stadium: REI,
  referee: "Arnaldo César Coelho",
  attendance: 16976,
  revenue: 1502880,
  revenueText: "Cr$ 1.502.880,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Zezinho",
      "Paulinho",
      "Dick",
      "Luizinho",
      "Ronaldo Alves",
      "Alberto",
      "Peu",
      "Jorginho",
      "Dentinho",
      "Luiz Carlos",
    ],
    [
      { out: "Ronaldo Alves", in: "Sabará" },
      { out: "Jorginho", in: "Roberval" },
    ],
  ),
  goals: [
    {
      name: "Itamar",
      minute: 90,
      ownGoal: true,
      ownGoalDirection: "for",
    },
  ],
});

add({
  date: "1980-11-23",
  phase: "Superturno final",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 5511,
  revenue: 475500,
  revenueText: "Cr$ 475.500,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Beto",
      "Paulinho",
      "Paranhos",
      "Zezinho",
      "Alberto",
      "Sabará",
      "Raul",
      "Roberval",
      "Dentinho",
      "Gilmar",
    ],
    [
      { out: "Dentinho", in: "Peu" },
      { out: "Gilmar", in: "Jorginho" },
    ],
  ),
  goals: [
    {
      name: "Cremildo",
      minute: 5,
      ownGoal: true,
      ownGoalDirection: "for",
    },
    { name: "Roberval", minute: 46 },
  ],
  note: "Expulsões Pedrinho e Esquerdinha (ASA). Tumulto por pênalti não marcado.",
});

add({
  date: "1980-11-26",
  phase: "Superturno final",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 7746,
  revenue: 637720,
  revenueText: "Cr$ 637.720,00",
  manager: M3,
  ...lineup(
    [
      "Zé Luiz",
      "Paulinho",
      "Paranhos",
      "Dick",
      "Zezinho",
      "Alberto",
      "Sabará",
      "Gilmar",
      "Roberval",
      "Raul",
      "Jorginho",
    ],
    [
      { out: "Alberto", in: "Ronaldo Alves" },
      { out: "Roberval", in: "Luiz Carlos" },
    ],
  ),
  goals: [{ name: "Jorginho", minute: 17 }],
});

add({
  date: "1980-11-30",
  phase: "Superturno final",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  attendance: 29330,
  revenue: 2666960,
  revenueText: "Cr$ 2.666.960,00",
  manager: M3,
  note: "Ficha incompleta no texto (sem árbitro, gols e escalações). CSA campeão alagoano 1980 (dois turnos).",
});

let w = 0,
  d = 0,
  l = 0,
  gf = 0,
  ga = 0;
for (const g of GAMES) {
  if (g.gf > g.ga) w++;
  else if (g.gf < g.ga) l++;
  else d++;
  gf += g.gf;
  ga += g.ga;
}
console.log(`games=${GAMES.length} V${w} E${d} D${l} GF${gf} GC${ga}`);
console.log("oficial: J36 V21 E10 D05 GP66 GC20");
if (GAMES.length !== 36 || w !== 21 || d !== 10 || l !== 5) {
  console.error("WDL/J mismatch");
  process.exit(1);
}

const out = `/** Campeonato Alagoano 1980 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA campeão por ter vencido 1º e 2º turnos (regulamento alterado; CRB teve mais PG geral).
 * Soma dos placares do texto: GF63 GC23; classificação oficial cita GP66 GC20.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N.
 * Técnicos: Laerte Dória → Tadeu Lima (02/11) → Alberto Meneses (a partir de 05/11).
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1980;

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
export const GAMES = ${JSON.stringify(GAMES, null, 2)};
`;

writeFileSync(resolve(__dirname, "data/season-1980-alagoano.mjs"), out, "utf8");
console.log("wrote season-1980-alagoano.mjs", GAMES.length);
