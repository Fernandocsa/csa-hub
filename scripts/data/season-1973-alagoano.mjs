/** Campeonato Alagoano 1973 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA vice-campeão 1973; técnico Maglione Sales; CRB campeão geral.
 * Soma dos placares: J24 V13 E8 D3 GP38 GC17.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 46' do 2ºT = 91.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1973;

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
    "manager": "Maglione Sales",
    "date": "1973-04-11",
    "phase": "1º turno",
    "opponent": "Guarany-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Digérson",
    "attendance": 490,
    "revenue": 6105,
    "revenueText": "NCr$ 6.105,00",
    "goals": [
      {
        "name": "Giraldo",
        "minute": 25
      },
      {
        "name": "Giraldo",
        "minute": 57
      },
      {
        "name": "Beto",
        "minute": 60
      }
    ]
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-04-15",
    "phase": "1º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Murilo Maciel",
    "attendance": 1165,
    "revenue": 3949,
    "revenueText": "NCr$ 3.949,00"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-04-22",
    "phase": "1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 786,
    "revenue": 7491,
    "revenueText": "NCr$ 7.491,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Soareste",
      "Batoré",
      "Otávio",
      "Dudu",
      "Giraldo",
      "Misso"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Soareste",
        "minute": 19
      }
    ],
    "note": "Gol Edmilson (Ferroviário) 31'; expulsões Jorge (Ferroviário) e Soareste (CSA)"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-04-25",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dirceu Arruda",
    "attendance": 920,
    "revenue": 8395,
    "revenueText": "NCr$ 8.395,00",
    "starters": [
      "Zé Galego",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Roberto",
      "Manoelzinho",
      "Giraldo",
      "Misso",
      "Otávio"
    ],
    "entered": [
      "Batoré",
      "Beto"
    ],
    "subs": [
      {
        "out": "Misso",
        "in": "Batoré"
      },
      {
        "out": "Otávio",
        "in": "Beto"
      }
    ],
    "goals": [
      {
        "name": "Misso",
        "minute": 21
      },
      {
        "name": "Giraldo",
        "minute": 76
      }
    ]
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-05-06",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Estádio Édson Amaro",
    "referee": "Rubens Cerqueira",
    "revenue": 10560,
    "revenueText": "Cr$ 10.560,00",
    "starters": [
      "Zé Galego",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Batoré",
      "Otávio",
      "Misso",
      "Giraldo"
    ],
    "entered": [],
    "subs": [],
    "note": "Gols Ailton 23' e Aldemir 55' (CSE); expulsões Misso (CSA) e Lourival (CSE)"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-05-13",
    "phase": "1º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dirceu Arruda",
    "goals": [
      {
        "name": "Manoelzinho",
        "minute": 39
      },
      {
        "name": "Giraldo",
        "minute": 55
      },
      {
        "name": "Giraldo",
        "minute": 80
      }
    ],
    "note": "Gol Fernando Carlos 50' (São Domingos)"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-05-16",
    "phase": "1º turno",
    "opponent": "Dínamo-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Claudionor Tenório",
    "starters": [
      "Dida",
      "Mendes",
      "Fernando",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Misso",
      "Batoré",
      "Otávio"
    ],
    "entered": [
      "Beto",
      "Zé Roberto"
    ],
    "subs": [
      {
        "out": "Misso",
        "in": "Beto"
      },
      {
        "out": "Batoré",
        "in": "Zé Roberto"
      }
    ],
    "goals": [
      {
        "name": "Otávio",
        "minute": 51
      },
      {
        "name": "Batoré",
        "minute": 54
      }
    ]
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-05-20",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 9482,
    "revenue": 43560,
    "revenueText": "Cr$ 43.560,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Batoré",
      "Otávio",
      "Giraldo",
      "Misso",
      "Luís Mário"
    ],
    "entered": [
      "Manoelzinho",
      "Soareste"
    ],
    "subs": [
      {
        "out": "Otávio",
        "in": "Manoelzinho"
      },
      {
        "out": "Luís Mário",
        "in": "Soareste"
      }
    ],
    "goals": [
      {
        "name": "Giraldo",
        "minute": 60
      }
    ],
    "note": "Gol Orlandinho (CRB) 52'; CRB campeão do 1º turno"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-05-30",
    "phase": "2º turno",
    "opponent": "Dínamo-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dirceu Arruda",
    "attendance": 73,
    "revenue": 4321,
    "revenueText": "NCr$ 4.321,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Batoré",
      "Giraldo",
      "Otávio"
    ],
    "entered": [
      "Zé Roberto",
      "Luís Mário"
    ],
    "subs": [
      {
        "out": "Dudu",
        "in": "Zé Roberto"
      },
      {
        "out": "Otávio",
        "in": "Luís Mário"
      }
    ],
    "goals": [
      {
        "name": "Giraldo",
        "minute": 18
      },
      {
        "name": "Edmilson",
        "minute": 25,
        "ownGoal": true,
        "ownGoalDirection": "for"
      },
      {
        "name": "Giraldo",
        "minute": 28
      }
    ],
    "note": "Fonte lista Otávio duas vezes; omitido Batoré→Otávio (escalação: Manoelzinho, Batoré, Giraldo, Otávio no ataque)"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-06-06",
    "phase": "2º turno",
    "opponent": "Guarany-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Severino Cavalcante",
    "attendance": 152,
    "revenue": 4536,
    "revenueText": "NCr$ 4.536,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Batoré",
      "Manoelzinho",
      "Giraldo",
      "Otávio"
    ],
    "entered": [
      "Misso",
      "Beto"
    ],
    "subs": [
      {
        "out": "Batoré",
        "in": "Misso"
      },
      {
        "out": "Manoelzinho",
        "in": "Beto"
      }
    ],
    "goals": [
      {
        "name": "Otávio",
        "minute": 25
      },
      {
        "name": "Misso",
        "minute": 64
      }
    ]
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-06-10",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Rubens Cerqueira",
    "revenue": 3565,
    "revenueText": "Cr$ 3.565,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Soareste",
      "Manoelzinho",
      "Otávio",
      "Zé Roberto",
      "Giraldo",
      "Misso"
    ],
    "entered": [
      "Beto"
    ],
    "subs": [
      {
        "out": "Soareste",
        "in": "Beto"
      }
    ],
    "note": "Expulsões Paulo (ASA) e Bibiu (CSA)"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-06-17",
    "phase": "2º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "attendance": 5003,
    "revenue": 23560,
    "revenueText": "NCr$ 23.560,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Zé Roberto",
      "Batoré",
      "Manoelzinho",
      "Giraldo",
      "Dudu",
      "Otávio"
    ],
    "entered": [
      "Misso",
      "Beto"
    ],
    "subs": [
      {
        "out": "Zé Roberto",
        "in": "Misso"
      },
      {
        "out": "Manoelzinho",
        "in": "Beto"
      }
    ],
    "goals": [
      {
        "name": "Misso",
        "minute": 87
      }
    ],
    "note": "Gol Ademir (São Domingos) 88'"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-06-24",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "revenue": 15379,
    "revenueText": "Cr$ 15.379,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Otávio",
      "Batoré",
      "Geraldo",
      "Luís Mário"
    ],
    "entered": [
      "Manoelzinho",
      "Misso"
    ],
    "subs": [
      {
        "out": "Batoré",
        "in": "Manoelzinho"
      },
      {
        "out": "Geraldo",
        "in": "Misso"
      }
    ],
    "goals": [
      {
        "name": "Misso",
        "minute": 91
      }
    ]
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-06-27",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dirceu Arruda",
    "attendance": 361,
    "revenue": 6092,
    "revenueText": "NCr$ 6.092,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Roberto",
      "Otávio",
      "Misso",
      "Batoré",
      "Luís Mário"
    ],
    "entered": [
      "Fernando",
      "Manoelzinho"
    ],
    "subs": [
      {
        "out": "Jaminho",
        "in": "Fernando"
      },
      {
        "out": "Luís Mário",
        "in": "Manoelzinho"
      }
    ],
    "goals": [
      {
        "name": "Otávio",
        "minute": 60
      }
    ]
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-07-04",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Digérson",
    "attendance": 3454,
    "revenue": 14422,
    "revenueText": "Cr$ 14.422,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Roberto",
      "Manoelzinho",
      "Misso",
      "Giraldo",
      "Luís Mário"
    ],
    "entered": [
      "Batoré",
      "Otávio"
    ],
    "subs": [
      {
        "out": "Jaminho",
        "in": "Batoré"
      },
      {
        "out": "Manoelzinho",
        "in": "Otávio"
      }
    ],
    "goals": [
      {
        "name": "Giraldo",
        "minute": 33
      },
      {
        "name": "Giraldo",
        "minute": 36
      },
      {
        "name": "Dudu",
        "minute": 60
      },
      {
        "name": "Luís Mário",
        "minute": 70
      }
    ]
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-07-08",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Gilberto Ferreira",
    "attendance": 22045,
    "revenue": 106356,
    "revenueText": "NCr$ 106.356,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Roberto",
      "Manoelzinho",
      "Misso",
      "Giraldo",
      "Luís Mário"
    ],
    "entered": [
      "Batoré",
      "Otávio"
    ],
    "subs": [
      {
        "out": "Zé Roberto",
        "in": "Batoré"
      },
      {
        "out": "Luís Mário",
        "in": "Otávio"
      }
    ],
    "note": "Gols Haroldo 54' e 80', Silva 72' (CRB); expulsão Jaminho; CRB campeão do 2º turno"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-07-15",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 7320,
    "revenue": 34305,
    "revenueText": "NCr$ 34.305,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Lourival",
      "Zé Leite",
      "Dudu",
      "Manoelzinho",
      "Batoré",
      "Giraldo",
      "Luís Mário"
    ],
    "entered": [
      "Misso"
    ],
    "subs": [
      {
        "out": "Giraldo",
        "in": "Misso"
      }
    ],
    "goals": [
      {
        "name": "Batoré",
        "minute": 14
      },
      {
        "name": "Dudu",
        "minute": 42
      },
      {
        "name": "Batoré",
        "minute": 87
      }
    ],
    "note": "Gol Pires 52' (São Domingos)"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-07-18",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Severino Cavalcante",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Zé Leite",
      "Dudu",
      "Manoelzinho",
      "Giraldo",
      "Misso",
      "Luís Mário"
    ],
    "entered": [
      "Lourival",
      "Otávio"
    ],
    "subs": [
      {
        "out": "Zé Leite",
        "in": "Lourival"
      },
      {
        "out": "Luís Mário",
        "in": "Otávio"
      }
    ],
    "goals": [
      {
        "name": "Manoelzinho",
        "minute": 55
      },
      {
        "name": "Giraldo",
        "minute": 66
      }
    ],
    "note": "Gol Tião (ASA) 84'; ASA revoltado com a arbitragem"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-07-22",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Rufino",
    "attendance": 13278,
    "revenue": 62331,
    "revenueText": "NCr$ 62.331,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Zé Leite",
      "Manoelzinho",
      "Giraldo",
      "Soareste",
      "Otávio"
    ],
    "entered": [
      "Lourival",
      "Misso"
    ],
    "subs": [
      {
        "out": "Jaminho",
        "in": "Lourival"
      },
      {
        "out": "Otávio",
        "in": "Misso"
      }
    ],
    "goals": [
      {
        "name": "Soareste",
        "minute": 78
      }
    ],
    "note": "Gol Silva (CRB) 90'; fonte cita Manuel → Manoelzinho"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-07-25",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Dirceu Arruda",
    "attendance": 3165,
    "revenue": 15415,
    "revenueText": "NCr$ 15.415,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Zé Leite",
      "Soareste",
      "Manoelzinho",
      "Dudu",
      "Giraldo",
      "Misso"
    ],
    "entered": [
      "Beto",
      "Otávio"
    ],
    "subs": [
      {
        "out": "Giraldo",
        "in": "Beto"
      },
      {
        "out": "Misso",
        "in": "Otávio"
      }
    ],
    "goals": [
      {
        "name": "Misso",
        "minute": 15
      },
      {
        "name": "Giraldo",
        "minute": 37
      }
    ],
    "note": "Gols Bió 20' e Bié 40' (ASA)"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-07-29",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Lourival",
      "Zé Leite",
      "Soareste",
      "Manoelzinho",
      "Dudu",
      "Giraldo",
      "Misso"
    ],
    "entered": [
      "Otávio"
    ],
    "subs": [
      {
        "out": "Giraldo",
        "in": "Otávio"
      }
    ],
    "goals": [
      {
        "name": "Giraldo",
        "minute": 50
      },
      {
        "name": "Manoelzinho",
        "minute": 65,
        "penalty": true
      },
      {
        "name": "Otávio",
        "minute": 89
      }
    ],
    "note": "Expulsão Isauro (São Domingos)"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-08-05",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Romualdo Arppi Filho",
    "attendance": 17372,
    "revenue": 105635,
    "revenueText": "Cr$ 105.635,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Lourival",
      "Zé Leite",
      "Soareste",
      "Manoelzinho",
      "Dudu",
      "Giraldo",
      "Otávio"
    ],
    "entered": [
      "Batoré",
      "Misso"
    ],
    "subs": [
      {
        "out": "Zé Leite",
        "in": "Batoré"
      },
      {
        "out": "Otávio",
        "in": "Misso"
      }
    ],
    "goals": [
      {
        "name": "Manoelzinho",
        "minute": 76,
        "penalty": true
      }
    ],
    "note": "Gol Haroldo (CRB) 40'"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-08-08",
    "phase": "Decisão do 3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Nivaldo dos Santos",
    "revenue": 67838,
    "revenueText": "NCr$ 67.838,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Batoré",
      "Giraldo",
      "Misso"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Giraldo",
        "minute": 20
      }
    ],
    "note": "CSA campeão do 3º turno; expulsão Major (CRB)"
  },
  {
    "manager": "Maglione Sales",
    "date": "1973-08-12",
    "phase": "Decisão do campeonato",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Marçal Filho",
    "attendance": 17812,
    "revenue": 88931,
    "revenueText": "NCr$ 88.931,00",
    "starters": [
      "Dida",
      "Mendes",
      "Bibiu",
      "Zé Preta",
      "Jaminho",
      "Dudu",
      "Soareste",
      "Manoelzinho",
      "Giraldo",
      "Misso",
      "Otávio"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Misso",
        "minute": 82
      }
    ],
    "note": "Gols Reinaldo (CRB) 4' 1T e 2º tempo; CRB campeão geral"
  }
];
