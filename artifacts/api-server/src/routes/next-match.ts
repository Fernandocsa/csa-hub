import { Router, type IRouter } from "express";
import {
  db,
  matchesTable,
  opponentsTable,
  competitionsTable,
  stadiumsTable,
  nextMatchTable,
} from "@workspace/db";
import { and, asc, eq, gte } from "drizzle-orm";
import { scheduledMatchConditions } from "../lib/match-filters";

const router: IRouter = Router();

/**
 * Public: next upcoming scheduled match for the Home card (null if none).
 * Prefer matches.status='scheduled'; fall back to legacy next_match singleton
 * during deploy overlap.
 */
router.get("/next-match", async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const [row] = await db
      .select({
        matchId: matchesTable.id,
        matchDate: matchesTable.matchDate,
        homeAway: matchesTable.homeAway,
        opponentId: matchesTable.opponentId,
        opponent: opponentsTable.name,
        opponentLogoUrl: opponentsTable.logoUrl,
        competition: competitionsTable.name,
        stadium: stadiumsTable.name,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(
        and(
          scheduledMatchConditions(),
          gte(matchesTable.matchDate, todayStr),
        ),
      )
      .orderBy(asc(matchesTable.matchDate), asc(matchesTable.id))
      .limit(1);

    if (row) {
      res.json({
        opponent: row.opponent,
        matchDate: row.matchDate,
        competition: row.competition,
        homeAway: row.homeAway,
        stadium: row.stadium ?? null,
        opponentId: row.opponentId,
        matchId: row.matchId,
        opponentLogoUrl: row.opponentLogoUrl ?? null,
      });
      return;
    }

    // Legacy fallback (singleton) — remove after deploy settles
    const [legacy] = await db
      .select({
        opponent: nextMatchTable.opponent,
        matchDate: nextMatchTable.matchDate,
        competition: nextMatchTable.competition,
        homeAway: nextMatchTable.homeAway,
        stadium: nextMatchTable.stadium,
        opponentId: nextMatchTable.opponentId,
        matchId: nextMatchTable.matchId,
        opponentLogoUrl: opponentsTable.logoUrl,
      })
      .from(nextMatchTable)
      .leftJoin(opponentsTable, eq(nextMatchTable.opponentId, opponentsTable.id))
      .where(eq(nextMatchTable.id, 1))
      .limit(1);

    if (!legacy) {
      res.json(null);
      return;
    }

    res.json({
      opponent: legacy.opponent,
      matchDate: legacy.matchDate,
      competition: legacy.competition,
      homeAway: legacy.homeAway,
      stadium: legacy.stadium ?? null,
      opponentId: legacy.opponentId ?? null,
      matchId: legacy.matchId ?? null,
      opponentLogoUrl: legacy.opponentLogoUrl ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
