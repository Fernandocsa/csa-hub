/**
 * Apply researched announcement/signing dates for 2026 CSA transfers.
 * Sources: ge.globo, Transfermarkt, TNH1, OCP News, Reporter Diario, etc.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

/** @type {{ playerId: number; direction: 'in'|'out'; date: string; club?: string; transferType?: string|null; notes?: string }[]} */
const UPDATES = [
  // ——— Saídas ———
  {
    playerId: 414,
    direction: "out",
    date: "2026-01-08",
    club: "Athletic-MG",
    transferType: "empréstimo",
    notes: "Athletic anuncia empréstimo (ge, 08/01/2026)",
  },
  {
    playerId: 390,
    direction: "out",
    date: "2026-01-19",
    club: "Rio Branco-ES",
    notes: "CSA anuncia saída (ge, 19/01/2026)",
  },
  {
    playerId: 441,
    direction: "out",
    date: "2026-04-01",
    club: "Juazeirense",
    transferType: "empréstimo",
    notes:
      "Empréstimo inicial ao Atlético-BA (21/01); Juazeirense desde 01/04 (Transfermarkt)",
  },
  {
    playerId: 478,
    direction: "out",
    date: "2026-01-31",
    club: "Atlético Piauiense",
    notes: "CSA anuncia saída (ge, 31/01/2026)",
  },
  {
    // Sem data oficial encontrada; mantém ordem aproximada (início de temporada)
    playerId: 2144,
    direction: "out",
    date: "2026-02-15",
    club: "CSE",
    notes: "Data aproximada — sem anúncio oficial localizado",
  },
  {
    playerId: 355,
    direction: "out",
    date: "2026-03-01",
    club: "KF Trepça'89",
    notes: "Data aproximada — sem anúncio oficial localizado",
  },
  {
    playerId: 456,
    direction: "out",
    date: "2026-03-13",
    club: "São José-RS",
    notes: "CSA anuncia saída com Buba (ge, 13/03/2026)",
  },
  {
    playerId: 480,
    direction: "out",
    date: "2026-03-13",
    club: "Treze",
    notes: "CSA anuncia saída (ge, 13/03); Treze confirma 17/03",
  },
  {
    playerId: 447,
    direction: "out",
    date: "2026-03-23",
    club: "Ferroviário",
    notes: "CSA/Ciel anunciam saída (ge, 23/03); Ferroviário 02/04",
  },
  {
    playerId: 445,
    direction: "out",
    date: "2026-03-25",
    club: "Treze",
    notes: "CSA anuncia saída (GazetaWeb, 25/03); BID Treze 31/03",
  },
  {
    playerId: 493,
    direction: "out",
    date: "2026-04-09",
    club: "GE Brasil",
    notes: "CSA anuncia saída (ge, 09/04/2026)",
  },
  {
    playerId: 458,
    direction: "out",
    date: "2026-04-17",
    club: "GE Brasil",
    transferType: "empréstimo",
    notes: "CSA anuncia empréstimo (ge, 17/04/2026)",
  },
  {
    playerId: 469,
    direction: "out",
    date: "2026-04-23",
    club: "Altos",
    notes: "CSA anuncia saída (ge, 23/04); Altos 24/04",
  },
  {
    playerId: 440,
    direction: "out",
    date: "2026-05-28",
    club: "Juventus Jaraguá",
    transferType: "empréstimo",
    notes: "Juventus anuncia empréstimo (OCP News, 28/05/2026)",
  },
  {
    playerId: 481,
    direction: "out",
    date: "2026-06-12",
    club: "Joinville",
    transferType: "empréstimo",
    notes: "Transfermarkt: no Joinville desde 12/06/2026",
  },
  {
    playerId: 452,
    direction: "out",
    date: "2026-06-22",
    club: "Mamoré",
    notes: "Transfermarkt: no Mamoré desde 22/06/2026",
  },
  {
    playerId: 415,
    direction: "out",
    date: "2026-07-10",
    club: "Santo André",
    transferType: "empréstimo",
    notes:
      "Transfermarkt joined 10/07; Santo André anuncia ~18/06 (Reporter Diario)",
  },

  // ——— Chegadas ———
  {
    playerId: 71,
    direction: "in",
    date: "2026-04-02",
    club: "Boavista-RJ",
    notes: "CSA anuncia (ge, 02/04/2026)",
  },
  {
    playerId: 476,
    direction: "in",
    date: "2026-04-30",
    club: "Marília",
    notes: "Rodas confirma chegada na quinta (ge, 29/04 → 30/04/2026)",
  },
  {
    playerId: 475,
    direction: "in",
    date: "2026-05-22",
    club: "XV de Jaú",
    notes: "CSA anuncia (ge, 22/05/2026)",
  },
  {
    playerId: 467,
    direction: "in",
    date: "2026-05-25",
    club: "CA Votuporanguense",
    transferType: "empréstimo",
    notes: "CSA anuncia (ge, 25/05/2026)",
  },
  {
    playerId: 477,
    direction: "in",
    date: "2026-06-12",
    club: "Volta Redonda",
    transferType: "empréstimo",
    notes: "CSA anuncia empréstimo (ge/TNH1, 12/06/2026)",
  },
  {
    playerId: 104,
    direction: "in",
    date: "2026-06-19",
    club: "Sousa",
    notes: "CSA anuncia (ge/NE45, 19/06/2026)",
  },
];

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const u of UPDATES) {
    const r = await client.query(
      `UPDATE transfers
       SET transfer_date = $1::date,
           club = COALESCE($2, club),
           transfer_type = COALESCE($3, transfer_type),
           notes = COALESCE($4, notes)
       WHERE player_id = $5 AND direction = $6 AND season = '2026'
       RETURNING id, player_id, transfer_date::text`,
      [
        u.date,
        u.club ?? null,
        u.transferType !== undefined ? u.transferType : null,
        u.notes ?? null,
        u.playerId,
        u.direction,
      ],
    );
    if (r.rowCount === 0) {
      console.warn(`No row for player ${u.playerId} ${u.direction}`);
    } else {
      console.log(
        `OK #${r.rows[0].id} player=${r.rows[0].player_id} → ${r.rows[0].transfer_date}`,
      );
    }
  }
  await client.query("COMMIT");

  const { rows } = await client.query(`
    SELECT p.name, t.direction, t.club, t.transfer_date::text AS d, t.transfer_type
    FROM transfers t JOIN players p ON p.id = t.player_id
    WHERE t.season = '2026'
    ORDER BY t.transfer_date DESC NULLS LAST, t.id
  `);
  console.log("\n=== 2026 transfers (newest first) ===");
  console.table(rows);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
