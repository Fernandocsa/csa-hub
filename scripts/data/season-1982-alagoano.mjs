/** Campeonato Alagoano 1982 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA campeão estadual (1º e 3º turnos + superturno final).
 * Texto lista 36 jogos (V25 E7 D4 GF78 GC23); classificação oficial cita J37 E8
 * (provável empate sem gols ausente — GF/GC idênticos).
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N.
 * Técnicos: Jorge Vasconcelos (1º/2º) → Velha (3º + superturno).
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1982;

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
export const GAMES = [
  {
    "date": "1982-05-16",
    "phase": "1º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 6,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Ernande Jonas",
    "attendance": 4438,
    "revenue": 858600,
    "revenueText": "Cr$ 858.600,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Joceli",
      "Flávio",
      "Café",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Veiga",
      "Rommel",
      "Américo",
      "Dentinho",
      "Jacozinho"
    ],
    "entered": [
      "Josenílton",
      "Mug"
    ],
    "subs": [
      {
        "out": "Veiga",
        "in": "Josenílton"
      },
      {
        "out": "Américo",
        "in": "Mug"
      }
    ],
    "goals": [
      {
        "name": "Dentinho",
        "minute": 30
      },
      {
        "name": "Rommel",
        "minute": 40,
        "penalty": true
      },
      {
        "name": "Rommel",
        "minute": 42,
        "penalty": true
      },
      {
        "name": "Rommel",
        "minute": 65
      },
      {
        "name": "Rommel",
        "minute": 82,
        "penalty": true
      },
      {
        "name": "Jacozinho",
        "minute": 83
      }
    ]
  },
  {
    "date": "1982-05-26",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Moacir Serafim",
    "attendance": 4100,
    "revenue": 781950,
    "revenueText": "Cr$ 781.950,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Flávio",
      "Café",
      "Fernando",
      "Zezinho",
      "Veiga",
      "Ademir",
      "Rommel",
      "Américo",
      "Dentinho",
      "Jacozinho"
    ],
    "entered": [
      "Josenílton",
      "Mug"
    ],
    "subs": [
      {
        "out": "Veiga",
        "in": "Josenílton"
      },
      {
        "out": "Jacozinho",
        "in": "Mug"
      }
    ],
    "goals": [
      {
        "name": "Mug"
      },
      {
        "name": "Dentinho"
      }
    ]
  },
  {
    "date": "1982-05-30",
    "phase": "1º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 7,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Benedito Amâncio",
    "attendance": 4217,
    "revenue": 808500,
    "revenueText": "Cr$ 808.500,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Flávio",
      "Café",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Josenílton",
      "Rommel",
      "Américo",
      "Dentinho",
      "Mug"
    ],
    "entered": [
      "Veiga",
      "Jacozinho"
    ],
    "subs": [
      {
        "out": "Flávio",
        "in": "Veiga"
      },
      {
        "out": "Américo",
        "in": "Jacozinho"
      }
    ],
    "goals": [
      {
        "name": "Dentinho",
        "minute": 24
      },
      {
        "name": "Josenílton",
        "minute": 33
      },
      {
        "name": "Rommel",
        "minute": 60,
        "penalty": true
      },
      {
        "name": "Rommel",
        "minute": 72,
        "penalty": true
      },
      {
        "name": "Dentinho",
        "minute": 74
      },
      {
        "name": "Jacozinho",
        "minute": 76
      }
    ],
    "note": "Fonte lista 6 gols nomeados para placar 7x0 — 1 gol sem autor explícito no texto"
  },
  {
    "date": "1982-06-06",
    "phase": "1º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Moacir Serafim",
    "revenue": 448000,
    "revenueText": "Cr$ 448.000,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Geraldo",
      "Café",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Veiga",
      "Josenílton",
      "Américo",
      "Dentinho",
      "Mug"
    ],
    "entered": [
      "João",
      "Jacozinho"
    ],
    "subs": [
      {
        "out": "Veiga",
        "in": "João"
      },
      {
        "out": "Américo",
        "in": "Jacozinho"
      }
    ],
    "note": "Expulsão de Teti (Penedense)"
  },
  {
    "date": "1982-06-09",
    "phase": "1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 2369,
    "revenue": 436950,
    "revenueText": "Cr$ 436.950,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Geraldo",
      "Café",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Josenílton",
      "Rommel",
      "Jacozinho",
      "Américo",
      "Mug"
    ],
    "entered": [
      "Veiga",
      "João"
    ],
    "subs": [
      {
        "out": "Rommel",
        "in": "Veiga"
      },
      {
        "out": "Mug",
        "in": "João"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 24
      },
      {
        "name": "Jacozinho",
        "minute": 48
      },
      {
        "name": "Américo",
        "minute": 58
      },
      {
        "name": "Jacozinho",
        "minute": 70
      }
    ]
  },
  {
    "date": "1982-06-12",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Rufino",
    "revenue": 1294250,
    "revenueText": "Cr$ 1.294.250,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Adeíldo",
      "Geraldo",
      "Café",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Josenílton",
      "Rommel",
      "Américo",
      "Dentinho",
      "Mug"
    ],
    "entered": [
      "Veiga",
      "Jacozinho"
    ],
    "subs": [
      {
        "out": "Josenílton",
        "in": "Veiga"
      },
      {
        "out": "Américo",
        "in": "Jacozinho"
      }
    ],
    "goals": [
      {
        "name": "Américo",
        "minute": 27
      }
    ]
  },
  {
    "date": "1982-06-19",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 3,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Wilson Carlos dos Santos",
    "attendance": 8206,
    "revenue": 1637650,
    "revenueText": "Cr$ 1.637.650,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Geraldo",
      "Café",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Josenílton",
      "Rommel",
      "Américo",
      "Dentinho",
      "Mug"
    ],
    "entered": [
      "Jorginho",
      "Veiga"
    ],
    "subs": [
      {
        "out": "Josenílton",
        "in": "Jorginho"
      },
      {
        "out": "Américo",
        "in": "Veiga"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 72
      },
      {
        "name": "Rommel",
        "minute": 82,
        "penalty": true
      },
      {
        "name": "Jorginho",
        "minute": 89
      }
    ]
  },
  {
    "date": "1982-06-24",
    "phase": "Quadrangular 1º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Moacir Serafim",
    "attendance": 2854,
    "revenue": 562750,
    "revenueText": "Cr$ 562.750,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Adeíldo",
      "Geraldo",
      "Café",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Dentinho",
      "Mug"
    ],
    "entered": [
      "Josenílton",
      "Jacozinho"
    ],
    "subs": [
      {
        "out": "Rommel",
        "in": "Josenílton"
      },
      {
        "out": "Américo",
        "in": "Jacozinho"
      }
    ],
    "goals": [
      {
        "name": "Américo",
        "minute": 47
      }
    ],
    "note": "Expulsões Dentinho (CSA) e Zé Unílson (Penedense). CSA campeão 1º turno."
  },
  {
    "date": "1982-06-27",
    "phase": "Quadrangular 1º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Moacir Serafim",
    "attendance": 3743,
    "revenue": 739900,
    "revenueText": "Cr$ 739.900,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Adeíldo",
      "Geraldo",
      "Café",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Américo",
      "Mug"
    ],
    "entered": [
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Jacozinho",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 9,
        "penalty": true
      },
      {
        "name": "Américo",
        "minute": 41
      },
      {
        "name": "Américo",
        "minute": 81
      }
    ]
  },
  {
    "date": "1982-07-03",
    "phase": "Quadrangular 1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Nacor Benedito Aroche",
    "attendance": 6892,
    "revenue": 1405400,
    "revenueText": "Cr$ 1.405.400,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Adeíldo",
      "Geraldo",
      "Café",
      "Fernando",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Dentinho",
      "Mug"
    ],
    "entered": [
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Américo",
        "in": "Josenílton"
      }
    ],
    "note": "Expulsões Zezinho (CSA) e Neco (ASA). CSA campeão do 1º turno."
  },
  {
    "date": "1982-07-21",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Edson Batista da Hora",
    "revenue": 1054600,
    "revenueText": "Cr$ 1.054.600,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Adeíldo",
      "Zezinho",
      "Café",
      "Dequinha",
      "Gaúcho Lima",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marcinho",
      "Mug"
    ],
    "entered": [
      "Veiga",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Rommel",
        "in": "Veiga"
      },
      {
        "out": "Marcinho",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 75
      },
      {
        "name": "Mug",
        "minute": 90
      }
    ]
  },
  {
    "date": "1982-07-25",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 6,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "attendance": 2919,
    "revenue": 562750,
    "revenueText": "Cr$ 562.750,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Zezinho",
      "Café",
      "Dequinha",
      "Gaúcho Lima",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marcinho",
      "Mug"
    ],
    "entered": [
      "Dentinho"
    ],
    "subs": [
      {
        "out": "Américo",
        "in": "Dentinho"
      }
    ],
    "goals": [
      {
        "name": "Zezinho",
        "minute": 36
      },
      {
        "name": "Zezinho",
        "minute": 42
      },
      {
        "name": "Mug",
        "minute": 45
      },
      {
        "name": "Américo",
        "minute": 59
      },
      {
        "name": "Marcinho",
        "minute": 63
      },
      {
        "name": "Dentinho",
        "minute": 75
      }
    ]
  },
  {
    "date": "1982-08-01",
    "phase": "2º turno",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Manoel Moreira",
    "referee": "Ronaldo Nunes",
    "attendance": 2800,
    "revenue": 496000,
    "revenueText": "Cr$ 496.000,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Adeíldo",
      "Zezinho",
      "Café",
      "Dequinha",
      "Gaúcho Lima",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marcinho",
      "Dentinho"
    ],
    "entered": [
      "Geraldo",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Gaúcho Lima",
        "in": "Geraldo"
      },
      {
        "out": "Marcinho",
        "in": "Josenílton"
      }
    ]
  },
  {
    "date": "1982-08-04",
    "phase": "2º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "attendance": 2017,
    "revenue": 381500,
    "revenueText": "Cr$ 381.500,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Zezinho",
      "Café",
      "Dequinha",
      "Gaúcho Lima",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marcinho",
      "Beu"
    ],
    "entered": [
      "Josenílton",
      "Jacozinho"
    ],
    "subs": [
      {
        "out": "Marcinho",
        "in": "Josenílton"
      },
      {
        "out": "Beu",
        "in": "Jacozinho"
      }
    ],
    "goals": [
      {
        "name": "Josenílton",
        "minute": 75
      },
      {
        "name": "Américo",
        "minute": 80
      },
      {
        "name": "Jorginho",
        "minute": 90
      }
    ]
  },
  {
    "date": "1982-08-08",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "attendance": 4003,
    "revenue": 776500,
    "revenueText": "Cr$ 776.500,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Adeíldo",
      "Zezinho",
      "Café",
      "Dequinha",
      "Gaúcho Lima",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Dentinho",
      "Mug"
    ],
    "entered": [
      "Josenílton",
      "Jacozinho"
    ],
    "subs": [
      {
        "out": "Rommel",
        "in": "Josenílton"
      },
      {
        "out": "Américo",
        "in": "Jacozinho"
      }
    ],
    "goals": [
      {
        "name": "Cremildo",
        "minute": 15,
        "ownGoal": true,
        "ownGoalDirection": "for"
      }
    ]
  },
  {
    "date": "1982-08-15",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 1,
    "ga": 2,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Maurílio José Santiago",
    "revenue": 2437250,
    "revenueText": "Cr$ 2.437.250,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Geraldo",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Américo",
      "Mug"
    ],
    "entered": [
      "Josenílton",
      "Marcinho"
    ],
    "subs": [
      {
        "out": "Geraldo",
        "in": "Josenílton"
      },
      {
        "out": "Jacozinho",
        "in": "Marcinho"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 57
      }
    ]
  },
  {
    "date": "1982-08-22",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 4,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Wilson Carlos dos Santos",
    "attendance": 19130,
    "revenue": 4131450,
    "revenueText": "Cr$ 4.131.450,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Geraldo",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Américo",
      "Mug"
    ],
    "entered": [
      "Gaúcho Lima",
      "Marcinho"
    ],
    "subs": [
      {
        "out": "Zezinho",
        "in": "Gaúcho Lima"
      },
      {
        "out": "Américo",
        "in": "Marcinho"
      }
    ],
    "goals": [
      {
        "name": "Ademir",
        "minute": 36
      },
      {
        "name": "Jacozinho",
        "minute": 42
      },
      {
        "name": "Jorginho",
        "minute": 50
      },
      {
        "name": "Rommel",
        "minute": 89,
        "penalty": true
      }
    ]
  },
  {
    "date": "1982-08-26",
    "phase": "Quadrangular 2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "manager": "Jorge Vasconcelos",
    "goals": [
      {
        "name": "Rommel",
        "minute": 28
      },
      {
        "name": "Rommel",
        "minute": 60
      }
    ]
  },
  {
    "date": "1982-08-29",
    "phase": "Quadrangular 2º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Carlos Rosa Martins",
    "attendance": 11789,
    "revenue": 2897150,
    "revenueText": "Cr$ 2.897.150,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Geraldo",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Marcinho",
      "Mug"
    ],
    "entered": [
      "Gaúcho Lima",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Zezinho",
        "in": "Gaúcho Lima"
      },
      {
        "out": "Marcinho",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Jorginho",
        "minute": 67
      }
    ],
    "note": "Expulsões Jurandir (ASA) e Josenílton (CSA)"
  },
  {
    "date": "1982-09-05",
    "phase": "Quadrangular 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Roberto Wright",
    "attendance": 25555,
    "revenue": 6643850,
    "revenueText": "Cr$ 6.643.850,00",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Luiz",
      "Geraldo",
      "Café",
      "Dequinha",
      "Gaúcho Lima",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Marcinho",
      "Mug"
    ],
    "entered": [
      "Veiga",
      "Celso"
    ],
    "subs": [
      {
        "out": "Marcinho",
        "in": "Veiga"
      },
      {
        "out": "Mug",
        "in": "Celso"
      }
    ],
    "note": "CRB liderou o quadrangular (06 PG); texto não declara campeão explícito do 2º turno."
  },
  {
    "date": "1982-09-12",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "attendance": 2052,
    "revenue": 394400,
    "revenueText": "Cr$ 394.400,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Geraldo",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Marcinho",
      "Jacozinho",
      "Josenílton",
      "Mug"
    ],
    "entered": [
      "João"
    ],
    "subs": [
      {
        "out": "Jacozinho",
        "in": "João"
      }
    ],
    "goals": [
      {
        "name": "Zezinho",
        "minute": 17
      },
      {
        "name": "Mug",
        "minute": 56
      }
    ]
  },
  {
    "date": "1982-09-22",
    "phase": "3º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Ronaldo Nunes",
    "attendance": 5149,
    "revenue": 1012350,
    "revenueText": "Cr$ 1.012.350,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Geraldo",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Marciano",
      "Mug"
    ],
    "entered": [
      "Marcinho",
      "Américo"
    ],
    "subs": [
      {
        "out": "Jorginho",
        "in": "Marcinho"
      },
      {
        "out": "Jacozinho",
        "in": "Américo"
      }
    ],
    "goals": [
      {
        "name": "Jorginho",
        "minute": 53
      },
      {
        "name": "Rommel",
        "minute": 76,
        "penalty": true
      },
      {
        "name": "Zezinho",
        "minute": 91
      }
    ]
  },
  {
    "date": "1982-09-26",
    "phase": "3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 6409,
    "revenue": 1290500,
    "revenueText": "Cr$ 1.290.500,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Geraldo",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Marciano",
      "Mug"
    ],
    "entered": [
      "Fernando",
      "Valmir"
    ],
    "subs": [
      {
        "out": "Dequinha",
        "in": "Fernando"
      },
      {
        "out": "Zezinho",
        "in": "Valmir"
      }
    ],
    "goals": [
      {
        "name": "Jorginho",
        "minute": 45
      },
      {
        "name": "Jacozinho",
        "minute": 65
      },
      {
        "name": "Rommel",
        "minute": 71,
        "penalty": true
      },
      {
        "name": "Mug",
        "minute": 74
      }
    ]
  },
  {
    "date": "1982-10-02",
    "phase": "3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 4911,
    "revenue": 940800,
    "revenueText": "Cr$ 940.800,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Geraldo",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Marciano",
      "Mug"
    ],
    "entered": [
      "Fernando",
      "Valmir"
    ],
    "subs": [
      {
        "out": "Dequinha",
        "in": "Fernando"
      },
      {
        "out": "Fernando",
        "in": "Valmir"
      }
    ],
    "goals": [
      {
        "name": "Marcinho",
        "minute": 76
      },
      {
        "name": "Jorginho",
        "minute": 84
      }
    ],
    "note": "Dequinha → Fernando → Valmir. Fonte atribui gol a Marcinho (não listado na escalação; Marciano era titular)."
  },
  {
    "date": "1982-10-06",
    "phase": "3º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Ernande Jonas",
    "attendance": 3124,
    "revenue": 598250,
    "revenueText": "Cr$ 598.250,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Humberto",
      "Valmir",
      "Gaúcho Lima",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Marciano",
      "Mug"
    ],
    "entered": [
      "Geraldo",
      "Américo"
    ],
    "subs": [
      {
        "out": "Humberto",
        "in": "Geraldo"
      },
      {
        "out": "Mug",
        "in": "Américo"
      }
    ],
    "goals": [
      {
        "name": "Marciano"
      },
      {
        "name": "Marciano"
      },
      {
        "name": "Marciano"
      },
      {
        "name": "Mug"
      }
    ]
  },
  {
    "date": "1982-10-10",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Carlos Rosa Martins",
    "attendance": 8940,
    "revenue": 1821300,
    "revenueText": "Cr$ 1.821.300,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Valmir",
      "Café",
      "Gaúcho Lima",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Jacozinho",
      "Marciano",
      "Mug"
    ],
    "entered": [
      "Humberto",
      "Américo"
    ],
    "subs": [
      {
        "out": "Gaúcho Lima",
        "in": "Humberto"
      },
      {
        "out": "Marciano",
        "in": "Américo"
      }
    ]
  },
  {
    "date": "1982-10-17",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Giese do Couto",
    "attendance": 18836,
    "revenue": 4727730,
    "revenueText": "Cr$ 4.727.730,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Valmir",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marciano",
      "Jacozinho"
    ],
    "entered": [
      "Geraldo",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Valmir",
        "in": "Geraldo"
      },
      {
        "out": "Ademir",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 19,
        "penalty": true
      },
      {
        "name": "Américo",
        "minute": 40
      }
    ]
  },
  {
    "date": "1982-10-21",
    "phase": "Quadrangular 3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 5456,
    "revenue": 1219210,
    "revenueText": "Cr$ 1.219.210,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Humberto",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marciano",
      "Jacozinho"
    ],
    "entered": [
      "Josenílton",
      "Marcinho"
    ],
    "subs": [
      {
        "out": "Rommel",
        "in": "Josenílton"
      },
      {
        "out": "Américo",
        "in": "Marcinho"
      }
    ],
    "goals": [
      {
        "name": "Marciano",
        "minute": 18
      },
      {
        "name": "Josenílton",
        "minute": 75
      }
    ]
  },
  {
    "date": "1982-10-24",
    "phase": "Quadrangular 3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Bráulio Zanotto",
    "attendance": 8537,
    "revenue": 2087750,
    "revenueText": "Cr$ 2.087.750,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Humberto",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marciano",
      "Jacozinho"
    ],
    "entered": [
      "Geraldo",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Humberto",
        "in": "Geraldo"
      },
      {
        "out": "Marciano",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 49,
        "penalty": true
      },
      {
        "name": "Américo",
        "minute": 69
      }
    ],
    "note": "Rommel pênalti aos 49' do 1ºT (conforme fonte)."
  },
  {
    "date": "1982-10-31",
    "phase": "Quadrangular 3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Artur Ribeiro de Araújo",
    "attendance": 10285,
    "revenue": 2565250,
    "revenueText": "Cr$ 2.565.250,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Humberto",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marciano",
      "Jacozinho"
    ],
    "entered": [
      "Veiga",
      "Geraldo"
    ],
    "subs": [
      {
        "out": "Ademir",
        "in": "Veiga"
      },
      {
        "out": "Américo",
        "in": "Geraldo"
      }
    ],
    "goals": [
      {
        "name": "Marciano",
        "minute": 30
      }
    ],
    "note": "Expulsões Zezinho (CSA); Batista e Carlos Roberto (CRB). CSA campeão 3º turno."
  },
  {
    "date": "1982-11-07",
    "phase": "Superturno final",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 7200,
    "revenue": 1690950,
    "revenueText": "Cr$ 1.690.950,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Humberto",
      "Café",
      "Dequinha",
      "Geraldo",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marciano",
      "Jacozinho"
    ],
    "entered": [
      "Mug",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Américo",
        "in": "Mug"
      },
      {
        "out": "Marciano",
        "in": "Josenílton"
      }
    ],
    "note": "Expulsão Jacozinho (CSA) no 2ºT. Bonificação: CSA +4 PG (dois turnos), CRB +2 PG."
  },
  {
    "date": "1982-11-14",
    "phase": "Superturno final",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Ernande Jonas",
    "attendance": 7598,
    "revenue": 1861900,
    "revenueText": "Cr$ 1.861.900,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Valmir",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marciano",
      "Mug"
    ],
    "entered": [
      "Humberto",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Zezinho",
        "in": "Humberto"
      },
      {
        "out": "Mug",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Marciano",
        "minute": 10
      },
      {
        "name": "Marciano",
        "minute": 53
      }
    ],
    "note": "Jogo encerrado antecipadamente após tumulto por pênalti duvidoso (~37' 2ºT). Expulsões ASA."
  },
  {
    "date": "1982-11-21",
    "phase": "Superturno final",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Marçal Filho",
    "attendance": 13591,
    "revenue": 3508150,
    "revenueText": "Cr$ 3.508.150,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Valmir",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marciano",
      "Mug"
    ],
    "entered": [
      "Marcinho",
      "Jacozinho"
    ],
    "subs": [
      {
        "out": "Marciano",
        "in": "Marcinho"
      },
      {
        "out": "Mug",
        "in": "Jacozinho"
      }
    ],
    "goals": [
      {
        "name": "Marciano",
        "minute": 47
      },
      {
        "name": "Marcinho",
        "minute": 89
      }
    ],
    "note": "Expulsões Nau (CRB) e Café (CSA)"
  },
  {
    "date": "1982-11-28",
    "phase": "Superturno final",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 2,
    "ga": 2,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Josival Pedro",
    "revenue": 957950,
    "revenueText": "Cr$ 957.950,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Humberto",
      "Valmir",
      "Dequinha",
      "Zezinho",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marciano",
      "Mug"
    ],
    "entered": [
      "Marcinho",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Américo",
        "in": "Marcinho"
      },
      {
        "out": "Mug",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Marciano",
        "minute": 55
      },
      {
        "name": "Jorginho",
        "minute": 83
      }
    ]
  },
  {
    "date": "1982-12-01",
    "phase": "Superturno final",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 10682,
    "revenue": 2755750,
    "revenueText": "Cr$ 2.755.750,00",
    "manager": "Velha",
    "starters": [
      "Adeíldo",
      "Valmir",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Jorginho",
      "Rommel",
      "Américo",
      "Marciano",
      "Mug"
    ],
    "entered": [
      "Jacozinho",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Américo",
        "in": "Jacozinho"
      },
      {
        "out": "Mug",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Rommel",
        "minute": 39,
        "penalty": true
      }
    ]
  },
  {
    "date": "1982-12-05",
    "phase": "Superturno final",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Abelardo Lucena",
    "attendance": 7959,
    "revenue": 1904800,
    "revenueText": "Cr$ 1.904.800,00",
    "manager": "Velha",
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 16
      },
      {
        "name": "Rommel",
        "minute": 83,
        "penalty": true
      }
    ],
    "note": "Expulsão Tuca (CRB) 40' 2ºT. CSA campeão alagoano 1982."
  }
];
