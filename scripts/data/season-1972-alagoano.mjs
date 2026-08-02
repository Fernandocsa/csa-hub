/** Campeonato Alagoano 1972 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * Jogo de 04/06/1972 (São Domingos) anulado — excludeFromStats; remarcação em 07/06.
 * Contagem oficial (exclui anulado): J31 V16 E9 D6 GP57 GC34.
 * Datas de jan–fev/1973 entram na season 1972.
 * Zé Luiz goleiro ≠ goleiro Zé Luiz da década de 1980.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1972;

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
    "date": "1972-02-27",
    "phase": "1º turno",
    "opponent": "Dínamo-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "goals": [
      {
        "name": "Fernando Carlos"
      },
      {
        "name": "Ricardo"
      }
    ]
  },
  {
    "date": "1972-03-12",
    "phase": "1º turno",
    "opponent": "Guarany-AL",
    "ha": "home",
    "gf": 4,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luís Digerson",
    "attendance": 703,
    "goals": [
      {
        "name": "Cardosinho"
      },
      {
        "name": "Valter"
      },
      {
        "name": "Manoelzinho II"
      },
      {
        "name": "Soareste"
      }
    ]
  },
  {
    "date": "1972-03-26",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "José Queiroz",
    "manager": "Pedrinho Rodrigues",
    "starters": [
      "Zé Luiz",
      "Erivaldo",
      "Paranhos",
      "Bibiu",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Valter",
      "Manoelzinho II",
      "Arnaldo",
      "Adeíldo"
    ],
    "entered": [
      "Fernando Carlos",
      "Manoelzinho I"
    ],
    "subs": [
      {
        "out": "Arnaldo",
        "in": "Fernando Carlos"
      },
      {
        "out": "Adeíldo",
        "in": "Manoelzinho I"
      }
    ],
    "goals": [
      {
        "name": "Manoelzinho I",
        "penalty": true
      }
    ]
  },
  {
    "date": "1972-04-02",
    "phase": "1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Claudionor Tenório",
    "goals": [
      {
        "name": "Fernando Carlos"
      }
    ]
  },
  {
    "date": "1972-04-16",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz",
    "attendance": 3644,
    "goals": [
      {
        "name": "Freitas"
      },
      {
        "name": "Soareste"
      }
    ]
  },
  {
    "date": "1972-04-23",
    "phase": "1º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 1,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz",
    "goals": [
      {
        "name": "Dudu"
      }
    ]
  },
  {
    "date": "1972-05-07",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Carlos Costa (RJ)",
    "attendance": 24166,
    "manager": "Pedrinho Rodrigues",
    "starters": [
      "Zé Luiz",
      "Teco",
      "Bibiu",
      "Paranhos",
      "Jaminho",
      "Valter",
      "Mário",
      "Manoelzinho",
      "Fernando Carlos",
      "Freitas",
      "Adeíldo"
    ],
    "entered": [
      "Arnaldo",
      "Cardosinho"
    ],
    "subs": [
      {
        "out": "Mário",
        "in": "Arnaldo"
      },
      {
        "out": "Adeíldo",
        "in": "Cardosinho"
      }
    ],
    "goals": [
      {
        "name": "Ronaldo Brito",
        "ownGoal": true,
        "ownGoalDirection": "for"
      }
    ]
  },
  {
    "date": "1972-05-14",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Édson Amaro",
    "referee": "Sebastião Canuto",
    "goals": [
      {
        "name": "Arnaldo"
      }
    ]
  },
  {
    "date": "1972-05-21",
    "phase": "2º turno",
    "opponent": "Dínamo-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dirceu Arruda",
    "attendance": 2037,
    "goals": [
      {
        "name": "Freitas"
      },
      {
        "name": "Jurinha"
      }
    ]
  },
  {
    "date": "1972-05-28",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 6,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 2095,
    "manager": "Pedrinho Rodrigues",
    "starters": [
      "Zé Luiz",
      "Teco",
      "Bibiu",
      "Orlando",
      "Jaminho",
      "Valter",
      "Mário",
      "Manoelzinho",
      "Giraldo",
      "Jurinha",
      "Freitas"
    ],
    "entered": [
      "Erivaldo",
      "Arnaldo"
    ],
    "subs": [
      {
        "out": "Jaminho",
        "in": "Erivaldo"
      },
      {
        "out": "Mário",
        "in": "Arnaldo"
      }
    ],
    "goals": [
      {
        "name": "Giraldo"
      },
      {
        "name": "Giraldo"
      },
      {
        "name": "Jurinha"
      },
      {
        "name": "Jurinha"
      },
      {
        "name": "Freitas"
      },
      {
        "name": "Freitas"
      }
    ]
  },
  {
    "date": "1972-06-04",
    "phase": "2º turno (jogo anulado)",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz",
    "goals": [
      {
        "name": "Jurinha"
      },
      {
        "name": "Jurinha"
      }
    ],
    "excludeFromStats": true,
    "note": "Partida interrompida aos 27' do 2ºT por falta de energia; posteriormente anulada. Remarcada em 07/06/1972"
  },
  {
    "date": "1972-06-07",
    "phase": "2º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz Irmão",
    "goals": [
      {
        "name": "Manoelzinho"
      },
      {
        "name": "Freitas"
      }
    ],
    "note": "Remarcação do jogo anulado em 04/06/1972"
  },
  {
    "date": "1972-06-18",
    "phase": "2º turno",
    "opponent": "Guarany-AL",
    "ha": "home",
    "gf": 2,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "goals": [
      {
        "name": "Jurinha"
      },
      {
        "name": "Jurinha"
      }
    ]
  },
  {
    "date": "1972-06-21",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz"
  },
  {
    "date": "1972-07-01",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Carlos Costa (RJ)",
    "goals": [
      {
        "name": "Freitas"
      }
    ]
  },
  {
    "date": "1972-07-08",
    "phase": "3º turno",
    "opponent": "Guarany-AL",
    "ha": "away",
    "gf": 5,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "goals": [
      {
        "name": "Jurinha"
      },
      {
        "name": "Jurinha"
      },
      {
        "name": "Mário"
      },
      {
        "name": "Freitas"
      },
      {
        "name": "Dudu"
      }
    ]
  },
  {
    "date": "1972-07-19",
    "phase": "3º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz",
    "goals": [
      {
        "name": "Dudu"
      },
      {
        "name": "Paranhos"
      }
    ]
  },
  {
    "date": "1972-07-23",
    "phase": "3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Claudionor Tenório",
    "attendance": 3602,
    "goals": [
      {
        "name": "Giraldo"
      }
    ]
  },
  {
    "date": "1972-08-09",
    "phase": "3º turno",
    "opponent": "Dínamo-AL",
    "ha": "home",
    "gf": 7,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Murilo Maciel",
    "goals": [
      {
        "name": "Giraldo"
      },
      {
        "name": "Giraldo"
      },
      {
        "name": "Giraldo"
      },
      {
        "name": "Jurinha"
      },
      {
        "name": "Jurinha"
      },
      {
        "name": "Jurinha"
      },
      {
        "name": "Jurinha"
      }
    ]
  },
  {
    "date": "1972-08-13",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz"
  },
  {
    "date": "1972-08-23",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "starters": [
      "Zé Luiz",
      "Teco",
      "Bibiu",
      "Paranhos",
      "Jaminho",
      "Valter",
      "Mário",
      "Manoelzinho",
      "Giraldo",
      "Freitas",
      "Adeíldo"
    ],
    "entered": [
      "Arnaldo",
      "Dudu"
    ],
    "subs": [
      {
        "out": "Valter",
        "in": "Arnaldo"
      },
      {
        "out": "Giraldo",
        "in": "Dudu"
      }
    ],
    "goals": [
      {
        "name": "Manoelzinho"
      },
      {
        "name": "Manoelzinho"
      },
      {
        "name": "Freitas"
      },
      {
        "name": "Mário"
      }
    ]
  },
  {
    "date": "1972-08-27",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Nivaldo da Costa (RJ)",
    "goals": [
      {
        "name": "Dudu"
      }
    ]
  },
  {
    "date": "1973-01-21",
    "phase": "4º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
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
    "date": "1973-01-24",
    "phase": "4º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "goals": [
      {
        "name": "Soareste"
      }
    ]
  },
  {
    "date": "1973-01-28",
    "phase": "4º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "goals": [
      {
        "name": "Fernando Carlos"
      }
    ]
  },
  {
    "date": "1973-01-31",
    "phase": "4º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 1,
    "ga": 4,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dirceu Arruda",
    "goals": [
      {
        "name": "Adeíldo"
      }
    ]
  },
  {
    "date": "1973-02-04",
    "phase": "4º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Paulo Soares",
    "goals": [
      {
        "name": "Batoré"
      }
    ]
  },
  {
    "date": "1973-02-07",
    "phase": "4º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 3,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 2396,
    "goals": [
      {
        "name": "Giraldo"
      },
      {
        "name": "Giraldo"
      },
      {
        "name": "Fernando Carlos"
      }
    ]
  },
  {
    "date": "1973-02-11",
    "phase": "Supercampeonato",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto"
  },
  {
    "date": "1973-02-18",
    "phase": "Supercampeonato",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Carlos Félix (RJ)",
    "starters": [
      "Zé Galego",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Fernando Carlos",
      "Giraldo",
      "Adeíldo"
    ],
    "entered": [
      "Batoré",
      "Beto"
    ],
    "subs": [
      {
        "out": "Dudu",
        "in": "Batoré"
      },
      {
        "out": "Adeíldo",
        "in": "Beto"
      }
    ]
  },
  {
    "date": "1973-02-21",
    "phase": "Supercampeonato",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "goals": [
      {
        "name": "Beto"
      },
      {
        "name": "Otávio"
      }
    ]
  },
  {
    "date": "1973-02-25",
    "phase": "Supercampeonato",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Marçal Filho (RJ)",
    "manager": "Jorge Vasconcelos",
    "starters": [
      "Zé Galego",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Soareste",
      "Batoré",
      "Giraldo",
      "Jurinha",
      "Fernando Carlos",
      "Jairo"
    ],
    "entered": [
      "Dudu",
      "Otávio"
    ],
    "subs": [
      {
        "out": "Jurinha",
        "in": "Dudu"
      },
      {
        "out": "Jairo",
        "in": "Otávio"
      }
    ],
    "note": "Jorge Vasconcelos desligou-se do time depois da partida"
  }
];
