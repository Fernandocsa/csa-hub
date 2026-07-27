import { Router } from "express";
import { db } from "@workspace/db";
import {
  suggestionsTable,
  playersTable,
  managersTable,
  matchesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  isRatingEntityType,
  type RatingEntityType,
} from "../lib/rating-labels";

const router = Router();

const AUTHOR_NAME_MAX = 80;
const MESSAGE_MAX = 4000;
const CONTACT_MAX = 200;

async function entityExists(
  entityType: RatingEntityType,
  entityId: number,
): Promise<boolean> {
  if (entityType === "player") {
    const [row] = await db
      .select({ id: playersTable.id })
      .from(playersTable)
      .where(eq(playersTable.id, entityId))
      .limit(1);
    return !!row;
  }
  if (entityType === "manager") {
    const [row] = await db
      .select({ id: managersTable.id })
      .from(managersTable)
      .where(eq(managersTable.id, entityId))
      .limit(1);
    return !!row;
  }
  const [row] = await db
    .select({ id: matchesTable.id })
    .from(matchesTable)
    .where(eq(matchesTable.id, entityId))
    .limit(1);
  return !!row;
}

function parseEntityParams(req: {
  params: { entityType?: string; entityId?: string };
}):
  | { ok: true; entityType: RatingEntityType; entityId: number }
  | { ok: false; status: number; error: string } {
  const rawType = (req.params.entityType ?? "").toLowerCase();
  if (!isRatingEntityType(rawType)) {
    return {
      ok: false,
      status: 400,
      error: "entityType inválido (player | manager | match)",
    };
  }
  const entityId = parseInt(req.params.entityId ?? "", 10);
  if (!Number.isFinite(entityId) || entityId < 1) {
    return { ok: false, status: 400, error: "entityId inválido" };
  }
  return { ok: true, entityType: rawType, entityId };
}

function normalizeAuthorName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name || name.length > AUTHOR_NAME_MAX) return null;
  return name;
}

function normalizeMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const message = raw.trim();
  if (!message || message.length > MESSAGE_MAX) return null;
  return message;
}

function normalizeContact(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return null;
  const contact = raw.trim();
  if (!contact) return null;
  if (contact.length > CONTACT_MAX) return null;
  return contact;
}

/** Public submit only — no public list. */
router.post("/suggestions/:entityType/:entityId", async (req, res) => {
  try {
    const parsed = parseEntityParams(req);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

    const { entityType, entityId } = parsed;
    if (!(await entityExists(entityType, entityId))) {
      return res.status(404).json({ error: "Entidade não encontrada" });
    }

    const body = req.body as {
      authorName?: unknown;
      message?: unknown;
      contact?: unknown;
    };
    const authorName = normalizeAuthorName(body.authorName);
    if (!authorName) {
      return res.status(400).json({
        error: `authorName obrigatório (1–${AUTHOR_NAME_MAX} caracteres)`,
      });
    }
    const message = normalizeMessage(body.message);
    if (!message) {
      return res.status(400).json({
        error: `message obrigatório (1–${MESSAGE_MAX} caracteres)`,
      });
    }
    const contact = normalizeContact(body.contact);
    if (body.contact != null && body.contact !== "" && contact == null) {
      return res.status(400).json({
        error: `contact inválido (até ${CONTACT_MAX} caracteres)`,
      });
    }

    const [inserted] = await db
      .insert(suggestionsTable)
      .values({
        entityType,
        entityId,
        authorName,
        message,
        contact,
        status: "new",
      })
      .returning({
        id: suggestionsTable.id,
        status: suggestionsTable.status,
        createdAt: suggestionsTable.createdAt,
      });

    res.status(201).json({
      id: inserted.id,
      status: inserted.status,
      createdAt:
        inserted.createdAt instanceof Date
          ? inserted.createdAt.toISOString()
          : String(inserted.createdAt),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
