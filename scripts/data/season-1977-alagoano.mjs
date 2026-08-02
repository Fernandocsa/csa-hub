/** Campeonato Alagoano 1977 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA 3º 1977; CRB campeão; ASA não disputou (Fumeirão).
 * Sem técnico na fonte; decisão CRB x CSE sem CSA.
 * Soma dos placares listados: J27 V15 E5 D7 GP47 GC24.
 * Classificação da fonte (tabela): GP47 GC22.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 53' do 2ºT = 98.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1977;

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
    "date": "1977-03-06",
    "phase": "1ª fase do 1º turno",
    "opponent": "Guarany-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 985,
    "revenue": 13564,
    "revenueText": "Cr$ 13.564,00",
    "starters": [
      "Milano",
      "Geraldo",
      "Ulisses",
      "Alberto",
      "Zequinha",
      "Muçurica",
      "Soareste",
      "Jorge Siri",
      "Gilmar",
      "Almir",
      "Ricardo"
    ],
    "entered": [
      "Jorge Nunes"
    ],
    "subs": [
      {
        "out": "Gilmar",
        "in": "Jorge Nunes"
      }
    ],
    "goals": [
      {
        "name": "Almir",
        "minute": 45
      }
    ]
  },
  {
    "date": "1977-03-23",
    "phase": "1ª fase do 1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 2158,
    "revenue": 31509,
    "revenueText": "Cr$ 31.509,00",
    "starters": [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Alberto",
      "Soareste",
      "Ênio Oliveira",
      "Gilmar",
      "Almir",
      "Zequinha"
    ],
    "entered": [
      "Muçurica",
      "Serginho"
    ],
    "subs": [
      {
        "out": "Geraldo",
        "in": "Muçurica"
      },
      {
        "out": "Zequinha",
        "in": "Serginho"
      }
    ],
    "goals": [
      {
        "name": "Almir",
        "minute": 50
      }
    ],
    "note": "Gol Augusto (CSE) 74'"
  },
  {
    "date": "1977-04-03",
    "phase": "1ª fase do 1º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 4,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "revenue": 49290,
    "revenueText": "Cr$ 49.290,00",
    "starters": [
      "Nego",
      "Alberto",
      "Ulisses",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Almir",
      "Ênio Oliveira",
      "Soareste",
      "Gilmar",
      "Ricardo"
    ],
    "entered": [
      "Zequinha"
    ],
    "subs": [
      {
        "out": "Ricardo",
        "in": "Zequinha"
      }
    ],
    "goals": [
      {
        "name": "Alberto",
        "minute": 40,
        "penalty": true
      },
      {
        "name": "Gilmar",
        "minute": 41
      },
      {
        "name": "Almir",
        "minute": 58
      },
      {
        "name": "Soareste",
        "minute": 80
      }
    ],
    "note": "Gols Mozart 5', Aílton 75' (São Domingos); fonte Timbóe→Timbó"
  },
  {
    "date": "1977-04-06",
    "phase": "1ª fase do 1º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 6,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 1495,
    "revenue": 20802,
    "revenueText": "Cr$ 20.802,00",
    "starters": [
      "Nego",
      "Alberto",
      "Ulisses",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Soareste",
      "Ênio Oliveira",
      "Almir",
      "Gilmar",
      "Ricardo"
    ],
    "entered": [
      "Misso",
      "Zequinha"
    ],
    "subs": [
      {
        "out": "Gilmar",
        "in": "Misso"
      },
      {
        "out": "Ricardo",
        "in": "Zequinha"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira",
        "minute": 8
      },
      {
        "name": "Alberto",
        "minute": 35,
        "penalty": true
      },
      {
        "name": "Almir",
        "minute": 40
      },
      {
        "name": "Gilmar",
        "minute": 44
      },
      {
        "name": "Misso",
        "minute": 75
      },
      {
        "name": "Ênio Oliveira",
        "minute": 87
      }
    ],
    "note": "Gol Alcides (Penedense) 64'"
  },
  {
    "date": "1977-04-10",
    "phase": "1ª fase do 1º turno",
    "opponent": "Canavieiro-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Manoel Moreira",
    "referee": "Sebastião Canuto",
    "starters": [
      "Nego",
      "Alberto",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Almir",
      "Ênio Oliveira",
      "Soareste",
      "Gilmar",
      "Zequinha"
    ],
    "entered": [
      "Misso"
    ],
    "subs": [
      {
        "out": "Almir",
        "in": "Misso"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira",
        "minute": 87
      }
    ]
  },
  {
    "date": "1977-04-17",
    "phase": "1ª fase do 1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 3667,
    "revenue": 51320,
    "revenueText": "Cr$ 51.320,00",
    "starters": [
      "Nego",
      "Alberto",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Almir",
      "Ênio Oliveira",
      "Soareste",
      "Gilmar",
      "Zequinha"
    ],
    "entered": [
      "Misso"
    ],
    "subs": [
      {
        "out": "Almir",
        "in": "Misso"
      }
    ],
    "goals": [
      {
        "name": "Gilmar",
        "minute": 43
      },
      {
        "name": "Gilmar",
        "minute": 80
      }
    ],
    "note": "Expulsão Capeta (Ferroviário)"
  },
  {
    "date": "1977-04-21",
    "phase": "1ª fase do 1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 11096,
    "revenue": 166603,
    "revenueText": "Cr$ 166.603,00",
    "starters": [
      "Nego",
      "Alberto",
      "Ulisses",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Almir",
      "Ênio Oliveira",
      "Zequinha",
      "Gilmar",
      "Ricardo"
    ],
    "entered": [
      "Dão",
      "Misso"
    ],
    "subs": [
      {
        "out": "Muçurica",
        "in": "Dão"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Misso"
      }
    ],
    "note": "Quatro meias na fonte; gol Roberval (CRB) 75'"
  },
  {
    "date": "1977-04-24",
    "phase": "Quadrangular do 1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "starters": [
      "Nego",
      "Almiro",
      "Ulisses",
      "Timbó",
      "Ênio",
      "Alberto",
      "Almir",
      "Ênio Oliveira",
      "Zequinha",
      "Gilmar",
      "Ricardo"
    ],
    "entered": [
      "Misso",
      "Dão"
    ],
    "subs": [
      {
        "out": "Gilmar",
        "in": "Misso"
      },
      {
        "out": "Ricardo",
        "in": "Dão"
      }
    ],
    "goals": [
      {
        "name": "Almir",
        "minute": 50
      }
    ],
    "note": "Gol Reginaldo (CSE) 4'"
  },
  {
    "date": "1977-04-27",
    "phase": "Quadrangular do 1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "revenue": 111840,
    "revenueText": "Cr$ 111.840,00",
    "starters": [
      "Nego",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Alberto",
      "Soareste",
      "Ênio Oliveira",
      "Misso",
      "Zequinha"
    ],
    "entered": [
      "Gilmar",
      "Ricardo"
    ],
    "subs": [
      {
        "out": "Alberto",
        "in": "Gilmar"
      },
      {
        "out": "Zequinha",
        "in": "Ricardo"
      }
    ],
    "goals": [
      {
        "name": "Gilmar",
        "minute": 73
      }
    ]
  },
  {
    "date": "1977-05-01",
    "phase": "Quadrangular do 1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "attendance": 11288,
    "revenue": 182489,
    "revenueText": "Cr$ 182.489,00",
    "starters": [
      "Nego",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Almir",
      "Soareste",
      "Misso",
      "Gilmar",
      "Zequinha"
    ],
    "entered": [
      "Alberto",
      "Ricardo"
    ],
    "subs": [
      {
        "out": "Almiro",
        "in": "Alberto"
      },
      {
        "out": "Zequinha",
        "in": "Ricardo"
      }
    ],
    "goals": [
      {
        "name": "Misso",
        "minute": 38
      }
    ],
    "note": "Gols Silva 30', Antônio Carlos 32', Silva 83' (CRB)"
  },
  {
    "date": "1977-05-08",
    "phase": "1ª fase do 2º turno",
    "opponent": "Guarany-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Moacir Monteiro",
    "attendance": 850,
    "revenue": 12340,
    "revenueText": "Cr$ 12.340,00",
    "starters": [
      "Milano",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Timbó",
      "Alberto",
      "Soareste",
      "Gabriel",
      "Misso",
      "Ênio Oliveira",
      "Ricardo"
    ],
    "entered": [
      "Muçurica",
      "Almir"
    ],
    "subs": [
      {
        "out": "Alberto",
        "in": "Muçurica"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Almir"
      }
    ],
    "goals": [
      {
        "name": "Ricardo",
        "minute": 10
      },
      {
        "name": "Ênio Oliveira",
        "minute": 36
      },
      {
        "name": "Ênio Oliveira",
        "minute": 40
      },
      {
        "name": "Ricardo",
        "minute": 76
      }
    ]
  },
  {
    "date": "1977-05-15",
    "phase": "1ª fase do 2º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Juca Sampaio",
    "referee": "Sebastião Canuto",
    "revenue": 42000,
    "revenueText": "Cr$ 42.000,00",
    "starters": [
      "Milano",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Timbó",
      "Muçurica",
      "Soareste",
      "Ênio Oliveira",
      "Gabriel",
      "Almir",
      "Zequinha"
    ],
    "entered": [
      "Misso"
    ],
    "subs": [
      {
        "out": "Gabriel",
        "in": "Misso"
      }
    ]
  },
  {
    "date": "1977-05-22",
    "phase": "1ª fase do 2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 0,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 2967,
    "revenue": 43061,
    "revenueText": "Cr$ 43.061,00",
    "starters": [
      "Milano",
      "Almiro",
      "Ulisses",
      "Zé Preta",
      "Timbó",
      "Alberto",
      "Almir",
      "Dão",
      "Ênio Oliveira",
      "Assis",
      "Ricardo"
    ],
    "entered": [
      "Soareste",
      "Zequinha"
    ],
    "subs": [
      {
        "out": "Alberto",
        "in": "Soareste"
      },
      {
        "out": "Ricardo",
        "in": "Zequinha"
      }
    ],
    "note": "Gols Jorge Siri 48', Batoré 72', Jorge da Sorte 84' (Ferroviário); expulsão Jorge Siri (Ferroviário)"
  },
  {
    "date": "1977-05-29",
    "phase": "1ª fase do 2º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Sebastião Canuto",
    "starters": [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Alberto",
      "Gilmar",
      "Misso",
      "Soareste",
      "Assis",
      "Ênio Oliveira"
    ],
    "entered": [
      "Muçurica",
      "Serginho"
    ],
    "subs": [
      {
        "out": "Soareste",
        "in": "Muçurica"
      },
      {
        "out": "Assis",
        "in": "Serginho"
      }
    ],
    "goals": [
      {
        "name": "Alberto",
        "minute": 24
      },
      {
        "name": "Misso",
        "minute": 82
      }
    ],
    "note": "Quatro meias; gol Saulzinho pênalti 59' (Penedense)"
  },
  {
    "date": "1977-06-05",
    "phase": "1ª fase do 2º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 1060,
    "revenue": 26760,
    "revenueText": "Cr$ 26.760,00",
    "starters": [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Alberto",
      "Gilmar",
      "Soareste",
      "Ênio Oliveira",
      "Misso",
      "Serginho"
    ],
    "entered": [
      "Almir",
      "Ricardo"
    ],
    "subs": [
      {
        "out": "Gilmar",
        "in": "Almir"
      },
      {
        "out": "Serginho",
        "in": "Ricardo"
      }
    ],
    "goals": [
      {
        "name": "Ênio",
        "minute": 35
      },
      {
        "name": "Almir",
        "minute": 72
      }
    ]
  },
  {
    "date": "1977-06-09",
    "phase": "1ª fase do 2º turno",
    "opponent": "Canavieiro-AL",
    "ha": "home",
    "gf": 1,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "attendance": 1592,
    "revenue": 25573,
    "revenueText": "Cr$ 25.573,00",
    "starters": [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Dão",
      "Ênio Oliveira",
      "Misso",
      "Assis",
      "Zequinha"
    ],
    "entered": [
      "Almir"
    ],
    "subs": [
      {
        "out": "Ênio Oliveira",
        "in": "Almir"
      }
    ],
    "goals": [
      {
        "name": "Misso",
        "minute": 11
      }
    ],
    "note": "Gols Toninho 24', Alcidésio 54', Rosquinha pênalti 76' (Canavieiro)"
  },
  {
    "date": "1977-06-18",
    "phase": "1ª fase do 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 9075,
    "revenue": 145906,
    "revenueText": "Cr$ 145.906,00",
    "starters": [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Alberto",
      "Gilmar",
      "Almir",
      "Soareste",
      "Misso",
      "Ricardo"
    ],
    "entered": [
      "Almiro",
      "Serginho"
    ],
    "subs": [
      {
        "out": "Geraldo",
        "in": "Almiro"
      },
      {
        "out": "Ricardo",
        "in": "Serginho"
      }
    ],
    "goals": [
      {
        "name": "Gilmar",
        "minute": 11
      },
      {
        "name": "Misso",
        "minute": 31
      },
      {
        "name": "Almir",
        "minute": 87
      }
    ],
    "note": "Expulsões Almir/Misso (CSA); Fifi (CRB)"
  },
  {
    "date": "1977-07-20",
    "phase": "1ª fase do 3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Minervino",
    "attendance": null,
    "revenue": null,
    "starters": [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Soareste",
      "Ênio Oliveira",
      "Nilton Melo",
      "Gilmar",
      "Ricardo"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Gilmar",
        "minute": 20
      },
      {
        "name": "Nilton Melo",
        "minute": 35
      },
      {
        "name": "Gilmar",
        "minute": 60
      }
    ],
    "note": "Portões abertos"
  },
  {
    "date": "1977-07-24",
    "phase": "1ª fase do 3º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pedro Rufino",
    "attendance": 2503,
    "revenue": 37840,
    "revenueText": "Cr$ 37.840,00",
    "note": "Gol Jorge da Sorte 1'; expulsões Alberto (CSA); Brito (Ferroviário); sem escalação na fonte"
  },
  {
    "date": "1977-07-31",
    "phase": "1ª fase do 3º turno",
    "opponent": "Canavieiro-AL",
    "ha": "away",
    "gf": 2,
    "ga": 1,
    "stadium": "Manoel Moreira",
    "referee": "Antônio Morais",
    "starters": [
      "Milano",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Ênio",
      "Muçurica",
      "Gilmar",
      "Soareste",
      "Almir",
      "Ênio Oliveira",
      "Misso"
    ],
    "entered": [
      "Sérgio",
      "Ricardo"
    ],
    "subs": [
      {
        "out": "Almir",
        "in": "Sérgio"
      },
      {
        "out": "Misso",
        "in": "Ricardo"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira",
        "minute": 25
      },
      {
        "name": "Misso",
        "minute": 52
      }
    ],
    "note": "Gol Ferreira (Canavieiro) 71'"
  },
  {
    "date": "1977-08-07",
    "phase": "1ª fase do 3º turno",
    "opponent": "Guarany-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "attendance": 2180,
    "revenue": 43637,
    "revenueText": "Cr$ 43.637,00",
    "starters": [
      "Milano",
      "Geraldo",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Muçurica",
      "Soareste",
      "Ênio Oliveira",
      "Gilmar",
      "Almir",
      "Misso"
    ],
    "entered": [
      "Alberto",
      "Ricardo"
    ],
    "subs": [
      {
        "out": "Muçurica",
        "in": "Alberto"
      },
      {
        "out": "Misso",
        "in": "Ricardo"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira",
        "minute": 5
      },
      {
        "name": "Ênio Oliveira",
        "minute": 61,
        "penalty": true
      },
      {
        "name": "Ênio Oliveira",
        "minute": 81,
        "penalty": true
      }
    ]
  },
  {
    "date": "1977-08-17",
    "phase": "1ª fase do 3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "note": "Só placar na fonte"
  },
  {
    "date": "1977-08-21",
    "phase": "1ª fase do 3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 4,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "starters": [
      "Milano",
      "Muçurica",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Alberto",
      "Soareste",
      "Gilmar",
      "Ênio Oliveira",
      "Misso",
      "Ricardo"
    ],
    "entered": [
      "Geraldo"
    ],
    "subs": [
      {
        "out": "Alberto",
        "in": "Geraldo"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira",
        "minute": 22,
        "penalty": true
      },
      {
        "name": "Ulisses",
        "minute": 28,
        "ownGoal": true,
        "ownGoalDirection": "against"
      },
      {
        "name": "Soareste",
        "minute": 31
      },
      {
        "name": "Ênio Oliveira",
        "minute": 49
      },
      {
        "name": "Soareste",
        "minute": 73
      }
    ]
  },
  {
    "date": "1977-08-28",
    "phase": "1ª fase do 3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 16530,
    "revenue": 275709,
    "revenueText": "Cr$ 275.709,00",
    "starters": [
      "Milano",
      "Muçurica",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Alberto",
      "Soareste",
      "Gilmar",
      "Ênio Oliveira",
      "Misso",
      "Ricardo"
    ],
    "entered": [
      "Almir",
      "Zequinha"
    ],
    "subs": [
      {
        "out": "Ênio Oliveira",
        "in": "Almir"
      },
      {
        "out": "Ricardo",
        "in": "Zequinha"
      }
    ],
    "note": "Gol Dirceu (CRB) 7'"
  },
  {
    "date": "1977-09-04",
    "phase": "Quadrangular do 3º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "starters": [
      "Milano",
      "Muçurica",
      "Timbó",
      "Zé Preta",
      "Ênio",
      "Alberto",
      "Soareste",
      "Gilmar",
      "Almir",
      "Misso",
      "Zequinha"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Almir",
        "minute": 17
      },
      {
        "name": "Gilmar",
        "minute": 36
      }
    ],
    "note": "Expulsão Machado (Ferroviário)"
  },
  {
    "date": "1977-09-07",
    "phase": "Quadrangular do 3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "note": "Só placar na fonte"
  },
  {
    "date": "1977-09-11",
    "phase": "Quadrangular do 3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 2,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "starters": [
      "Milano",
      "Muçurica",
      "Ulisses",
      "Zé Preta",
      "Ênio",
      "Alberto",
      "Soareste",
      "Almir",
      "Gabriel",
      "Misso",
      "Gilmar"
    ],
    "entered": [
      "Geraldo",
      "Caneta"
    ],
    "subs": [
      {
        "out": "Muçurica",
        "in": "Geraldo"
      },
      {
        "out": "Gabriel",
        "in": "Caneta"
      }
    ],
    "goals": [
      {
        "name": "Gilmar",
        "minute": 5
      },
      {
        "name": "Gilmar",
        "minute": 11
      }
    ],
    "note": "Gols Hamilton 4', Fininho pênalti 32' (São Domingos)"
  }
];
