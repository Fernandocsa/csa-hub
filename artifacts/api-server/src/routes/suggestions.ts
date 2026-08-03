import { Router } from "express";
import { db } from "@workspace/db";
import {
  suggestionsTable,
  playersTable,
  managersTable,
  matchesTable,
  opponentsTable,
  stadiumsTable,
  refereesTable,
  seasonsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  isSuggestionEntityType,
  suggestionRequiresEntityId,
  type SuggestionEntityType,
} from "../lib/suggestion-entity";

const router = Router();

const AUTHOR_NAME_MAX = 80;
const MESSAGE_MAX = 4000;
const CONTACT_MAX = 200;

async function entityExists(
  entityType: SuggestionEntityType,
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
  if (entityType === "match") {
    const [row] = await db
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.id, entityId))
      .limit(1);
    return !!row;
  }
  if (entityType === "opponent") {
    const [row] = await db
      .select({ id: opponentsTable.id })
      .from(opponentsTable)
      .where(eq(opponentsTable.id, entityId))
      .limit(1);
    return !!row;
  }
  if (entityType === "stadium") {
    const [row] = await db
      .select({ id: stadiumsTable.id })
      .from(stadiumsTable)
      .where(eq(stadiumsTable.id, entityId))
      .limit(1);
    return !!row;
  }
  if (entityType === "referee") {
    const [row] = await db
      .select({ id: refereesTable.id })
      .from(refereesTable)
      .where(eq(refereesTable.id, entityId))
      .limit(1);
    return !!row;
  }
  if (entityType === "season") {
    const [row] = await db
      .select({ year: seasonsTable.year })
      .from(seasonsTable)
      .where(eq(seasonsTable.year, entityId))
      .limit(1);
    return !!row;
  }
  return false;
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

async function insertSuggestion(
  req: { log: { error: (e: unknown) => void }; body: unknown },
  res: {
    status: (n: number) => {
      json: (b: unknown) => void;
    };
  },
  entityType: SuggestionEntityType,
  entityId: number | null,
) {
  try {
    if (suggestionRequiresEntityId(entityType)) {
      if (entityId == null || !Number.isFinite(entityId) || entityId < 1) {
        return res.status(400).json({ error: "entityId inválido" });
      }
      if (!(await entityExists(entityType, entityId))) {
        return res.status(404).json({ error: "Entidade não encontrada" });
      }
    } else if (entityId != null) {
      return res
        .status(400)
        .json({ error: "Sugestão geral não deve ter entityId" });
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
}

/** General suggestion (no linked entity). */
router.post("/suggestions/general", async (req, res) => {
  await insertSuggestion(req, res, "general", null);
});

/** Entity-scoped suggestion. */
router.post("/suggestions/:entityType/:entityId", async (req, res) => {
  const rawType = (req.params.entityType ?? "").toLowerCase();
  if (rawType === "general") {
    return res.status(400).json({
      error: "Use POST /api/suggestions/general para sugestões gerais",
    });
  }
  if (!isSuggestionEntityType(rawType)) {
    return res.status(400).json({
      error:
        "entityType inválido (player | manager | match | opponent | stadium | referee | season)",
    });
  }
  const entityId = parseInt(req.params.entityId ?? "", 10);
  await insertSuggestion(req, res, rawType, entityId);
});

export default router;
