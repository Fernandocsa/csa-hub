// CSA Campeonato Alagoano 1992 — match sheets (lineups, goals, cards) extracted from
// Blog Sorrentino source material. Only matches with at least a CSA lineup, goals with
// minutes, or cards are included; matches with score-only records are omitted.

export const SHEETS = [
  // 1992-06-07 — away Ipanema (Ipanema 0 x 1 CSA)
  {
    date: "1992-06-07",
    opponentHint: "Ipanema",
    homeAway: "away",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Café", "Marcelo", "Talvanes",
      "Oseas", "Lino", "Peu",
      "Chico", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Chico", in: "Mazinho", minute: 0 },
    ],
    goals: [
      { name: "Café", minute: 82, side: "csa" },
    ],
    cards: [],
  },

  // 1992-06-10 — home 7 de Setembro (CSA 1 x 0)
  {
    date: "1992-06-10",
    opponentHint: "7 de Setembro",
    homeAway: "home",
    starters: [],
    subs: [],
    goals: [
      { name: "Marcelo", minute: 0, side: "csa" },
    ],
    cards: [],
  },

  // 1992-06-14 — home CSE (CSA 2 x 0)
  {
    date: "1992-06-14",
    opponentHint: "CSE",
    homeAway: "home",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Café", "Marcelo", "Talvanes",
      "Oseas", "Lino", "Peu",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Café", in: "Raul", minute: 0 },
      { out: "Oseas", in: "Ivanildo", minute: 0 },
    ],
    goals: [
      { name: "Ivan", minute: 86, side: "csa" },
      { name: "Bizu", minute: 89, side: "csa" },
    ],
    cards: [
      { name: "Luís Oliveira", type: "red", side: "opponent" },
    ],
  },

  // 1992-06-21 — away ASA (ASA 0 x 1 CSA)
  {
    date: "1992-06-21",
    opponentHint: "ASA",
    homeAway: "away",
    starters: [
      "Flávio",
      "Ivanildo", "Rau", "Beu", "Talvanes",
      "Carlinhos Marechal", "Lino", "Peu",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Lino", in: "César", minute: 0 },
      { out: "Bizu", in: "Chico", minute: 0 },
    ],
    goals: [
      { name: "Ivan", minute: 34, side: "csa" },
    ],
    cards: [
      { name: "Carlinhos Marechal", type: "red", side: "csa" },
    ],
  },

  // 1992-06-25 — home Capela (CSA 1 x 0)
  {
    date: "1992-06-25",
    opponentHint: "Capela",
    homeAway: "home",
    starters: [],
    subs: [],
    goals: [
      { name: "Ivanildo", minute: 85, penalty: true, side: "csa" },
    ],
    cards: [
      { name: "Rau", type: "red", side: "opponent" },
    ],
  },

  // 1992-06-28 — home Cruzeiro (CSA 5 x 2)
  {
    date: "1992-06-28",
    opponentHint: "Cruzeiro",
    homeAway: "home",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Beu", "Marcelo", "Talvanes",
      "Oseas", "Peu", "Marcelo Gomes",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Peu", in: "Chico", minute: 0 },
      { out: "Marcelo Gomes", in: "Mário Xavier", minute: 0 },
    ],
    goals: [
      { name: "Bizu", minute: 0, side: "csa" },
      { name: "Bizu", minute: 0, side: "csa" },
      { name: "Bizu", minute: 0, side: "csa" },
      { name: "Ailton", minute: 0, side: "opponent" },
      { name: "Chico", minute: 0, side: "csa" },
      { name: "Édson", minute: 0, side: "csa" },
      { name: "Ronaldo", minute: 0, side: "opponent" },
    ],
    cards: [],
  },

  // 1992-07-01 — away Internacional (Internacional 0 x 2 CSA)
  {
    date: "1992-07-01",
    opponentHint: "Internacional",
    homeAway: "away",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Rau", "Marcelo", "Talvanes",
      "Oseas", "Lino", "Marcelo Gomes",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Talvanes", in: "Marcelo Barreto", minute: 0 },
      { out: "Édson", in: "Chico", minute: 0 },
    ],
    goals: [
      { name: "Marcelo Gomes", minute: 29, side: "csa" },
      { name: "Bizu", minute: 90, injury: 5, side: "csa" },
    ],
    cards: [],
  },

  // 1992-07-05 — away Comercial (Comercial 1 x 1 CSA)
  {
    date: "1992-07-05",
    opponentHint: "Comercial",
    homeAway: "away",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Rau", "Marcelo Silva", "Marcelo Barreto",
      "Oseas", "Lino", "Marcelo Gomes",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Rau", in: "Edmílson", minute: 0 },
      { out: "Marcelo Barreto", in: "Chico", minute: 0 },
    ],
    goals: [
      { name: "Ivan", minute: 28, side: "csa" },
      { name: "Roberto", minute: 55, side: "opponent" },
    ],
    cards: [
      { name: "Carlinhos Marechal", type: "red", side: "csa" },
    ],
  },

  // 1992-07-12 home CRB 1x3 — skipped, no sheet detail

  // 1992-07-15 — home CRB (CSA 3 x 3)
  {
    date: "1992-07-15",
    opponentHint: "CRB",
    homeAway: "home",
    starters: [],
    subs: [],
    goals: [
      { name: "Lino", minute: 0, side: "csa" },
      { name: "Ivan", minute: 0, side: "csa" },
      { name: "Chico", minute: 0, side: "csa" },
      { name: "Rildo", minute: 0, side: "opponent" },
      { name: "Rildo", minute: 0, side: "opponent" },
      { name: "Hamilton", minute: 0, side: "opponent" },
    ],
    cards: [],
  },

  // 1992-07-18 — away CRB (2 x 2, extra time only)
  {
    date: "1992-07-18",
    opponentHint: "CRB",
    homeAway: "away",
    starters: [],
    subs: [],
    goals: [
      { name: "Jerônimo", minute: 93, side: "opponent" },
      { name: "Jerônimo", minute: 96, side: "opponent" },
      { name: "Bizu", minute: 107, side: "csa" },
      { name: "Marcelo Barreto", minute: 109, side: "csa" },
    ],
    cards: [],
  },

  // 1992-07-22 — away Ipanema (Ipanema 1 x 3 CSA)
  {
    date: "1992-07-22",
    opponentHint: "Ipanema",
    homeAway: "away",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Marcelo Silva", "Marcelo Barreto", "Dago",
      "Oseas", "Lino", "Mário Xavier",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Marcelo Barreto", in: "Beu", minute: 0 },
      { out: "Bizu", in: "Chico", minute: 0 },
    ],
    goals: [
      { name: "Valdo", minute: 10, side: "opponent" },
      { name: "Carlinhos Marechal", minute: 22, penalty: true, side: "csa" },
      { name: "Marcelo Barreto", minute: 41, side: "csa" },
      { name: "Ivan", minute: 85, side: "csa" },
    ],
    cards: [],
  },

  // 1992-07-26 — home Ipanema (CSA 4 x 2)
  {
    date: "1992-07-26",
    opponentHint: "Ipanema",
    homeAway: "home",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Marcelo Silva", "Marcelo Barreto", "Dago",
      "Marcelo Gomes", "Lino", "Mário Xavier",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Carlinhos Marechal", in: "Beu", minute: 0 },
      { out: "Lino", in: "Chico", minute: 0 },
    ],
    goals: [
      { name: "Bizu", minute: 35, side: "csa" },
      { name: "Bizu", minute: 40, side: "csa" },
      { name: "Rui", minute: 60, penalty: true, side: "opponent" },
      { name: "Carlinhos Marechal", minute: 63, penalty: true, side: "csa" },
      { name: "Bizu", minute: 66, penalty: true, side: "csa" },
      { name: "Joel", minute: 85, side: "opponent" },
    ],
    cards: [
      { name: "Marcão", type: "red", minute: 20, side: "opponent" },
    ],
  },

  // 1992-07-29 — home Capela (CSA 2 x 1)
  {
    date: "1992-07-29",
    opponentHint: "Capela",
    homeAway: "home",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Marcelo Silva", "Marcelo Barreto", "Dago",
      "Marcelo Gomes", "Lino", "Mário Xavier",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Marcelo Silva", in: "Beu", minute: 0 },
      { out: "Lino", in: "Chico", minute: 0 },
    ],
    goals: [
      { name: "Édson", minute: 27, side: "csa" },
      { name: "Marcelo Gomes", minute: 56, side: "csa" },
      { name: "Edvaldo", minute: 86, side: "opponent" },
    ],
    cards: [],
  },

  // 1992-08-01 — home Ipanema (CSA 1 x 1)
  {
    date: "1992-08-01",
    opponentHint: "Ipanema",
    homeAway: "home",
    starters: [],
    subs: [],
    goals: [
      { name: "Rui", minute: 66, penalty: true, side: "opponent" },
      { name: "Édson", minute: 75, side: "csa" },
    ],
    cards: [],
  },

  // 1992-08-09 — away 7 de Setembro (0 x 0)
  {
    date: "1992-08-09",
    opponentHint: "7 de Setembro",
    homeAway: "away",
    starters: [
      "Flávio",
      "Délio", "Marcelo Silva", "Marcelo Barreto", "Cláudio Bocão",
      "Mário Xavier", "Lino", "Chico",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Chico", in: "Peu", minute: 0 },
      { out: "Ivan", in: "Piti", minute: 0 },
    ],
    goals: [],
    cards: [],
  },

  // 1992-08-12 away Cruzeiro 1x2 — skipped, no sheet detail

  // 1992-08-16 — home Internacional (CSA 3 x 0)
  {
    date: "1992-08-16",
    opponentHint: "Internacional",
    homeAway: "home",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Marcelo Silva", "Marcelo Barreto", "Dago",
      "Oseas", "Lino", "Marcelo Gomes",
      "Piti", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Marcelo Silva", in: "Edmílson", minute: 0 },
      { out: "Lino", in: "Peu", minute: 0 },
    ],
    goals: [
      { name: "Piti", minute: 9, side: "csa" },
      { name: "Bizu", minute: 49, side: "csa" },
      { name: "Bizu", minute: 64, side: "csa" },
    ],
    cards: [],
  },

  // 1992-08-19 — home Comercial (CSA 4 x 1)
  {
    date: "1992-08-19",
    opponentHint: "Comercial",
    homeAway: "home",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Marcelo Silva", "Marcelo Barreto", "Dago",
      "Mário Xavier", "Lino", "Marcelo Gomes",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Édson", in: "Oseas", minute: 0 },
      { out: "Ivan", in: "Piti", minute: 0 },
    ],
    goals: [
      { name: "Marcelo Gomes", minute: 43, side: "csa" },
      { name: "Marcelo Silva", minute: 45, injury: 1, side: "csa" },
      { name: "Isac", minute: 60, side: "opponent" },
      { name: "Dago", minute: 80, side: "csa" },
      { name: "Carlinhos Marechal", minute: 83, side: "csa" },
    ],
    cards: [
      { name: "Marcelo Gomes", type: "red", side: "csa" },
      { name: "Solteiro", type: "red", side: "opponent" },
    ],
  },

  // 1992-08-23 — away Capela (Capela 0 x 1 CSA)
  {
    date: "1992-08-23",
    opponentHint: "Capela",
    homeAway: "away",
    starters: [],
    subs: [],
    goals: [
      { name: "Bizu", minute: 31, side: "csa" },
    ],
    cards: [
      { name: "Bosco", type: "red", side: "opponent" },
      { name: "Ivan", type: "red", side: "csa" },
    ],
  },

  // 1992-08-26 away CSE 1x0 — skipped, no sheet detail

  // 1992-08-30 — home ASA (CSA 3 x 0)
  {
    date: "1992-08-30",
    opponentHint: "ASA",
    homeAway: "home",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Marcelo Silva", "Marcelo Barreto", "Dago",
      "Mário Xavier", "Lino", "Marcelo Gomes",
      "Piti", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Mário Xavier", in: "Oseas", minute: 0 },
      { out: "Marcelo Gomes", in: "Pau", minute: 0 },
    ],
    goals: [
      { name: "Marcelo Gomes", minute: 9, side: "csa" },
      { name: "Marcelo Barreto", minute: 19, side: "csa" },
      { name: "Piti", minute: 36, side: "csa" },
    ],
    cards: [],
  },

  // 1992-09-06 — away CRB (CRB 1 x 0 CSA)
  {
    date: "1992-09-06",
    opponentHint: "CRB",
    homeAway: "away",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Marcelo Silva", "Marcelo Barreto", "Dago",
      "Mário Xavier", "Lino", "Marcelo Gomes",
      "Édson", "Bizu", "Ivan",
    ],
    subs: [
      { out: "Marcelo Gomes", in: "Piti", minute: 0 },
      { out: "Ivan", in: "Rau", minute: 0 },
    ],
    goals: [
      { name: "Rinaldo", minute: 66, side: "opponent" },
    ],
    cards: [
      { name: "César", type: "red", minute: 9, side: "opponent" },
      { name: "Marcelo Barreto", type: "red", minute: 9, side: "csa" },
    ],
  },

  // 1992-09-09 — home Ipanema (CSA 1 x 2)
  {
    date: "1992-09-09",
    opponentHint: "Ipanema",
    homeAway: "home",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Marcelo Silva", "Beu", "Talvanes",
      "Mário Xavier", "Lino", "Peu",
      "Édson", "Chico", "Ivan",
    ],
    subs: [
      { out: "Peu", in: "Williams", minute: 0 },
      { out: "Édson", in: "Piti", minute: 0 },
    ],
    goals: [
      { name: "Valdo", minute: 15, side: "opponent" },
      { name: "Valdo", minute: 71, side: "opponent" },
      { name: "Talvanes", minute: 90, side: "csa" },
    ],
    cards: [
      { name: "Paulo Silva", type: "red", side: "opponent" },
    ],
  },

  // 1992-09-13 — away Ipanema (Ipanema 1 x 0 CSA)
  // Source lists "Ivan" twice (mid + attack). Keep unique names only (Ivan once as FW);
  // Dago enters for Mário Xavier.
  {
    date: "1992-09-13",
    opponentHint: "Ipanema",
    homeAway: "away",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Rau", "Marcelo Silva", "Talvanes",
      "Oseas", "Mário Xavier", "Édson",
      "Chico", "Ivan",
    ],
    subs: [
      { out: "Mário Xavier", in: "Dago", minute: 0 },
    ],
    goals: [
      { name: "Rui", minute: 59, penalty: true, side: "opponent" },
    ],
    cards: [],
  },

  // 1992-09-28 — away Ipanema (0 x 0)
  {
    date: "1992-09-28",
    opponentHint: "Ipanema",
    homeAway: "away",
    starters: [
      "Flávio",
      "Dago", "Edmílson", "Beu", "Talvanes",
      "Oseas", "Mário Xavier", "Marcelo Gomes", "Lino",
      "Édson", "Chico",
    ],
    subs: [
      { out: "Marcelo Gomes", in: "Peu", minute: 0 },
      { out: "Lino", in: "Ivanildo", minute: 0 },
    ],
    goals: [],
    cards: [
      { name: "Dago", type: "red", side: "csa" },
      { name: "Ivanildo", type: "red", side: "csa" },
      { name: "Fábio", type: "red", side: "opponent" },
    ],
  },

  // 1992-10-04 — home CSE (CSA 0 x 1)
  {
    date: "1992-10-04",
    opponentHint: "CSE",
    homeAway: "home",
    starters: [
      "Flávio",
      "Edmílson", "Marcelo Silva", "Rau", "Talvanes",
      "Oseas", "Mário Xavier", "Marcelo Gomes",
      "Piti", "Peu", "Édson",
    ],
    subs: [
      { out: "Mário Xavier", in: "Lino", minute: 0 },
      { out: "Peu", in: "Ivan", minute: 0 },
    ],
    goals: [
      { name: "Cássio", minute: 80, side: "opponent" },
    ],
    cards: [],
  },

  // 1992-10-07 — home 7 de Setembro (CSA 1 x 0)
  {
    date: "1992-10-07",
    opponentHint: "7 de Setembro",
    homeAway: "home",
    starters: [
      "Flávio",
      "Dago", "Rau", "Marcelo Silva", "Talvanes",
      "Oseas", "Mário Xavier", "Lino",
      "Piti", "Chico", "Édson",
    ],
    subs: [
      { out: "Oseas", in: "Peu", minute: 0 },
      { out: "Piti", in: "Ivan", minute: 0 },
    ],
    goals: [
      { name: "Rau", minute: 70, side: "csa" },
    ],
    cards: [
      { name: "Ricardo", type: "red", side: "opponent" },
      { name: "Edinho", type: "red", side: "opponent" },
    ],
  },

  // 1992-10-11 — away ASA (0 x 0)
  {
    date: "1992-10-11",
    opponentHint: "ASA",
    homeAway: "away",
    starters: [
      "Wellington",
      "Carlinhos Marechal", "Edmílson", "Marcelo Barreto", "Talvanes",
      "Oseas", "Mário Xavier", "Marcelo Gomes", "Lino",
      "Édson", "Peu",
    ],
    subs: [
      { out: "Oseas", in: "Ivan", minute: 0 },
      { out: "Lino", in: "Piti", minute: 0 },
    ],
    goals: [],
    cards: [],
  },

  // 1992-10-14 away Comercial — skipped, no sheet detail

  // 1992-10-18 — home Capela (CSA 0 x 1)
  {
    date: "1992-10-18",
    opponentHint: "Capela",
    homeAway: "home",
    starters: [
      "Flávio",
      "Ivanildo", "Edmílson", "Marcelo Barreto", "Beu",
      "Carlinhos Marechal", "Mário Xavier", "Marcelo Gomes",
      "Édson", "Chico", "Ivan",
    ],
    subs: [
      { out: "Mário Xavier", in: "Lino", minute: 0 },
      { out: "Ivan", in: "Williams", minute: 0 },
    ],
    goals: [
      { name: "Sussu", minute: 51, side: "opponent" },
    ],
    cards: [],
  },

  // 1992-10-21 — home Cruzeiro (CSA 1 x 1)
  {
    date: "1992-10-21",
    opponentHint: "Cruzeiro",
    homeAway: "home",
    starters: [
      "Flávio",
      "Ivanildo", "César", "Marcelo Silva", "Talvanes",
      "Mário Xavier", "Lino", "Marcelo Gomes",
      "Édson", "Chico", "Ivan",
    ],
    subs: [
      { out: "Marcelo Gomes", in: "Dago", minute: 0 },
      { out: "Chico", in: "Adalberon", minute: 0 },
    ],
    goals: [
      { name: "Nem", minute: 44, side: "opponent" },
      { name: "Adalberon", minute: 71, side: "csa" },
    ],
    cards: [
      { name: "Altair", type: "red", side: "opponent" },
      { name: "Maílton", type: "red", side: "opponent" },
    ],
  },

  // 1992-10-25 away Internacional 0x4 — skipped, no scorers/lineup detail

  // 1992-11-01 — home CRB (CSA 1 x 1)
  {
    date: "1992-11-01",
    opponentHint: "CRB",
    homeAway: "home",
    starters: [
      "Flávio",
      "Carlinhos Marechal", "Rau", "Marcelo Barreto", "Talvanes",
      "Mário Xavier", "Dago", "Lino",
      "Édson", "Peu", "Ivan",
    ],
    subs: [
      { out: "Lino", in: "Oseas", minute: 0 },
      { out: "Ivan", in: "Chico", minute: 0 },
    ],
    goals: [
      { name: "Chico", minute: 33, side: "csa" },
      { name: "Jerônimo", minute: 71, side: "opponent" },
    ],
    cards: [],
  },

  // 1992-11-22 — away Capela (Capela 1 x 0 CSA)
  {
    date: "1992-11-22",
    opponentHint: "Capela",
    homeAway: "away",
    starters: [
      "Flávio",
      "Ivanildo", "Café", "Rau", "Cláudio",
      "Oseas", "Carlinhos Marechal", "Dago",
      "Lino", "Chico", "Ivan",
    ],
    subs: [
      { out: "Dago", in: "Édson", minute: 0 },
      { out: "Lino", in: "Peu", minute: 0 },
    ],
    goals: [
      { name: "Edvaldo", minute: 85, side: "opponent" },
    ],
    cards: [
      { name: "Jorge Reis", type: "red", side: "opponent" },
      { name: "Ivan", type: "red", side: "csa" },
    ],
  },

  // 1992-11-26 — home CRB (CSA 0 x 2)
  {
    date: "1992-11-26",
    opponentHint: "CRB",
    homeAway: "home",
    starters: [],
    subs: [],
    goals: [
      { name: "Rildo", minute: 0, side: "opponent" },
      { name: "Jerônimo", minute: 0, side: "opponent" },
    ],
    cards: [],
  },

  // 1992-11-29 — away Ipanema (Ipanema 5 x 1 CSA)
  {
    date: "1992-11-29",
    opponentHint: "Ipanema",
    homeAway: "away",
    starters: [
      "Wellington",
      "Ivanildo", "Café", "Marcelo Silva", "Cláudio",
      "Oseas", "Mário Xavier", "Édson",
      "Wilson", "Chico", "Ivan",
    ],
    subs: [
      { out: "Mário Xavier", in: "Serjão", minute: 0 },
      { out: "Ivan", in: "Williams", minute: 0 },
    ],
    goals: [
      { name: "Batista", minute: 24, side: "opponent" },
      { name: "Rui", minute: 53, side: "opponent" },
      { name: "Ivanildo", minute: 68, penalty: true, side: "csa" },
      { name: "Rui", minute: 72, side: "opponent" },
      { name: "Ney", minute: 81, side: "opponent" },
      { name: "Rui", minute: 90, side: "opponent" },
    ],
    cards: [
      { name: "Café", type: "red", minute: 72, side: "csa" },
      { name: "Marcelo Silva", type: "red", minute: 72, side: "csa" },
    ],
  },

  // 1992-12-06 — home Ipanema (CSA 1 x 3)
  {
    date: "1992-12-06",
    opponentHint: "Ipanema",
    homeAway: "home",
    starters: [
      "Flávio",
      "Ivanildo", "César", "Beu", "Cláudio",
      "Délio", "Chico", "Peu",
      "Édson", "Wilson", "Ivan",
    ],
    subs: [
      { out: "Cláudio", in: "Williams", minute: 0 },
    ],
    goals: [
      { name: "Ney", minute: 0, side: "opponent" },
      { name: "Ney", minute: 0, side: "opponent" },
      { name: "Mica", minute: 0, side: "opponent" },
      { name: "Chico", minute: 0, side: "csa" },
    ],
    cards: [
      { name: "Chico", type: "red", side: "csa" },
    ],
  },

  // 1992-12-13 — away CRB (CRB 5 x 2 CSA)
  {
    date: "1992-12-13",
    opponentHint: "CRB",
    homeAway: "away",
    starters: [
      "Flávio",
      "Ivanildo", "Café", "Marcelo Silva", "Talvanes",
      "Mário Xavier", "Délio", "Lino",
      "Édson", "Wilson", "Ivan",
    ],
    subs: [
      { out: "Édson", in: "Marcelo Barreto", minute: 0 },
    ],
    goals: [
      { name: "Café", minute: 21, ownGoal: true, side: "csa" },
      { name: "Jerônimo", minute: 27, side: "opponent" },
      { name: "Wilson", minute: 37, side: "csa" },
      { name: "Lino", minute: 42, side: "csa" },
      { name: "Jerônimo", minute: 48, side: "opponent" },
      { name: "Joel", minute: 70, side: "opponent" },
      { name: "Ivanildo", minute: 89, side: "opponent" },
    ],
    cards: [
      { name: "Jean", type: "red", side: "opponent" },
      { name: "Marcelo Silva", type: "red", side: "csa" },
    ],
  },
];
