/**
 * Generates scripts/data/season-1979-alagoano.mjs
 * Run: node scripts/_gen-1979-data.mjs
 *
 * CSA 4º em 1979; CRB campeão; superturno top-4.
 * Técnicos: Vassil Barbosa → Hélio Miranda → Zé Galego.
 * Soma dos placares listados: J34 V19 E6 D9 GP67 GC33.
 * Classificação final da fonte: GP67 GC32 (diferença de 1 gol contra).
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const MOREIRA = "Manoel Moreira";
const JUCA = "Estádio Juca Sampaio";
const M1 = "Vassil Barbosa";
const M2 = "Hélio Miranda";
const M3 = "Zé Galego";

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
  date: "1979-03-25",
  phase: "1º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "Pedro Rufino",
  revenue: 77930,
  revenueText: revText(77930),
  manager: M1,
  ...lineup(
    [
      "Dida",
      "Beto",
      "Haroldo",
      "Paulo",
      "Zezinho",
      "Jorge Siri",
      "Luís Carlos",
      "Peu",
      "Paulinho",
      "Gilmar",
      "Ênio Oliveira",
    ],
    [
      { out: "Zezinho", in: "Hélio" },
      { out: "Paulinho", in: "Cláudio" },
    ],
  ),
  goals: [
    { name: "Ênio Oliveira", minute: 57 },
    { name: "Gilmar", minute: 69 },
    { name: "Peu", minute: 87 },
  ],
  note: "Gol Zezinho (Ferroviário) 12'",
});

add({
  date: "1979-04-01",
  phase: "1º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  revenue: 101700,
  revenueText: revText(101700),
  manager: M1,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Soareste",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira",
    ],
  ),
  goals: [
    { name: "Gilmar" },
    { name: "Gilmar" },
    { name: "Ênio Oliveira" },
  ],
});

add({
  date: "1979-04-08",
  phase: "1º turno",
  opponent: "Capelense-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: MOREIRA,
  referee: "João Vilela",
  attendance: 30000,
  manager: M1,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Soareste",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira",
    ],
    [{ out: "Soareste", in: "Cláudio" }],
  ),
  goals: [
    { name: "Ênio Oliveira" },
    { name: "Gilmar" },
    { name: "Peu" },
  ],
});

add({
  date: "1979-04-11",
  phase: "1º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  revenue: 71290,
  revenueText: revText(71290),
  manager: M1,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Soareste",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira",
    ],
    [{ out: "Jorge Siri", in: "Alberto" }],
  ),
  note: "ASA revoltado com anulação de gol de Freitas",
});

add({
  date: "1979-04-15",
  phase: "1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 4,
  ga: 1,
  stadium: REI,
  referee: "Juarez Inácio",
  revenue: 39420,
  revenueText: revText(39420),
  manager: M1,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Hélio",
      "Alberto",
      "Peu",
      "Luís Carlos",
      "Cláudio",
      "Gilmar",
      "Ênio Oliveira",
    ],
  ),
  goals: [
    { name: "Peu" },
    { name: "Gilmar" },
    { name: "Gilmar" },
    { name: "Cláudio" },
  ],
  note: "Gol Gilberto (CSE)",
});

add({
  date: "1979-04-22",
  phase: "1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 2,
  stadium: REI,
  referee: "José Teles",
  attendance: 12272,
  revenue: 292760,
  revenueText: revText(292760),
  manager: M1,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Beto",
      "Haroldo",
      "Zezinho",
      "Alberto",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira",
    ],
    [
      { out: "Peu", in: "Paulo" },
      { out: "Ênio Oliveira", in: "Soareste" },
    ],
  ),
  note: "Gols Mundinho e Jorge da Sorte; expulsões Beto e Zezinho (CSA)",
});

// ——— Quadrangular do 1º turno ———
add({
  date: "1979-04-29",
  phase: "Quadrangular do 1º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  manager: M1,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Paulo",
      "Haroldo",
      "Evaristo",
      "Alberto",
      "Soareste",
      "Peu",
      "Jorge Siri",
      "Gilmar",
      "Caneta",
    ],
  ),
  goals: [{ name: "Jorge Siri", penalty: true }],
  note: "Gol Rosalvinho (Penedense)",
});

add({
  date: "1979-05-03",
  phase: "Quadrangular do 1º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Pedro Rufino",
  revenue: 128020,
  revenueText: revText(128020),
  manager: M1,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Alberto",
      "Soareste",
      "Jorge Siri",
      "Paulinho",
      "Gilmar",
      "Ênio Oliveira",
    ],
    [
      { out: "Geraldo", in: "Evaristo" },
      { out: "Soareste", in: "Peu" },
    ],
  ),
  goals: [{ name: "Paulinho" }],
  note: "Gol Freitas (ASA)",
});

add({
  date: "1979-05-06",
  phase: "Quadrangular do 1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: REI,
  referee: "Antônio Morais",
  revenue: 390040,
  revenueText: revText(390040),
  manager: M1,
  ...lineup(
    [
      "Dida",
      "Evaristo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Soareste",
      "Jorge Siri",
      "Alex",
      "Paulinho",
      "Gilmar",
      "Ênio Oliveira",
    ],
    [
      { out: "Paulinho", in: "Cláudio" },
      { out: "Ênio Oliveira", in: "Peu" },
    ],
  ),
  note: "Gol Alberto (CRB) 70'; expulsões Soareste/Beto (CSA); Silva (CRB)",
});

// ——— 2º turno ———
add({
  date: "1979-05-13",
  phase: "2º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: JUCA,
  referee: "Sebastião Canuto",
  manager: M2,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Haroldo",
      "Paulo",
      "Evaristo",
      "Alberto",
      "Alex",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Peu",
    ],
    [
      { out: "Jorge Siri", in: "Cláudio" },
      { out: "Peu", in: "Paulinho" },
    ],
  ),
  note: "Gol Gilberto (CSE) 49'",
});

add({
  date: "1979-05-20",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  revenue: 66630,
  revenueText: revText(66630),
  manager: M2,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Haroldo",
      "Paulo",
      "Evaristo",
      "Alberto",
      "Alex",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira",
    ],
    [
      { out: "Alberto", in: "Paulinho" },
      { out: "Ênio Oliveira", in: "Peu" },
    ],
  ),
  goals: [{ name: "Gilmar" }, { name: "Jorge Siri" }],
  note: "Gol Zezinho (Ferroviário)",
});

add({
  date: "1979-05-30",
  phase: "2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 4,
  ga: 1,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 2047,
  revenue: 44560,
  revenueText: revText(44560),
  manager: M2,
  goals: [
    { name: "Gilmar" },
    { name: "Ênio Oliveira" },
    { name: "Beto" },
    { name: "Peu" },
  ],
  note: "Gol Dado (Penedense)",
});

add({
  date: "1979-06-02",
  phase: "2º turno",
  opponent: "São Sebastião-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  manager: M2,
  goals: [{ name: "Jorge Siri", minute: 42 }],
});

add({
  date: "1979-06-10",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 2,
  ga: 2,
  stadium: FUMEI,
  referee: "Arnaldo César Coelho",
  revenue: 301000,
  revenueText: revText(301000),
  manager: M2,
  ...lineup(
    [
      "Dida",
      "Geraldo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alex",
      "Luís Carlos",
      "Gilmar",
      "Ênio Oliveira",
      "Peu",
      "Ézio",
    ],
    [
      { out: "Alex", in: "Alberto" },
      { out: "Ézio", in: "Jorge Siri" },
    ],
  ),
  goals: [{ name: "Peu" }, { name: "Ézio" }],
  note: "Gols Carioca e Icinho (ASA); ASA custeou arbitragem",
});

add({
  date: "1979-06-17",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Antônio Morais",
  revenue: 592840,
  revenueText: revText(592840),
  manager: M2,
  goals: [{ name: "Peu" }, { name: "Radar" }],
  note:
    "Gol Galba (CRB); expulsões Alex/Geraldo (CSA); Mundinho (CRB); Silva (CRB) fratura braço",
});

// ——— Quadrangular do 2º turno + decisão ———
add({
  date: "1979-06-24",
  phase: "Quadrangular do 2º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 1,
  stadium: REI,
  referee: "Pedro Rufino",
  revenue: 129000,
  revenueText: revText(129000),
  manager: M2,
  goals: [{ name: "Ênio Oliveira" }, { name: "Jorge Siri", minute: 82 }],
  note: "Gol Índio (CSE) 1ºT",
});

add({
  date: "1979-06-27",
  phase: "Quadrangular do 2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 4,
  ga: 3,
  stadium: REI,
  referee: "Luiz Carlos Félix",
  attendance: 8943,
  revenue: 302085,
  revenueText: revText(302085),
  manager: M2,
  goals: [
    { name: "Jorge Siri", minute: 4 },
    { name: "Ézio", minute: 44 },
    { name: "Ézio", minute: 57 },
    { name: "Almir", minute: 85 },
  ],
  note: "Gols ASA: Leônidas 25, Zeca 26, Canhoto 39; ASA custeou arbitragem",
});

add({
  date: "1979-07-01",
  phase: "Quadrangular do 2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Luiz Carlos Félix",
  attendance: 27415,
  revenue: 970280,
  revenueText: revText(970280),
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Geraldo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alex",
      "Luís Carlos",
      "Gilmar",
      "Jorge Siri",
      "Peu",
      "Ézio",
    ],
    [
      { out: "Alex", in: "Ênio Oliveira" },
      { out: "Ézio", in: "Almir" },
    ],
  ),
  note: "Expulsões Geraldo (CSA); Jorge da Sorte (CRB)",
});

add({
  date: "1979-07-04",
  phase: "Decisão do 2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Walquir Pimentel",
  attendance: 19402,
  revenue: 717990,
  revenueText: revText(717990),
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Alberto",
      "Zé Luiz",
      "Beto",
      "Evaristo",
      "Alex",
      "Gilmar",
      "Luís Carlos",
      "Ênio Oliveira",
      "Peu",
      "Ézio",
    ],
    [
      { out: "Alberto", in: "Zezinho" },
      { out: "Ênio Oliveira", in: "Jorge Siri" },
    ],
  ),
  goals: [
    { name: "Ézio", minute: 25 },
    { name: "Gilmar", minute: 42 },
  ],
  note: "CSA campeão do 2º turno",
});

// ——— 3º turno ———
add({
  date: "1979-07-15",
  phase: "3º turno",
  opponent: "São Sebastião-AL",
  ha: "home",
  gf: 7,
  ga: 0,
  stadium: REI,
  manager: M2,
  note: "Só placar na fonte",
});

add({
  date: "1979-07-22",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Juarez Inácio",
  attendance: 8101,
  revenue: 196170,
  revenueText: revText(196170),
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Alberto",
      "Zé Luiz",
      "Beto",
      "Evaristo",
      "Alex",
      "Gilmar",
      "Luís Carlos",
      "Ênio Oliveira",
      "Radar",
      "Ézio",
    ],
    [
      { out: "Gilmar", in: "Peu" },
      { out: "Ézio", in: "Jorge Siri" },
    ],
  ),
});

add({
  date: "1979-07-28",
  phase: "3º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Pedro Rufino",
  attendance: 2371,
  revenue: 51600,
  revenueText: revText(51600),
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Evaristo",
      "Zé Luiz",
      "Haroldo",
      "Luizinho",
      "Belisco",
      "Almir",
      "Luís Carlos",
      "Ênio Oliveira",
      "Radar",
      "Ézio",
    ],
    [
      { out: "Almir", in: "Gilmar" },
      { out: "Ênio Oliveira", in: "Jorge Siri" },
    ],
  ),
  goals: [
    { name: "Ênio Oliveira" },
    { name: "Almir" },
    { name: "Almir" },
    { name: "Gilmar" },
  ],
  note: "CSA comprou mando",
});

add({
  date: "1979-08-01",
  phase: "3º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  revenue: 66440,
  revenueText: revText(66440),
  manager: M2,
  goals: [
    { name: "Gilmar", minute: 8 },
    { name: "Gilmar", minute: 9 },
    { name: "Ênio Oliveira", minute: 88 },
  ],
});

add({
  date: "1979-08-05",
  phase: "3º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Evaristo",
      "Paulo",
      "Haroldo",
      "Luizinho",
      "Alberto",
      "Gilmar",
      "Luís Carlos",
      "Jorge Siri",
      "Radar",
      "Ézio",
    ],
    [
      { out: "Jorge Siri", in: "Paulinho" },
      { out: "Radar", in: "Peu" },
    ],
  ),
  goals: [
    { name: "Radar" },
    { name: "Gilmar", penalty: true },
    { name: "Peu" },
    { name: "Almir" },
  ],
});

add({
  date: "1979-08-12",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "Antônio Morais",
  revenue: 362230,
  revenueText: revText(362230),
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Evaristo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alex",
      "Gilmar",
      "Luís Carlos",
      "Ênio Oliveira",
      "Peu",
      "Ézio",
    ],
    [
      { out: "Peu", in: "Alberto" },
      { out: "Ézio", in: "Jorge Siri" },
    ],
  ),
  goals: [
    { name: "Gilmar", minute: 21 },
    { name: "Gilmar", minute: 67 },
    { name: "Gilmar", minute: 68 },
  ],
  note: "Gol Alberto (CRB) 65'",
});

// ——— Quadrangular do 3º turno ———
add({
  date: "1979-08-15",
  phase: "Quadrangular do 3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Luiz Carlos Félix",
  attendance: 4138,
  revenue: 313125,
  revenueText: revText(313125),
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Alberto",
      "Zé Luiz",
      "Beto",
      "Evaristo",
      "Luís Carlos",
      "Gilmar",
      "Ézio",
      "Ênio Oliveira",
      "Peu",
      "Jorge Siri",
    ],
    [{ out: "Jorge Siri", in: "Paulinho" }],
  ),
  goals: [{ name: "Gilmar" }, { name: "Gilmar" }, { name: "Peu" }],
  note:
    "ASA custeou arbitragem; fonte listava Gilmar duas vezes — Peu no ataque (marcou)",
});

add({
  date: "1979-08-19",
  phase: "Quadrangular do 3º turno",
  opponent: "Capelense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Evaristo",
      "Haroldo",
      "Beto",
      "Luizinho",
      "Alex",
      "Luís Carlos",
      "Gilmar",
      "Jorge Siri",
      "Almir",
      "Ézio",
    ],
    [
      { out: "Alex", in: "Alberto" },
      { out: "Almir", in: "Peu" },
    ],
  ),
  goals: [{ name: "Ézio" }, { name: "Ézio" }, { name: "Peu" }],
});

add({
  date: "1979-08-26",
  phase: "Quadrangular do 3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 3,
  stadium: REI,
  manager: M2,
  note: "Só placar na fonte",
});

// ——— Superturno final ———
add({
  date: "1979-08-30",
  phase: "Superturno final",
  opponent: "CSE-AL",
  ha: "home",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "Juarez Inácio",
  attendance: 2489,
  revenue: 81460,
  revenueText: revText(81460),
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Alberto",
      "Zé Luiz",
      "Beto",
      "Evaristo",
      "Luís Carlos",
      "Gilmar",
      "Peu",
      "Ênio Oliveira",
      "Radar",
      "Jorge Siri",
    ],
    [
      { out: "Luís Carlos", in: "Alex" },
      { out: "Radar", in: "Almir" },
    ],
  ),
  goals: [
    {
      name: "Zé Luiz",
      minute: 4,
      ownGoal: true,
      ownGoalDirection: "against",
    },
    { name: "Gilmar", minute: 32, penalty: true },
    { name: "Zé Luiz", minute: 87 },
    { name: "Almir", minute: 98 },
  ],
  note: "Expulsões Alex (CSA) e Marcos (CSE)",
});

add({
  date: "1979-09-02",
  phase: "Superturno final",
  opponent: "ASA-AL",
  ha: "away",
  gf: 0,
  ga: 2,
  stadium: FUMEI,
  referee: "Luiz Carlos Félix",
  manager: M2,
  ...lineup(
    [
      "Samuel",
      "Evaristo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alberto",
      "Peu",
      "Jorge Siri",
      "Ênio Oliveira",
      "Gilmar",
      "Ézio",
    ],
    [{ out: "Ézio", in: "Almir" }],
  ),
  note:
    "Gols Jorge Luiz 31, Carioca 63; interrompida 84' falta energia; ASA custeou arbitragem",
});

add({
  date: "1979-09-09",
  phase: "Superturno final",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 3,
  stadium: REI,
  referee: "Arnaldo César Coelho",
  revenue: 480000,
  revenueText: revText(480000),
  manager: M2,
  ...lineup(
    [
      "Valvir",
      "Geraldo",
      "Zé Luiz",
      "Paulo",
      "Evaristo",
      "Alberto",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira",
    ],
    [
      { out: "Peu", in: "Almir" },
      { out: "Gilmar", in: "Paulinho" },
    ],
  ),
  goals: [{ name: "Ênio Oliveira", minute: 42, penalty: true }],
  note: "Gols Silva 16, Itamar 32, Silva 50 (CRB)",
});

add({
  date: "1979-09-16",
  phase: "Superturno final",
  opponent: "CSE-AL",
  ha: "away",
  gf: 1,
  ga: 2,
  stadium: JUCA,
  referee: "Pelópidas Argolo",
  manager: M3,
  ...lineup(
    [
      "Samuel",
      "Luizinho",
      "Zé Luiz",
      "Paulo",
      "Evaristo",
      "Alberto",
      "Almir",
      "Belisco",
      "Ênio Oliveira",
      "Gilmar",
      "Ézio",
    ],
  ),
  goals: [{ name: "Gilmar", minute: 68 }],
  note: "Gols Ailton 50, Geo 73 (CSE)",
});

add({
  date: "1979-09-19",
  phase: "Superturno final",
  opponent: "ASA-AL",
  ha: "home",
  gf: 0,
  ga: 2,
  stadium: REI,
  referee: "Pelópidas Argolo",
  revenue: 132320,
  revenueText: revText(132320),
  manager: M3,
  ...lineup(
    [
      "Nego",
      "Paulo",
      "Zé Luiz",
      "Luizinho",
      "Cardoso",
      "Alberto",
      "Belisco",
      "Luís Carlos",
      "Jorge Siri",
      "Peu",
      "Ézio",
    ],
    [
      { out: "Nego", in: "Evaristo" },
      { out: "Belisco", in: "Almir" },
      { out: "Jorge Siri", in: "Ênio Oliveira" },
    ],
  ),
  note: "Gols Freitas 53 e 61",
});

add({
  date: "1979-09-23",
  phase: "Superturno final",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 2,
  stadium: REI,
  referee: "Arnaldo César Coelho",
  attendance: 15331,
  revenue: 531670,
  revenueText: revText(531670),
  manager: M3,
  ...lineup(
    [
      "Samuel",
      "Evaristo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alberto",
      "Belisco",
      "Almir",
      "Ênio Oliveira",
      "Gilmar",
      "Ézio",
    ],
    [
      { out: "Belisco", in: "Luís Carlos" },
      { out: "Ézio", in: "Peu" },
    ],
  ),
  goals: [
    {
      name: "Zé Luiz",
      minute: 20,
      ownGoal: true,
      ownGoalDirection: "against",
    },
  ],
  note: "Gol Silva (CRB) 2ºT",
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

const t = tally(GAMES);
console.log("GAMES.length:", GAMES.length);
console.log("tally (soma dos placares):", t);
const expectedPlacares = { n: 34, v: 19, e: 6, d: 9, gf: 67, ga: 33 };
for (const k of Object.keys(expectedPlacares)) {
  if (t[k] !== expectedPlacares[k])
    console.error(`MISMATCH ${k}: got ${t[k]} expected ${expectedPlacares[k]}`);
}
console.log("classificação fonte (cabeçalho): J34 V19 E6 D9 GP67 GC32");

const header = `/** Campeonato Alagoano 1979 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA 4º colocado em 1979; CRB campeão; regulamento do superturno define os quatro primeiros.
 * Técnicos: Vassil Barbosa → Hélio Miranda → Zé Galego.
 * Soma dos placares listados: J34 V19 E6 D9 GP67 GC33.
 * Classificação final da fonte: GP67 GC32 (diferença de 1 gol contra).
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 53' do 2ºT = 98.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1979;

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

const out = resolve(__dirname, "data", "season-1979-alagoano.mjs");
writeFileSync(out, header + JSON.stringify(GAMES, null, 2) + ";\n", "utf8");
console.log("wrote", out);
