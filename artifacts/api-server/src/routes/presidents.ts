import { Router } from "express";
import { db } from "@workspace/db";
import { presidentsTable } from "@workspace/db";
import { asc, eq, sql } from "drizzle-orm";

const router = Router();

/** Public presidents list — chronological (oldest first; null start last). */
router.get("/presidents", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(presidentsTable)
      .orderBy(
        sql`${presidentsTable.termStart} ASC NULLS LAST`,
        asc(presidentsTable.name),
      );

    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        photoUrl: r.photoUrl ?? null,
        termStart: r.termStart ?? null,
        termEnd: r.termEnd ?? null,
        notes: r.notes ?? null,
      })),
    );
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
      .select()
      .from(presidentsTable)
      .where(eq(presidentsTable.id, id));
    if (!row) return res.status(404).json({ error: "Presidente não encontrado" });
    res.json({
      id: row.id,
      name: row.name,
      photoUrl: row.photoUrl ?? null,
      termStart: row.termStart ?? null,
      termEnd: row.termEnd ?? null,
      notes: row.notes ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
