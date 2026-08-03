import { Router } from "express";
import { db, siteContentTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function serialize(row: typeof siteContentTable.$inferSelect) {
  return {
    key: row.key,
    content: row.content,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  };
}

/** Public: fetch one content block by key. */
router.get("/site-content/:key", async (req, res) => {
  try {
    const key = String(req.params.key ?? "").trim();
    if (!key || key.length > 80) {
      return res.status(400).json({ error: "key inválida" });
    }
    const [row] = await db
      .select()
      .from(siteContentTable)
      .where(eq(siteContentTable.key, key))
      .limit(1);
    if (!row) return res.status(404).json({ error: "Conteúdo não encontrado" });
    res.json(serialize(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
