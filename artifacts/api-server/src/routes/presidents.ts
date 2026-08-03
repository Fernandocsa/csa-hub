import { Router } from "express";
import { db } from "@workspace/db";
import { presidentsTable, playersTable, managersTable } from "@workspace/db";
import { asc, eq, sql } from "drizzle-orm";

const router = Router();

function mapPresident(r: {
  id: number;
  name: string;
  photoUrl: string | null;
  termStart: string | null;
  termEnd: string | null;
  notes: string | null;
  linkedPlayerId: number | null;
  linkedManagerId: number | null;
  linkedPlayerName: string | null;
  linkedPlayerPhotoUrl: string | null;
  linkedManagerName: string | null;
}) {
  return {
    id: r.id,
    name: r.name,
    photoUrl: r.photoUrl ?? r.linkedPlayerPhotoUrl ?? null,
    termStart: r.termStart ?? null,
    termEnd: r.termEnd ?? null,
    notes: r.notes ?? null,
    linkedPlayerId: r.linkedPlayerId ?? null,
    linkedPlayerName: r.linkedPlayerName ?? null,
    linkedManagerId: r.linkedManagerId ?? null,
    linkedManagerName: r.linkedManagerName ?? null,
  };
}

const selectFields = {
  id: presidentsTable.id,
  name: presidentsTable.name,
  photoUrl: presidentsTable.photoUrl,
  termStart: presidentsTable.termStart,
  termEnd: presidentsTable.termEnd,
  notes: presidentsTable.notes,
  linkedPlayerId: presidentsTable.linkedPlayerId,
  linkedManagerId: presidentsTable.linkedManagerId,
  linkedPlayerName: playersTable.name,
  linkedPlayerPhotoUrl: playersTable.photoUrl,
  linkedManagerName: managersTable.name,
};

/** Public presidents list — chronological (oldest first; null start last). */
router.get("/presidents", async (req, res) => {
  try {
    const rows = await db
      .select(selectFields)
      .from(presidentsTable)
      .leftJoin(
        playersTable,
        eq(presidentsTable.linkedPlayerId, playersTable.id),
      )
      .leftJoin(
        managersTable,
        eq(presidentsTable.linkedManagerId, managersTable.id),
      )
      .orderBy(
        sql`${presidentsTable.termStart} ASC NULLS LAST`,
        asc(presidentsTable.name),
      );

    res.json(rows.map(mapPresident));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/presidents/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [row] = await db
      .select(selectFields)
      .from(presidentsTable)
      .leftJoin(
        playersTable,
        eq(presidentsTable.linkedPlayerId, playersTable.id),
      )
      .leftJoin(
        managersTable,
        eq(presidentsTable.linkedManagerId, managersTable.id),
      )
      .where(eq(presidentsTable.id, id));
    if (!row) return res.status(404).json({ error: "Presidente não encontrado" });
    res.json(mapPresident(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
