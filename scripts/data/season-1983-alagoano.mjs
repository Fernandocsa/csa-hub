/** Campeonato Alagoano 1983 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA vice-campeão; CRB campeão dos 3 turnos e geral.
 * Descarta ASA 0x0 de 29/06 (falta de energia); mantém rematch 07/07.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; prorrogação ≈ 91+.
 * Técnicos: Wassil Barbosa → Ernesto Guedes (21/08) → Luciano Veloso (3º) → Tadeu Lima (02/11).
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1983;

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
    "date": "1983-05-07",
    "phase": "1º turno",
    "opponent": "São Sebastião-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 1961,
    "revenue": 617000,
    "revenueText": "Cr$ 617.000,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Humberto",
      "Café",
      "Dequinha",
      "Zezinho",
      "Veiga",
      "Jorginho",
      "Rommel",
      "Américo",
      "Josenílton",
      "Jacozinho"
    ],
    "entered": [
      "Jurandir",
      "Everaldo"
    ],
    "subs": [
      {
        "out": "Adeíldo",
        "in": "Jurandir"
      },
      {
        "out": "Jacozinho",
        "in": "Everaldo"
      }
    ],
    "goals": [
      {
        "name": "Josenílton",
        "minute": 1
      },
      {
        "name": "Rommel",
        "minute": 14
      },
      {
        "name": "Jorginho",
        "minute": 59
      },
      {
        "name": "Josenílton",
        "minute": 90
      }
    ],
    "note": "Expulsão de Fábio (São Sebastião)"
  },
  {
    "date": "1983-05-15",
    "phase": "1º turno",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Manoel Moreira",
    "referee": "Moacir Serafim",
    "manager": "Wassil Barbosa",
    "goals": [
      {
        "name": "Zé Carlos",
        "minute": 92
      }
    ]
  },
  {
    "date": "1983-05-21",
    "phase": "1º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 2683,
    "revenue": 811750,
    "revenueText": "Cr$ 811.750,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Veiga",
      "Café",
      "Dequinha",
      "Zezinho",
      "Ademir",
      "Zé Carlos",
      "Rommel",
      "Jorginho",
      "Josenílton",
      "Jacozinho"
    ],
    "entered": [
      "Josival"
    ],
    "subs": [
      {
        "out": "Dequinha",
        "in": "Josival"
      }
    ],
    "goals": [
      {
        "name": "Josenílton",
        "minute": 32
      },
      {
        "name": "Zé Carlos",
        "minute": 46
      },
      {
        "name": "Zé Carlos",
        "minute": 66
      }
    ]
  },
  {
    "date": "1983-05-25",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 3018,
    "revenue": 956800,
    "revenueText": "Cr$ 956.800,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Veiga",
      "Café",
      "Josival",
      "Zezinho",
      "Ademir",
      "Zé Carlos",
      "Rommel",
      "Jorginho",
      "Josenílton",
      "Jacozinho"
    ],
    "entered": [
      "Carlos Alberto",
      "Américo"
    ],
    "subs": [
      {
        "out": "Veiga",
        "in": "Carlos Alberto"
      },
      {
        "out": "Rommel",
        "in": "Américo"
      }
    ],
    "goals": [
      {
        "name": "Ademir",
        "minute": 49
      }
    ]
  },
  {
    "date": "1983-05-28",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Josival Pedro",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Carlos Alberto Rocha",
      "Café",
      "Flávio",
      "Zezinho",
      "Ademir",
      "Veiga",
      "Zé Carlos",
      "Américo",
      "Josenílton",
      "Jacozinho"
    ],
    "entered": [
      "Beu"
    ],
    "subs": [
      {
        "out": "Jacozinho",
        "in": "Beu"
      }
    ],
    "note": "Gol Carlos Alberto (ASA, 48' 2ºT). Expulsão Carlos Alberto (ASA)."
  },
  {
    "date": "1983-06-08",
    "phase": "1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 3,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Cícero",
      "Café",
      "Flávio",
      "Carlos Alberto",
      "Veiga",
      "Zé Carlos",
      "Josenílton",
      "Jorginho",
      "Jorge Campos",
      "Zelito"
    ],
    "entered": [
      "Carlinhos"
    ],
    "subs": [
      {
        "out": "Josenílton",
        "in": "Carlinhos"
      }
    ],
    "goals": [
      {
        "name": "Jorginho",
        "minute": 40
      },
      {
        "name": "Carlos Alberto",
        "minute": 75
      },
      {
        "name": "Carlinhos",
        "minute": 80
      }
    ],
    "note": "Expulsões Jeová e Jorge da Sorte (Ferroviário)"
  },
  {
    "date": "1983-06-15",
    "phase": "1º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 1930,
    "revenue": 752800,
    "revenueText": "Cr$ 752.800,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Carlos Alberto",
      "Batista",
      "Café",
      "Zé Carlos",
      "Veiga",
      "Carlinhos",
      "Josenílton",
      "Jorginho",
      "Jorge Campos",
      "Betinho"
    ],
    "entered": [
      "Beu"
    ],
    "subs": [
      {
        "out": "Betinho",
        "in": "Beu"
      }
    ],
    "goals": [
      {
        "name": "Jorge Campos",
        "minute": 4
      },
      {
        "name": "Josenílton",
        "minute": 22
      },
      {
        "name": "Jorge Campos",
        "minute": 25
      },
      {
        "name": "Jorginho",
        "minute": 64,
        "penalty": true
      }
    ]
  },
  {
    "date": "1983-06-19",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 10150,
    "revenue": 4278800,
    "revenueText": "Cr$ 4.278.800,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Carlos Alberto",
      "Flávio",
      "Café",
      "Zé Carlos",
      "Veiga",
      "Josenílton",
      "Zeíca",
      "Jorginho",
      "Jorge Campos",
      "Betinho"
    ],
    "entered": [
      "Carlinhos",
      "Beu"
    ],
    "subs": [
      {
        "out": "Zeíca",
        "in": "Carlinhos"
      },
      {
        "out": "Betinho",
        "in": "Beu"
      }
    ]
  },
  {
    "date": "1983-06-26",
    "phase": "Quadrangular 1º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Juca Sampaio",
    "referee": "João Monteiro",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Carlos Alberto",
      "Flávio",
      "Café",
      "Ricardo",
      "Veiga",
      "Carlinhos",
      "Zeíca",
      "Jorginho",
      "Jorge Campos",
      "Betinho"
    ],
    "entered": [
      "Josenílton",
      "Zelito"
    ],
    "subs": [
      {
        "out": "Zeíca",
        "in": "Josenílton"
      },
      {
        "out": "Betinho",
        "in": "Zelito"
      }
    ]
  },
  {
    "date": "1983-07-03",
    "phase": "Quadrangular 1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 11112,
    "revenue": 4854500,
    "revenueText": "Cr$ 4.854.500,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Cícero",
      "Flávio",
      "Josival",
      "Carlos Alberto",
      "Veiga",
      "Jorginho",
      "Josenílton",
      "Frank",
      "Jorge Campos",
      "Bel"
    ],
    "entered": [
      "Zeíca",
      "Carlinhos"
    ],
    "subs": [
      {
        "out": "Veiga",
        "in": "Zeíca"
      },
      {
        "out": "Jorge Campos",
        "in": "Carlinhos"
      }
    ],
    "note": "Expulsões Márcio (CRB) e Flávio (CSA)"
  },
  {
    "date": "1983-07-07",
    "phase": "Quadrangular 1º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Antônio Morais",
    "attendance": 1143,
    "revenue": 445600,
    "revenueText": "Cr$ 445.600,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Cícero",
      "Café",
      "Josival",
      "Carlos Alberto",
      "Veiga",
      "Jorginho",
      "João Neto",
      "Zelito",
      "Josenílton",
      "Zeíca"
    ],
    "entered": [
      "Carlinhos",
      "Bel"
    ],
    "subs": [
      {
        "out": "Zelito",
        "in": "Carlinhos"
      },
      {
        "out": "Zeíca",
        "in": "Bel"
      }
    ],
    "note": "Rematch da partida de 29/06 interrompida por falta de energia"
  },
  {
    "date": "1983-07-13",
    "phase": "2º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 5,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dorivaldo Santana",
    "attendance": 2085,
    "revenue": 1219800,
    "revenueText": "Cr$ 1.219.800,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Cícero",
      "Flávio",
      "Josival",
      "Ricardo",
      "João Neto",
      "Carlinhos",
      "Zeíca",
      "Jorginho",
      "Frank",
      "Bel"
    ],
    "entered": [
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Frank",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Frank",
        "minute": 5
      },
      {
        "name": "Flávio",
        "minute": 25
      },
      {
        "name": "Flávio",
        "minute": 35
      },
      {
        "name": "Josenílton",
        "minute": 46
      },
      {
        "name": "João Neto",
        "minute": 70
      }
    ]
  },
  {
    "date": "1983-07-24",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Juca Sampaio",
    "referee": "Pelópidas Argolo",
    "revenue": 607000,
    "revenueText": "Cr$ 607.000,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Carlos Alberto",
      "Flávio",
      "Josival",
      "Ricardo",
      "Édson Silva",
      "Falcão",
      "João Neto",
      "Jorginho",
      "Josenílton",
      "Zeíca"
    ],
    "entered": [
      "Bel"
    ],
    "subs": [
      {
        "out": "Zeíca",
        "in": "Bel"
      }
    ]
  },
  {
    "date": "1983-07-28",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 1951,
    "revenue": 759800,
    "revenueText": "Cr$ 759.800,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Carlos Alberto",
      "Flávio",
      "Josival",
      "Ricardo",
      "Édson Silva",
      "Falcão",
      "João Neto",
      "Jorginho",
      "Josenílton",
      "Zeíca"
    ],
    "entered": [
      "Carlinhos",
      "Bel"
    ],
    "subs": [
      {
        "out": "Falcão",
        "in": "Carlinhos"
      },
      {
        "out": "Zeíca",
        "in": "Bel"
      }
    ],
    "goals": [
      {
        "name": "Falcão",
        "minute": 4
      },
      {
        "name": "Josenílton",
        "minute": 49
      },
      {
        "name": "Flávio",
        "minute": 53
      }
    ]
  },
  {
    "date": "1983-07-31",
    "phase": "2º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dorivaldo Santana",
    "attendance": 2909,
    "revenue": 1572800,
    "revenueText": "Cr$ 1.572.800,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Jurandir",
      "Carlos Alberto",
      "Flávio",
      "Josival",
      "Ricardo",
      "Édson Silva",
      "Falcão",
      "João Neto",
      "Zelito",
      "Josenílton",
      "Zeíca"
    ],
    "entered": [
      "Bel"
    ],
    "subs": [
      {
        "out": "João Neto",
        "in": "Bel"
      }
    ],
    "goals": [
      {
        "name": "Josenílton",
        "minute": 10
      },
      {
        "name": "Flávio",
        "minute": 35
      },
      {
        "name": "Josenílton",
        "minute": 38
      },
      {
        "name": "Falcão",
        "minute": 50
      }
    ],
    "note": "Expulsão de Gerson (Capelense)"
  },
  {
    "date": "1983-08-03",
    "phase": "2º turno",
    "opponent": "São Sebastião-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 3499,
    "revenue": 1375000,
    "revenueText": "Cr$ 1.375.000,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Carlos Alberto",
      "Flávio",
      "Josival",
      "Ricardo",
      "Édson Silva",
      "Falcão",
      "João Neto",
      "Jorginho",
      "Josenílton",
      "Zeíca"
    ],
    "entered": [
      "Zelito",
      "Veiga"
    ],
    "subs": [
      {
        "out": "Jorginho",
        "in": "Zelito"
      },
      {
        "out": "Zeíca",
        "in": "Veiga"
      }
    ],
    "goals": [
      {
        "name": "Josenílton",
        "minute": 12
      },
      {
        "name": "Flávio",
        "minute": 64,
        "penalty": true
      },
      {
        "name": "Ricardo",
        "minute": 89
      }
    ],
    "note": "Expulsões Flávio e Josenílton (CSA); Fábio e Fausto (São Sebastião)"
  },
  {
    "date": "1983-08-07",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 4292,
    "revenue": 1772300,
    "revenueText": "Cr$ 1.772.300,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Carlos Alberto",
      "Café",
      "Josival",
      "Ricardo",
      "Édson Silva",
      "Falcão",
      "João Neto",
      "Zelito",
      "Carlinhos",
      "Zeíca"
    ],
    "entered": [
      "Veiga"
    ],
    "subs": [
      {
        "out": "Josival",
        "in": "Veiga"
      }
    ],
    "goals": [
      {
        "name": "Carlos Alberto",
        "minute": 15,
        "penalty": true
      }
    ]
  },
  {
    "date": "1983-08-14",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "attendance": 9874,
    "revenue": 4253200,
    "revenueText": "Cr$ 4.253.200,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Adeíldo",
      "Carlos Alberto",
      "Flávio",
      "Dequinha",
      "Ricardo",
      "Édson Silva",
      "Falcão",
      "Paulinho",
      "Jorginho",
      "Josenílton",
      "Betinho"
    ],
    "entered": [
      "Ney Vagner"
    ],
    "subs": [
      {
        "out": "Paulinho",
        "in": "Ney Vagner"
      }
    ],
    "goals": [
      {
        "name": "Buá",
        "minute": 47,
        "ownGoal": true,
        "ownGoalDirection": "for"
      }
    ],
    "note": "Buá (ASA, contra). Gols ASA: Mundinho 7' 1ºT, Neco 26' 2ºT"
  },
  {
    "date": "1983-08-21",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 18123,
    "revenue": 8121700,
    "revenueText": "Cr$ 8.121.700,00",
    "manager": "Ernesto Guedes",
    "starters": [
      "Zé Luiz",
      "Café",
      "Flávio",
      "Dequinha",
      "Carlos Alberto",
      "Édson Silva",
      "Falcão",
      "Veiga",
      "Jorginho",
      "Josenílton",
      "Betinho"
    ],
    "entered": [
      "Carlinhos",
      "Ney Vagner"
    ],
    "subs": [
      {
        "out": "Josenílton",
        "in": "Carlinhos"
      },
      {
        "out": "Betinho",
        "in": "Ney Vagner"
      }
    ],
    "goals": [
      {
        "name": "Flávio",
        "minute": 91
      }
    ],
    "note": "Estreia de Ernesto Guedes"
  },
  {
    "date": "1983-08-25",
    "phase": "Quadrangular 2º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 5656,
    "revenue": 2368500,
    "revenueText": "Cr$ 2.368.500,00",
    "manager": "Ernesto Guedes",
    "starters": [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Dequinha",
      "Zé Carlos",
      "Édson Silva",
      "Falcão",
      "Veiga",
      "Jorginho",
      "Josenílton",
      "Betinho"
    ],
    "entered": [
      "João Neto",
      "Ney Vagner"
    ],
    "subs": [
      {
        "out": "Veiga",
        "in": "João Neto"
      },
      {
        "out": "Betinho",
        "in": "Ney Vagner"
      }
    ]
  },
  {
    "date": "1983-08-30",
    "phase": "Quadrangular 2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 8735,
    "revenue": 3828300,
    "revenueText": "Cr$ 3.828.300,00",
    "manager": "Ernesto Guedes",
    "starters": [
      "Zé Luiz",
      "Carlos Alberto",
      "Flávio",
      "Dequinha",
      "Mílton",
      "Édson Silva",
      "Falcão",
      "Veiga",
      "Jorginho",
      "Ney Vagner",
      "Josenílton"
    ],
    "entered": [
      "Café",
      "Bebeto"
    ],
    "subs": [
      {
        "out": "Dequinha",
        "in": "Café"
      },
      {
        "out": "Josenílton",
        "in": "Bebeto"
      }
    ],
    "goals": [
      {
        "name": "Bebeto",
        "minute": 83
      }
    ],
    "note": "Expulsão de Flávio (CSA)"
  },
  {
    "date": "1983-09-04",
    "phase": "Quadrangular 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 23265,
    "revenue": 10986900,
    "revenueText": "Cr$ 10.986.900,00",
    "manager": "Ernesto Guedes",
    "starters": [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Dequinha",
      "Mílton",
      "Édson Silva",
      "Falcão",
      "Veiga",
      "Jorginho",
      "Ney Vagner",
      "Josenílton"
    ],
    "entered": [
      "Carlinhos",
      "Bebeto"
    ],
    "subs": [
      {
        "out": "Veiga",
        "in": "Carlinhos"
      },
      {
        "out": "Ney Vagner",
        "in": "Bebeto"
      }
    ]
  },
  {
    "date": "1983-09-07",
    "phase": "Decisão 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 21619,
    "revenue": 10323600,
    "revenueText": "Cr$ 10.323.600,00",
    "manager": "Ernesto Guedes",
    "starters": [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Dequinha",
      "Mílton",
      "Édson Silva",
      "Veiga",
      "Jorginho",
      "Carlinhos",
      "Ney Vagner",
      "Bebeto"
    ],
    "entered": [
      "Falcão",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Ney Vagner",
        "in": "Falcão"
      },
      {
        "out": "Bebeto",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Jorginho",
        "minute": 70
      }
    ],
    "note": "Tempo normal 1x1; prorrogação Márcio 7' e Ivanildo 10' (CRB). CRB campeão 2º turno."
  },
  {
    "date": "1983-09-11",
    "phase": "3º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Manoel Cavalcante",
    "attendance": 1862,
    "revenue": 759100,
    "revenueText": "Cr$ 759.100,00",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Dequinha",
      "Mílton",
      "Édson Silva",
      "Jorginho",
      "Paulinho",
      "Carlinhos",
      "Ney Vagner",
      "Bebeto"
    ],
    "entered": [
      "Falcão",
      "Ferreira"
    ],
    "subs": [
      {
        "out": "Édson Silva",
        "in": "Falcão"
      },
      {
        "out": "Ney Vagner",
        "in": "Ferreira"
      }
    ],
    "goals": [
      {
        "name": "Jorginho",
        "minute": 44,
        "penalty": true
      },
      {
        "name": "Falcão",
        "minute": 74
      }
    ]
  },
  {
    "date": "1983-09-18",
    "phase": "3º turno",
    "opponent": "São Sebastião-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "José Nivaldo",
    "referee": "Josival Pedro",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Carlos Alberto",
      "Café",
      "Dequinha",
      "Mílton",
      "Veiga",
      "Jorginho",
      "Paulinho",
      "Carlinhos",
      "Ney Vagner",
      "Bebeto"
    ],
    "entered": [
      "Josenílton",
      "Ferreira"
    ],
    "subs": [
      {
        "out": "Paulinho",
        "in": "Josenílton"
      },
      {
        "out": "Bebeto",
        "in": "Ferreira"
      }
    ],
    "note": "Expulsões Natal (São Sebastião) e Josenílton (CSA)"
  },
  {
    "date": "1983-09-25",
    "phase": "3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 5,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 5307,
    "revenue": 2287100,
    "revenueText": "Cr$ 2.287.100,00",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Cícero",
      "Dequinha",
      "Edvaldo",
      "Carlos Alberto",
      "Édson Silva",
      "Ney Vagner",
      "Paulinho",
      "Jorginho",
      "Ferreira",
      "Betinho"
    ],
    "entered": [
      "Mílton",
      "Escurinho"
    ],
    "subs": [
      {
        "out": "Cícero",
        "in": "Mílton"
      },
      {
        "out": "Ferreira",
        "in": "Escurinho"
      }
    ],
    "goals": [
      {
        "name": "Ferreira",
        "minute": 7
      },
      {
        "name": "Edvaldo",
        "minute": 12
      },
      {
        "name": "Escurinho",
        "minute": 65
      },
      {
        "name": "Escurinho",
        "minute": 70
      },
      {
        "name": "Jorginho",
        "minute": 83
      }
    ]
  },
  {
    "date": "1983-09-28",
    "phase": "3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 4861,
    "revenue": 2061500,
    "revenueText": "Cr$ 2.061.500,00",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Cícero",
      "Café",
      "Dequinha",
      "Carlos Alberto",
      "Édson Silva",
      "Ferreira",
      "Paulinho",
      "Jorginho",
      "Ney Vagner",
      "Betinho"
    ],
    "entered": [
      "Escurinho",
      "Falcão"
    ],
    "subs": [
      {
        "out": "Ferreira",
        "in": "Escurinho"
      },
      {
        "out": "Paulinho",
        "in": "Falcão"
      }
    ],
    "goals": [
      {
        "name": "Carlos Alberto",
        "minute": 73
      },
      {
        "name": "Escurinho",
        "minute": 77
      },
      {
        "name": "Escurinho",
        "minute": 83
      }
    ]
  },
  {
    "date": "1983-10-02",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Josival Pedro",
    "attendance": 7830,
    "revenue": 3232700,
    "revenueText": "Cr$ 3.232.700,00",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Cícero",
      "Dequinha",
      "Edvaldo",
      "Carlos Alberto",
      "Édson Silva",
      "Ney Vagner",
      "Paulinho",
      "Jorginho",
      "Escurinho",
      "Betinho"
    ],
    "entered": [
      "Falcão",
      "Josenílton"
    ],
    "subs": [
      {
        "out": "Ney Vagner",
        "in": "Falcão"
      },
      {
        "out": "Paulinho",
        "in": "Josenílton"
      }
    ],
    "goals": [
      {
        "name": "Ney Vagner",
        "minute": 55
      }
    ]
  },
  {
    "date": "1983-10-12",
    "phase": "3º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 7,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 3839,
    "revenue": 1579000,
    "revenueText": "Cr$ 1.579.000,00",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Cícero",
      "Dequinha",
      "Edvaldo",
      "Mílton",
      "Édson Silva",
      "Ney Vagner",
      "Paulinho",
      "Jorginho",
      "Escurinho",
      "Betinho"
    ],
    "entered": [
      "Falcão",
      "Bebeto"
    ],
    "subs": [
      {
        "out": "Édson Silva",
        "in": "Falcão"
      },
      {
        "out": "Betinho",
        "in": "Bebeto"
      }
    ],
    "goals": [
      {
        "name": "Jorginho",
        "minute": 6,
        "penalty": true
      },
      {
        "name": "Escurinho",
        "minute": 12
      },
      {
        "name": "Paulinho",
        "minute": 22
      },
      {
        "name": "Ney Vagner",
        "minute": 24
      },
      {
        "name": "Escurinho",
        "minute": 54
      },
      {
        "name": "Escurinho",
        "minute": 59
      },
      {
        "name": "Escurinho",
        "minute": 65
      }
    ]
  },
  {
    "date": "1983-10-18",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 8,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 4393,
    "revenue": 1839200,
    "revenueText": "Cr$ 1.839.200,00",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Cícero",
      "Dequinha",
      "Edvaldo",
      "Carlos Alberto",
      "Falcão",
      "Ney Vagner",
      "Paulinho",
      "Jorginho",
      "Escurinho",
      "Bebeto"
    ],
    "entered": [
      "Josenílton",
      "Ferreira"
    ],
    "subs": [
      {
        "out": "Ney Vagner",
        "in": "Josenílton"
      },
      {
        "out": "Escurinho",
        "in": "Ferreira"
      }
    ],
    "goals": [
      {
        "name": "Escurinho",
        "minute": 12
      },
      {
        "name": "Ney Vagner",
        "minute": 45
      },
      {
        "name": "Bebeto",
        "minute": 50
      },
      {
        "name": "Ferreira",
        "minute": 58
      },
      {
        "name": "Jorginho",
        "minute": 69
      },
      {
        "name": "Bebeto",
        "minute": 71
      },
      {
        "name": "Carlos Alberto",
        "minute": 73
      },
      {
        "name": "Jorginho",
        "minute": 85
      }
    ],
    "note": "Expulsões Cardoso, Paulo Pita, Humberto, Édson e Nílson (São Domingos)"
  },
  {
    "date": "1983-10-23",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 23784,
    "revenue": 11496500,
    "revenueText": "Cr$ 11.496.500,00",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Cícero",
      "Dequinha",
      "Edvaldo",
      "Carlos Alberto",
      "Édson Silva",
      "Ney Vagner",
      "Paulinho",
      "Jorginho",
      "Escurinho",
      "Betinho"
    ],
    "entered": [
      "Falcão",
      "Bebeto"
    ],
    "subs": [
      {
        "out": "Paulinho",
        "in": "Falcão"
      },
      {
        "out": "Betinho",
        "in": "Bebeto"
      }
    ]
  },
  {
    "date": "1983-10-26",
    "phase": "Quadrangular 3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 17595,
    "revenue": 8668100,
    "revenueText": "Cr$ 8.668.100,00",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Café",
      "Dequinha",
      "Edvaldo",
      "Carlos Alberto",
      "Édson Silva",
      "Ney Vagner",
      "Falcão",
      "Jorginho",
      "Escurinho",
      "Betinho"
    ],
    "entered": [
      "Veiga",
      "Ferreira"
    ],
    "subs": [
      {
        "out": "Café",
        "in": "Veiga"
      },
      {
        "out": "Escurinho",
        "in": "Ferreira"
      }
    ],
    "goals": [
      {
        "name": "Jorginho",
        "minute": 40
      }
    ]
  },
  {
    "date": "1983-10-30",
    "phase": "Quadrangular 3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 3984,
    "revenue": 1657100,
    "revenueText": "Cr$ 1.657.100,00",
    "manager": "Luciano Veloso",
    "starters": [
      "Zé Luiz",
      "Café",
      "Dequinha",
      "Edvaldo",
      "Carlos Alberto",
      "Édson Silva",
      "Escurinho",
      "Falcão",
      "Jorginho",
      "Ferreira",
      "Betinho"
    ],
    "entered": [
      "Nílson",
      "Paulinho"
    ],
    "subs": [
      {
        "out": "Ferreira",
        "in": "Nílson"
      },
      {
        "out": "Betinho",
        "in": "Paulinho"
      }
    ],
    "note": "Expulsão Nílson (CSA). Após o jogo, Luciano Veloso pediu demissão."
  },
  {
    "date": "1983-11-02",
    "phase": "Quadrangular 3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "manager": "Tadeu Lima",
    "note": "Tadeu Lima interino. ASA jogava pelo empate (Taça de Prata); acusações de corpo mole na imprensa."
  }
];
