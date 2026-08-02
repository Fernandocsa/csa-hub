/**
 * Generates scripts/data/season-1978-alagoano.mjs
 * Run: node scripts/_gen-1978-data.mjs
 *
 * CSA vice-campeão 1978; CRB campeão; decisão 31/01/1979 na season 1978.
 * Técnico: Paulistinha (Wassil Barbosa no jogo da decisão).
 * Soma dos placares listados: J28 V18 E7 D3.
 * Classificação da fonte (tabela): GP56 GC10.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const FUMEI = "Coaracy da Mata (Fumeirão)";
const MOREIRA = "Manoel Moreira";
const JUCA = "Estádio Juca Sampaio";
const NIVALDO = "Estádio José Nivaldo";
const LEAHY = "Estádio Alfredo Leahy";
const M1 = "Paulistinha";
const M2 = "Wassil Barbosa";

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
  date: "1978-08-05",
  phase: "1º turno",
  opponent: "São Sebastião-AL",
  ha: "home",
  gf: 6,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 1548,
  revenue: 32960,
  revenueText: revText(32960),
  manager: M1,
  ...lineup(
    [
      "Carlos",
      "Geraldo",
      "Beto",
      "Timbó",
      "Zezinho",
      "Válter",
      "Peu",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio",
    ],
  ),
  goals: [
    { name: "Élcio" },
    { name: "Élcio" },
    { name: "Élcio" },
    { name: "Hélio" },
    { name: "Hélio" },
    { name: "Hélio" },
  ],
});

add({
  date: "1978-08-13",
  phase: "1º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: FUMEI,
  referee: "Sebastião Canuto",
  attendance: 8893,
  revenue: 229450,
  revenueText: revText(229450),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Peu",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio",
    ],
    [{ out: "Geraldo", in: "Válter" }],
  ),
  goals: [
    { name: "Gabriel", minute: 11 },
    { name: "Gabriel", minute: 44 },
  ],
});

add({
  date: "1978-08-16",
  phase: "1º turno",
  opponent: "Canavieiro-AL",
  ha: "home",
  gf: 6,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 2836,
  revenue: 59900,
  revenueText: revText(59900),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Válter",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio",
    ],
    [
      { out: "Olímpio", in: "Zezinho" },
      { out: "Válter", in: "Peu" },
    ],
  ),
  goals: [
    { name: "Élcio" },
    { name: "Élcio" },
    { name: "Peu" },
    { name: "Peu" },
    { name: "Timbó" },
    { name: "Gabriel" },
  ],
  note:
    "Fonte também indica Geraldo→Válter; omitido por conflito com Válter titular no meio.",
});

add({
  date: "1978-08-20",
  phase: "1º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 5474,
  revenue: 118600,
  revenueText: revText(118600),
  manager: M1,
  note: "Expulsões Zé Preta (CSA); Orlandinho (São Domingos)",
});

add({
  date: "1978-08-27",
  phase: "1º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: JUCA,
  referee: "Sebastião Canuto",
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Válter",
      "Zé Preta",
      "Timbó",
      "Olímpio",
      "Alberto",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio",
    ],
    [
      { out: "Válter", in: "Geraldo" },
      { out: "Alberto", in: "Peu" },
    ],
  ),
  goals: [
    { name: "Soareste", minute: 27 },
    { name: "Élcio", minute: 38, penalty: true },
    { name: "Élcio", minute: 78 },
  ],
});

add({
  date: "1978-09-03",
  phase: "1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 12841,
  revenue: 302541,
  revenueText: revText(302541),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Soareste",
      "Luís Carlos",
      "Peu",
      "Élcio",
      "Hélio",
    ],
    [
      { out: "Olímpio", in: "Zezinho" },
      { out: "Luís Carlos", in: "Válter" },
    ],
  ),
  note: "Gol Silva (CRB) 21'",
});

// ——— Quadrangular do 1º turno ———
add({
  date: "1978-09-07",
  phase: "Quadrangular do 1º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Pedro Rufino",
  revenue: 220000,
  revenueText: revText(220000),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Válter",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio",
    ],
    [
      { out: "Soareste", in: "Peu" },
      { out: "Hélio", in: "Ricardo" },
    ],
  ),
  goals: [{ name: "Peu" }],
});

add({
  date: "1978-09-10",
  phase: "Quadrangular do 1º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 2,
  stadium: REI,
  referee: "Carlos Costa",
  attendance: 10429,
  revenue: 315575,
  revenueText: revText(315575),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Válter",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Alberto",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio",
    ],
    [
      { out: "Luís Carlos", in: "Ricardo" },
      { out: "Élcio", in: "Peu" },
    ],
  ),
  note: "Gols Joãozinho Paulista e Jorge da Sorte (CRB)",
});

add({
  date: "1978-09-13",
  phase: "Quadrangular do 1º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Juarez Inácio",
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Patota",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Betinho",
      "Alberto",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Soareste",
    ],
    [{ out: "Patota", in: "Geraldo" }],
  ),
  goals: [{ name: "Élcio" }],
  note: "Gol Rato Branco (Ferroviário) 81'",
});

// ——— 2º turno ———
add({
  date: "1978-09-17",
  phase: "2º turno",
  opponent: "São Sebastião-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: NIVALDO,
  referee: "José Teles",
  revenue: 34990,
  revenueText: revText(34990),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Betinho",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Peu",
    ],
    [
      { out: "Luís Carlos", in: "Soareste" },
      { out: "Soareste", in: "Válter" },
    ],
  ),
  goals: [{ name: "Élcio" }, { name: "Peu" }],
});

add({
  date: "1978-09-27",
  phase: "2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 2558,
  revenue: 59986,
  revenueText: revText(59986),
  manager: M1,
  ...lineup(
    [
      "Carlos",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Válter",
      "Alberto",
      "Peu",
      "Gabriel",
      "Élcio",
      "Hélio",
    ],
    [{ out: "Hélio", in: "Ricardo" }],
  ),
  goals: [
    { name: "Élcio" },
    { name: "Élcio" },
    { name: "Zezinho" },
  ],
  note: "Gol Ézio (ASA); expulsão Geraldo (CSA)",
});

add({
  date: "1978-10-01",
  phase: "2º turno",
  opponent: "Canavieiro-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: MOREIRA,
  referee: "Pelópidas Argolo",
  revenue: 20150,
  revenueText: revText(20150),
  manager: M1,
  goals: [
    { name: "Hélio", minute: 36 },
    { name: "Élcio", minute: 83 },
    { name: "Peu", minute: 89 },
  ],
});

add({
  date: "1978-10-04",
  phase: "2º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 3,
  ga: 1,
  stadium: REI,
  referee: "Túlio Jatobá",
  revenue: 37450,
  revenueText: revText(37450),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Válter",
      "Luís Carlos",
      "Peu",
      "Ênio Oliveira",
      "Gabriel",
      "Hélio",
    ],
    [
      { out: "Zezinho", in: "Olímpio" },
      { out: "Válter", in: "Alberto" },
    ],
  ),
  goals: [
    { name: "Hélio" },
    {
      name: "Buá",
      ownGoal: true,
      ownGoalDirection: "for",
    },
    { name: "Alberto" },
  ],
  note: "Gol Moadir (Penedense); expulsão Moadir; Buá contra",
});

add({
  date: "1978-10-08",
  phase: "2º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  manager: M1,
  note: "Só placar na fonte",
});

add({
  date: "1978-10-08",
  phase: "2º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 12720,
  revenue: 290890,
  revenueText: revText(290890),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Jorge Siri",
      "Betinho",
      "Gabriel",
      "Élcio",
      "Ênio Oliveira",
    ],
    [
      { out: "Geraldo", in: "Peu" },
      { out: "Gabriel", in: "Hélio" },
    ],
  ),
  goals: [{ name: "Gabriel", minute: 69 }],
  note:
    "Expulsões Flávio/Marcos/Deco (CRB); Ênio Oliveira (CSA); CRB simulou contusões",
});

// ——— Quadrangular do 2º turno ———
add({
  date: "1978-10-19",
  phase: "Quadrangular do 2º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "José Teles",
  attendance: 6441,
  revenue: 194630,
  revenueText: revText(194630),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Betinho",
      "Jorge Siri",
      "Gabriel",
      "Élcio",
      "Hélio",
    ],
    [
      { out: "Betinho", in: "Peu" },
      { out: "Peu", in: "Soareste" },
    ],
  ),
  goals: [
    { name: "Hélio", minute: 60 },
    { name: "Élcio", minute: 75 },
  ],
  note: "Disputa nacionalidade árbitro; Pinguela demitido (ASA)",
});

add({
  date: "1978-10-22",
  phase: "Quadrangular do 2º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "José Teles",
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Alberto",
      "Peu",
      "Jorge Siri",
      "Gabriel",
      "Hélio",
      "Ênio Oliveira",
    ],
    [{ out: "Peu", in: "Soareste" }],
  ),
  goals: [
    { name: "Gabriel" },
    { name: "Hélio" },
    { name: "Jorge Siri" },
  ],
});

add({
  date: "1978-10-29",
  phase: "Quadrangular do 2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "José Teles",
  attendance: 15587,
  revenue: 481660,
  revenueText: revText(481660),
  manager: M1,
  ...lineup(
    [
      "Tião",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Olímpio",
      "Alberto",
      "Jorge Siri",
      "Betinho",
      "Gabriel",
      "Élcio",
      "Ênio Oliveira",
    ],
    [
      { out: "Betinho", in: "Soareste" },
      { out: "Ênio Oliveira", in: "Hélio" },
    ],
  ),
  goals: [{ name: "Jorge Siri", minute: 3 }],
  note:
    "Gol Joãozinho Paulista (CRB) 44'; CSA campeão do 2º turno",
});

// ——— 3º turno ———
add({
  date: "1978-11-05",
  phase: "3º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: LEAHY,
  referee: "Everaldo Holanda",
  attendance: 1714,
  revenue: 35110,
  revenueText: revText(35110),
  manager: M1,
  ...lineup(
    [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Zezinho",
      "Alberto",
      "Almir",
      "Betinho",
      "Jorge Siri",
      "Hélio",
      "Ênio Oliveira",
    ],
    [{ out: "Jorge Siri", in: "Peu" }],
  ),
  goals: [
    { name: "Almir", minute: 45 },
    { name: "Ênio Oliveira", minute: 71, penalty: true },
  ],
});

add({
  date: "1978-11-08",
  phase: "3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Juarez Inácio",
  attendance: 1730,
  revenue: 34690,
  revenueText: revText(34690),
  manager: M1,
  ...lineup(
    [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Válter",
      "Alberto",
      "Jorge Siri",
      "Almir",
      "Ênio Oliveira",
      "Hélio",
      "Soareste",
    ],
    [
      { out: "Alberto", in: "Betinho" },
      { out: "Almir", in: "Peu" },
    ],
  ),
  goals: [{ name: "Ênio Oliveira" }, { name: "Ênio Oliveira" }],
});

add({
  date: "1978-11-12",
  phase: "3º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Túlio Jatobá",
  attendance: 3563,
  revenue: 77750,
  revenueText: revText(77750),
  manager: M1,
  ...lineup(
    [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Válter",
      "Alberto",
      "Jorge Siri",
      "Almir",
      "Ênio Oliveira",
      "Gabriel",
      "Soareste",
    ],
    [
      { out: "Almir", in: "Peu" },
      { out: "Soareste", in: "Betinho" },
    ],
  ),
  goals: [
    { name: "Ênio Oliveira", penalty: true },
    {
      name: "Machado",
      ownGoal: true,
      ownGoalDirection: "for",
    },
  ],
  note:
    "Árbitro passou mal 15'; substituído por Ronaldo Nunes",
});

add({
  date: "1978-11-19",
  phase: "3º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 2863,
  revenue: 61160,
  revenueText: revText(61160),
  manager: M1,
  ...lineup(
    [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Válter",
      "Alberto",
      "Jorge Siri",
      "Almir",
      "Ênio Oliveira",
      "Hélio",
      "Soareste",
    ],
    [
      { out: "Alberto", in: "Luís Carlos" },
      { out: "Ênio Oliveira", in: "Gabriel" },
    ],
  ),
  goals: [{ name: "Hélio", minute: 80 }],
  note: "Expulsão Orlandinho (São Domingos)",
});

add({
  date: "1978-11-26",
  phase: "3º turno",
  opponent: "ASA-AL",
  ha: "away",
  gf: 2,
  ga: 2,
  stadium: FUMEI,
  referee: "José Roberto Wright",
  revenue: 246000,
  revenueText: revText(246000),
  manager: M1,
  ...lineup(
    [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Olímpio",
      "Betinho",
      "Jorge Siri",
      "Luís Carlos",
      "Ênio Oliveira",
      "Almir",
      "Soareste",
    ],
    [
      { out: "Timbó", in: "Beto" },
      { out: "Betinho", in: "Hélio" },
    ],
  ),
  goals: [{ name: "Almir" }, { name: "Hélio" }],
  note:
    "Gols Freitas (ASA) x2; expulsões Jorge Siri/Geraldo/Olímpio (CSA); Haroldo/Marcos Itabaiana (ASA); ASA pagou arbitragem",
});

add({
  date: "1978-12-03",
  phase: "3º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "José Teles",
  revenue: 221950,
  revenueText: revText(221950),
  manager: M1,
  note: "Expulsão Timbó (CSA)",
});

// ——— Quadrangular do 3º turno ———
add({
  date: "1978-12-10",
  phase: "Quadrangular do 3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  manager: M1,
  note: "Só placar na fonte",
});

add({
  date: "1978-12-13",
  phase: "Quadrangular do 3º turno",
  opponent: "ASA-AL",
  ha: "home",
  gf: 1,
  ga: 2,
  stadium: REI,
  referee: "Walquir Pimentel",
  manager: M1,
  ...lineup(
    [
      "Carlos",
      "Geraldo",
      "Beto",
      "Timbó",
      "Zezinho",
      "Alberto",
      "Almir",
      "Jorge Siri",
      "Gabriel",
      "Hélio",
      "Soareste",
    ],
    [
      { out: "Almir", in: "Luís Carlos" },
      { out: "Gabriel", in: "Ênio Oliveira" },
    ],
  ),
  goals: [{ name: "Jorge Siri", minute: 69 }],
  note:
    "Gols Freitas 39', Icinho 90' (ASA); expulsão Jorge Siri; ASA pagou arbitragem",
});

add({
  date: "1978-12-17",
  phase: "Quadrangular do 3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "José Teles",
  revenue: 380630,
  revenueText: revText(380630),
  manager: M1,
  ...lineup(
    [
      "Carlos",
      "Válter",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Soareste",
      "Alberto",
      "Almir",
      "Gabriel",
      "Hélio",
      "Ênio Oliveira",
    ],
    [
      { out: "Soareste", in: "Luís Carlos" },
      { out: "Gabriel", in: "Peu" },
    ],
  ),
  goals: [{ name: "Ênio Oliveira" }],
  note: "Gol Joãozinho Paulista (CRB)",
});

// ——— Decisão do campeonato ———
add({
  date: "1979-01-31",
  phase: "Decisão do campeonato",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: REI,
  referee: "Luís Carlos Félix",
  attendance: 17518,
  revenue: 575600,
  revenueText: revText(575600),
  manager: M2,
  ...lineup(
    [
      "Carlos",
      "Beto",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Alberto",
      "Luís Carlos",
      "Élcio",
      "Jorge Siri",
      "Hélio",
      "Soareste",
    ],
    [
      { out: "Élcio", in: "Peu" },
      { out: "Hélio", in: "Gabriel" },
    ],
  ),
  note:
    "CRB campeão apesar CSA 43 PG vs CRB 41; critério desempate não detalhado na fonte",
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
const expectedPlacares = { n: 28, v: 18, e: 7, d: 3 };
for (const k of Object.keys(expectedPlacares)) {
  if (t[k] !== expectedPlacares[k])
    console.error(`MISMATCH ${k}: got ${t[k]} expected ${expectedPlacares[k]}`);
}
console.log("classificação fonte (tabela): J28 GP56 GC10");
console.log(
  `GP/GC soma vs tabela: GP ${t.gf} vs 56 (Δ${t.gf - 56}); GC ${t.ga} vs 10 (Δ${t.ga - 10})`,
);

const header = `/** Campeonato Alagoano 1978 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA vice-campeão 1978; CRB campeão; decisão em 31/01/1979 permanece na season 1978.
 * Cabeçalhos 2º/3º turno na fonte indicam 1976 por erro tipográfico.
 * Técnico: Paulistinha (Wassil Barbosa na decisão).
 * Soma dos placares listados: J28 V18 E7 D3 GP${t.gf} GC${t.ga}.
 * Classificação da fonte (tabela): GP56 GC10.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 53' do 2ºT = 98.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1978;

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

const out = resolve(__dirname, "data", "season-1978-alagoano.mjs");
writeFileSync(out, header + JSON.stringify(GAMES, null, 2) + ";\n", "utf8");
console.log("wrote", out);
