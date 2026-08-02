/** Campeonato Alagoano 1970 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * Contagem oficial: J21 V9 E5 D7 GP25 GC13.
 * Zé Luiz (goleiro) = cadastro da era 1970/72 (#1783), ≠ década de 80.
 * Zé Luiz II = volante/meia (fonte às vezes Zé Luiz / Zé Luiz I no meio).
 * Erik/Eric unificados como Erik na planilha; import mapeia para Eric #813.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1970;

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
    "date": "1970-04-05",
    "phase": "1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Pajuçara",
    "referee": "Dirceu Arruda",
    "starters": [
      "Zé Luiz",
      "Catatau",
      "Dida",
      "Givaldo",
      "Erivaldo",
      "Ratinho",
      "Erik",
      "Petruce",
      "Salê",
      "Geo",
      "Ricardo"
    ],
    "entered": [
      "Tadeu",
      "Roberto"
    ],
    "subs": [
      {
        "out": "Ratinho",
        "in": "Tadeu"
      },
      {
        "out": "Geo",
        "in": "Roberto"
      }
    ],
    "goals": [
      {
        "name": "Geo"
      },
      {
        "name": "Tadeu"
      }
    ]
  },
  {
    "date": "1970-04-12",
    "phase": "1º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Rubens Cerqueira",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Givaldo",
      "Erivaldo",
      "Tadeu",
      "Erik",
      "Ratinho",
      "Valfrido",
      "Salê",
      "Ricardo"
    ],
    "entered": [
      "Zé Leite",
      "Petruce"
    ],
    "subs": [
      {
        "out": "Erik",
        "in": "Zé Leite"
      },
      {
        "out": "Ratinho",
        "in": "Petruce"
      }
    ],
    "goals": [
      {
        "name": "Tadeu"
      },
      {
        "name": "Salê"
      },
      {
        "name": "Valfrido"
      }
    ]
  },
  {
    "date": "1970-04-19",
    "phase": "1º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio do Mutange",
    "referee": "Sebastião Canuto",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Paranhos",
      "Erivaldo",
      "Tadeu",
      "Erik",
      "Ratinho",
      "Valfrido",
      "Salê",
      "Ricardo"
    ],
    "entered": [
      "Barbosa",
      "Zé Leite"
    ],
    "subs": [
      {
        "out": "Erivaldo",
        "in": "Barbosa"
      },
      {
        "out": "Erik",
        "in": "Zé Leite"
      }
    ],
    "goals": [
      {
        "name": "Tadeu"
      },
      {
        "name": "Tadeu"
      }
    ]
  },
  {
    "date": "1970-05-03",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio do Mutange",
    "referee": "Rubens Cerqueira",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      "Erik",
      "Ratinho",
      "Salê",
      "Valfrido",
      "Ricardo"
    ],
    "entered": [
      "Erivaldo"
    ],
    "subs": [
      {
        "out": "Ciro",
        "in": "Erivaldo"
      }
    ],
    "goals": [
      {
        "name": "Tadeu"
      }
    ]
  },
  {
    "date": "1970-05-10",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Édson Amaro",
    "referee": "Sebastião Canuto",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Paranhos",
      "Erivaldo",
      "Zé Leite",
      "Erik",
      "Ratinho",
      "Tadeu",
      "Salê",
      "Ricardo"
    ],
    "entered": [
      "Valfrido"
    ],
    "subs": [
      {
        "out": "Tadeu",
        "in": "Valfrido"
      }
    ],
    "goals": [
      {
        "name": "Tadeu"
      }
    ]
  },
  {
    "date": "1970-05-17",
    "phase": "1º turno",
    "opponent": "Guarany-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Pajuçara",
    "referee": "José Ferreira"
  },
  {
    "date": "1970-05-31",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Pajuçara",
    "referee": "Sebastião Canuto",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Givaldo",
      "Paranhos",
      "Erivaldo",
      "Zé Leite",
      "Mário",
      "Ratinho",
      "Tadeu",
      "Salê",
      "Ricardo"
    ],
    "entered": [
      "Zé Luiz II",
      "Geo"
    ],
    "subs": [
      {
        "out": "Mário",
        "in": "Zé Luiz II"
      },
      {
        "out": "Salê",
        "in": "Geo"
      }
    ]
  },
  {
    "date": "1970-07-12",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio do Mutange",
    "referee": "Dirceu Arruda",
    "attendance": 1386,
    "manager": "Maglione Sales",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      "Zé Luiz II",
      "Ratinho",
      "Roberto",
      "Salê",
      "Ricardo"
    ],
    "entered": [
      "Erik",
      "Petruce"
    ],
    "subs": [
      {
        "out": "Zé Luiz II",
        "in": "Erik"
      },
      {
        "out": "Ratinho",
        "in": "Petruce"
      }
    ],
    "goals": [
      {
        "name": "Roberto"
      },
      {
        "name": "Roberto"
      },
      {
        "name": "Tadeu"
      },
      {
        "name": "Tadeu"
      }
    ]
  },
  {
    "date": "1970-07-19",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio do Mutange",
    "referee": "Sebastião Canuto",
    "manager": "Maglione Sales",
    "starters": [
      "Zé Galego",
      "Ciro",
      "Dida",
      "Paranhos",
      "Catatau",
      "Tadeu",
      "Zé Luiz II",
      "Petruce",
      "Roberto",
      "Salê",
      "Ricardo"
    ],
    "entered": [
      "Erik",
      "Valfrido"
    ],
    "subs": [
      {
        "out": "Tadeu",
        "in": "Erik"
      },
      {
        "out": "Salê",
        "in": "Valfrido"
      }
    ],
    "goals": [
      {
        "name": "Tadeu",
        "penalty": true
      },
      {
        "name": "Roberto"
      },
      {
        "name": "Roberto"
      }
    ]
  },
  {
    "date": "1970-07-26",
    "phase": "2º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio do Mutange",
    "referee": "Dirceu Arruda",
    "attendance": 1545,
    "manager": "Maglione Sales",
    "starters": [
      "Zé Luiz",
      "Catatau",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      "Zé Luiz II",
      "Petruce",
      "Roberto",
      "Salê",
      "Ricardo"
    ],
    "entered": [
      "Erik",
      "Piranha"
    ],
    "subs": [
      {
        "out": "Zé Luiz II",
        "in": "Erik"
      },
      {
        "out": "Salê",
        "in": "Piranha"
      }
    ],
    "goals": [
      {
        "name": "Roberto"
      },
      {
        "name": "Roberto"
      },
      {
        "name": "Barbosa"
      },
      {
        "name": "Ricardo"
      }
    ]
  },
  {
    "date": "1970-08-08",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio do Mutange",
    "referee": "Claudionor Tenório",
    "attendance": 1096,
    "manager": "Maglione Sales",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      "Zé Luiz II",
      "Petruce",
      "Roberto",
      "Salê",
      "Canhoteiro"
    ],
    "entered": [
      "Piranha",
      "Ricardo"
    ],
    "subs": [
      {
        "out": "Salê",
        "in": "Piranha"
      },
      {
        "out": "Canhoteiro",
        "in": "Ricardo"
      }
    ],
    "goals": [
      {
        "name": "Tadeu",
        "penalty": true
      }
    ]
  },
  {
    "date": "1970-08-16",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Sebastião Canuto",
    "manager": "Maglione Sales",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      "Zé Luiz II",
      "Ratinho",
      "Piranha",
      "Roberto",
      "Canhoteiro"
    ],
    "entered": [
      "Erik"
    ],
    "subs": [
      {
        "out": "Zé Luiz II",
        "in": "Erik"
      }
    ],
    "goals": [
      {
        "name": "Piranha"
      }
    ]
  },
  {
    "date": "1970-08-22",
    "phase": "2º turno",
    "opponent": "Guarany-AL",
    "ha": "home",
    "gf": 0,
    "ga": 2,
    "stadium": "Estádio do Mutange",
    "referee": "Edvan Tenório"
  },
  {
    "date": "1970-08-30",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Pajuçara",
    "referee": "Edvan Tenório",
    "manager": "Maglione Sales",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Erik",
      "Zé Luiz II",
      "Ratinho",
      "Valfrido",
      "Piranha",
      "Canhoteiro"
    ],
    "entered": [
      "Tadeu",
      "Roberto"
    ],
    "subs": [
      {
        "out": "Paranhos",
        "in": "Tadeu"
      },
      {
        "out": "Valfrido",
        "in": "Roberto"
      }
    ],
    "goals": [
      {
        "name": "Piranha"
      },
      {
        "name": "Roberto"
      }
    ]
  },
  {
    "date": "1970-09-06",
    "phase": "Decisão do 2º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Pajuçara",
    "referee": "Sebastião Canuto",
    "manager": "Maglione Sales",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Paranhos",
      "Barbosa",
      "Tadeu",
      "Zé Luiz II",
      "Ratinho",
      "Valfrido",
      "Piranha",
      "Canhoteiro"
    ],
    "entered": [
      "Erik",
      "Roberto"
    ],
    "subs": [
      {
        "out": "Zé Luiz II",
        "in": "Erik"
      },
      {
        "out": "Valfrido",
        "in": "Roberto"
      }
    ]
  },
  {
    "date": "1970-09-13",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Pajuçara",
    "referee": "Rubens Cerqueira",
    "manager": "Maglione Sales",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Givaldo",
      "Barbosa",
      "Zé Luiz II",
      "Erik",
      "Ratinho",
      "Roberto",
      "Lelé",
      "Canhoteiro"
    ],
    "entered": [
      "Tadeu",
      "Piranha"
    ],
    "subs": [
      {
        "out": "Erik",
        "in": "Tadeu"
      },
      {
        "out": "Lelé",
        "in": "Piranha"
      }
    ],
    "goals": [
      {
        "name": "Roberto"
      }
    ]
  },
  {
    "date": "1970-09-17",
    "phase": "3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 0,
    "ga": 1,
    "stadium": "Pajuçara",
    "referee": "Dirceu Arruda",
    "manager": "Maglione Sales",
    "starters": [
      "Zé Luiz",
      "Catatau",
      "Dida",
      "Tadeu",
      "Barbosa",
      "Erik",
      "Zé Luiz II",
      "Ratinho",
      "Roberto",
      "Lelé",
      "Canhoteiro"
    ],
    "entered": [
      "Givaldo",
      "Piranha"
    ],
    "subs": [
      {
        "out": "Tadeu",
        "in": "Givaldo"
      },
      {
        "out": "Lelé",
        "in": "Piranha"
      }
    ]
  },
  {
    "date": "1970-09-20",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Pajuçara",
    "referee": "Edvan Tenório",
    "manager": "Maglione Sales",
    "starters": [
      "Zé Galego",
      "Catatau",
      "Dida",
      "Givaldo",
      "Barbosa",
      "Zé Luiz II",
      "Tadeu",
      "Ratinho",
      "Valfrido",
      "Lelé",
      "Canhoteiro"
    ],
    "entered": [
      "Erik",
      "Roberto"
    ],
    "subs": [
      {
        "out": "Tadeu",
        "in": "Erik"
      },
      {
        "out": "Valfrido",
        "in": "Roberto"
      }
    ],
    "note": "Fonte lista Dida (Tadeu) e meio Zé Luiz I e Tadeu (Erik); mantido Tadeu titular no meio com Erik entrando (evita Tadeu em duas posições)"
  },
  {
    "date": "1970-09-27",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 0,
    "ga": 1,
    "stadium": "Pajuçara",
    "referee": "Sebastião Canuto",
    "attendance": 2738,
    "manager": "Maglione Sales",
    "starters": [
      "Zé Galego",
      "Catatau",
      "Givaldo",
      "Tadeu",
      "Erivaldo",
      "Zé Luiz II",
      "Erik",
      "Ratinho",
      "Lelé",
      "Valfrido",
      "Canhoteiro"
    ],
    "entered": [
      "Caroço",
      "Roberto"
    ],
    "subs": [
      {
        "out": "Erik",
        "in": "Caroço"
      },
      {
        "out": "Valfrido",
        "in": "Roberto"
      }
    ]
  },
  {
    "date": "1970-09-30",
    "phase": "3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Pajuçara",
    "referee": "Luiz Digerson"
  },
  {
    "date": "1970-10-04",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 1,
    "stadium": "Pajuçara",
    "referee": "Sebastião Canuto",
    "manager": "Maglione Sales",
    "starters": [
      "Zé Galego",
      "Catatau",
      "Paranhos",
      "Givaldo",
      "Barbosa",
      "Ratinho",
      "Zé Luiz II",
      "Caroço",
      "Piranha",
      "Roberto",
      "Canhoteiro"
    ],
    "entered": [
      "Erivaldo"
    ],
    "subs": [
      {
        "out": "Givaldo",
        "in": "Erivaldo"
      }
    ]
  }
];
