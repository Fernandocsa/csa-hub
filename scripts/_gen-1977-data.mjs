/**
 * Generates scripts/data/season-1977-alagoano.mjs
 * Run: node scripts/_gen-1977-data.mjs
 *
 * CSA 3º 1977; CRB campeão; ASA não disputou (Fumeirão).
 * Sem técnico na fonte; decisão CRB x CSE sem CSA.
 * Soma dos placares listados: J27 V15 E5 D7 GP47.
 * Classificação da fonte (tabela): GC22.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const MOREIRA = "Manoel Moreira";
const JUCA = "Estádio Juca Sampaio";
const LEAHY = "Estádio Alfredo Leahy";

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

// ——— 1ª fase do 1º turno ———
add({
  date: "1977-03-06",
  phase: "1ª fase do 1º turno",
  opponent: "Guarany-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 985,
  revenue: 13564,
  revenueText: revText(13564),
  ...lineup(
    [
      "Milano",
      "Geraldo",
      "Ulisses",
      "Alberto",
      "Zequinha",
      "Muçurica",
      "Soareste",
      "Jorge Siri",
      "Gilmar",
      "Almir",
      "Ricardo",
    ],
    [{ out: "Gilmar", in: "Jorge Nunes" }],
  ),
  goals: [{ name: "Almir", minute: 45 }],
});

add({
  date: "1977-03-23",
  phase: "1ª fase do 1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 2158,
  revenue: 31509,
  revenueText: revText(31509),
  ...lineup(
    [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Alberto",
      "Soareste",
      "Ênio Oliveira",
      "Gilmar",
      "Almir",
      "Zequinha",
    ],
    [
      { out: "Geraldo", in: "Muçurica" },
      { out: "Zequinha", in: "Serginho" },
    ],
  ),
  goals: [{ name: "Almir", minute: 50 }],
  note: "Gol Augusto (CSE) 74'",
});

add({
  date: "1977-04-03",
  phase: "1ª fase do 1º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 4,
  ga: 2,
  stadium: REI,
  referee: "Sebastião Canuto",
  revenue: 49290,
  revenueText: revText(49290),
  ...lineup(
    [
      "Nego",
      "Alberto",
      "Ulisses",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Almir",
      "Ênio Oliveira",
      "Soareste",
      "Gilmar",
      "Ricardo",
    ],
    [{ out: "Ricardo", in: "Zequinha" }],
  ),
  goals: [
    { name: "Alberto", minute: 40, penalty: true },
    { name: "Gilmar", minute: 41 },
    { name: "Almir", minute: 58 },
    { name: "Soareste", minute: 80 },
  ],
  note: "Gols Mozart 5', Aílton 75' (São Domingos); fonte Timbóe→Timbó",
});

add({
  date: "1977-04-06",
  phase: "1ª fase do 1º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 6,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 1495,
  revenue: 20802,
  revenueText: revText(20802),
  ...lineup(
    [
      "Nego",
      "Alberto",
      "Ulisses",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Soareste",
      "Ênio Oliveira",
      "Almir",
      "Gilmar",
      "Ricardo",
    ],
    [
      { out: "Gilmar", in: "Misso" },
      { out: "Ricardo", in: "Zequinha" },
    ],
  ),
  goals: [
    { name: "Ênio Oliveira", minute: 8 },
    { name: "Alberto", minute: 35, penalty: true },
    { name: "Almir", minute: 40 },
    { name: "Gilmar", minute: 44 },
    { name: "Misso", minute: 75 },
    { name: "Ênio Oliveira", minute: 87 },
  ],
  note: "Gol Alcides (Penedense) 64'",
});

add({
  date: "1977-04-10",
  phase: "1ª fase do 1º turno",
  opponent: "Canavieiro-AL",
  ha: "away",
  gf: 1,
  ga: 0,
  stadium: MOREIRA,
  referee: "Sebastião Canuto",
  ...lineup(
    [
      "Nego",
      "Alberto",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Almir",
      "Ênio Oliveira",
      "Soareste",
      "Gilmar",
      "Zequinha",
    ],
    [{ out: "Almir", in: "Misso" }],
  ),
  goals: [{ name: "Ênio Oliveira", minute: 87 }],
});

add({
  date: "1977-04-17",
  phase: "1ª fase do 1º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 3667,
  revenue: 51320,
  revenueText: revText(51320),
  ...lineup(
    [
      "Nego",
      "Alberto",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Almir",
      "Ênio Oliveira",
      "Soareste",
      "Gilmar",
      "Zequinha",
    ],
    [{ out: "Almir", in: "Misso" }],
  ),
  goals: [
    { name: "Gilmar", minute: 43 },
    { name: "Gilmar", minute: 80 },
  ],
  note: "Expulsão Capeta (Ferroviário)",
});

add({
  date: "1977-04-21",
  phase: "1ª fase do 1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 11096,
  revenue: 166603,
  revenueText: revText(166603),
  ...lineup(
    [
      "Nego",
      "Alberto",
      "Ulisses",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Almir",
      "Ênio Oliveira",
      "Zequinha",
      "Gilmar",
      "Ricardo",
    ],
    [
      { out: "Muçurica", in: "Dão" },
      { out: "Ênio Oliveira", in: "Misso" },
    ],
  ),
  note: "Quatro meias na fonte; gol Roberval (CRB) 75'",
});

// ——— Quadrangular do 1º turno ———
add({
  date: "1977-04-24",
  phase: "Quadrangular do 1º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  referee: "Rubens Cerqueira",
  ...lineup(
    [
      "Nego",
      "Almiro",
      "Ulisses",
      "Timbó",
      "Ênio",
      "Alberto",
      "Almir",
      "Ênio Oliveira",
      "Zequinha",
      "Gilmar",
      "Ricardo",
    ],
    [
      { out: "Gilmar", in: "Misso" },
      { out: "Ricardo", in: "Dão" },
    ],
  ),
  goals: [{ name: "Almir", minute: 50 }],
  note: "Gol Reginaldo (CSE) 4'",
});

add({
  date: "1977-04-27",
  phase: "Quadrangular do 1º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 1,
  ga: 0,
  stadium: REI,
  referee: "Rubens Cerqueira",
  revenue: 111840,
  revenueText: revText(111840),
  ...lineup(
    [
      "Nego",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Alberto",
      "Soareste",
      "Ênio Oliveira",
      "Misso",
      "Zequinha",
    ],
    [
      { out: "Alberto", in: "Gilmar" },
      { out: "Zequinha", in: "Ricardo" },
    ],
  ),
  goals: [{ name: "Gilmar", minute: 73 }],
});

add({
  date: "1977-05-01",
  phase: "Quadrangular do 1º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 1,
  ga: 3,
  stadium: REI,
  referee: "Rubens Cerqueira",
  attendance: 11288,
  revenue: 182489,
  revenueText: revText(182489),
  ...lineup(
    [
      "Nego",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Almir",
      "Soareste",
      "Misso",
      "Gilmar",
      "Zequinha",
    ],
    [
      { out: "Almiro", in: "Alberto" },
      { out: "Zequinha", in: "Ricardo" },
    ],
  ),
  goals: [{ name: "Misso", minute: 38 }],
  note: "Gols Silva 30', Antônio Carlos 32', Silva 83' (CRB)",
});

// ——— 1ª fase do 2º turno ———
add({
  date: "1977-05-08",
  phase: "1ª fase do 2º turno",
  opponent: "Guarany-AL",
  ha: "home",
  gf: 4,
  ga: 0,
  stadium: REI,
  referee: "Moacir Monteiro",
  attendance: 850,
  revenue: 12340,
  revenueText: revText(12340),
  ...lineup(
    [
      "Milano",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Timbó",
      "Alberto",
      "Soareste",
      "Gabriel",
      "Misso",
      "Ênio Oliveira",
      "Ricardo",
    ],
    [
      { out: "Alberto", in: "Muçurica" },
      { out: "Ênio Oliveira", in: "Almir" },
    ],
  ),
  goals: [
    { name: "Ricardo", minute: 10 },
    { name: "Ênio Oliveira", minute: 36 },
    { name: "Ênio Oliveira", minute: 40 },
    { name: "Ricardo", minute: 76 },
  ],
});

add({
  date: "1977-05-15",
  phase: "1ª fase do 2º turno",
  opponent: "CSE-AL",
  ha: "away",
  gf: 0,
  ga: 0,
  stadium: JUCA,
  referee: "Sebastião Canuto",
  revenue: 42000,
  revenueText: revText(42000),
  ...lineup(
    [
      "Milano",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Timbó",
      "Muçurica",
      "Soareste",
      "Ênio Oliveira",
      "Gabriel",
      "Almir",
      "Zequinha",
    ],
    [{ out: "Gabriel", in: "Misso" }],
  ),
});

add({
  date: "1977-05-22",
  phase: "1ª fase do 2º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 0,
  ga: 3,
  stadium: REI,
  referee: "Antônio Morais",
  attendance: 2967,
  revenue: 43061,
  revenueText: revText(43061),
  ...lineup(
    [
      "Milano",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Timbó",
      "Alberto",
      "Almir",
      "Dão",
      "Ênio Oliveira",
      "Assis",
      "Ricardo",
    ],
    [
      { out: "Alberto", in: "Soareste" },
      { out: "Ricardo", in: "Zequinha" },
    ],
  ),
  note:
    "Gols Jorge Siri 48', Batoré 72', Jorge da Sorte 84' (Ferroviário); expulsão Jorge Siri (Ferroviário)",
});

add({
  date: "1977-05-29",
  phase: "1ª fase do 2º turno",
  opponent: "Penedense-AL",
  ha: "away",
  gf: 2,
  ga: 1,
  stadium: LEAHY,
  referee: "Sebastião Canuto",
  ...lineup(
    [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Alberto",
      "Gilmar",
      "Misso",
      "Soareste",
      "Assis",
      "Ênio Oliveira",
    ],
    [
      { out: "Soareste", in: "Muçurica" },
      { out: "Assis", in: "Serginho" },
    ],
  ),
  goals: [
    { name: "Alberto", minute: 24 },
    { name: "Misso", minute: 82 },
  ],
  note: "Quatro meias; gol Saulzinho pênalti 59' (Penedense)",
});

add({
  date: "1977-06-05",
  phase: "1ª fase do 2º turno",
  opponent: "São Domingos-AL",
  ha: "away",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 1060,
  revenue: 26760,
  revenueText: revText(26760),
  ...lineup(
    [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Alberto",
      "Gilmar",
      "Soareste",
      "Ênio Oliveira",
      "Misso",
      "Serginho",
    ],
    [
      { out: "Gilmar", in: "Almir" },
      { out: "Serginho", in: "Ricardo" },
    ],
  ),
  goals: [
    { name: "Ênio", minute: 35 },
    { name: "Almir", minute: 72 },
  ],
});

add({
  date: "1977-06-09",
  phase: "1ª fase do 2º turno",
  opponent: "Canavieiro-AL",
  ha: "home",
  gf: 1,
  ga: 3,
  stadium: REI,
  referee: "Juarez Inácio",
  attendance: 1592,
  revenue: 25573,
  revenueText: revText(25573),
  ...lineup(
    [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Dão",
      "Ênio Oliveira",
      "Misso",
      "Assis",
      "Zequinha",
    ],
    [{ out: "Ênio Oliveira", in: "Almir" }],
  ),
  goals: [{ name: "Misso", minute: 11 }],
  note:
    "Gols Toninho 24', Alcidésio 54', Rosquinha pênalti 76' (Canavieiro)",
});

add({
  date: "1977-06-18",
  phase: "1ª fase do 2º turno",
  opponent: "CRB-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 9075,
  revenue: 145906,
  revenueText: revText(145906),
  ...lineup(
    [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Alberto",
      "Gilmar",
      "Almir",
      "Soareste",
      "Misso",
      "Ricardo",
    ],
    [
      { out: "Geraldo", in: "Almiro" },
      { out: "Ricardo", in: "Serginho" },
    ],
  ),
  goals: [
    { name: "Gilmar", minute: 11 },
    { name: "Misso", minute: 31 },
    { name: "Almir", minute: 87 },
  ],
  note: "Expulsões Almir/Misso (CSA); Fifi (CRB)",
});

// ——— 1ª fase do 3º turno ———
add({
  date: "1977-07-20",
  phase: "1ª fase do 3º turno",
  opponent: "Penedense-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "José Minervino",
  attendance: null,
  revenue: null,
  ...lineup(
    [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Soareste",
      "Ênio Oliveira",
      "Nilton Melo",
      "Gilmar",
      "Ricardo",
    ],
  ),
  goals: [
    { name: "Gilmar", minute: 20 },
    { name: "Nilton Melo", minute: 35 },
    { name: "Gilmar", minute: 60 },
  ],
  note: "Portões abertos",
});

add({
  date: "1977-07-24",
  phase: "1ª fase do 3º turno",
  opponent: "Ferroviário-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: REI,
  referee: "Pedro Rufino",
  attendance: 2503,
  revenue: 37840,
  revenueText: revText(37840),
  note:
    "Gol Jorge da Sorte 1'; expulsões Alberto (CSA); Brito (Ferroviário); sem escalação na fonte",
});

add({
  date: "1977-07-31",
  phase: "1ª fase do 3º turno",
  opponent: "Canavieiro-AL",
  ha: "away",
  gf: 2,
  ga: 1,
  stadium: MOREIRA,
  referee: "Antônio Morais",
  ...lineup(
    [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Gilmar",
      "Soareste",
      "Almir",
      "Ênio Oliveira",
      "Misso",
    ],
    [
      { out: "Almir", in: "Sérgio" },
      { out: "Misso", in: "Ricardo" },
    ],
  ),
  goals: [
    { name: "Ênio Oliveira", minute: 25 },
    { name: "Misso", minute: 52 },
  ],
  note: "Gol Ferreira (Canavieiro) 71'",
});

add({
  date: "1977-08-07",
  phase: "1ª fase do 3º turno",
  opponent: "Guarany-AL",
  ha: "home",
  gf: 3,
  ga: 0,
  stadium: REI,
  referee: "Pelópidas Argolo",
  attendance: 2180,
  revenue: 43637,
  revenueText: revText(43637),
  ...lineup(
    [
      "Milano",
      "Geraldo",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Soareste",
      "Ênio Oliveira",
      "Gilmar",
      "Almir",
      "Misso",
    ],
    [
      { out: "Muçurica", in: "Alberto" },
      { out: "Misso", in: "Ricardo" },
    ],
  ),
  goals: [
    { name: "Ênio Oliveira", minute: 5 },
    { name: "Ênio Oliveira", minute: 61, penalty: true },
    { name: "Ênio Oliveira", minute: 81, penalty: true },
  ],
});

add({
  date: "1977-08-17",
  phase: "1ª fase do 3º turno",
  opponent: "CSE-AL",
  ha: "home",
  gf: 1,
  ga: 1,
  stadium: REI,
  note: "Só placar na fonte",
});

add({
  date: "1977-08-21",
  phase: "1ª fase do 3º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 4,
  ga: 1,
  stadium: REI,
  referee: "Pelópidas Argolo",
  ...lineup(
    [
      "Milano",
      "Muçurica",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Alberto",
      "Soareste",
      "Gilmar",
      "Ênio Oliveira",
      "Misso",
      "Ricardo",
    ],
    [{ out: "Alberto", in: "Geraldo" }],
  ),
  goals: [
    { name: "Ênio Oliveira", minute: 22, penalty: true },
    {
      name: "Ulisses",
      minute: 28,
      ownGoal: true,
      ownGoalDirection: "against",
    },
    { name: "Soareste", minute: 31 },
    { name: "Ênio Oliveira", minute: 49 },
    { name: "Soareste", minute: 73 },
  ],
});

add({
  date: "1977-08-28",
  phase: "1ª fase do 3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: REI,
  referee: "Sebastião Canuto",
  attendance: 16530,
  revenue: 275709,
  revenueText: revText(275709),
  ...lineup(
    [
      "Milano",
      "Muçurica",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Alberto",
      "Soareste",
      "Gilmar",
      "Ênio Oliveira",
      "Misso",
      "Ricardo",
    ],
    [
      { out: "Ênio Oliveira", in: "Almir" },
      { out: "Ricardo", in: "Zequinha" },
    ],
  ),
  note: "Gol Dirceu (CRB) 7'",
});

// ——— Quadrangular do 3º turno ———
add({
  date: "1977-09-04",
  phase: "Quadrangular do 3º turno",
  opponent: "Ferroviário-AL",
  ha: "home",
  gf: 2,
  ga: 0,
  stadium: REI,
  referee: "Sebastião Canuto",
  ...lineup(
    [
      "Milano",
      "Muçurica",
      "Timbó",
      "Zé Preta",
      "Ênio",
      "Alberto",
      "Soareste",
      "Gilmar",
      "Almir",
      "Misso",
      "Zequinha",
    ],
  ),
  goals: [
    { name: "Almir", minute: 17 },
    { name: "Gilmar", minute: 36 },
  ],
  note: "Expulsão Machado (Ferroviário)",
});

add({
  date: "1977-09-07",
  phase: "Quadrangular do 3º turno",
  opponent: "CRB-AL",
  ha: "away",
  gf: 0,
  ga: 1,
  stadium: REI,
  note: "Só placar na fonte",
});

add({
  date: "1977-09-11",
  phase: "Quadrangular do 3º turno",
  opponent: "São Domingos-AL",
  ha: "home",
  gf: 2,
  ga: 2,
  stadium: REI,
  referee: "Sebastião Canuto",
  ...lineup(
    [
      "Milano",
      "Muçurica",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Alberto",
      "Soareste",
      "Almir",
      "Gabriel",
      "Misso",
      "Gilmar",
    ],
    [
      { out: "Muçurica", in: "Geraldo" },
      { out: "Gabriel", in: "Caneta" },
    ],
  ),
  goals: [
    { name: "Gilmar", minute: 5 },
    { name: "Gilmar", minute: 11 },
  ],
  note: "Gols Hamilton 4', Fininho pênalti 32' (São Domingos)",
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
const expectedPlacares = { n: 27, v: 15, e: 5, d: 7, gf: 47 };
for (const k of Object.keys(expectedPlacares)) {
  if (t[k] !== expectedPlacares[k])
    console.error(`MISMATCH ${k}: got ${t[k]} expected ${expectedPlacares[k]}`);
}
console.log("classificação fonte (tabela): J27 GP47 GC22");
console.log(
  `GP/GC soma vs tabela: GP ${t.gf} vs 47 (Δ${t.gf - 47}); GC ${t.ga} vs 22 (Δ${t.ga - 22})`,
);

const header = `/** Campeonato Alagoano 1977 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA 3º 1977; CRB campeão; ASA não disputou (Fumeirão).
 * Sem técnico na fonte; decisão CRB x CSE sem CSA.
 * Soma dos placares listados: J27 V15 E5 D7 GP${t.gf} GC${t.ga}.
 * Classificação da fonte (tabela): GP47 GC22.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 53' do 2ºT = 98.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1977;

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

const out = resolve(__dirname, "data", "season-1977-alagoano.mjs");
writeFileSync(out, header + JSON.stringify(GAMES, null, 2) + ";\n", "utf8");
console.log("wrote", out);
