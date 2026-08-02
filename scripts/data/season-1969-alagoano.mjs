/** Campeonato Alagoano 1969 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * Contagem oficial: J12 V6 E4 D2 GP23 GC10.
 * Zé Luiz / Zé Luís na fonte = volante (#1179); goleiro = Zé Galego.
 * ownGoalDirection: "for" = GPF.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1969;

/**
 * @typedef {{
 *   date: string;
 *   phase: string;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number;
 *   ga: number;
 *   stadium?: string|null;
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
    "date": "1969-03-16",
    "phase": "1º turno",
    "opponent": "Guarany-AL",
    "ha": "away",
    "gf": 2,
    "ga": 1,
    "stadium": "Pajuçara",
    "referee": "José Amaro",
    "goals": [
      {
        "name": "Duda"
      },
      {
        "name": "Duda"
      }
    ]
  },
  {
    "date": "1969-03-23",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio do Mutange",
    "referee": "Rubens Cerqueira",
    "manager": "Pinguela",
    "starters": [
      "Zé Galego",
      "Ciro",
      "Dida",
      "Tadeu",
      "Erivaldo",
      "Zé Luís",
      "Erik",
      "Ratinho",
      "Giraldo",
      "Duda",
      "Petruce"
    ],
    "entered": [
      "Edmílson"
    ],
    "subs": [
      {
        "out": "Erik",
        "in": "Edmílson"
      }
    ],
    "goals": [
      {
        "name": "Giraldo"
      },
      {
        "name": "Duda"
      }
    ]
  },
  {
    "date": "1969-03-30",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Rubens Cerqueira",
    "manager": "Pinguela",
    "starters": [
      "Zé Galego",
      "Catatau",
      "Dida",
      "Tadeu",
      "Erivaldo",
      "Barbosa",
      "Petruce",
      "Giraldo",
      "Duda",
      "Deo",
      "Geo"
    ],
    "entered": [],
    "subs": []
  },
  {
    "date": "1969-04-06",
    "phase": "1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": null,
    "referee": "Rubens Cerqueira",
    "goals": [
      {
        "name": "Zé Luís"
      },
      {
        "name": "Geo"
      }
    ]
  },
  {
    "date": "1969-04-13",
    "phase": "1º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Paulo Soares"
  },
  {
    "date": "1969-04-20",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Pajuçara",
    "referee": "Paulo Soares",
    "manager": "Pinguela",
    "starters": [
      "Zé Galego",
      "Ciro",
      "Dida",
      "Tadeu",
      "Barbosa",
      "Zé Luís",
      "Erik",
      "Geo",
      "Giraldo",
      "Tonho Lima",
      "Deo"
    ],
    "entered": [
      "Petruce",
      "Alderico"
    ],
    "subs": [
      {
        "out": "Geo",
        "in": "Petruce"
      },
      {
        "out": "Tonho Lima",
        "in": "Alderico"
      }
    ]
  },
  {
    "date": "1969-05-04",
    "phase": "2º turno",
    "opponent": "Guarany-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Pajuçara",
    "note": "Gols do CSA não informados na fonte"
  },
  {
    "date": "1969-05-11",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 2,
    "stadium": "Pajuçara",
    "referee": "Paulo Soares",
    "manager": "Pinguela",
    "starters": [
      "Zé Galego",
      "Ciro",
      "Paranhos",
      "Tadeu",
      "Barbosa",
      "Zé Luís",
      "Erik",
      "Ratinho",
      "Giraldo",
      "Jairo",
      "Petruce"
    ],
    "entered": [
      "Cabeludo"
    ],
    "subs": [
      {
        "out": "Petruce",
        "in": "Cabeludo"
      }
    ],
    "goals": [
      {
        "name": "Jairo"
      },
      {
        "name": "Zé Luís"
      }
    ]
  },
  {
    "date": "1969-05-25",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Pajuçara",
    "referee": "Rubens Cerqueira",
    "goals": [
      {
        "name": "Giraldo"
      },
      {
        "name": "Giraldo"
      }
    ]
  },
  {
    "date": "1969-06-01",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 3,
    "ga": 3,
    "stadium": "Estádio Édson Amaro",
    "referee": "Paulo Soares",
    "manager": "Pinguela",
    "starters": [
      "Zé Galego",
      "Ciro",
      "Dida",
      "Tadeu",
      "Barbosa",
      "Zé Luís",
      "Erik",
      "Ratinho",
      "Giraldo",
      "Deo",
      "Cabeludo"
    ],
    "entered": [
      "Geo",
      "Alderico"
    ],
    "subs": [
      {
        "out": "Ratinho",
        "in": "Geo"
      },
      {
        "out": "Cabeludo",
        "in": "Alderico"
      }
    ],
    "goals": [
      {
        "name": "Deda",
        "ownGoal": true,
        "ownGoalDirection": "for"
      },
      {
        "name": "Giraldo"
      },
      {
        "name": "Ratinho"
      }
    ]
  },
  {
    "date": "1969-06-08",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 6,
    "ga": 0,
    "stadium": "Pajuçara",
    "referee": "Lourival Ferreira",
    "goals": [
      {
        "name": "Zé Luís"
      },
      {
        "name": "Deo"
      },
      {
        "name": "Deo"
      },
      {
        "name": "Deo"
      },
      {
        "name": "Giraldo"
      },
      {
        "name": "Giraldo"
      }
    ]
  },
  {
    "date": "1969-06-15",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Pajuçara",
    "referee": "Dirceu Arruda",
    "manager": "Pinguela",
    "starters": [
      "Zé Galego",
      "Ciro",
      "Paranhos",
      "Tadeu",
      "Barbosa",
      "Zé Luís",
      "Erik",
      "Ratinho",
      "Giraldo",
      "Deo",
      "Petruce"
    ],
    "entered": [
      "Alderico"
    ],
    "subs": [
      {
        "out": "Deo",
        "in": "Alderico"
      }
    ],
    "goals": [
      {
        "name": "Alderico"
      }
    ]
  }
];
