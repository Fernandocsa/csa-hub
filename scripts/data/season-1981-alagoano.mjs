/** Campeonato Alagoano 1981 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA campeão 1981; técnico Walmir Louruz (canon DB: Valmir Louruz); título antecipado 22/11/1981.
 * Soma dos placares listados: J36 V27 E6 D3 GP79 GC22 (fases batem).
 * Cabeçalho final da fonte (V28 E6 D2 GP72 GC20 / PG66) não fecha com a soma dos jogos.
 * Contagem oficial: J36 V28 E06 D02 GP72 GC20.
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
export const GAMES = [
  {
    "date": "1981-05-27",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Vilela dos Santos",
    "attendance": 4769,
    "revenue": 522800,
    "revenueText": "Cr$ 522.800,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Luís Paulo"
    ],
    "entered": [
      "Fernando",
      "Nílson"
    ],
    "subs": [
      {
        "out": "Osmar Barão",
        "in": "Fernando"
      },
      {
        "out": "Jorge Luiz",
        "in": "Nílson"
      }
    ],
    "goals": [
      {
        "name": "Luís Paulo",
        "minute": 3
      },
      {
        "name": "Jorginho",
        "minute": 13
      },
      {
        "name": "Rommel",
        "minute": 59
      }
    ]
  },
  {
    "date": "1981-05-31",
    "phase": "1º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "revenue": 432860,
    "revenueText": "Cr$ 432.860,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Luís Paulo"
    ],
    "entered": [
      "Geraldo",
      "Nílson"
    ],
    "subs": [
      {
        "out": "Zezinho",
        "in": "Geraldo"
      },
      {
        "out": "Jorge Luiz",
        "in": "Nílson"
      }
    ],
    "goals": [
      {
        "name": "Luís Paulo",
        "minute": 31
      },
      {
        "name": "Rommel",
        "minute": 74,
        "penalty": true
      }
    ],
    "note": "Gol Alberto (Capelense) 68'"
  },
  {
    "date": "1981-06-07",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 1,
    "ga": 2,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Abelardo Lucena",
    "attendance": 10859,
    "revenue": 1192800,
    "revenueText": "Cr$ 1.192.800,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Luís Paulo"
    ],
    "entered": [
      "Jorge Luiz"
    ],
    "subs": [
      {
        "out": "Paraná",
        "in": "Jorge Luiz"
      }
    ],
    "goals": [
      {
        "name": "Osmar Barão",
        "minute": 30
      }
    ],
    "note": "Gols ASA: Valmir 14', Zé Carlos 81'"
  },
  {
    "date": "1981-06-14",
    "phase": "1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 7,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "revenue": 484400,
    "revenueText": "Cr$ 484.400,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Luís Paulo"
    ],
    "entered": [
      "Décio",
      "Fernando"
    ],
    "subs": [
      {
        "out": "Zé Luiz",
        "in": "Décio"
      },
      {
        "out": "Dick",
        "in": "Fernando"
      }
    ],
    "goals": [
      {
        "name": "Luís Paulo",
        "minute": 7
      },
      {
        "name": "Rommel",
        "minute": 44,
        "penalty": true
      },
      {
        "name": "Rommel",
        "minute": 53
      },
      {
        "name": "Dick",
        "minute": 57
      },
      {
        "name": "Rommel",
        "minute": 76
      },
      {
        "name": "Geraldo",
        "minute": 79
      },
      {
        "name": "Luís Paulo",
        "minute": 82
      }
    ]
  },
  {
    "date": "1981-06-18",
    "phase": "1º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 5,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Laércio Teles",
    "manager": "Valmir Louruz"
  },
  {
    "date": "1981-06-21",
    "phase": "1º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Antônio Morais",
    "attendance": 3026,
    "revenue": 164200,
    "revenueText": "Cr$ 164.200,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Luís Paulo"
    ],
    "entered": [
      "Nílson"
    ],
    "subs": [
      {
        "out": "Luís Paulo",
        "in": "Nílson"
      }
    ],
    "goals": [
      {
        "name": "Luís Paulo",
        "minute": 42
      }
    ],
    "note": "Gol Vavá (Penedense) 10'"
  },
  {
    "date": "1981-06-28",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Vilela dos Santos",
    "attendance": 15916,
    "revenue": 1861600,
    "revenueText": "Cr$ 1.861.600,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Luís Paulo"
    ],
    "entered": [
      "Jorge Luiz",
      "Vilmário"
    ],
    "subs": [
      {
        "out": "Jorginho",
        "in": "Jorge Luiz"
      },
      {
        "out": "Luís Paulo",
        "in": "Vilmário"
      }
    ],
    "goals": [
      {
        "name": "Paraná",
        "minute": 37
      }
    ],
    "note": "Gol Israel (CRB) 85'; expulsões Américo/Almir (CRB); Osmar Barão/Fernando (CSA)"
  },
  {
    "date": "1981-07-02",
    "phase": "Quadrangular do 1º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Sebastião Canuto",
    "attendance": 8001,
    "revenue": 907650,
    "revenueText": "Cr$ 907.650,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Luís Paulo"
    ],
    "entered": [
      "Jorginho",
      "Zé Luiz II",
      "Jorge Luiz"
    ],
    "subs": [
      {
        "out": "Ademir",
        "in": "Jorginho"
      },
      {
        "out": "Paraná",
        "in": "Zé Luiz II"
      },
      {
        "out": "Luís Paulo",
        "in": "Jorge Luiz"
      }
    ],
    "note": "Expulsão Ademir (CSA) 2ºT"
  },
  {
    "date": "1981-07-05",
    "phase": "Quadrangular do 1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 4,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Carlos Félix",
    "attendance": 18481,
    "revenue": 2157200,
    "revenueText": "Cr$ 2.157.200,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Luís Paulo"
    ],
    "entered": [
      "Café",
      "Zé Luiz II"
    ],
    "subs": [
      {
        "out": "Ronaldo Alves",
        "in": "Café"
      },
      {
        "out": "Luís Paulo",
        "in": "Zé Luiz II"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 47
      }
    ],
    "note": "Gols CRB: Lula 19', 25'; Edu 55'; Américo 70'"
  },
  {
    "date": "1981-07-12",
    "phase": "Quadrangular do 1º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "revenue": 189000,
    "revenueText": "Cr$ 189.000,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Nílson"
    ],
    "entered": [
      "Fernando",
      "Poty"
    ],
    "subs": [
      {
        "out": "Antunes",
        "in": "Fernando"
      },
      {
        "out": "Dentinho",
        "in": "Poty"
      }
    ],
    "goals": [
      {
        "name": "Nílson"
      },
      {
        "name": "Nílson"
      },
      {
        "name": "Jorginho"
      },
      {
        "name": "Geraldo"
      }
    ]
  },
  {
    "date": "1981-07-22",
    "phase": "2º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "attendance": 3047,
    "revenue": 326500,
    "revenueText": "Cr$ 326.500,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Nílson"
    ],
    "entered": [
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Nílson",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Jerônimo",
        "minute": 32
      },
      {
        "name": "Dentinho",
        "minute": 59
      }
    ],
    "note": "Gol Jorge da Sorte (Capelense) 70'"
  },
  {
    "date": "1981-07-26",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Juca Sampaio",
    "referee": "Daniel da Luz",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Nílson"
    ],
    "entered": [
      "Zezinho",
      "Ney"
    ],
    "subs": [
      {
        "out": "Antunes",
        "in": "Zezinho"
      },
      {
        "out": "Nílson",
        "in": "Ney"
      }
    ],
    "goals": [
      {
        "name": "Ney",
        "minute": 85
      }
    ],
    "note": "Tumulto pós-gol; paralisação ~15 min"
  },
  {
    "date": "1981-08-02",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 9095,
    "revenue": 999150,
    "revenueText": "Cr$ 999.150,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Jorginho",
      "Dentinho"
    ],
    "subs": [
      {
        "out": "Ney",
        "in": "Jorginho"
      },
      {
        "out": "Jacozinho",
        "in": "Dentinho"
      }
    ],
    "goals": [
      {
        "name": "Flávio",
        "minute": 42
      },
      {
        "name": "Rommel",
        "minute": 85,
        "penalty": true
      }
    ],
    "note": "Gol Furiba (Penedense) 67'"
  },
  {
    "date": "1981-08-05",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 5,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Aloísio dos Santos",
    "attendance": 4339,
    "revenue": 460000,
    "revenueText": "Cr$ 460.000,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Félix",
      "Dentinho"
    ],
    "subs": [
      {
        "out": "Flávio",
        "in": "Félix"
      },
      {
        "out": "Ney",
        "in": "Dentinho"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 27,
        "penalty": true
      },
      {
        "name": "Jacozinho",
        "minute": 41
      },
      {
        "name": "Rommel",
        "minute": 47
      },
      {
        "name": "Freitas",
        "minute": 61
      },
      {
        "name": "Freitas",
        "minute": 86
      }
    ],
    "note": "Expulsão Romário (Ferroviário)"
  },
  {
    "date": "1981-08-09",
    "phase": "2º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Aloísio Vasconcelos",
    "referee": "Pelópidas Argolo",
    "revenue": 156000,
    "revenueText": "Cr$ 156.000,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Dentinho",
      "Félix"
    ],
    "subs": [
      {
        "out": "Paraná",
        "in": "Dentinho"
      },
      {
        "out": "Jacozinho",
        "in": "Félix"
      }
    ],
    "goals": [
      {
        "name": "Machado",
        "minute": 50,
        "ownGoal": true,
        "ownGoalDirection": "for"
      },
      {
        "name": "Freitas",
        "minute": 67
      },
      {
        "name": "Freitas",
        "minute": 90
      }
    ],
    "note": "Gol Silva (São Domingos) 16'"
  },
  {
    "date": "1981-08-16",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Jair Pereira",
    "attendance": 12584,
    "revenue": 1411200,
    "revenueText": "Cr$ 1.411.200,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Félix",
      "Ademir"
    ],
    "subs": [
      {
        "out": "Zezinho",
        "in": "Félix"
      },
      {
        "out": "Jacozinho",
        "in": "Ademir"
      }
    ],
    "goals": [
      {
        "name": "Jorginho",
        "minute": 43
      },
      {
        "name": "Rommel",
        "minute": 51,
        "penalty": true
      }
    ],
    "note": "Expulsões Raimundo e Dema (ASA)"
  },
  {
    "date": "1981-08-23",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Bráulio Zanotto",
    "attendance": 25417,
    "revenue": 3191250,
    "revenueText": "Cr$ 3.191.250,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Antunes",
      "Dentinho"
    ],
    "subs": [
      {
        "out": "Geraldo",
        "in": "Antunes"
      },
      {
        "out": "Freitas",
        "in": "Dentinho"
      }
    ],
    "goals": [
      {
        "name": "Mug",
        "minute": 38
      },
      {
        "name": "Freitas",
        "minute": 75
      },
      {
        "name": "Paulinho",
        "minute": 81,
        "ownGoal": true,
        "ownGoalDirection": "for"
      }
    ],
    "note": "Gol Sabará (CRB) 85'; expulsões Almir (CRB) e Veiga (CSA)"
  },
  {
    "date": "1981-08-27",
    "phase": "Quadrangular do 2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Antônio Vieira de Goes",
    "manager": "Valmir Louruz"
  },
  {
    "date": "1981-09-02",
    "phase": "Quadrangular do 2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Nei Andrade",
    "attendance": 10801,
    "revenue": 1225900,
    "revenueText": "Cr$ 1.225.900,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Ademir",
      "Dentinho"
    ],
    "subs": [
      {
        "out": "Jorginho",
        "in": "Ademir"
      },
      {
        "out": "Mug",
        "in": "Dentinho"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 40
      }
    ]
  },
  {
    "date": "1981-09-13",
    "phase": "Quadrangular do 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Walquir Pimentel",
    "attendance": 25866,
    "revenue": 3356850,
    "revenueText": "Cr$ 3.356.850,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Ademir",
      "Freitas"
    ],
    "subs": [
      {
        "out": "Jacozinho",
        "in": "Ademir"
      },
      {
        "out": "Dentinho",
        "in": "Freitas"
      }
    ],
    "goals": [
      {
        "name": "Odon",
        "minute": 85,
        "ownGoal": true,
        "ownGoalDirection": "for"
      }
    ],
    "note": "Gol Alexandre Bueno (CRB) 90'; expulsão Israel (CRB)"
  },
  {
    "date": "1981-09-13",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Manoel Amaro",
    "attendance": 2815,
    "revenue": 306600,
    "revenueText": "Cr$ 306.600,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Paraná"
    ],
    "subs": [
      {
        "out": "Dentinho",
        "in": "Paraná"
      }
    ],
    "goals": [
      {
        "name": "Luís Felipe",
        "minute": 10
      },
      {
        "name": "Freitas",
        "minute": 90
      }
    ],
    "note": "Mesma data do 1x1 com CRB no quadrangular do 2º turno (fonte)"
  },
  {
    "date": "1981-09-20",
    "phase": "3º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio José Nivaldo",
    "referee": "Laércio Ribeiro dos Anjos",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Dentinho",
      "Ney"
    ],
    "subs": [
      {
        "out": "Jorginho",
        "in": "Dentinho"
      },
      {
        "out": "Freitas",
        "in": "Ney"
      }
    ],
    "goals": [
      {
        "name": "Freitas",
        "minute": 73
      }
    ]
  },
  {
    "date": "1981-09-23",
    "phase": "3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Jorginho",
      "Ademir"
    ],
    "subs": [
      {
        "out": "Ney",
        "in": "Jorginho"
      },
      {
        "out": "Jacozinho",
        "in": "Ademir"
      }
    ],
    "goals": [
      {
        "name": "Flávio",
        "minute": 29
      },
      {
        "name": "Rommel",
        "minute": 39
      },
      {
        "name": "Freitas",
        "minute": 89,
        "penalty": true
      }
    ],
    "note": "Preliminar do amistoso Brasil x Irlanda; arrecadação do amistoso Cr$ 19.808.000 / 36.982 (não confundir com renda desta partida)"
  },
  {
    "date": "1981-09-27",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 5,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Bartolomeu Lordello",
    "attendance": 4548,
    "revenue": 506300,
    "revenueText": "Cr$ 506.300,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Félix",
      "Dentinho"
    ],
    "subs": [
      {
        "out": "Jacozinho",
        "in": "Félix"
      },
      {
        "out": "Mug",
        "in": "Dentinho"
      }
    ],
    "goals": [
      {
        "name": "Mug",
        "minute": 10
      },
      {
        "name": "Jorginho",
        "minute": 14
      },
      {
        "name": "Freitas",
        "minute": 31
      },
      {
        "name": "Dentinho",
        "minute": 66
      },
      {
        "name": "Flávio",
        "minute": 89
      }
    ],
    "note": "Gol Zé Carlos (ASA) 24'; expulsões Dema e Gilmar (ASA)"
  },
  {
    "date": "1981-10-04",
    "phase": "3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Araújo",
    "attendance": 4854,
    "revenue": 523280,
    "revenueText": "Cr$ 523.280,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Dentinho"
    ],
    "entered": [
      "Fernando",
      "Félix"
    ],
    "subs": [
      {
        "out": "Jerônimo",
        "in": "Fernando"
      },
      {
        "out": "Paraná",
        "in": "Félix"
      }
    ],
    "goals": [
      {
        "name": "Dentinho",
        "minute": 36
      },
      {
        "name": "Dentinho",
        "minute": 76
      }
    ]
  },
  {
    "date": "1981-10-11",
    "phase": "3º turno",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Manoel Moreira",
    "referee": "José Araújo",
    "manager": "Valmir Louruz"
  },
  {
    "date": "1981-10-18",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Maurílio Santiago",
    "attendance": 14066,
    "revenue": 1630550,
    "revenueText": "Cr$ 1.630.550,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Dentinho",
      "Antunes"
    ],
    "subs": [
      {
        "out": "Freitas",
        "in": "Dentinho"
      },
      {
        "out": "Mug",
        "in": "Antunes"
      }
    ],
    "note": "Expulsão Geraldo (CSA) 55'"
  },
  {
    "date": "1981-10-22",
    "phase": "Quadrangular do 3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Araújo",
    "attendance": 5176,
    "revenue": 587200,
    "revenueText": "Cr$ 587.200,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Paraná",
      "Dentinho"
    ],
    "subs": [
      {
        "out": "Jorginho",
        "in": "Paraná"
      },
      {
        "out": "Freitas",
        "in": "Dentinho"
      }
    ],
    "goals": [
      {
        "name": "Flávio",
        "minute": 14
      },
      {
        "name": "Dentinho",
        "minute": 50
      }
    ],
    "note": "Expulsões Edmilson/Cananô (CSE); Flávio (CSA)"
  },
  {
    "date": "1981-10-27",
    "phase": "Quadrangular do 3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Bartolomeu Lordello",
    "attendance": 7464,
    "revenue": 876050,
    "revenueText": "Cr$ 876.050,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Ademir",
      "Freitas"
    ],
    "subs": [
      {
        "out": "Rommel",
        "in": "Ademir"
      },
      {
        "out": "Jacozinho",
        "in": "Freitas"
      }
    ],
    "goals": [
      {
        "name": "Dentinho",
        "minute": 15
      },
      {
        "name": "Freitas",
        "minute": 29
      }
    ],
    "note": "Gol Dema (ASA) 23'"
  },
  {
    "date": "1981-11-01",
    "phase": "Quadrangular do 3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Aldemir Vieira Matos",
    "manager": "Valmir Louruz"
  },
  {
    "date": "1981-11-07",
    "phase": "Superturno final",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Araújo",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Paraná",
      "Félix"
    ],
    "subs": [
      {
        "out": "Dentinho",
        "in": "Paraná"
      },
      {
        "out": "Mug",
        "in": "Félix"
      }
    ],
    "goals": [
      {
        "name": "Dentinho",
        "minute": 6
      },
      {
        "name": "Dentinho",
        "minute": 35
      },
      {
        "name": "Freitas",
        "minute": 53
      }
    ],
    "note": "Gol Valmir (Penedense) 30'"
  },
  {
    "date": "1981-11-15",
    "phase": "Superturno final",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 4,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Araújo",
    "revenue": 1004000,
    "revenueText": "Cr$ 1.004.000,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Félix",
      "Jacozinho"
    ],
    "subs": [
      {
        "out": "Jerônimo",
        "in": "Félix"
      },
      {
        "out": "Veiga",
        "in": "Jacozinho"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 31
      },
      {
        "name": "Freitas",
        "minute": 52
      },
      {
        "name": "Rommel",
        "minute": 67
      },
      {
        "name": "Mug",
        "minute": 76
      }
    ],
    "note": "Gol Neco (ASA) 2'; expulsões Gilmar e Toninho (ASA); torcedor agrediu técnico do ASA"
  },
  {
    "date": "1981-11-18",
    "phase": "Superturno final",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Arnaldo César Coelho",
    "attendance": 15418,
    "revenue": 2532050,
    "revenueText": "Cr$ 2.532.050,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Jacozinho",
      "Ademir"
    ],
    "subs": [
      {
        "out": "Rommel",
        "in": "Jacozinho"
      },
      {
        "out": "Freitas",
        "in": "Ademir"
      }
    ],
    "goals": [
      {
        "name": "Dentinho",
        "minute": 10
      }
    ]
  },
  {
    "date": "1981-11-22",
    "phase": "Superturno final — jogo do título antecipado",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "José Araújo",
    "attendance": 5139,
    "revenue": 348630,
    "revenueText": "Cr$ 348.630,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Jacozinho",
      "Ademir"
    ],
    "subs": [
      {
        "out": "Rommel",
        "in": "Jacozinho"
      },
      {
        "out": "Freitas",
        "in": "Ademir"
      }
    ],
    "goals": [
      {
        "name": "Dentinho",
        "minute": 47
      },
      {
        "name": "Rommel",
        "minute": 75
      },
      {
        "name": "Freitas",
        "minute": 84
      }
    ],
    "note": "Título alagoano antecipado; gol Careca (Penedense) 9'"
  },
  {
    "date": "1981-11-25",
    "phase": "Superturno final",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Saul Mendes",
    "revenue": 700540,
    "revenueText": "Cr$ 700.540,00",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [],
    "subs": [],
    "note": "Gols ASA: Zé Carlos 20', Dema 25'; expulsão Jacozinho (CSA) 2ºT"
  },
  {
    "date": "1981-11-29",
    "phase": "Superturno final",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Anivaldo Seixas Magalhães",
    "manager": "Valmir Louruz",
    "starters": [
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
      "Mug"
    ],
    "entered": [
      "Josenílton",
      "Paraná"
    ],
    "subs": [
      {
        "out": "Veiga",
        "in": "Josenílton"
      },
      {
        "out": "Mug",
        "in": "Paraná"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 75
      }
    ],
    "note": "Gol Nau (CRB) 46'"
  }
];
