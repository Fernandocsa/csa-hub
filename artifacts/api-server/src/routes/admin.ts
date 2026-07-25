import { Router } from "express";
import crypto from "node:crypto";
import { db, pool as pgPool } from "@workspace/db";
import {
  playersTable,
  playerSeasonStatsTable,
  matchesTable,
  opponentsTable,
  stadiumsTable,
  competitionsTable,
  managersTable,
} from "@workspace/db";
import { eq, asc, desc, sql } from "drizzle-orm";

const router = Router();

function getAdminToken(): string {
  const secret = process.env.SESSION_SECRET ?? "fallback-secret";
  const password = process.env.ADMIN_PASSWORD ?? "admin";
  return crypto.createHmac("sha256", secret).update(`marujo-admin:${password}`).digest("hex");
}

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  const token = auth.slice(7);
  if (token !== getAdminToken()) {
    return res.status(401).json({ error: "Token inválido" });
  }
  next();
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] ?? "";
      });
      return row;
    });
}

function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown): string => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join(
    "\n",
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────

router.post("/admin/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";
  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: "Senha incorreta" });
  }
  res.json({ token: getAdminToken() });
});

router.get("/admin/session", requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

// ── Lookup (dropdowns) ────────────────────────────────────────────────────────

router.get("/admin/lookup", requireAdmin, async (req, res) => {
  try {
    const [opponents, competitions, stadiums, managers] = await Promise.all([
      db.select().from(opponentsTable).orderBy(asc(opponentsTable.name)),
      db.select().from(competitionsTable).orderBy(asc(competitionsTable.name)),
      db.select().from(stadiumsTable).orderBy(asc(stadiumsTable.name)),
      db.select().from(managersTable).orderBy(asc(managersTable.name)),
    ]);
    res.json({ opponents, competitions, stadiums, managers });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Players ───────────────────────────────────────────────────────────────────

router.get("/admin/players", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(playersTable).orderBy(asc(playersTable.name));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/players", requireAdmin, async (req, res) => {
  try {
    const { name, position, nationality, birthYear } = req.body as {
      name: string;
      position?: string;
      nationality?: string;
      birthYear?: number;
    };
    if (!name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const [player] = await db
      .insert(playersTable)
      .values({ name: name.trim(), position: position || null, nationality: nationality || null, birthYear: birthYear || null })
      .returning();
    res.status(201).json(player);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/players/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { name, position, nationality, birthYear } = req.body as {
      name: string;
      position?: string;
      nationality?: string;
      birthYear?: number;
    };
    if (!name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const [updated] = await db
      .update(playersTable)
      .set({ name: name.trim(), position: position || null, nationality: nationality || null, birthYear: birthYear || null })
      .where(eq(playersTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Jogador não encontrado" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/players/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    await db.delete(playerSeasonStatsTable).where(eq(playerSeasonStatsTable.playerId, id));
    await db.delete(playersTable).where(eq(playersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Player Season Stats ───────────────────────────────────────────────────────

router.get("/admin/players/:id/stats", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const stats = await db
      .select()
      .from(playerSeasonStatsTable)
      .where(eq(playerSeasonStatsTable.playerId, id))
      .orderBy(desc(playerSeasonStatsTable.season));
    res.json(stats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/players/:id/stats", requireAdmin, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) return res.status(400).json({ error: "ID inválido" });
    const { season, appearances, goals, assists } = req.body as {
      season: string;
      appearances: number;
      goals: number;
      assists?: number;
    };
    if (!season) return res.status(400).json({ error: "Temporada obrigatória" });
    const [stat] = await db
      .insert(playerSeasonStatsTable)
      .values({
        playerId,
        season,
        appearances: appearances ?? 0,
        goals: goals ?? 0,
        assists: assists ?? 0,
      })
      .returning();
    res.status(201).json(stat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/player-stats/:statId", requireAdmin, async (req, res) => {
  try {
    const statId = parseInt(req.params.statId);
    if (isNaN(statId)) return res.status(400).json({ error: "ID inválido" });
    const { season, appearances, goals, assists } = req.body as {
      season: string;
      appearances: number;
      goals: number;
      assists?: number;
    };
    const [updated] = await db
      .update(playerSeasonStatsTable)
      .set({ season, appearances: appearances ?? 0, goals: goals ?? 0, assists: assists ?? 0 })
      .where(eq(playerSeasonStatsTable.id, statId))
      .returning();
    if (!updated) return res.status(404).json({ error: "Stat não encontrada" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/player-stats/:statId", requireAdmin, async (req, res) => {
  try {
    const statId = parseInt(req.params.statId);
    if (isNaN(statId)) return res.status(400).json({ error: "ID inválido" });
    await db.delete(playerSeasonStatsTable).where(eq(playerSeasonStatsTable.id, statId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Matches ───────────────────────────────────────────────────────────────────

// Standardize Alagoano club names: append -AL to all clubs that play in Alagoano competitions
router.post("/admin/fix/alagoano-names", requireAdmin, async (req, res) => {
  try {
    // Alagoano competition IDs: Campeonato Alagoano (5), Copa Alagoas (12), Alagoano 2ª Divisão (14)
    const ALAGOANO_COMPS = [5, 12, 14];

    // Step 1: Move Corinthians-SP (national) Alagoano matches to Corinthians-AL
    // Find Corinthians-SP and Corinthians-AL by name
    const [corpSP] = await db.select().from(opponentsTable).where(eq(opponentsTable.name, "Corinthians-SP"));
    const [corpAL] = await db.select().from(opponentsTable).where(eq(opponentsTable.name, "Corinthians-AL"));
    let corinthiansLog = "Corinthians-SP not found or Corinthians-AL not found — skipped";
    if (corpSP && corpAL) {
      const result = await db.update(matchesTable)
        .set({ opponentId: corpAL.id })
        .where(sql`${matchesTable.opponentId} = ${corpSP.id} AND ${matchesTable.competitionId} IN (${sql.join(ALAGOANO_COMPS.map(id => sql`${id}`), sql`, `)})`);
      corinthiansLog = `Moved Corinthians-SP Alagoano matches → Corinthians-AL`;
    }

    // Step 2: Find all opponents in Alagoano competitions without -AL suffix (and not CSA or state-suffixed)
    const alagoanoOpponents = await db
      .selectDistinct({ id: matchesTable.opponentId })
      .from(matchesTable)
      .where(sql`${matchesTable.competitionId} = ANY(ARRAY[5,12,14]::int[])`);

    const ids = alagoanoOpponents.map(r => r.id);
    if (ids.length === 0) return res.json({ ok: true, renamed: 0, log: [corinthiansLog] });

    const candidates = await db.select().from(opponentsTable)
      .where(sql`${opponentsTable.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}]::int[])`);

    const EXCLUDED_SUFFIXES = ["-AL", "-SP", "-MG", "-PE", "-BA", "-RN", "-RS", "-ES", "-PI"];
    const toRename = candidates.filter(o =>
      o.name !== "CSA" &&
      !EXCLUDED_SUFFIXES.some(suffix => o.name.endsWith(suffix))
    );

    const log: string[] = [corinthiansLog];
    for (const opp of toRename) {
      const newName = opp.name + "-AL";
      await db.update(opponentsTable).set({ name: newName }).where(eq(opponentsTable.id, opp.id));
      log.push(`${opp.id}: "${opp.name}" → "${newName}"`);
    }

    res.json({ ok: true, renamed: toRename.length, log });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// One-shot fix for 2015 Campeonato Alagoano inconsistencies
router.post("/admin/fix/2015-alagoano", requireAdmin, async (req, res) => {
  try {
    const COMP = 5; // Campeonato Alagoano
    const SEASON = "2015";
    const CEO_ID = 85;
    const MURICI_ID = 44;

    // Find all 2015 Alagoano matches involving CEO
    const ceoMatches = await db
      .select()
      .from(matchesTable)
      .where(
        sql`${matchesTable.season} = ${SEASON}
        AND ${matchesTable.competitionId} = ${COMP}
        AND ${matchesTable.opponentId} = ${CEO_ID}`
      )
      .orderBy(matchesTable.matchDate);

    // Find any Murici match on 2015-02-01
    const muriciOnFeb1 = await db
      .select()
      .from(matchesTable)
      .where(
        sql`${matchesTable.season} = ${SEASON}
        AND ${matchesTable.competitionId} = ${COMP}
        AND ${matchesTable.opponentId} = ${MURICI_ID}
        AND ${matchesTable.matchDate} = '2015-02-01'`
      );

    const log: string[] = [];

    // Fix 1: CEO match on 01/03 that is home+1-1+draw → should be 08/02 (game #4)
    const wrongDateMatch = ceoMatches.find(
      m => m.matchDate === "2015-03-01" && m.homeAway === "home" && m.goalsFor === 1 && m.goalsAgainst === 1
    );
    if (wrongDateMatch) {
      await db.update(matchesTable)
        .set({ matchDate: "2015-02-08" })
        .where(eq(matchesTable.id, wrongDateMatch.id));
      log.push(`Fixed date of match ${wrongDateMatch.id}: 2015-03-01 → 2015-02-08`);
    }

    // Fix 2: Delete duplicate CEO match on 17/04 (wrong, erroneously classified)
    const dupMatch = ceoMatches.find(
      m => m.matchDate === "2015-04-17" && m.homeAway === "away"
    );
    if (dupMatch) {
      await db.delete(matchesTable).where(eq(matchesTable.id, dupMatch.id));
      log.push(`Deleted duplicate CEO match ${dupMatch.id} (2015-04-17)`);
    }

    // Fix 3: Insert missing Murici 01/02 (away, 1-1, draw) if not present
    if (muriciOnFeb1.length === 0) {
      const [m] = await db.insert(matchesTable).values({
        matchDate: "2015-02-01", season: SEASON, opponentId: MURICI_ID,
        goalsFor: 1, goalsAgainst: 1, result: "draw",
        homeAway: "away", competitionId: COMP, stadiumId: null,
      }).returning();
      log.push(`Inserted missing Murici 01/02 match (id=${m.id})`);
    } else {
      log.push(`Murici 01/02 already present (id=${muriciOnFeb1[0].id})`);
    }

    // Fix 4: Insert missing CEO 01/03 away loss (Semifinal 1º Turno) if not present
    const ceoApr1Away = ceoMatches.find(
      m => m.matchDate === "2015-03-01" && m.homeAway === "away"
    );
    const ceoFeb8Fixed = ceoMatches.find(m => m.id === wrongDateMatch?.id);
    if (!ceoApr1Away) {
      const [m] = await db.insert(matchesTable).values({
        matchDate: "2015-03-01", season: SEASON, opponentId: CEO_ID,
        goalsFor: 0, goalsAgainst: 1, result: "loss",
        homeAway: "away", competitionId: COMP, stadiumId: null,
      }).returning();
      log.push(`Inserted missing CEO 01/03 away loss (id=${m.id})`);
    } else {
      log.push(`CEO 01/03 away already present (id=${ceoApr1Away.id})`);
    }

    // Verify totals
    const [totals] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        wins:  sql<number>`cast(count(*) filter (where result='win') as int)`,
        draws: sql<number>`cast(count(*) filter (where result='draw') as int)`,
        losses:sql<number>`cast(count(*) filter (where result='loss') as int)`,
        gf:    sql<number>`cast(sum(goals_for) as int)`,
        gc:    sql<number>`cast(sum(goals_against) as int)`,
      })
      .from(matchesTable)
      .where(sql`season=${SEASON} AND competition_id=${COMP}`);

    res.json({ ok: true, log, totals });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/matches", requireAdmin, async (req, res) => {
  try {
    const { limit = "100", offset = "0" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 100, 500);
    const off = parseInt(offset) || 0;
    const rows = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        attendance: matchesTable.attendance,
        scorers: matchesTable.scorers,
        opponentId: matchesTable.opponentId,
        opponentName: opponentsTable.name,
        competitionId: matchesTable.competitionId,
        competitionName: competitionsTable.name,
        stadiumId: matchesTable.stadiumId,
        stadiumName: stadiumsTable.name,
        managerId: matchesTable.managerId,
        managerName: managersTable.name,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .leftJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
      .orderBy(desc(matchesTable.matchDate));
    const total = rows.length;
    res.json({ data: rows.slice(off, off + lim), total });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/matches", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      matchDate: string;
      season: string;
      opponentId: number;
      goalsFor: number;
      goalsAgainst: number;
      result: string;
      homeAway: string;
      competitionId: number;
      stadiumId?: number | null;
      managerId?: number | null;
      attendance?: number | null;
      scorers?: string | null;
    };
    const [match] = await db
      .insert(matchesTable)
      .values({
        matchDate: body.matchDate,
        season: body.season,
        opponentId: body.opponentId,
        goalsFor: body.goalsFor,
        goalsAgainst: body.goalsAgainst,
        result: body.result,
        homeAway: body.homeAway,
        competitionId: body.competitionId,
        stadiumId: body.stadiumId ?? null,
        managerId: body.managerId ?? null,
        attendance: body.attendance ?? null,
        scorers: body.scorers ?? null,
      })
      .returning();
    res.status(201).json(match);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/matches/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const body = req.body as {
      matchDate: string;
      season: string;
      opponentId: number;
      goalsFor: number;
      goalsAgainst: number;
      result: string;
      homeAway: string;
      competitionId: number;
      stadiumId?: number | null;
      managerId?: number | null;
      attendance?: number | null;
      scorers?: string | null;
      isWalkover?: boolean;
      isFriendly?: boolean;
      grossRevenue?: number | null;
      grossRevenueText?: string | null;
    };
    const [updated] = await db
      .update(matchesTable)
      .set({
        matchDate: body.matchDate,
        season: body.season,
        opponentId: body.opponentId,
        goalsFor: body.goalsFor,
        goalsAgainst: body.goalsAgainst,
        result: body.result,
        homeAway: body.homeAway,
        competitionId: body.competitionId,
        stadiumId: body.stadiumId ?? null,
        managerId: body.managerId ?? null,
        attendance: body.attendance ?? null,
        scorers: body.scorers ?? null,
        isWalkover: body.isWalkover ?? false,
        isFriendly: body.isFriendly ?? false,
        grossRevenue: body.grossRevenue ?? null,
        grossRevenueText: body.grossRevenueText ?? null,
      })
      .where(eq(matchesTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Partida não encontrada" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/matches/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    await db.delete(matchesTable).where(eq(matchesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Stadiums ──────────────────────────────────────────────────────────────────

router.post("/admin/stadiums", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body as { name: string };
    if (!name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const [stadium] = await db.insert(stadiumsTable).values({ name: name.trim() }).returning();
    res.status(201).json(stadium);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/stadiums/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { name } = req.body as { name: string };
    if (!name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const result = await pgPool.query(
      `UPDATE stadiums SET name=$1 WHERE id=$2 RETURNING *`,
      [name.trim(), id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Estádio não encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Merge multiple stadiums into one: move all match references, rename, delete duplicates
router.post("/admin/stadiums/merge", requireAdmin, async (req, res) => {
  try {
    const { keepId, mergeIds, newName } = req.body as {
      keepId: number;
      mergeIds: number[];
      newName?: string;
    };
    if (!keepId || !Array.isArray(mergeIds) || mergeIds.length === 0) {
      return res.status(400).json({ error: "keepId e mergeIds obrigatórios" });
    }
    let matchesMoved = 0;
    // Move all match references from mergeIds to keepId
    for (const oldId of mergeIds) {
      const r = await pgPool.query(
        `UPDATE matches SET stadium_id=$1 WHERE stadium_id=$2`,
        [keepId, oldId]
      );
      matchesMoved += r.rowCount ?? 0;
    }
    // Rename if requested
    if (newName?.trim()) {
      await pgPool.query(`UPDATE stadiums SET name=$1 WHERE id=$2`, [newName.trim(), keepId]);
    }
    // Delete merged stadiums
    await pgPool.query(
      `DELETE FROM stadiums WHERE id = ANY($1::int[])`,
      [mergeIds]
    );
    const kept = await pgPool.query(`SELECT * FROM stadiums WHERE id=$1`, [keepId]);
    res.json({ ok: true, matchesMoved, deletedIds: mergeIds, kept: kept.rows[0] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Bulk update matches by date+opponent — fix stadium_id, gross_revenue, gross_revenue_text
router.post("/admin/matches/bulk-patch", requireAdmin, async (req, res) => {
  try {
    const { patches } = req.body as {
      patches: {
        match_date: string;
        opponent_id: number;
        season: string;
        stadium_id?: number | null;
        gross_revenue?: number | null;
        gross_revenue_text?: string | null;
      }[];
    };
    if (!Array.isArray(patches)) return res.status(400).json({ error: "patches obrigatório" });
    let updated = 0; let notFound = 0;
    for (const p of patches) {
      const result = await pgPool.query(
        `UPDATE matches SET
           stadium_id        = COALESCE($1, stadium_id),
           gross_revenue     = COALESCE($2, gross_revenue),
           gross_revenue_text = COALESCE($3, gross_revenue_text)
         WHERE match_date = $4 AND opponent_id = $5 AND season = $6
         RETURNING id`,
        [
          p.stadium_id ?? null,
          p.gross_revenue ?? null,
          p.gross_revenue_text ?? null,
          p.match_date,
          p.opponent_id,
          p.season,
        ]
      );
      if (result.rowCount && result.rowCount > 0) updated += result.rowCount; else notFound++;
    }
    res.json({ updated, notFound });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Opponents ─────────────────────────────────────────────────────────────────

router.get("/admin/opponents", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(opponentsTable).orderBy(asc(opponentsTable.name));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/opponents", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body as { name: string };
    if (!name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const [opponent] = await db
      .insert(opponentsTable)
      .values({ name: name.trim() })
      .returning();
    res.status(201).json(opponent);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/opponents/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { name } = req.body as { name: string };
    if (!name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const [updated] = await db
      .update(opponentsTable)
      .set({ name: name.trim() })
      .where(eq(opponentsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Adversário não encontrado" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/opponents/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    await db.delete(opponentsTable).where(eq(opponentsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Managers ──────────────────────────────────────────────────────────────────

router.post("/admin/managers", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      name: string; nationality?: string;
      startYear?: number; endYear?: number; seasons?: string;
      storedGames?: number; storedWins?: number; storedDraws?: number;
      storedLosses?: number; storedGoalsFor?: number; storedGoalsAgainst?: number;
    };
    if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const [manager] = await db.insert(managersTable).values({
      name: body.name.trim(),
      nationality: body.nationality ?? "Brasileiro",
      startYear: body.startYear ?? null,
      endYear: body.endYear ?? null,
      seasons: body.seasons ?? null,
      storedGames: body.storedGames ?? null,
      storedWins: body.storedWins ?? null,
      storedDraws: body.storedDraws ?? null,
      storedLosses: body.storedLosses ?? null,
      storedGoalsFor: body.storedGoalsFor ?? null,
      storedGoalsAgainst: body.storedGoalsAgainst ?? null,
    }).returning();
    res.status(201).json(manager);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/managers/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const body = req.body as {
      name?: string; nationality?: string;
      startYear?: number | null; endYear?: number | null; seasons?: string | null;
      storedGames?: number | null; storedWins?: number | null; storedDraws?: number | null;
      storedLosses?: number | null; storedGoalsFor?: number | null; storedGoalsAgainst?: number | null;
    };
    const [updated] = await db.update(managersTable).set({
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.nationality !== undefined && { nationality: body.nationality }),
      ...(body.startYear !== undefined && { startYear: body.startYear }),
      ...(body.endYear !== undefined && { endYear: body.endYear }),
      ...(body.seasons !== undefined && { seasons: body.seasons }),
      ...(body.storedGames !== undefined && { storedGames: body.storedGames }),
      ...(body.storedWins !== undefined && { storedWins: body.storedWins }),
      ...(body.storedDraws !== undefined && { storedDraws: body.storedDraws }),
      ...(body.storedLosses !== undefined && { storedLosses: body.storedLosses }),
      ...(body.storedGoalsFor !== undefined && { storedGoalsFor: body.storedGoalsFor }),
      ...(body.storedGoalsAgainst !== undefined && { storedGoalsAgainst: body.storedGoalsAgainst }),
    }).where(eq(managersTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Técnico não encontrado" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── CSV Export ────────────────────────────────────────────────────────────────

router.get("/admin/export/players", requireAdmin, async (req, res) => {
  try {
    const players = await db.select().from(playersTable).orderBy(asc(playersTable.name));
    const csv = toCSV(["id", "name", "position", "nationality", "birth_year"], players as Record<string, unknown>[]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="jogadores.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/export/player-stats", requireAdmin, async (req, res) => {
  try {
    const stats = await db
      .select({
        player_id: playerSeasonStatsTable.playerId,
        player_name: playersTable.name,
        season: playerSeasonStatsTable.season,
        appearances: playerSeasonStatsTable.appearances,
        goals: playerSeasonStatsTable.goals,
        assists: playerSeasonStatsTable.assists,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .orderBy(asc(playersTable.name), asc(playerSeasonStatsTable.season));
    const csv = toCSV(["player_id", "player_name", "season", "appearances", "goals", "assists"], stats as Record<string, unknown>[]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="estatisticas_jogadores.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/export/matches", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: matchesTable.id,
        date: matchesTable.matchDate,
        season: matchesTable.season,
        opponent: opponentsTable.name,
        goals_for: matchesTable.goalsFor,
        goals_against: matchesTable.goalsAgainst,
        result: matchesTable.result,
        home_away: matchesTable.homeAway,
        competition: competitionsTable.name,
        stadium: stadiumsTable.name,
        manager: managersTable.name,
        scorers: matchesTable.scorers,
        attendance: matchesTable.attendance,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .leftJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
      .orderBy(asc(matchesTable.matchDate));
    const csv = toCSV(["id", "date", "season", "opponent", "goals_for", "goals_against", "result", "home_away", "competition", "stadium", "manager", "scorers", "attendance"], rows as Record<string, unknown>[]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="partidas.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/export/opponents", requireAdmin, async (req, res) => {
  try {
    const opponents = await db.select().from(opponentsTable).orderBy(asc(opponentsTable.name));
    const csv = toCSV(["id", "name"], opponents as Record<string, unknown>[]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="adversarios.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── CSV Import ────────────────────────────────────────────────────────────────

router.post("/admin/import/players", requireAdmin, async (req, res) => {
  try {
    const { csv } = req.body as { csv: string };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    const rows = parseCSV(csv);
    let created = 0;
    let skipped = 0;
    for (const row of rows) {
      if (!row.name?.trim()) { skipped++; continue; }
      await db.insert(playersTable).values({
        name: row.name.trim(),
        position: row.position || null,
        nationality: row.nationality || null,
        birthYear: row.birth_year ? parseInt(row.birth_year) : null,
      });
      created++;
    }
    res.json({ created, skipped });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/import/player-stats", requireAdmin, async (req, res) => {
  try {
    const { csv } = req.body as { csv: string };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    const rows = parseCSV(csv);
    let created = 0;
    let skipped = 0;
    for (const row of rows) {
      const playerId = parseInt(row.player_id);
      if (isNaN(playerId) || !row.season) { skipped++; continue; }
      await db.insert(playerSeasonStatsTable).values({
        playerId,
        season: row.season,
        appearances: parseInt(row.appearances) || 0,
        goals: parseInt(row.goals) || 0,
        assists: parseInt(row.assists) || 0,
      });
      created++;
    }
    res.json({ created, skipped });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/import/matches", requireAdmin, async (req, res) => {
  try {
    const { csv } = req.body as { csv: string };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    const rows = parseCSV(csv);
    let created = 0;
    let skipped = 0;

    const allOpponents = await db.select().from(opponentsTable);
    const allCompetitions = await db.select().from(competitionsTable);
    const allStadiums = await db.select().from(stadiumsTable);
    const allManagers = await db.select().from(managersTable);

    const opponentMap = new Map(allOpponents.map((o) => [o.name.toLowerCase(), o.id]));
    const competitionMap = new Map(allCompetitions.map((c) => [c.name.toLowerCase(), c.id]));
    const stadiumMap = new Map(allStadiums.map((s) => [s.name.toLowerCase(), s.id]));
    const managerMap = new Map(allManagers.map((m) => [m.name.toLowerCase(), m.id]));

    for (const row of rows) {
      if (!row.date || !row.opponent || !row.competition) { skipped++; continue; }

      let opponentId = opponentMap.get(row.opponent.toLowerCase());
      if (!opponentId) {
        const [newOpp] = await db.insert(opponentsTable).values({ name: row.opponent }).returning();
        opponentId = newOpp.id;
        opponentMap.set(row.opponent.toLowerCase(), opponentId);
      }

      let competitionId = competitionMap.get(row.competition.toLowerCase());
      if (!competitionId) {
        const [newComp] = await db.insert(competitionsTable).values({ name: row.competition }).returning();
        competitionId = newComp.id;
        competitionMap.set(row.competition.toLowerCase(), competitionId);
      }

      // Auto-create stadium if not found
      let stadiumId: number | null = null;
      if (row.stadium) {
        stadiumId = stadiumMap.get(row.stadium.toLowerCase()) ?? null;
        if (!stadiumId) {
          const [newStad] = await db.insert(stadiumsTable).values({ name: row.stadium }).returning();
          stadiumId = newStad.id;
          stadiumMap.set(row.stadium.toLowerCase(), stadiumId);
        }
      }
      const managerId = row.manager ? managerMap.get(row.manager.toLowerCase()) ?? null : null;

      const gf = parseInt(row.goals_for);
      const ga = parseInt(row.goals_against);
      const result = row.result || (gf > ga ? "win" : gf < ga ? "loss" : "draw");

      const grossRevenue = row.gross_revenue ? parseInt(row.gross_revenue) : null;
      const grossRevenueText = row.gross_revenue_text || null;

      await db.insert(matchesTable).values({
        matchDate: row.date,
        season: row.season || row.date.substring(0, 4),
        opponentId,
        goalsFor: gf || 0,
        goalsAgainst: ga || 0,
        result,
        homeAway: row.home_away || "home",
        competitionId,
        stadiumId,
        managerId,
        attendance: row.attendance ? parseInt(row.attendance) : null,
        scorers: row.scorers || null,
        grossRevenue: isNaN(grossRevenue as number) ? null : grossRevenue,
        grossRevenueText,
        isWalkover: row.is_walkover === "true",
        isFriendly: row.is_friendly === "true",
      });
      created++;
    }
    res.json({ created, skipped });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Competition management
router.post("/admin/competitions/merge", requireAdmin, async (req, res) => {
  try {
    const { keepId, removeId } = req.body as { keepId: number; removeId: number };
    if (!keepId || !removeId) return res.status(400).json({ error: "keepId e removeId obrigatórios" });
    await db.update(matchesTable).set({ competitionId: keepId }).where(eq(matchesTable.competitionId, removeId));
    await db.delete(competitionsTable).where(eq(competitionsTable.id, removeId));
    const [kept] = await db.select({ name: competitionsTable.name }).from(competitionsTable).where(eq(competitionsTable.id, keepId));
    res.json({ ok: true, kept: kept?.name, removedId: removeId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/competitions/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Only delete if no matches reference it
    const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(matchesTable).where(eq(matchesTable.competitionId, id));
    if (count > 0) return res.status(400).json({ error: `Competição possui ${count} partidas vinculadas` });
    await db.delete(competitionsTable).where(eq(competitionsTable.id, id));
    res.json({ ok: true, deletedId: id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/competitions/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, type } = req.body as { name?: string; type?: string };
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (!Object.keys(updates).length) return res.status(400).json({ error: "Nenhum campo para atualizar" });
    await db.update(competitionsTable).set(updates).where(eq(competitionsTable.id, id));
    const [updated] = await db.select().from(competitionsTable).where(eq(competitionsTable.id, id));
    res.json({ ok: true, competition: updated });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Merge two opponents: reassign all matches from removeId to keepId, then delete removeId
router.post("/admin/opponents/merge", requireAdmin, async (req, res) => {
  try {
    const { keepId, removeId } = req.body as { keepId: number; removeId: number };
    if (!keepId || !removeId) return res.status(400).json({ error: "keepId e removeId obrigatórios" });
    await db.update(matchesTable).set({ opponentId: keepId }).where(eq(matchesTable.opponentId, removeId));
    await db.delete(opponentsTable).where(eq(opponentsTable.id, removeId));
    const [kept] = await db.select({ name: opponentsTable.name }).from(opponentsTable).where(eq(opponentsTable.id, keepId));
    res.json({ ok: true, kept: kept?.name, removedId: removeId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Update a single season entry for a player (upsert)
router.put("/admin/players/:id/season-stats/:season", requireAdmin, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const season = req.params.season;
    const { appearances, goals, assists } = req.body as {
      appearances?: number; goals?: number; assists?: number;
    };
    if (!season) return res.status(400).json({ error: "season obrigatório" });
    const result = await pgPool.query(
      `UPDATE player_season_stats SET appearances=$1, goals=$2, assists=$3 WHERE player_id=$4 AND season=$5 RETURNING *`,
      [appearances ?? 0, goals ?? 0, assists ?? 0, playerId, season]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Entrada não encontrada para esse jogador/temporada" });
    }
    res.json({ ok: true, row: result.rows[0] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Replace all player_season_stats for a player with a single aggregate entry
router.put("/admin/players/:id/stats", requireAdmin, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const { season, appearances, goals, assists } = req.body as {
      season: string; appearances: number; goals: number; assists?: number;
    };
    if (!season) return res.status(400).json({ error: "season obrigatório" });
    await db.delete(playerSeasonStatsTable).where(eq(playerSeasonStatsTable.playerId, playerId));
    await db.insert(playerSeasonStatsTable).values({
      playerId,
      season,
      appearances: appearances ?? 0,
      goals: goals ?? 0,
      assists: assists ?? 0,
    });
    res.json({ ok: true, playerId, season, appearances: appearances ?? 0, goals: goals ?? 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/import/opponents", requireAdmin, async (req, res) => {
  try {
    const { csv } = req.body as { csv: string };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    const rows = parseCSV(csv);
    let created = 0;
    let skipped = 0;
    for (const row of rows) {
      if (!row.name?.trim()) { skipped++; continue; }
      try {
        await db.insert(opponentsTable).values({ name: row.name.trim() });
        created++;
      } catch {
        skipped++;
      }
    }
    res.json({ created, skipped });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Sync Apply ────────────────────────────────────────────────────────────────

router.post("/admin/sync/apply", requireAdmin, async (req, res) => {
  const {
    competitions_upsert = [],
    opponents_update = [],
    opponents_insert = [],
    managers_upsert = [],
    players_upsert = [],
    pss_upsert = [],
    matches_insert = [],
    static_opponent_map = {},
  } = req.body as {
    competitions_upsert: { id: number; name: string; type: string | null }[];
    opponents_update:    { id: number; name: string }[];
    opponents_insert:    { devId: number; name: string }[];
    managers_upsert:     Record<string, unknown>[];
    players_upsert:      { id: number; name: string; position?: string; nationality?: string }[];
    pss_upsert:          { player_id: number; season: string; goals: number; appearances: number; assists: number }[];
    matches_insert:      Record<string, unknown>[];
    static_opponent_map: Record<string, number>;
  };

  const client = await (pgPool as any).connect();
  const report: Record<string, unknown> = {};

  try {
    await client.query("BEGIN");

    // 1. Competitions upsert
    let compUpserted = 0;
    for (const c of competitions_upsert) {
      await client.query(
        `INSERT INTO competitions (id, name, type) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = COALESCE(EXCLUDED.type, competitions.type)`,
        [c.id, c.name, c.type ?? null]
      );
      compUpserted++;
    }
    report.competitions_upserted = compUpserted;

    // 2. Opponent name updates
    let oppUpdated = 0;
    for (const o of opponents_update) {
      await client.query(`UPDATE opponents SET name = $1 WHERE id = $2`, [o.name, o.id]);
      oppUpdated++;
    }
    report.opponents_updated = oppUpdated;

    // 3. Opponent inserts — collect new IDs for remapping
    const newOppMap: Record<number, number> = {};
    let oppInserted = 0;
    for (const o of opponents_insert) {
      const { rows } = await client.query(
        `INSERT INTO opponents (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [o.name]
      );
      newOppMap[o.devId] = rows[0].id;
      oppInserted++;
    }
    report.opponents_inserted = oppInserted;
    report.new_opponent_id_map = newOppMap;

    // Build full opponent remapping
    const oppRemap: Record<number, number> = {};
    for (const [devId, prodId] of Object.entries(static_opponent_map)) {
      oppRemap[Number(devId)] = Number(prodId);
    }
    Object.assign(oppRemap, newOppMap);

    // 4. Managers upsert
    let mgrUpserted = 0;
    for (const m of managers_upsert as any[]) {
      await client.query(
        `INSERT INTO managers (id, name, nationality, start_year, end_year, seasons,
           stored_games, stored_wins, stored_draws, stored_losses, stored_goals_for, stored_goals_against)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           nationality = EXCLUDED.nationality,
           start_year = EXCLUDED.start_year,
           end_year = EXCLUDED.end_year,
           seasons = EXCLUDED.seasons,
           stored_games = COALESCE(EXCLUDED.stored_games, managers.stored_games),
           stored_wins = COALESCE(EXCLUDED.stored_wins, managers.stored_wins),
           stored_draws = COALESCE(EXCLUDED.stored_draws, managers.stored_draws),
           stored_losses = COALESCE(EXCLUDED.stored_losses, managers.stored_losses),
           stored_goals_for = COALESCE(EXCLUDED.stored_goals_for, managers.stored_goals_for),
           stored_goals_against = COALESCE(EXCLUDED.stored_goals_against, managers.stored_goals_against)`,
        [m.id, m.name, m.nationality, m.start_year, m.end_year, m.seasons,
         m.stored_games, m.stored_wins, m.stored_draws, m.stored_losses,
         m.stored_goals_for, m.stored_goals_against]
      );
      mgrUpserted++;
    }
    report.managers_upserted = mgrUpserted;

    // 5. Players upsert
    let playersUpserted = 0;
    for (const p of players_upsert) {
      await client.query(
        `INSERT INTO players (id, name, position, nationality, birth_year)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, nationality = EXCLUDED.nationality`,
        [p.id, (p as any).name, (p as any).position, (p as any).nationality, (p as any).birth_year ?? null]
      );
      playersUpserted++;
    }
    report.players_upserted = playersUpserted;

    // 6. Player season stats insert (no unique constraint — check existence first)
    let pssInserted = 0, pssSkipped = 0;
    for (const s of pss_upsert) {
      const exists = await client.query(
        `SELECT 1 FROM player_season_stats WHERE player_id=$1 AND season=$2 LIMIT 1`,
        [s.player_id, s.season]
      );
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
           VALUES ($1, $2, $3, $4, $5)`,
          [s.player_id, s.season, s.appearances ?? 0, s.goals ?? 0, s.assists ?? 0]
        );
        pssInserted++;
      } else {
        pssSkipped++;
      }
    }
    report.pss_inserted = pssInserted;
    report.pss_skipped = pssSkipped;

    // 7. Matches insert — auto-increment ID, deduplicate by content
    let matchesInserted = 0, matchesSkipped = 0;
    for (const m of matches_insert as any[]) {
      const finalOppId = oppRemap[Number(m.opponent_id)] ?? Number(m.opponent_id);
      // Deduplicate: skip if same date/competition/opponent/home_away/season already exists
      const exists = await client.query(
        `SELECT 1 FROM matches WHERE match_date=$1 AND competition_id=$2 AND opponent_id=$3 AND home_away=$4 AND season=$5 LIMIT 1`,
        [m.match_date, m.competition_id, finalOppId, m.home_away, m.season]
      );
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO matches (match_date, season, competition_id, opponent_id,
             home_away, goals_for, goals_against, result, stadium_id, manager_id, attendance, scorers)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [m.match_date, m.season, m.competition_id, finalOppId,
           m.home_away, m.goals_for, m.goals_against, m.result,
           m.stadium_id ?? null, m.manager_id ?? null, m.attendance ?? null, m.scorers ?? null]
        );
        matchesInserted++;
      } else {
        matchesSkipped++;
      }
    }
    report.matches_inserted = matchesInserted;
    report.matches_skipped = matchesSkipped;

    // Reset sequences to max ID + 1 to avoid future conflicts
    for (const tbl of ['competitions','opponents','managers','players','player_season_stats','matches']) {
      await client.query(`SELECT setval(pg_get_serial_sequence('${tbl}', 'id'), COALESCE(MAX(id), 1)) FROM ${tbl}`);
    }
    report.sequences_reset = true;

    await client.query("COMMIT");
    report.success = true;
    res.json(report);
  } catch (err: any) {
    await client.query("ROLLBACK");
    req.log.error(err);
    res.status(500).json({ error: err.message, report });
  } finally {
    client.release();
  }
});

// ── Full matches table replacement (DEV → PROD) ───────────────────────────────
//
// POST /admin/sync/full-matches-replace
//
// Body:
//   opponents_to_create  [{name}]          — new opponents to INSERT before replace
//   managers_to_create   [{name}]          — upsert all managers by name
//   matches              [{...devMatch}]   — all 1051 rows from DEV with DEV FK IDs
//   opp_id_map           {devId: prodId}   — remap opponent_id
//   comp_id_map          {devId: prodId}   — remap competition_id
//   man_id_map           {devId: prodId}   — remap manager_id (unmapped → null)
//   stad_id_map          {devId: prodId}   — remap stadium_id (unmapped → null)
//   dry_run?             boolean           — if true, run all checks but ROLLBACK at the end

router.post("/admin/sync/full-matches-replace", requireAdmin, async (req, res) => {
  const {
    opponents_to_create = [],
    managers_to_create  = [],
    matches             = [],
    opp_id_map          = {},
    comp_id_map         = {},
    man_id_map          = {},
    stad_id_map         = {},
    dry_run             = false,
  } = req.body as {
    opponents_to_create?: { name: string }[];
    managers_to_create?:  { name: string }[];
    matches?:             any[];
    opp_id_map?:          Record<string, number>;
    comp_id_map?:         Record<string, number>;
    man_id_map?:          Record<string, number>;
    stad_id_map?:         Record<string, number>;
    dry_run?:             boolean;
  };

  const report: Record<string, any> = { dry_run };
  const client = await pgPool.connect();

  try {
    await client.query("BEGIN");

    // 1. Backup current matches table
    const ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const backupTable = `matches_backup_${ts}`;
    await client.query(`CREATE TABLE ${backupTable} AS SELECT * FROM matches`);
    const backupCount = await client.query(`SELECT count(*) FROM ${backupTable}`);
    report.backup_table   = backupTable;
    report.backup_rows    = parseInt(backupCount.rows[0].count, 10);

    // 2. Create missing opponents (by name — skip if already exists)
    let opponentsCreated = 0;
    const newOppIdByName: Record<string, number> = {};
    for (const o of opponents_to_create) {
      const existing = await client.query(
        `SELECT id FROM opponents WHERE lower(name) = lower($1) LIMIT 1`,
        [o.name]
      );
      if (existing.rows.length > 0) {
        newOppIdByName[o.name.toLowerCase()] = existing.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO opponents (name) VALUES ($1) RETURNING id`,
          [o.name]
        );
        newOppIdByName[o.name.toLowerCase()] = ins.rows[0].id;
        opponentsCreated++;
      }
    }
    report.opponents_created = opponentsCreated;

    // Build final opponent map: opp_id_map covers existing, newOppIdByName covers created.
    // opponents_to_create must include dev_id so we can complete the map for new entries.
    const finalOppMap: Record<number, number> = {};
    for (const [devId, prodId] of Object.entries(opp_id_map)) {
      finalOppMap[Number(devId)] = Number(prodId);
    }
    // Patch with newly created opponents (dev_id required in each entry)
    for (const o of opponents_to_create) {
      if ((o as any).dev_id && newOppIdByName[(o.name as string).toLowerCase()] !== undefined) {
        finalOppMap[Number((o as any).dev_id)] = newOppIdByName[(o.name as string).toLowerCase()];
      }
    }

    // 3. Upsert all managers by name (INSERT … ON CONFLICT DO NOTHING)
    let managersCreated = 0;
    const prodManIdByName: Record<string, number> = {};
    for (const m of managers_to_create) {
      const existing = await client.query(
        `SELECT id FROM managers WHERE lower(name) = lower($1) LIMIT 1`,
        [m.name]
      );
      if (existing.rows.length > 0) {
        prodManIdByName[m.name.toLowerCase()] = existing.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO managers (name) VALUES ($1) RETURNING id`,
          [m.name]
        );
        prodManIdByName[m.name.toLowerCase()] = ins.rows[0].id;
        managersCreated++;
      }
    }
    report.managers_created = managersCreated;

    // 4. Truncate matches
    await client.query("TRUNCATE TABLE matches RESTART IDENTITY CASCADE");
    report.truncated = true;

    // 5. Insert all DEV matches with remapped FK ids
    let inserted = 0;
    const unmappedOpps = new Set<number>();
    const unmappedComps = new Set<number>();

    for (const m of matches) {
      const devOppId  = Number(m.opponent_id);
      const devCompId = Number(m.competition_id);
      const devManId  = m.manager_id ? Number(m.manager_id) : null;
      const devStadId = m.stadium_id ? Number(m.stadium_id) : null;

      const prodOppId  = finalOppMap[devOppId];
      const prodCompId = Number(comp_id_map[devCompId] ?? devCompId);
      const prodStadId = devStadId !== null ? (Number(stad_id_map[devStadId] ?? devStadId) || null) : null;

      // Manager: use explicit map first, then fallback to name-based lookup
      let prodManId: number | null = null;
      if (devManId !== null) {
        if (man_id_map[devManId] !== undefined) {
          prodManId = Number(man_id_map[devManId]);
        } else {
          // Try name-based lookup from the upserted managers
          const manRes = await client.query(
            `SELECT id FROM managers WHERE id = $1 LIMIT 1`,
            [devManId]
          );
          if (manRes.rows.length > 0) prodManId = manRes.rows[0].id;
        }
      }

      if (prodOppId === undefined) {
        unmappedOpps.add(devOppId);
        continue; // skip — FK would fail
      }
      if (!prodCompId) {
        unmappedComps.add(devCompId);
        continue;
      }

      await client.query(
        `INSERT INTO matches
           (match_date, season, competition_id, opponent_id,
            home_away, goals_for, goals_against, result,
            stadium_id, manager_id, attendance, scorers)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          m.match_date, m.season, prodCompId, prodOppId,
          m.home_away, m.goals_for, m.goals_against, m.result,
          prodStadId, prodManId, m.attendance ?? null, m.scorers ?? null,
        ]
      );
      inserted++;
    }

    report.matches_inserted = inserted;
    report.unmapped_opp_ids  = [...unmappedOpps];
    report.unmapped_comp_ids = [...unmappedComps];

    // 6. Reset sequence
    await client.query(
      `SELECT setval(pg_get_serial_sequence('matches', 'id'), COALESCE(MAX(id), 1)) FROM matches`
    );
    report.sequence_reset = true;

    // 7. Final count validation
    const finalCount = await client.query(`SELECT count(*) FROM matches`);
    report.final_count = parseInt(finalCount.rows[0].count, 10);
    report.success = unmappedOpps.size === 0 && unmappedComps.size === 0 && inserted === matches.length;

    if (dry_run) {
      await client.query("ROLLBACK");
      report.rolled_back = true;
    } else {
      await client.query("COMMIT");
    }

    res.json(report);
  } catch (err: any) {
    await client.query("ROLLBACK");
    req.log?.error?.(err);
    res.status(500).json({ error: err.message, report });
  } finally {
    client.release();
  }
});

export default router;
