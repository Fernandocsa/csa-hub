import { Router } from "express";
import { db } from "@workspace/db";
import {
  commentsTable,
  playersTable,
  managersTable,
  matchesTable,
} from "@workspace/db";
import { and, count, desc, eq } from "drizzle-orm";
import {
  isRatingEntityType,
  type RatingEntityType,
} from "../lib/rating-labels";

const router = Router();

const AUTHOR_NAME_MAX = 80;
const BODY_MAX = 2000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

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

function parseLimitOffset(query: { limit?: unknown; offset?: unknown }) {
  const limitRaw = parseInt(String(query.limit ?? DEFAULT_LIMIT), 10);
  const offsetRaw = parseInt(String(query.offset ?? 0), 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  return { limit, offset };
}

function normalizeAuthorName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name || name.length > AUTHOR_NAME_MAX) return null;
  return name;
}

function normalizeBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const body = raw.trim();
  if (!body || body.length > BODY_MAX) return null;
  return body;
}

function serializeComment(row: {
  id: number;
  entityType: string;
  entityId: number;
  authorName: string;
  body: string;
  createdAt: Date | string;
}) {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    authorName: row.authorName,
    body: row.body,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

router.get("/comments/:entityType/:entityId", async (req, res) => {
  try {
    const parsed = parseEntityParams(req);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

    const { entityType, entityId } = parsed;
    if (!(await entityExists(entityType, entityId))) {
      return res.status(404).json({ error: "Entidade não encontrada" });
    }

    const { limit, offset } = parseLimitOffset(req.query);
    const where = and(
      eq(commentsTable.entityType, entityType),
      eq(commentsTable.entityId, entityId),
    );

    const [totalRow] = await db
      .select({ total: count() })
      .from(commentsTable)
      .where(where);

    const rows = await db
      .select({
        id: commentsTable.id,
        entityType: commentsTable.entityType,
        entityId: commentsTable.entityId,
        authorName: commentsTable.authorName,
        body: commentsTable.body,
        createdAt: commentsTable.createdAt,
      })
      .from(commentsTable)
      .where(where)
      .orderBy(desc(commentsTable.createdAt), desc(commentsTable.id))
      .limit(limit)
      .offset(offset);

    res.json({
      data: rows.map(serializeComment),
      total: Number(totalRow?.total ?? 0),
      limit,
      offset,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/comments/:entityType/:entityId", async (req, res) => {
  try {
    const parsed = parseEntityParams(req);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

    const { entityType, entityId } = parsed;
    if (!(await entityExists(entityType, entityId))) {
      return res.status(404).json({ error: "Entidade não encontrada" });
    }

    const body = req.body as { authorName?: unknown; body?: unknown };
    const authorName = normalizeAuthorName(body.authorName);
    if (!authorName) {
      return res.status(400).json({
        error: `authorName obrigatório (1–${AUTHOR_NAME_MAX} caracteres)`,
      });
    }
    const text = normalizeBody(body.body);
    if (!text) {
      return res.status(400).json({
        error: `body obrigatório (1–${BODY_MAX} caracteres)`,
      });
    }

    const [inserted] = await db
      .insert(commentsTable)
      .values({
        entityType,
        entityId,
        authorName,
        body: text,
      })
      .returning({
        id: commentsTable.id,
        entityType: commentsTable.entityType,
        entityId: commentsTable.entityId,
        authorName: commentsTable.authorName,
        body: commentsTable.body,
        createdAt: commentsTable.createdAt,
      });

    res.status(201).json(serializeComment(inserted));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
