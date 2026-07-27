import { Router, type IRouter } from "express";
import { db, nextMatchTable, opponentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const SINGLETON_ID = 1;

/** Public: featured next match for the Home card (null if unset). */
router.get("/next-match", async (req, res) => {
  try {
    const [row] = await db
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
      .where(eq(nextMatchTable.id, SINGLETON_ID))
      .limit(1);

    if (!row) {
      res.json(null);
      return;
    }

    res.json({
      opponent: row.opponent,
      matchDate: row.matchDate,
      competition: row.competition,
      homeAway: row.homeAway,
      stadium: row.stadium,
      opponentId: row.opponentId ?? null,
      matchId: row.matchId ?? null,
      opponentLogoUrl: row.opponentLogoUrl ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
