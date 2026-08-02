import { Router } from "express";
import { db } from "@workspace/db";
import { transfersTable, playersTable } from "@workspace/db";
import { asc, desc, eq, and } from "drizzle-orm";

const router = Router();

export type PublicTransfer = {
  id: number;
  playerId: number;
  playerName: string;
  playerPhotoUrl: string | null;
  direction: "in" | "out";
  club: string | null;
  transferDate: string | null;
  season: string;
  transferType: string | null;
  notes: string | null;
};

function mapRow(r: {
  id: number;
  playerId: number;
  playerName: string;
  playerPhotoUrl: string | null;
  direction: string;
  club: string | null;
  transferDate: string | null;
  season: string;
  transferType: string | null;
  notes: string | null;
}): PublicTransfer {
  return {
    id: r.id,
    playerId: r.playerId,
    playerName: r.playerName,
    playerPhotoUrl: r.playerPhotoUrl,
    direction: r.direction === "out" ? "out" : "in",
    club: r.club,
    transferDate: r.transferDate,
    season: r.season,
    transferType: r.transferType,
    notes: r.notes,
  };
}

/** List transfers, optionally filtered by season / direction. */
router.get("/transfers", async (req, res) => {
  try {
    const season =
      typeof req.query.season === "string" && req.query.season.trim()
        ? req.query.season.trim()
        : null;
    const directionRaw =
      typeof req.query.direction === "string" ? req.query.direction.trim() : "";
    const direction =
      directionRaw === "in" || directionRaw === "out" ? directionRaw : null;

    const conditions = [];
    if (season) conditions.push(eq(transfersTable.season, season));
    if (direction) conditions.push(eq(transfersTable.direction, direction));

    const rows = await db
      .select({
        id: transfersTable.id,
        playerId: transfersTable.playerId,
        playerName: playersTable.name,
        playerPhotoUrl: playersTable.photoUrl,
        direction: transfersTable.direction,
        club: transfersTable.club,
        transferDate: transfersTable.transferDate,
        season: transfersTable.season,
        transferType: transfersTable.transferType,
        notes: transfersTable.notes,
      })
      .from(transfersTable)
      .innerJoin(playersTable, eq(transfersTable.playerId, playersTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(
        desc(transfersTable.season),
        desc(transfersTable.transferDate),
        asc(playersTable.name),
      );

    const seasons = await db
      .selectDistinct({ season: transfersTable.season })
      .from(transfersTable)
      .orderBy(desc(transfersTable.season));

    res.json({
      transfers: rows.map(mapRow),
      seasons: seasons.map((s) => s.season),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/transfers/by-player/:playerId", async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId, 10);
    if (isNaN(playerId)) return res.status(400).json({ error: "ID inválido" });

    const rows = await db
      .select({
        id: transfersTable.id,
        playerId: transfersTable.playerId,
        playerName: playersTable.name,
        playerPhotoUrl: playersTable.photoUrl,
        direction: transfersTable.direction,
        club: transfersTable.club,
        transferDate: transfersTable.transferDate,
        season: transfersTable.season,
        transferType: transfersTable.transferType,
        notes: transfersTable.notes,
      })
      .from(transfersTable)
      .innerJoin(playersTable, eq(transfersTable.playerId, playersTable.id))
      .where(eq(transfersTable.playerId, playerId))
      .orderBy(desc(transfersTable.season), desc(transfersTable.transferDate));

    res.json(rows.map(mapRow));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
