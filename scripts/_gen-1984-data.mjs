/**
 * Generates scripts/data/season-1984-alagoano.mjs
 * Run: node scripts/_gen-1984-data.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const LEAHY = "Estádio Alfredo Leahy";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const MOREIRA = "Manoel Moreira";
const JUCA = "Estádio Juca Sampaio";
const MGR = "Valdemar Carabina";

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

// ——— 1ª fase do 1º turno ———
add({
  date: "1984-04-29",
  phase: "1ª fase do 1º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 2082,
  revenue: 1742000,
  revenueText: "Cr$ 1.742.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Batista",
      "Café",
      "Vininho",
      "João Neto",
      "Édson Silva",
      "Nívio",
      "Noronha",
      "Serginho",
      "Frank",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Carlinhos" },
      { out: "Jacozinho", in: "Bel" },
    ],
  ),
});

add({
  date: "1984-05-06",
  phase: "1ª fase do 1º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: FUMEI,
  referee: "Sebastião Canuto",
  attendance: 1274,
  revenue: 1042000,
  revenueText: "Cr$ 1.042.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "João Neto",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Carlinhos",
      "Noronha",
      "Frazão",
      "Nívio",
      "Jacozinho",
    ],
    [
      { out: "Carlinhos", in: "Frank" },
      { out: "Jacozinho", in: "Serginho" },
    ],
  ),
  note: "Gol Sabino (ASA) 67'",
});

add({
  date: "1984-05-09",
  phase: "1ª fase do 1º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 2127,
  revenue: 1802000,
  revenueText: "Cr$ 1.802.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "João Neto",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Noronha",
      "Frazão",
      "Nívio",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Carlinhos" },
      { out: "Jacozinho", in: "Bel" },
    ],
  ),
  goals: [
    { name: "Jacozinho", minute: 8 },
    { name: "Nívio", minute: 14 },
    { name: "Noronha", minute: 80 },
  ],
  note: "Expulsões Batista (Penedense) e Carlinhos (CSA)",
});

add({
  date: "1984-05-12",
  phase: "1ª fase do 1º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 7,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  revenue: 1861000,
  revenueText: "Cr$ 1.861.000,00",
  manager: MGR,
  goals: [
    { name: "Frazão" },
    { name: "Frazão" },
    { name: "Frazão" },
    { name: "Frazão" },
    { name: "Zé Carlos" },
    { name: "Zé Carlos" },
    { name: "Bel" },
  ],
});

add({
  date: "1984-05-20",
  phase: "1ª fase do 1º turno",
  opponent: "Capelense-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: MOREIRA,
  referee: "Ronaldo Nunes",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Carlos",
      "Frazão",
      "Nívio",
      "Jacozinho",
    ],
    [{ out: "Zé Carlos", in: "Frank" }],
  ),
  goals: [{ name: "Zé Carlos", minute: 3 }],
});

add({
  date: "1984-05-23",
  phase: "1ª fase do 1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "João Monteiro",
  attendance: 2452,
  revenue: 2142100,
  revenueText: "Cr$ 2.142.100,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Carlinhos",
      "Frazão",
      "Nívio",
      "Jacozinho",
    ],
    [{ out: "Nívio", in: "Noronha" }],
  ),
  goals: [{ name: "Zé Carlos", minute: 14 }],
});

add({
  date: "1984-05-26",
  phase: "1ª fase do 1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 7529,
  revenue: 12995000,
  revenueText: "Cr$ 12.995.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Ednaldo",
      "Édson Silva",
      "Zé Carlos",
      "Carlinhos",
      "Frazão",
      "Nívio",
      "Jacozinho",
    ],
    [{ out: "Nívio", in: "Noronha" }],
  ),
  note: "CRB campeão antecipado da 1ª fase do 1º turno (+ bônus)",
});

// ——— Quadrangular do 1º turno ———
add({
  date: "1984-05-30",
  phase: "Quadrangular do 1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 1806,
  revenue: 3099000,
  revenueText: "Cr$ 3.099.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Josival",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Carlinhos",
      "Jacozinho",
      "Luizão",
      "Bel",
    ],
    [
      { out: "Jacozinho", in: "Careca" },
      { out: "Bel", in: "Clésio" },
    ],
  ),
  goals: [
    { name: "Jacozinho", minute: 49 },
    { name: "Dario", minute: 53 },
  ],
});

add({
  date: "1984-06-05",
  phase: "Quadrangular do 1º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  officialResult: "loss",
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 4478,
  revenue: 7879000,
  revenueText: "Cr$ 7.879.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Café",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Silva",
      "Nívio",
      "Frazão",
      "Dario",
      "Jacozinho",
    ],
    [
      { out: "Café", in: "Carlinhos" },
      { out: "Nívio", in: "Zé Carlos" },
    ],
  ),
  goals: [
    { name: "Jacozinho", minute: 24 },
    { name: "Frazão", minute: 65 },
  ],
  note:
    "Vitória em campo; CSA perdeu pontos por doping de Zezinho (STJD, recurso ASA). Gol Carlos Alberto (ASA) 46'",
});

add({
  date: "1984-06-09",
  phase: "Quadrangular do 1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "João Monteiro",
  attendance: 8822,
  revenue: 15154000,
  revenueText: "Cr$ 15.154.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Dario",
      "Jacozinho",
    ],
    [
      { out: "Édson Silva", in: "Noronha" },
      { out: "Dario", in: "Zé Carlos" },
    ],
  ),
  goals: [{ name: "Nívio", minute: 26 }],
  note: "Expulsão Melo (CRB)",
});

// ——— Decisão 1º turno (anulada) ———
add({
  date: "1984-06-13",
  phase: "Decisão do 1º turno (jogo anulado)",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "José Roberto Wright",
  attendance: 9525,
  revenue: 17177000,
  revenueText: "Cr$ 17.177.000,00",
  manager: MGR,
  excludeFromStats: true,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Dario",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Noronha" },
      { out: "Dario", in: "Zé Carlos" },
    ],
  ),
  goals: [{ name: "Zé Carlos", minute: 87 }],
  note:
    "Partida disputada e vencida pelo CSA, anulada pelo STJD após caso doping; decisão real CRB x ASA em 24/10/1984 sem CSA. Expulsões Frazão (CSA) e Fanta (CRB)",
});

// ——— 2º turno ———
add({
  date: "1984-06-20",
  phase: "2º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "João Monteiro",
  attendance: 1665,
  revenue: 2841000,
  revenueText: "Cr$ 2.841.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Carlinhos",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Zé Carlos" },
      { out: "Jacozinho", in: "Nenê" },
    ],
  ),
  goals: [
    { name: "Luizão", minute: 38 },
    { name: "Luizão", minute: 61 },
  ],
});

add({
  date: "1984-06-24",
  phase: "2º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Agildo Alves",
  attendance: 1370,
  revenue: 2315000,
  revenueText: "Cr$ 2.315.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Careca",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Serginho",
    ],
    [
      { out: "Nívio", in: "Carlinhos" },
      { out: "Serginho", in: "Noronha" },
    ],
  ),
  goals: [
    { name: "Serginho", minute: 49 },
    { name: "Édson Silva", minute: 59 },
  ],
});

add({
  date: "1984-06-28",
  phase: "2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 855,
  revenue: 1452000,
  revenueText: "Cr$ 1.452.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Ednaldo",
      "Zé Carlos",
      "Noronha",
      "Carlinhos",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Zé Carlos", in: "João Neto" },
      { out: "Noronha", in: "Bel" },
    ],
  ),
  goals: [
    { name: "Luizão", minute: 25 },
    { name: "Zé Carlos", minute: 62 },
    { name: "Luizão", minute: 74 },
    { name: "Carlinhos", minute: 90 },
  ],
  note: "CSA comprou mando; expulsões Ednaldo (CSA) e Rogério (Penedense)",
});

add({
  date: "1984-07-01",
  phase: "2º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 2065,
  revenue: 3522000,
  revenueText: "Cr$ 3.522.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Josival",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Carlinhos",
      "Jacozinho",
      "Luizão",
      "Bel",
    ],
    [
      { out: "Jacozinho", in: "Careca" },
      { out: "Bel", in: "Clésio" },
    ],
  ),
  goals: [
    { name: "Zé Carlos", minute: 65 },
    { name: "Luizão", minute: 75 },
  ],
});

add({
  date: "1984-07-04",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 2149,
  revenue: 3696000,
  revenueText: "Cr$ 3.696.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Zé Carlos",
      "Carlinhos",
      "Luizão",
      "Jacozinho",
    ],
  ),
  goals: [{ name: "Zé Carlos", minute: 44 }],
  note: "Gol Gilmar (Ferroviário) 85'",
});

add({
  date: "1984-07-08",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 3469,
  revenue: 5983000,
  revenueText: "Cr$ 5.983.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Ednaldo",
      "Clésio",
      "Édson Silva",
      "Dario",
      "Zé Carlos",
      "Carlinhos",
      "Luizão",
      "Jacozinho",
    ],
    [{ out: "Carlinhos", in: "Noronha" }],
  ),
  goals: [
    {
      name: "Cremildo",
      minute: 32,
      ownGoal: true,
      ownGoalDirection: "for",
    },
    { name: "Jacozinho", minute: 46 },
  ],
});

add({
  date: "1984-07-15",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 2,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 12303,
  revenue: 22079000,
  revenueText: "Cr$ 22.079.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Zé Carlos",
      "Luizão",
      "Jacozinho",
    ],
    [{ out: "Zé Carlos", in: "Frazão" }],
  ),
  goals: [{ name: "Jacozinho", minute: 84 }],
  note: "Gols CRB: Fanta 53', João Paulista 58'",
});

// ——— Quadrangular do 2º turno ———
add({
  date: "1984-07-25",
  phase: "Quadrangular do 2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 3624,
  revenue: 6404000,
  revenueText: "Cr$ 6.404.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
  ),
  goals: [{ name: "Frazão", minute: 45 }],
  note: "Tumulto em pênalti; 5 expulsões ASA; encerramento prematuro",
});

add({
  date: "1984-07-29",
  phase: "Quadrangular do 2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 12102,
  revenue: 21569000,
  revenueText: "Cr$ 21.569.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Zé Carlos" },
      { out: "Frazão", in: "Carlinhos" },
    ],
  ),
  goals: [{ name: "Luizão", minute: 21 }],
  note: "Gol Joãozinho Paulista (CRB) 60'; expulsão Agnaldo (CSA) no 1ºT",
});

add({
  date: "1984-08-01",
  phase: "Quadrangular do 2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "João Monteiro",
  attendance: 4345,
  revenue: 7646000,
  revenueText: "Cr$ 7.646.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Ednaldo", in: "Zé Carlos" },
      { out: "Frazão", in: "Dario" },
    ],
  ),
  goals: [
    { name: "Nívio", minute: 14 },
    { name: "Zé Carlos", minute: 60 },
  ],
  note: "Adiado de 21/07 por chuva; expulsões Pedrinho e Alberto (Ferroviário)",
});

// ——— 3º turno ———
add({
  date: "1984-08-05",
  phase: "3º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 1454,
  revenue: 2538000,
  revenueText: "Cr$ 2.538.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Zé Carlos",
    ],
    [{ out: "Frazão", in: "Carlinhos" }],
  ),
  goals: [
    { name: "Luizão", minute: 35 },
    { name: "Nívio", minute: 69 },
    { name: "Frazão", minute: 73 },
  ],
});

add({
  date: "1984-08-12",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: FUMEI,
  referee: "Josival Pedro",
  attendance: 3042,
  revenue: 5135000,
  revenueText: "Cr$ 5.135.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Zé Carlos",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [{ out: "Luizão", in: "Dario" }],
  ),
});

add({
  date: "1984-08-15",
  phase: "3º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 1164,
  revenue: 1982000,
  revenueText: "Cr$ 1.982.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Zé Carlos",
    ],
    [
      { out: "Ednaldo", in: "Dario" },
      { out: "Zé Carlos", in: "Nenê" },
    ],
  ),
});

add({
  date: "1984-08-19",
  phase: "3º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "João Monteiro",
  attendance: 2728,
  revenue: 2984000,
  revenueText: "Cr$ 2.984.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Carlinhos",
      "Luizão",
      "Nenê",
    ],
    [{ out: "Édson Silva", in: "Zé Carlos" }],
  ),
  goals: [
    { name: "Luizão", minute: 17 },
    { name: "Nívio", minute: 27 },
    { name: "Luizão", minute: 36 },
    { name: "Nívio", minute: 58 },
  ],
  note: "Expulsão Fernando (Capelense)",
});

add({
  date: "1984-08-26",
  phase: "3º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: LEAHY,
  referee: "Antônio Morais",
  manager: MGR,
});

add({
  date: "1984-08-29",
  phase: "3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 2255,
  revenue: 3923000,
  revenueText: "Cr$ 3.923.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Josival",
      "Agnaldo",
      "Ednaldo",
      "Zé Carlos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Nenê" },
      { out: "Luizão", in: "Frank" },
    ],
  ),
  goals: [
    { name: "Luizão", minute: 56 },
    { name: "Cardoso", minute: 72 },
  ],
});

add({
  date: "1984-09-02",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 10063,
  revenue: 18194000,
  revenueText: "Cr$ 18.194.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Agnaldo",
      "Ednaldo",
      "Zé Carlos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Frazão", in: "Nenê" },
      { out: "Luizão", in: "Frank" },
    ],
  ),
  goals: [{ name: "Zé Carlos", minute: 19 }],
  note: "Gol Gilmar (CRB) 68'",
});

// ——— Quadrangular do 3º turno + decisão ———
add({
  date: "1984-09-09",
  phase: "Quadrangular do 3º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 2,
  ga: 1,
  stadium: FUMEI,
  referee: "Josival Pedro",
  attendance: 9746,
  revenue: 17322000,
  revenueText: "Cr$ 17.322.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho",
    ],
    [{ out: "Frazão", in: "Carlinhos" }],
  ),
  goals: [
    { name: "Frank", minute: 21 },
    { name: "Frank", minute: 63 },
  ],
  note:
    "Gol Berinho (ASA) 12'; tumulto; expulsões ASA; paralisação de 20 min",
});

add({
  date: "1984-09-12",
  phase: "Quadrangular do 3º turno",
  opponent: "Capelense-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: MOREIRA,
  referee: "João Monteiro",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Clésio",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Carlinhos" },
      { out: "Frazão", in: "Nenê" },
    ],
  ),
  goals: [
    { name: "Jacozinho", minute: 56 },
    { name: "Frank", minute: 87, penalty: true },
  ],
});

add({
  date: "1984-09-15",
  phase: "Quadrangular do 3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 8705,
  revenue: 20465000,
  revenueText: "Cr$ 20.465.000,00",
  manager: MGR,
  ...lineup(
    [
      "Adeíldo",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Carlinhos" },
      { out: "Frank", in: "Luizão" },
    ],
  ),
  goals: [{ name: "Jacozinho", minute: 48 }],
});

add({
  date: "1984-09-19",
  phase: "Decisão do 3º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 5272,
  revenue: 12278000,
  revenueText: "Cr$ 12.278.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Carlinhos",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Zé Carlos" },
      { out: "Jacozinho", in: "Nenê" },
    ],
  ),
  goals: [
    { name: "Edvaldo", minute: 37 },
    { name: "Frazão", minute: 84 },
  ],
  note: "CSA campeão do 3º turno",
});

// ——— 4º turno ———
add({
  date: "1984-09-23",
  phase: "4º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: JUCA,
  referee: "João Monteiro",
  attendance: 2158,
  revenue: 1079000,
  revenueText: "Cr$ 1.079.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Carlinhos",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho",
    ],
    [
      { out: "Frazão", in: "Nenê" },
      { out: "Frank", in: "Luizão" },
    ],
  ),
  note: "Gol Santos (CSE) 66'",
});

add({
  date: "1984-09-26",
  phase: "4º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Juarez Inácio",
  attendance: 1391,
  revenue: 2357000,
  revenueText: "Cr$ 2.357.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Nenê",
      "Zé Carlos",
      "Jacozinho",
    ],
    [
      { out: "Nenê", in: "Frazão" },
      { out: "Zé Carlos", in: "Laerte" },
    ],
  ),
  goals: [
    { name: "Jacozinho", minute: 56 },
    { name: "Nívio", minute: 90 },
  ],
  note: "Gol Gilson (Penedense) 67'; expulsão Manoel (Penedense)",
});

add({
  date: "1984-09-30",
  phase: "4º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Ronaldo Nunes",
  attendance: 1537,
  revenue: 2568000,
  revenueText: "Cr$ 2.568.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho",
    ],
    [
      { out: "Ednaldo", in: "Carlinhos" },
      { out: "Frank", in: "Zé Carlos" },
    ],
  ),
  goals: [{ name: "Jacozinho", minute: 79, penalty: true }],
});

add({
  date: "1984-10-07",
  phase: "4º turno",
  opponent: "Capelense-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: MOREIRA,
  referee: "Ronaldo Nunes",
  attendance: 773,
  revenue: 386500,
  revenueText: "Cr$ 386.500,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Carlinhos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
  ),
  goals: [{ name: "Nívio", minute: 63 }],
});

add({
  date: "1984-10-10",
  phase: "4º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 7,
  ga: 0,
  stadium: REI,
  referee: "Ernani Jonas",
  attendance: 1466,
  revenue: 2452000,
  revenueText: "Cr$ 2.452.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Ednaldo",
      "Zé Carlos",
      "Laerte",
      "Frank",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Laerte", in: "João Neto" },
      { out: "Frank", in: "Bel" },
    ],
  ),
  goals: [
    { name: "Zé Carlos" },
    { name: "Zé Carlos" },
    { name: "Zé Carlos" },
    { name: "Luizão" },
    { name: "Luizão" },
    { name: "Frank" },
    { name: "Carlinhos" },
  ],
  note: "Expulsão Sílvio (São Domingos)",
});

add({
  date: "1984-10-14",
  phase: "4º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 3674,
  revenue: 6295000,
  revenueText: "Cr$ 6.295.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Édson Silva", in: "Zé Carlos" },
      { out: "Jacozinho", in: "Frank" },
    ],
  ),
  goals: [
    { name: "Carlinhos", minute: 30 },
    { name: "Zé Carlos", minute: 81 },
  ],
});

add({
  date: "1984-10-21",
  phase: "4º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "João Monteiro",
  attendance: 11691,
  revenue: 21047000,
  revenueText: "Cr$ 21.047.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Ednaldo",
      "Zé Carlos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Zé Carlos", in: "Agnaldo" },
      { out: "Nívio", in: "Frank" },
    ],
  ),
  goals: [{ name: "Luizão", minute: 30 }],
  note:
    "Gol Joãozinho Paulista (CRB) 28'; expulsão Carlinhos (CRB, adversário)",
});

// ——— Quadrangular do 4º turno + decisão ———
add({
  date: "1984-10-25",
  phase: "Quadrangular do 4º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Marcelo Costa",
  attendance: 1586,
  revenue: 2776000,
  revenueText: "Cr$ 2.776.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Frank",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Ednaldo", in: "Zé Carlos" },
      { out: "Zé Carlos", in: "João Neto" },
    ],
  ),
  goals: [{ name: "Zé Carlos", minute: 66 }],
  note: "Gol Norinho (CSE) 86'",
});

add({
  date: "1984-11-01",
  phase: "Quadrangular do 4º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "João Monteiro",
  attendance: 1379,
  revenue: 2349000,
  revenueText: "Cr$ 2.349.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Frank",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Edvaldo", in: "Carlinhos" },
      { out: "Frank", in: "Zé Carlos" },
    ],
  ),
  goals: [
    { name: "Frank", minute: 24 },
    { name: "Luizão", minute: 31 },
    { name: "Luizão", minute: 88 },
  ],
});

add({
  date: "1984-11-04",
  phase: "Quadrangular do 4º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Pedro Carlos Begralda",
  attendance: 10831,
  revenue: 19678000,
  revenueText: "Cr$ 19.678.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Clésio", in: "Carlinhos" },
      { out: "Jacozinho", in: "Frank" },
    ],
  ),
  goals: [
    { name: "Nívio", minute: 34 },
    { name: "Frazão", minute: 51 },
  ],
  note: "Gol Gilmar (CRB) 23'",
});

add({
  date: "1984-11-07",
  phase: "Decisão do 4º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "José Roberto Wright",
  attendance: 12936,
  revenue: 23883000,
  revenueText: "Cr$ 23.883.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Agnaldo",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Ednaldo", in: "Zé Carlos" },
      { out: "Frazão", in: "Frank" },
    ],
  ),
  goals: [
    { name: "Frank", minute: 114 },
    { name: "Jacozinho", minute: 117, penalty: true },
  ],
  note:
    "CSA campeão do 4º turno; expulsões Gilnei (CRB) e Luizão (CSA). Gols na prorrogação (2º tempo)",
});

// ——— Superturno final ———
add({
  date: "1984-11-11",
  phase: "Superturno final",
  opponent: "ASA-AL",
  ha: "away",
  gf: 0,
  ga: 2,
  stadium: FUMEI,
  referee: "João Monteiro",
  attendance: 2850,
  revenue: 4847000,
  revenueText: "Cr$ 4.847.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Agnaldo",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho",
    ],
    [
      { out: "Ednaldo", in: "Zé Carlos" },
      { out: "Nívio", in: "Nenê" },
    ],
  ),
  goals: [
    {
      name: "Café",
      minute: 13,
      ownGoal: true,
      ownGoalDirection: "against",
    },
  ],
  note:
    "Gol Gil Lima (ASA) 78'; expulsões Frank (CSA); Major e Marquinhos (ASA)",
});

add({
  date: "1984-11-15",
  phase: "Superturno final",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 4,
  ga: 1,
  stadium: REI,
  referee: "Gilson Cordeiro",
  attendance: 1813,
  revenue: 4665000,
  revenueText: "Cr$ 4.665.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Agnaldo",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Carlinhos", in: "Clésio" },
      { out: "Édson Silva", in: "Zé Carlos" },
    ],
  ),
  goals: [
    { name: "Ednaldo", minute: 32 },
    { name: "Ednaldo", minute: 44 },
    { name: "Nívio", minute: 78 },
    { name: "Frazão", minute: 92 },
  ],
  note: "Gol Cacau (Capelense) 48'",
});

add({
  date: "1984-11-25",
  phase: "Superturno final",
  opponent: "CRB-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Wilson Carlos dos Santos",
  attendance: 11440,
  revenue: 30865500,
  revenueText: "Cr$ 30.865.500,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Agnaldo",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Frazão", in: "Frank" },
      { out: "Luizão", in: "Luiz Augusto" },
    ],
  ),
  goals: [
    { name: "Jacozinho", minute: 54 },
    { name: "Frank", minute: 77 },
  ],
  note:
    "Expulsões Gilnei, Williams e Joãozinho Paulista (CRB); Café, Édson Silva e Frank (CSA)",
});

add({
  date: "1984-12-02",
  phase: "Superturno final",
  opponent: "Capelense-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: MOREIRA,
  referee: "José Araújo",
  attendance: 2903,
  revenue: 2903000,
  revenueText: "Cr$ 2.903.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Agnaldo",
      "Ednaldo",
      "Zé Carlos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Luiz Augusto", in: "Clésio" },
      { out: "Frazão", in: "Nenê" },
    ],
  ),
  note: "Gol Sérgio (Capelense) 87'",
});

add({
  date: "1984-12-09",
  phase: "Superturno final",
  opponent: "ASA-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Gilson Cordeiro",
  attendance: 8624,
  revenue: 23397000,
  revenueText: "Cr$ 23.397.000,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho",
    ],
    [
      { out: "Nívio", in: "Zé Carlos" },
      { out: "Luizão", in: "Frank" },
    ],
  ),
  goals: [
    { name: "Édson Silva", minute: 35 },
    { name: "Nívio", minute: 73 },
    { name: "Frank", minute: 80 },
    { name: "Jacozinho", minute: 87 },
  ],
  note: "Título alagoano antecipado",
});

add({
  date: "1984-12-13",
  phase: "Superturno final",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Josival Pedro",
  attendance: 2760,
  revenue: 7312500,
  revenueText: "Cr$ 7.312.500,00",
  manager: MGR,
  ...lineup(
    [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Nenê",
    ],
    [
      { out: "Zezinho", in: "Carlinhos" },
      { out: "Luizão", in: "Frank" },
    ],
  ),
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

console.log("all games:", tally(GAMES));
console.log(
  "excluding excludeFromStats:",
  tally(GAMES.filter((x) => !x.excludeFromStats)),
);

const header = `/** Campeonato Alagoano 1984 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * Caso doping (Zezinho, jun/1984): placar de campo 2x1 vs ASA; officialResult=loss (pontos ao ASA no STJD).
 * Jogo de 13/06/1984 (decisão 1º turno) mantido com excludeFromStats (anulado pelo STJD).
 * CRB campeão do 1º turno; CSA campeão do 2º, 3º e 4º turnos e campeão geral.
 * Contagem oficial: J48 V31 E11 D6 GP84 GC17 (exclui anulado; doping como derrota administrativa).
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; prorrogação 2ºT = 105+N.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1984;

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

const out = resolve(__dirname, "data", "season-1984-alagoano.mjs");
writeFileSync(out, header + JSON.stringify(GAMES, null, 2) + ";\n", "utf8");
console.log("wrote", out);
