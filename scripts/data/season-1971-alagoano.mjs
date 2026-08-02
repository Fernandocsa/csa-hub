/** Campeonato Alagoano 1971 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA campeão; decisão disputada em mar/1973 após TJD.
 * 06/06/1971 Ferroviário: empate em campo; 1×0 administrativo (TJD/AL).
 * Contagem: J26 V15 E6 D5 GP51 GC25.
 * Técnicos: Hélio Miranda (confirmado a partir de 09/06); Wassil Barbosa (decisão).
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1971;

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
    "date": "1971-03-18",
    "phase": "1º turno",
    "opponent": "Guarany-AL",
    "ha": "away",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "goals": [
      {
        "name": "Zito"
      },
      {
        "name": "Dudu"
      },
      {
        "name": "Soareste"
      },
      {
        "name": "Ricardo"
      }
    ],
    "note": "Fonte: Soares → Soareste"
  },
  {
    "date": "1971-03-28",
    "phase": "1º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 2,
    "ga": 3,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Rubens Cerqueira",
    "goals": [
      {
        "name": "Zito"
      },
      {
        "name": "Zito"
      }
    ]
  },
  {
    "date": "1971-04-04",
    "phase": "1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Claudionor Tenório",
    "goals": [
      {
        "name": "Zezé"
      },
      {
        "name": "Zezé"
      },
      {
        "name": "Soareste"
      }
    ]
  },
  {
    "date": "1971-04-11",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Digerson",
    "starters": [
      "Zé Luiz II",
      "Ciro",
      "Dida",
      "Paranhos",
      "Lourival",
      "Zé Luiz I",
      "Zito",
      "Geo",
      "Caroço",
      "Zezé",
      "Soareste"
    ],
    "entered": [
      "Zé Raimundo",
      "Dudu"
    ],
    "subs": [
      {
        "out": "Zé Luiz I",
        "in": "Zé Raimundo"
      },
      {
        "out": "Zezé",
        "in": "Dudu"
      }
    ],
    "goals": [
      {
        "name": "Caroço"
      },
      {
        "name": "Zito"
      }
    ],
    "note": "ASA vendeu o mando de campo ao CSA"
  },
  {
    "date": "1971-04-21",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 5,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "goals": [
      {
        "name": "Zito"
      },
      {
        "name": "Zito"
      },
      {
        "name": "Manoelzinho"
      },
      {
        "name": "Dudu"
      },
      {
        "name": "Caroço"
      }
    ]
  },
  {
    "date": "1971-04-25",
    "phase": "1º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 0,
    "ga": 4,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Digerson",
    "attendance": 7486
  },
  {
    "date": "1971-05-02",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "starters": [
      "Irecê",
      "Ciro",
      "Paranhos",
      "Valter",
      "Lourival",
      "Dudu",
      "Zito",
      "Manoelzinho",
      "Soareste",
      "Rubens",
      "Ricardo"
    ],
    "entered": [
      "Dudu",
      "Zé Raimundo",
      "Caroço"
    ],
    "subs": [
      {
        "out": "Ciro",
        "in": "Dudu"
      },
      {
        "out": "Dudu",
        "in": "Zé Raimundo"
      },
      {
        "out": "Manoelzinho",
        "in": "Caroço"
      }
    ],
    "goals": [
      {
        "name": "Caroço"
      }
    ],
    "note": "Fonte lista Ciro (Dudu) e Dudu titular no meio — mantida literalmente"
  },
  {
    "date": "1971-05-09",
    "phase": "2º turno",
    "opponent": "Guarany-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Digerson",
    "goals": [
      {
        "name": "Manoelzinho"
      },
      {
        "name": "Manoelzinho"
      },
      {
        "name": "Caroço"
      }
    ]
  },
  {
    "date": "1971-05-23",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 3,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Ferreira",
    "goals": [
      {
        "name": "Dudu"
      },
      {
        "name": "Dudu"
      },
      {
        "name": "José Maria"
      }
    ],
    "note": "CSE vendeu o mando de campo ao CSA"
  },
  {
    "date": "1971-05-27",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Claudionor Tenório",
    "goals": [
      {
        "name": "Dudu"
      },
      {
        "name": "Dudu"
      },
      {
        "name": "Tenório"
      }
    ]
  },
  {
    "date": "1971-06-06",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "note": "Empate em campo; CSA ganhou os pontos no TJD/AL por irregularidades do Ferroviário. Placar 1×0 para classificação; nenhum gol de jogador registrado"
  },
  {
    "date": "1971-06-09",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dirceu Arruda",
    "attendance": 554,
    "manager": "Hélio Miranda",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Paranhos",
      "Valter",
      "Lourival",
      "Soareste",
      "Zito",
      "Caroço",
      "Fernando Carlos",
      "Ricardo"
    ],
    "entered": [
      "Ditão",
      "Zé Raimundo",
      "Manoelzinho"
    ],
    "subs": [
      {
        "out": "Valter",
        "in": "Ditão"
      },
      {
        "out": "Zito",
        "in": "Zé Raimundo"
      },
      {
        "out": "Caroço",
        "in": "Manoelzinho"
      }
    ],
    "goals": [
      {
        "name": "Fernando Carlos"
      },
      {
        "name": "Fernando Carlos"
      },
      {
        "name": "Zito"
      }
    ],
    "note": "Hélio Miranda estreando; fonte lista 10 titulares (um nome ausente)"
  },
  {
    "date": "1971-06-12",
    "phase": "2º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)"
  },
  {
    "date": "1971-06-27",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz Irmão"
  },
  {
    "date": "1971-07-04",
    "phase": "Decisão do 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Digerson",
    "attendance": 9329,
    "manager": "Hélio Miranda",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Paranhos",
      "Ditão",
      "Lourival",
      "Zito",
      "Rafael",
      "Caroço",
      "Dudu",
      "Fernando Carlos",
      "Silva"
    ],
    "entered": [
      "Soareste",
      "Manoelzinho"
    ],
    "subs": [
      {
        "out": "Caroço",
        "in": "Soareste"
      },
      {
        "out": "Fernando Carlos",
        "in": "Manoelzinho"
      }
    ],
    "goals": [
      {
        "name": "Azevedo",
        "ownGoal": true,
        "ownGoalDirection": "for"
      },
      {
        "name": "Rafael"
      },
      {
        "name": "Manoelzinho"
      }
    ],
    "note": "Após prorrogação; CSA campeão do 2º turno. Gol contra de Azevedo (CRB)"
  },
  {
    "date": "1971-07-10",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz",
    "manager": "Hélio Miranda",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Paranhos",
      "Ditão",
      "Lourival",
      "Zito",
      "Rafael",
      "Caroço",
      "Dudu",
      "Alderico",
      "Silva"
    ],
    "entered": [
      "Soareste",
      "Manoelzinho"
    ],
    "subs": [
      {
        "out": "Caroço",
        "in": "Soareste"
      },
      {
        "out": "Alderico",
        "in": "Manoelzinho"
      }
    ],
    "goals": [
      {
        "name": "Dudu"
      }
    ]
  },
  {
    "date": "1971-07-17",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "manager": "Hélio Miranda",
    "starters": [
      "Zé Luiz",
      "Valter",
      "Paranhos",
      "Ditão",
      "Lourival",
      "Rafael",
      "Dudu",
      "Zito",
      "Caroço",
      "Alderico",
      "Silva"
    ],
    "entered": [
      "Fernando Carlos",
      "Manoelzinho"
    ],
    "subs": [
      {
        "out": "Caroço",
        "in": "Fernando Carlos"
      },
      {
        "out": "Alderico",
        "in": "Manoelzinho"
      }
    ]
  },
  {
    "date": "1971-07-22",
    "phase": "3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 5,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Digerson",
    "goals": [
      {
        "name": "Silva"
      },
      {
        "name": "Silva"
      },
      {
        "name": "Dudu"
      },
      {
        "name": "Dudu"
      },
      {
        "name": "Rafael"
      }
    ]
  },
  {
    "date": "1971-07-25",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 1,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz",
    "goals": [
      {
        "name": "Zito"
      }
    ]
  },
  {
    "date": "1971-07-29",
    "phase": "3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz",
    "goals": [
      {
        "name": "Zito"
      },
      {
        "name": "Silva"
      },
      {
        "name": "Manoelzinho"
      },
      {
        "name": "Dudu"
      }
    ]
  },
  {
    "date": "1971-08-01",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dirceu Arruda",
    "manager": "Hélio Miranda",
    "starters": [
      "Zé Luiz",
      "Ciro",
      "Paranhos",
      "Ditão",
      "Valter",
      "Zito",
      "Rafael",
      "Manoelzinho",
      "Dudu",
      "Fernando Carlos",
      "Silva"
    ],
    "entered": [
      "Alderico",
      "Caroço"
    ],
    "subs": [
      {
        "out": "Manoelzinho",
        "in": "Alderico"
      },
      {
        "out": "Fernando Carlos",
        "in": "Caroço"
      }
    ]
  },
  {
    "date": "1971-09-19",
    "phase": "Superturno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "manager": "Hélio Miranda",
    "starters": [
      "Irecê",
      "Valter",
      "Ditão",
      "Paranhos",
      "Lourival",
      "Zito",
      "Dudu",
      "Manoelzinho",
      "Rafael",
      "Fernando Carlos",
      "Silva"
    ],
    "entered": [
      "Soareste",
      "Alderico"
    ],
    "subs": [
      {
        "out": "Rafael",
        "in": "Soareste"
      },
      {
        "out": "Fernando Carlos",
        "in": "Alderico"
      }
    ],
    "goals": [
      {
        "name": "Fernando Carlos"
      },
      {
        "name": "Silva"
      }
    ]
  },
  {
    "date": "1971-09-26",
    "phase": "Superturno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Queiroz",
    "manager": "Hélio Miranda",
    "starters": [
      "Irecê",
      "Ciro",
      "Paranhos",
      "Ditão",
      "Lourival",
      "Zito",
      "Dudu",
      "Rafael",
      "Manoelzinho",
      "Fernando Carlos",
      "Silva"
    ],
    "entered": [
      "Alderico",
      "Ricardo"
    ],
    "subs": [
      {
        "out": "Dudu",
        "in": "Alderico"
      },
      {
        "out": "Silva",
        "in": "Ricardo"
      }
    ],
    "goals": [
      {
        "name": "Alderico"
      }
    ]
  },
  {
    "date": "1973-03-15",
    "phase": "Decisão",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Carlos Floriano Vidal",
    "note": "Portões abertos; partida da decisão de 1971 disputada em 1973"
  },
  {
    "date": "1973-03-18",
    "phase": "Decisão",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "manager": "Wassil Barbosa",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Batoré",
      "Beto",
      "Giraldo",
      "Fernando Carlos"
    ],
    "entered": [
      "Manoelzinho"
    ],
    "subs": [
      {
        "out": "Beto",
        "in": "Manoelzinho"
      }
    ],
    "goals": [
      {
        "name": "Giraldo"
      }
    ],
    "note": "Fonte: técnico Barbosa → Wassil Barbosa"
  },
  {
    "date": "1973-03-25",
    "phase": "Decisão",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 3,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Rufino (PE)",
    "manager": "Wassil Barbosa",
    "starters": [
      "Dida",
      "Mendes",
      "Zé Preta",
      "Bibiu",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Batoré",
      "Manoelzinho",
      "Giraldo",
      "Misso"
    ],
    "entered": [
      "Otávio",
      "Beto"
    ],
    "subs": [
      {
        "out": "Batoré",
        "in": "Otávio"
      },
      {
        "out": "Manoelzinho",
        "in": "Beto"
      }
    ],
    "goals": [
      {
        "name": "Soareste"
      },
      {
        "name": "Beto"
      },
      {
        "name": "Giraldo"
      }
    ],
    "note": "Após prorrogação; CSA campeão alagoano de 1971. Fonte: técnico Barbosa → Wassil Barbosa"
  }
];
