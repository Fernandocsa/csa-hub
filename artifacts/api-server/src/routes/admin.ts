import { Router } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
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

      const stadiumId = row.stadium ? stadiumMap.get(row.stadium.toLowerCase()) ?? null : null;
      const managerId = row.manager ? managerMap.get(row.manager.toLowerCase()) ?? null : null;

      const gf = parseInt(row.goals_for);
      const ga = parseInt(row.goals_against);
      const result = row.result || (gf > ga ? "win" : gf < ga ? "loss" : "draw");

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
      });
      created++;
    }
    res.json({ created, skipped });
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

export default router;
