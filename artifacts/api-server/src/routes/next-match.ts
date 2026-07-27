import { Router, type IRouter } from "express";
import { db, nextMatchTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const SINGLETON_ID = 1;

function serialize(row: typeof nextMatchTable.$inferSelect) {
  return {
    opponent: row.opponent,
    matchDate: row.matchDate,
    competition: row.competition,
    homeAway: row.homeAway,
    stadium: row.stadium,
  };
}

/** Public: featured next match for the Home card (null if unset). */
router.get("/next-match", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(nextMatchTable)
      .where(eq(nextMatchTable.id, SINGLETON_ID))
      .limit(1);
    res.json(row ? serialize(row) : null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
