/** Campeonato Alagoano 1984 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * Caso doping (Zezinho, jun/1984): placar de campo 2x1 vs ASA; officialResult=loss (pontos ao ASA no STJD).
 * Jogo de 13/06/1984 (decisão 1º turno) mantido com excludeFromStats (anulado pelo STJD).
 * CRB campeão do 1º turno; CSA campeão do 2º, 3º e 4º turnos e campeão geral.
 * Contagem oficial: J48 V31 E11 D6 GP84 GC17 (exclui anulado; doping como derrota administrativa).
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; prorrogação 2ºT = 105+N.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1984;

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
    "date": "1984-04-29",
    "phase": "1ª fase do 1º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 2082,
    "revenue": 1742000,
    "revenueText": "Cr$ 1.742.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Batista",
      "Café",
      "Vininho",
      "João Neto",
      "Édson Silva",
      "Nívio",
      "Noronha",
      "Serginho",
      "Frank",
      "Jacozinho"
    ],
    "entered": [
      "Carlinhos",
      "Bel"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Carlinhos"
      },
      {
        "out": "Jacozinho",
        "in": "Bel"
      }
    ]
  },
  {
    "date": "1984-05-06",
    "phase": "1ª fase do 1º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Sebastião Canuto",
    "attendance": 1274,
    "revenue": 1042000,
    "revenueText": "Cr$ 1.042.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "João Neto",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Carlinhos",
      "Noronha",
      "Frazão",
      "Nívio",
      "Jacozinho"
    ],
    "entered": [
      "Frank",
      "Serginho"
    ],
    "subs": [
      {
        "out": "Carlinhos",
        "in": "Frank"
      },
      {
        "out": "Jacozinho",
        "in": "Serginho"
      }
    ],
    "note": "Gol Sabino (ASA) 67'"
  },
  {
    "date": "1984-05-09",
    "phase": "1ª fase do 1º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 2127,
    "revenue": 1802000,
    "revenueText": "Cr$ 1.802.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "João Neto",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Noronha",
      "Frazão",
      "Nívio",
      "Jacozinho"
    ],
    "entered": [
      "Carlinhos",
      "Bel"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Carlinhos"
      },
      {
        "out": "Jacozinho",
        "in": "Bel"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 8
      },
      {
        "name": "Nívio",
        "minute": 14
      },
      {
        "name": "Noronha",
        "minute": 80
      }
    ],
    "note": "Expulsões Batista (Penedense) e Carlinhos (CSA)"
  },
  {
    "date": "1984-05-12",
    "phase": "1ª fase do 1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 7,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "revenue": 1861000,
    "revenueText": "Cr$ 1.861.000,00",
    "manager": "Valdemar Carabina",
    "goals": [
      {
        "name": "Frazão"
      },
      {
        "name": "Frazão"
      },
      {
        "name": "Frazão"
      },
      {
        "name": "Frazão"
      },
      {
        "name": "Zé Carlos"
      },
      {
        "name": "Zé Carlos"
      },
      {
        "name": "Bel"
      }
    ]
  },
  {
    "date": "1984-05-20",
    "phase": "1ª fase do 1º turno",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Manoel Moreira",
    "referee": "Ronaldo Nunes",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Carlos",
      "Frazão",
      "Nívio",
      "Jacozinho"
    ],
    "entered": [
      "Frank"
    ],
    "subs": [
      {
        "out": "Zé Carlos",
        "in": "Frank"
      }
    ],
    "goals": [
      {
        "name": "Zé Carlos",
        "minute": 3
      }
    ]
  },
  {
    "date": "1984-05-23",
    "phase": "1ª fase do 1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 2452,
    "revenue": 2142100,
    "revenueText": "Cr$ 2.142.100,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Carlinhos",
      "Frazão",
      "Nívio",
      "Jacozinho"
    ],
    "entered": [
      "Noronha"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Noronha"
      }
    ],
    "goals": [
      {
        "name": "Zé Carlos",
        "minute": 14
      }
    ]
  },
  {
    "date": "1984-05-26",
    "phase": "1ª fase do 1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 7529,
    "revenue": 12995000,
    "revenueText": "Cr$ 12.995.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Ednaldo",
      "Édson Silva",
      "Zé Carlos",
      "Carlinhos",
      "Frazão",
      "Nívio",
      "Jacozinho"
    ],
    "entered": [
      "Noronha"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Noronha"
      }
    ],
    "note": "CRB campeão antecipado da 1ª fase do 1º turno (+ bônus)"
  },
  {
    "date": "1984-05-30",
    "phase": "Quadrangular do 1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 1806,
    "revenue": 3099000,
    "revenueText": "Cr$ 3.099.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Josival",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Carlinhos",
      "Jacozinho",
      "Luizão",
      "Bel"
    ],
    "entered": [
      "Careca",
      "Clésio"
    ],
    "subs": [
      {
        "out": "Jacozinho",
        "in": "Careca"
      },
      {
        "out": "Bel",
        "in": "Clésio"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 49
      },
      {
        "name": "Dario",
        "minute": 53
      }
    ]
  },
  {
    "date": "1984-06-05",
    "phase": "Quadrangular do 1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "officialResult": "loss",
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 4478,
    "revenue": 7879000,
    "revenueText": "Cr$ 7.879.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Café",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Silva",
      "Nívio",
      "Frazão",
      "Dario",
      "Jacozinho"
    ],
    "entered": [
      "Carlinhos",
      "Zé Carlos"
    ],
    "subs": [
      {
        "out": "Café",
        "in": "Carlinhos"
      },
      {
        "out": "Nívio",
        "in": "Zé Carlos"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 24
      },
      {
        "name": "Frazão",
        "minute": 65
      }
    ],
    "note": "Vitória em campo; CSA perdeu pontos por doping de Zezinho (STJD, recurso ASA). Gol Carlos Alberto (ASA) 46'"
  },
  {
    "date": "1984-06-09",
    "phase": "Quadrangular do 1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 8822,
    "revenue": 15154000,
    "revenueText": "Cr$ 15.154.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Dario",
      "Jacozinho"
    ],
    "entered": [
      "Noronha",
      "Zé Carlos"
    ],
    "subs": [
      {
        "out": "Édson Silva",
        "in": "Noronha"
      },
      {
        "out": "Dario",
        "in": "Zé Carlos"
      }
    ],
    "goals": [
      {
        "name": "Nívio",
        "minute": 26
      }
    ],
    "note": "Expulsão Melo (CRB)"
  },
  {
    "date": "1984-06-13",
    "phase": "Decisão do 1º turno (jogo anulado)",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Roberto Wright",
    "attendance": 9525,
    "revenue": 17177000,
    "revenueText": "Cr$ 17.177.000,00",
    "manager": "Valdemar Carabina",
    "excludeFromStats": true,
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Vininho",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Dario",
      "Jacozinho"
    ],
    "entered": [
      "Noronha",
      "Zé Carlos"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Noronha"
      },
      {
        "out": "Dario",
        "in": "Zé Carlos"
      }
    ],
    "goals": [
      {
        "name": "Zé Carlos",
        "minute": 87
      }
    ],
    "note": "Partida disputada e vencida pelo CSA, anulada pelo STJD após caso doping; decisão real CRB x ASA em 24/10/1984 sem CSA. Expulsões Frazão (CSA) e Fanta (CRB)"
  },
  {
    "date": "1984-06-20",
    "phase": "2º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 1665,
    "revenue": 2841000,
    "revenueText": "Cr$ 2.841.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Carlinhos",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho"
    ],
    "entered": [
      "Zé Carlos",
      "Nenê"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Zé Carlos"
      },
      {
        "out": "Jacozinho",
        "in": "Nenê"
      }
    ],
    "goals": [
      {
        "name": "Luizão",
        "minute": 38
      },
      {
        "name": "Luizão",
        "minute": 61
      }
    ]
  },
  {
    "date": "1984-06-24",
    "phase": "2º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Agildo Alves",
    "attendance": 1370,
    "revenue": 2315000,
    "revenueText": "Cr$ 2.315.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Careca",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Serginho"
    ],
    "entered": [
      "Carlinhos",
      "Noronha"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Carlinhos"
      },
      {
        "out": "Serginho",
        "in": "Noronha"
      }
    ],
    "goals": [
      {
        "name": "Serginho",
        "minute": 49
      },
      {
        "name": "Édson Silva",
        "minute": 59
      }
    ]
  },
  {
    "date": "1984-06-28",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 855,
    "revenue": 1452000,
    "revenueText": "Cr$ 1.452.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Ednaldo",
      "Zé Carlos",
      "Noronha",
      "Carlinhos",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "João Neto",
      "Bel"
    ],
    "subs": [
      {
        "out": "Zé Carlos",
        "in": "João Neto"
      },
      {
        "out": "Noronha",
        "in": "Bel"
      }
    ],
    "goals": [
      {
        "name": "Luizão",
        "minute": 25
      },
      {
        "name": "Zé Carlos",
        "minute": 62
      },
      {
        "name": "Luizão",
        "minute": 74
      },
      {
        "name": "Carlinhos",
        "minute": 90
      }
    ],
    "note": "CSA comprou mando; expulsões Ednaldo (CSA) e Rogério (Penedense)"
  },
  {
    "date": "1984-07-01",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 2065,
    "revenue": 3522000,
    "revenueText": "Cr$ 3.522.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Josival",
      "Zezinho",
      "Édson Silva",
      "Zé Carlos",
      "Carlinhos",
      "Jacozinho",
      "Luizão",
      "Bel"
    ],
    "entered": [
      "Careca",
      "Clésio"
    ],
    "subs": [
      {
        "out": "Jacozinho",
        "in": "Careca"
      },
      {
        "out": "Bel",
        "in": "Clésio"
      }
    ],
    "goals": [
      {
        "name": "Zé Carlos",
        "minute": 65
      },
      {
        "name": "Luizão",
        "minute": 75
      }
    ]
  },
  {
    "date": "1984-07-04",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 2149,
    "revenue": 3696000,
    "revenueText": "Cr$ 3.696.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Zé Carlos",
      "Carlinhos",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Zé Carlos",
        "minute": 44
      }
    ],
    "note": "Gol Gilmar (Ferroviário) 85'"
  },
  {
    "date": "1984-07-08",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 3469,
    "revenue": 5983000,
    "revenueText": "Cr$ 5.983.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Ednaldo",
      "Clésio",
      "Édson Silva",
      "Dario",
      "Zé Carlos",
      "Carlinhos",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Noronha"
    ],
    "subs": [
      {
        "out": "Carlinhos",
        "in": "Noronha"
      }
    ],
    "goals": [
      {
        "name": "Cremildo",
        "minute": 32,
        "ownGoal": true,
        "ownGoalDirection": "for"
      },
      {
        "name": "Jacozinho",
        "minute": 46
      }
    ]
  },
  {
    "date": "1984-07-15",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 12303,
    "revenue": 22079000,
    "revenueText": "Cr$ 22.079.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Zé Carlos",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Frazão"
    ],
    "subs": [
      {
        "out": "Zé Carlos",
        "in": "Frazão"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 84
      }
    ],
    "note": "Gols CRB: Fanta 53', João Paulista 58'"
  },
  {
    "date": "1984-07-25",
    "phase": "Quadrangular do 2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 3624,
    "revenue": 6404000,
    "revenueText": "Cr$ 6.404.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Frazão",
        "minute": 45
      }
    ],
    "note": "Tumulto em pênalti; 5 expulsões ASA; encerramento prematuro"
  },
  {
    "date": "1984-07-29",
    "phase": "Quadrangular do 2º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 12102,
    "revenue": 21569000,
    "revenueText": "Cr$ 21.569.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Zé Carlos",
      "Carlinhos"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Zé Carlos"
      },
      {
        "out": "Frazão",
        "in": "Carlinhos"
      }
    ],
    "goals": [
      {
        "name": "Luizão",
        "minute": 21
      }
    ],
    "note": "Gol Joãozinho Paulista (CRB) 60'; expulsão Agnaldo (CSA) no 1ºT"
  },
  {
    "date": "1984-08-01",
    "phase": "Quadrangular do 2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 4345,
    "revenue": 7646000,
    "revenueText": "Cr$ 7.646.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Zé Carlos",
      "Dario"
    ],
    "subs": [
      {
        "out": "Ednaldo",
        "in": "Zé Carlos"
      },
      {
        "out": "Frazão",
        "in": "Dario"
      }
    ],
    "goals": [
      {
        "name": "Nívio",
        "minute": 14
      },
      {
        "name": "Zé Carlos",
        "minute": 60
      }
    ],
    "note": "Adiado de 21/07 por chuva; expulsões Pedrinho e Alberto (Ferroviário)"
  },
  {
    "date": "1984-08-05",
    "phase": "3º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 1454,
    "revenue": 2538000,
    "revenueText": "Cr$ 2.538.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Zé Carlos"
    ],
    "entered": [
      "Carlinhos"
    ],
    "subs": [
      {
        "out": "Frazão",
        "in": "Carlinhos"
      }
    ],
    "goals": [
      {
        "name": "Luizão",
        "minute": 35
      },
      {
        "name": "Nívio",
        "minute": 69
      },
      {
        "name": "Frazão",
        "minute": 73
      }
    ]
  },
  {
    "date": "1984-08-12",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Josival Pedro",
    "attendance": 3042,
    "revenue": 5135000,
    "revenueText": "Cr$ 5.135.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Zé Carlos",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Dario"
    ],
    "subs": [
      {
        "out": "Luizão",
        "in": "Dario"
      }
    ]
  },
  {
    "date": "1984-08-15",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 1164,
    "revenue": 1982000,
    "revenueText": "Cr$ 1.982.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Zé Carlos"
    ],
    "entered": [
      "Dario",
      "Nenê"
    ],
    "subs": [
      {
        "out": "Ednaldo",
        "in": "Dario"
      },
      {
        "out": "Zé Carlos",
        "in": "Nenê"
      }
    ]
  },
  {
    "date": "1984-08-19",
    "phase": "3º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 2728,
    "revenue": 2984000,
    "revenueText": "Cr$ 2.984.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Carlinhos",
      "Luizão",
      "Nenê"
    ],
    "entered": [
      "Zé Carlos"
    ],
    "subs": [
      {
        "out": "Édson Silva",
        "in": "Zé Carlos"
      }
    ],
    "goals": [
      {
        "name": "Luizão",
        "minute": 17
      },
      {
        "name": "Nívio",
        "minute": 27
      },
      {
        "name": "Luizão",
        "minute": 36
      },
      {
        "name": "Nívio",
        "minute": 58
      }
    ],
    "note": "Expulsão Fernando (Capelense)"
  },
  {
    "date": "1984-08-26",
    "phase": "3º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Antônio Morais",
    "manager": "Valdemar Carabina"
  },
  {
    "date": "1984-08-29",
    "phase": "3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 2255,
    "revenue": 3923000,
    "revenueText": "Cr$ 3.923.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Josival",
      "Agnaldo",
      "Ednaldo",
      "Zé Carlos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Nenê",
      "Frank"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Nenê"
      },
      {
        "out": "Luizão",
        "in": "Frank"
      }
    ],
    "goals": [
      {
        "name": "Luizão",
        "minute": 56
      },
      {
        "name": "Cardoso",
        "minute": 72
      }
    ]
  },
  {
    "date": "1984-09-02",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 10063,
    "revenue": 18194000,
    "revenueText": "Cr$ 18.194.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Agnaldo",
      "Ednaldo",
      "Zé Carlos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Nenê",
      "Frank"
    ],
    "subs": [
      {
        "out": "Frazão",
        "in": "Nenê"
      },
      {
        "out": "Luizão",
        "in": "Frank"
      }
    ],
    "goals": [
      {
        "name": "Zé Carlos",
        "minute": 19
      }
    ],
    "note": "Gol Gilmar (CRB) 68'"
  },
  {
    "date": "1984-09-09",
    "phase": "Quadrangular do 3º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 2,
    "ga": 1,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Josival Pedro",
    "attendance": 9746,
    "revenue": 17322000,
    "revenueText": "Cr$ 17.322.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho"
    ],
    "entered": [
      "Carlinhos"
    ],
    "subs": [
      {
        "out": "Frazão",
        "in": "Carlinhos"
      }
    ],
    "goals": [
      {
        "name": "Frank",
        "minute": 21
      },
      {
        "name": "Frank",
        "minute": 63
      }
    ],
    "note": "Gol Berinho (ASA) 12'; tumulto; expulsões ASA; paralisação de 20 min"
  },
  {
    "date": "1984-09-12",
    "phase": "Quadrangular do 3º turno",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Manoel Moreira",
    "referee": "João Monteiro",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Clésio",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho"
    ],
    "entered": [
      "Carlinhos",
      "Nenê"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Carlinhos"
      },
      {
        "out": "Frazão",
        "in": "Nenê"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 56
      },
      {
        "name": "Frank",
        "minute": 87,
        "penalty": true
      }
    ]
  },
  {
    "date": "1984-09-15",
    "phase": "Quadrangular do 3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 8705,
    "revenue": 20465000,
    "revenueText": "Cr$ 20.465.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Adeíldo",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho"
    ],
    "entered": [
      "Carlinhos",
      "Luizão"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Carlinhos"
      },
      {
        "out": "Frank",
        "in": "Luizão"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 48
      }
    ]
  },
  {
    "date": "1984-09-19",
    "phase": "Decisão do 3º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 5272,
    "revenue": 12278000,
    "revenueText": "Cr$ 12.278.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Carlinhos",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho"
    ],
    "entered": [
      "Zé Carlos",
      "Nenê"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Zé Carlos"
      },
      {
        "out": "Jacozinho",
        "in": "Nenê"
      }
    ],
    "goals": [
      {
        "name": "Edvaldo",
        "minute": 37
      },
      {
        "name": "Frazão",
        "minute": 84
      }
    ],
    "note": "CSA campeão do 3º turno"
  },
  {
    "date": "1984-09-23",
    "phase": "4º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Juca Sampaio",
    "referee": "João Monteiro",
    "attendance": 2158,
    "revenue": 1079000,
    "revenueText": "Cr$ 1.079.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Carlinhos",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho"
    ],
    "entered": [
      "Nenê",
      "Luizão"
    ],
    "subs": [
      {
        "out": "Frazão",
        "in": "Nenê"
      },
      {
        "out": "Frank",
        "in": "Luizão"
      }
    ],
    "note": "Gol Santos (CSE) 66'"
  },
  {
    "date": "1984-09-26",
    "phase": "4º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "attendance": 1391,
    "revenue": 2357000,
    "revenueText": "Cr$ 2.357.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Nenê",
      "Zé Carlos",
      "Jacozinho"
    ],
    "entered": [
      "Frazão",
      "Laerte"
    ],
    "subs": [
      {
        "out": "Nenê",
        "in": "Frazão"
      },
      {
        "out": "Zé Carlos",
        "in": "Laerte"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 56
      },
      {
        "name": "Nívio",
        "minute": 90
      }
    ],
    "note": "Gol Gilson (Penedense) 67'; expulsão Manoel (Penedense)"
  },
  {
    "date": "1984-09-30",
    "phase": "4º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Ronaldo Nunes",
    "attendance": 1537,
    "revenue": 2568000,
    "revenueText": "Cr$ 2.568.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho"
    ],
    "entered": [
      "Carlinhos",
      "Zé Carlos"
    ],
    "subs": [
      {
        "out": "Ednaldo",
        "in": "Carlinhos"
      },
      {
        "out": "Frank",
        "in": "Zé Carlos"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 79,
        "penalty": true
      }
    ]
  },
  {
    "date": "1984-10-07",
    "phase": "4º turno",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Manoel Moreira",
    "referee": "Ronaldo Nunes",
    "attendance": 773,
    "revenue": 386500,
    "revenueText": "Cr$ 386.500,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Carlinhos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Nívio",
        "minute": 63
      }
    ]
  },
  {
    "date": "1984-10-10",
    "phase": "4º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 7,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Ernani Jonas",
    "attendance": 1466,
    "revenue": 2452000,
    "revenueText": "Cr$ 2.452.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Ednaldo",
      "Zé Carlos",
      "Laerte",
      "Frank",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "João Neto",
      "Bel"
    ],
    "subs": [
      {
        "out": "Laerte",
        "in": "João Neto"
      },
      {
        "out": "Frank",
        "in": "Bel"
      }
    ],
    "goals": [
      {
        "name": "Zé Carlos"
      },
      {
        "name": "Zé Carlos"
      },
      {
        "name": "Zé Carlos"
      },
      {
        "name": "Luizão"
      },
      {
        "name": "Luizão"
      },
      {
        "name": "Frank"
      },
      {
        "name": "Carlinhos"
      }
    ],
    "note": "Expulsão Sílvio (São Domingos)"
  },
  {
    "date": "1984-10-14",
    "phase": "4º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 3674,
    "revenue": 6295000,
    "revenueText": "Cr$ 6.295.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Zé Carlos",
      "Frank"
    ],
    "subs": [
      {
        "out": "Édson Silva",
        "in": "Zé Carlos"
      },
      {
        "out": "Jacozinho",
        "in": "Frank"
      }
    ],
    "goals": [
      {
        "name": "Carlinhos",
        "minute": 30
      },
      {
        "name": "Zé Carlos",
        "minute": 81
      }
    ]
  },
  {
    "date": "1984-10-21",
    "phase": "4º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 11691,
    "revenue": 21047000,
    "revenueText": "Cr$ 21.047.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Ednaldo",
      "Zé Carlos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Agnaldo",
      "Frank"
    ],
    "subs": [
      {
        "out": "Zé Carlos",
        "in": "Agnaldo"
      },
      {
        "out": "Nívio",
        "in": "Frank"
      }
    ],
    "goals": [
      {
        "name": "Luizão",
        "minute": 30
      }
    ],
    "note": "Gol Joãozinho Paulista (CRB) 28'; expulsão Carlinhos (CRB, adversário)"
  },
  {
    "date": "1984-10-25",
    "phase": "Quadrangular do 4º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Marcelo Costa",
    "attendance": 1586,
    "revenue": 2776000,
    "revenueText": "Cr$ 2.776.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Luiz Augusto",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Frank",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Zé Carlos",
      "João Neto"
    ],
    "subs": [
      {
        "out": "Ednaldo",
        "in": "Zé Carlos"
      },
      {
        "out": "Zé Carlos",
        "in": "João Neto"
      }
    ],
    "goals": [
      {
        "name": "Zé Carlos",
        "minute": 66
      }
    ],
    "note": "Gol Norinho (CSE) 86'"
  },
  {
    "date": "1984-11-01",
    "phase": "Quadrangular do 4º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "João Monteiro",
    "attendance": 1379,
    "revenue": 2349000,
    "revenueText": "Cr$ 2.349.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Frank",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Carlinhos",
      "Zé Carlos"
    ],
    "subs": [
      {
        "out": "Edvaldo",
        "in": "Carlinhos"
      },
      {
        "out": "Frank",
        "in": "Zé Carlos"
      }
    ],
    "goals": [
      {
        "name": "Frank",
        "minute": 24
      },
      {
        "name": "Luizão",
        "minute": 31
      },
      {
        "name": "Luizão",
        "minute": 88
      }
    ]
  },
  {
    "date": "1984-11-04",
    "phase": "Quadrangular do 4º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pedro Carlos Begralda",
    "attendance": 10831,
    "revenue": 19678000,
    "revenueText": "Cr$ 19.678.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Clésio",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Carlinhos",
      "Frank"
    ],
    "subs": [
      {
        "out": "Clésio",
        "in": "Carlinhos"
      },
      {
        "out": "Jacozinho",
        "in": "Frank"
      }
    ],
    "goals": [
      {
        "name": "Nívio",
        "minute": 34
      },
      {
        "name": "Frazão",
        "minute": 51
      }
    ],
    "note": "Gol Gilmar (CRB) 23'"
  },
  {
    "date": "1984-11-07",
    "phase": "Decisão do 4º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Roberto Wright",
    "attendance": 12936,
    "revenue": 23883000,
    "revenueText": "Cr$ 23.883.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Agnaldo",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Zé Carlos",
      "Frank"
    ],
    "subs": [
      {
        "out": "Ednaldo",
        "in": "Zé Carlos"
      },
      {
        "out": "Frazão",
        "in": "Frank"
      }
    ],
    "goals": [
      {
        "name": "Frank",
        "minute": 114
      },
      {
        "name": "Jacozinho",
        "minute": 117,
        "penalty": true
      }
    ],
    "note": "CSA campeão do 4º turno; expulsões Gilnei (CRB) e Luizão (CSA). Gols na prorrogação (2º tempo)"
  },
  {
    "date": "1984-11-11",
    "phase": "Superturno final",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "João Monteiro",
    "attendance": 2850,
    "revenue": 4847000,
    "revenueText": "Cr$ 4.847.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Agnaldo",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Frank",
      "Jacozinho"
    ],
    "entered": [
      "Zé Carlos",
      "Nenê"
    ],
    "subs": [
      {
        "out": "Ednaldo",
        "in": "Zé Carlos"
      },
      {
        "out": "Nívio",
        "in": "Nenê"
      }
    ],
    "goals": [
      {
        "name": "Café",
        "minute": 13,
        "ownGoal": true,
        "ownGoalDirection": "against"
      }
    ],
    "note": "Gol Gil Lima (ASA) 78'; expulsões Frank (CSA); Major e Marquinhos (ASA)"
  },
  {
    "date": "1984-11-15",
    "phase": "Superturno final",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 4,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Gilson Cordeiro",
    "attendance": 1813,
    "revenue": 4665000,
    "revenueText": "Cr$ 4.665.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Agnaldo",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Clésio",
      "Zé Carlos"
    ],
    "subs": [
      {
        "out": "Carlinhos",
        "in": "Clésio"
      },
      {
        "out": "Édson Silva",
        "in": "Zé Carlos"
      }
    ],
    "goals": [
      {
        "name": "Ednaldo",
        "minute": 32
      },
      {
        "name": "Ednaldo",
        "minute": 44
      },
      {
        "name": "Nívio",
        "minute": 78
      },
      {
        "name": "Frazão",
        "minute": 92
      }
    ],
    "note": "Gol Cacau (Capelense) 48'"
  },
  {
    "date": "1984-11-25",
    "phase": "Superturno final",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Wilson Carlos dos Santos",
    "attendance": 11440,
    "revenue": 30865500,
    "revenueText": "Cr$ 30.865.500,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Café",
      "Edvaldo",
      "Agnaldo",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Frank",
      "Luiz Augusto"
    ],
    "subs": [
      {
        "out": "Frazão",
        "in": "Frank"
      },
      {
        "out": "Luizão",
        "in": "Luiz Augusto"
      }
    ],
    "goals": [
      {
        "name": "Jacozinho",
        "minute": 54
      },
      {
        "name": "Frank",
        "minute": 77
      }
    ],
    "note": "Expulsões Gilnei, Williams e Joãozinho Paulista (CRB); Café, Édson Silva e Frank (CSA)"
  },
  {
    "date": "1984-12-02",
    "phase": "Superturno final",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Manoel Moreira",
    "referee": "José Araújo",
    "attendance": 2903,
    "revenue": 2903000,
    "revenueText": "Cr$ 2.903.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Carlinhos",
      "Luiz Augusto",
      "Edvaldo",
      "Agnaldo",
      "Ednaldo",
      "Zé Carlos",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Clésio",
      "Nenê"
    ],
    "subs": [
      {
        "out": "Luiz Augusto",
        "in": "Clésio"
      },
      {
        "out": "Frazão",
        "in": "Nenê"
      }
    ],
    "note": "Gol Sérgio (Capelense) 87'"
  },
  {
    "date": "1984-12-09",
    "phase": "Superturno final",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Gilson Cordeiro",
    "attendance": 8624,
    "revenue": 23397000,
    "revenueText": "Cr$ 23.397.000,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Jacozinho"
    ],
    "entered": [
      "Zé Carlos",
      "Frank"
    ],
    "subs": [
      {
        "out": "Nívio",
        "in": "Zé Carlos"
      },
      {
        "out": "Luizão",
        "in": "Frank"
      }
    ],
    "goals": [
      {
        "name": "Édson Silva",
        "minute": 35
      },
      {
        "name": "Nívio",
        "minute": 73
      },
      {
        "name": "Frank",
        "minute": 80
      },
      {
        "name": "Jacozinho",
        "minute": 87
      }
    ],
    "note": "Título alagoano antecipado"
  },
  {
    "date": "1984-12-13",
    "phase": "Superturno final",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Josival Pedro",
    "attendance": 2760,
    "revenue": 7312500,
    "revenueText": "Cr$ 7.312.500,00",
    "manager": "Valdemar Carabina",
    "starters": [
      "Zé Luiz",
      "Agnaldo",
      "Café",
      "Edvaldo",
      "Zezinho",
      "Édson Silva",
      "Ednaldo",
      "Nívio",
      "Frazão",
      "Luizão",
      "Nenê"
    ],
    "entered": [
      "Carlinhos",
      "Frank"
    ],
    "subs": [
      {
        "out": "Zezinho",
        "in": "Carlinhos"
      },
      {
        "out": "Luizão",
        "in": "Frank"
      }
    ]
  }
];
