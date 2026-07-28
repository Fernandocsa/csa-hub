import { Router } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import { aiImportSessionsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  loadEntityCatalog,
  catalogNamesForPrompt,
} from "../lib/ai-import/resolve";
import { extractSeasonMatchesWithClaude } from "../lib/ai-import/claude-season";
import { buildSeasonPreview, refreshUnresolved } from "../lib/ai-import/build-preview";
import { commitSeasonPreview } from "../lib/ai-import/commit";
import type { SeasonPreview } from "../lib/ai-import/types";

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
  if (auth.slice(7) !== getAdminToken()) {
    return res.status(401).json({ error: "Token inválido" });
  }
  next();
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2h

router.post("/admin/ai-import/season/parse", requireAdmin, async (req, res) => {
  try {
    const { seasonYear, text } = req.body as { seasonYear?: number; text?: string };
    const year = Number(seasonYear);
    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "seasonYear inválido" });
    }
    if (!text?.trim() || text.trim().length < 40) {
      return res.status(400).json({ error: "Cole o texto da temporada (mín. ~40 caracteres)" });
    }

    const cat = await loadEntityCatalog();
    const extracted = await extractSeasonMatchesWithClaude({
      seasonYear: year,
      text: text.trim(),
      catalog: catalogNamesForPrompt(cat),
    });

    if (!extracted.games.length) {
      return res.status(422).json({
        error: "Nenhuma partida extraída do texto",
        usage: extracted.usage,
      });
    }

    const preview = await buildSeasonPreview(year, extracted.games, cat);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const [session] = await db
      .insert(aiImportSessionsTable)
      .values({
        kind: "season_matches",
        seasonYear: year,
        sourceText: text.trim().slice(0, 500_000),
        preview,
        usage: extracted.usage,
        status: "preview",
        expiresAt,
      })
      .returning({ id: aiImportSessionsTable.id });

    res.json({
      sessionId: session.id,
      preview,
      usage: extracted.usage,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    req.log?.error?.(err);
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = message.includes("ANTHROPIC_API_KEY") ? 503 : 500;
    res.status(status).json({ error: message });
  }
});

router.get("/admin/ai-import/season/:sessionId", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.sessionId, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [row] = await db
      .select()
      .from(aiImportSessionsTable)
      .where(
        and(
          eq(aiImportSessionsTable.id, id),
          eq(aiImportSessionsTable.status, "preview"),
          gt(aiImportSessionsTable.expiresAt, new Date()),
        ),
      );
    if (!row) return res.status(404).json({ error: "Sessão não encontrada ou expirada" });
    res.json({
      sessionId: row.id,
      preview: row.preview,
      usage: row.usage,
      expiresAt: row.expiresAt,
    });
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/ai-import/season/:sessionId", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.sessionId, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { preview: incoming } = req.body as { preview?: SeasonPreview };
    if (!incoming?.games) return res.status(400).json({ error: "preview obrigatório" });

    const [row] = await db
      .select()
      .from(aiImportSessionsTable)
      .where(
        and(
          eq(aiImportSessionsTable.id, id),
          eq(aiImportSessionsTable.status, "preview"),
          gt(aiImportSessionsTable.expiresAt, new Date()),
        ),
      );
    if (!row) return res.status(404).json({ error: "Sessão não encontrada ou expirada" });

    const preview = refreshUnresolved(incoming);
    await db
      .update(aiImportSessionsTable)
      .set({ preview })
      .where(eq(aiImportSessionsTable.id, id));

    res.json({ sessionId: id, preview });
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/ai-import/season/:sessionId/commit", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.sessionId, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [row] = await db
      .select()
      .from(aiImportSessionsTable)
      .where(
        and(
          eq(aiImportSessionsTable.id, id),
          eq(aiImportSessionsTable.status, "preview"),
          gt(aiImportSessionsTable.expiresAt, new Date()),
        ),
      );
    if (!row) return res.status(404).json({ error: "Sessão não encontrada ou expirada" });

    // Prefer body preview (latest UI state); fall back to stored
    const bodyPreview = (req.body as { preview?: SeasonPreview })?.preview;
    const preview = refreshUnresolved(
      (bodyPreview?.games ? bodyPreview : (row.preview as SeasonPreview)) as SeasonPreview,
    );

    if (preview.summary.unresolved > 0) {
      return res.status(400).json({
        error: `Ainda há ${preview.summary.unresolved} ambiguidade(s) para resolver`,
        preview,
      });
    }

    const result = await commitSeasonPreview(preview);
    await db
      .update(aiImportSessionsTable)
      .set({ status: "committed", preview })
      .where(eq(aiImportSessionsTable.id, id));

    res.json({ ok: true, ...result });
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Erro interno",
    });
  }
});

export default router;
