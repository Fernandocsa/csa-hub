import { Router } from "express";
import { db } from "@workspace/db";
import {
  ratingsTable,
  playersTable,
  managersTable,
  matchesTable,
} from "@workspace/db";
import { and, avg, count, eq } from "drizzle-orm";
import {
  isRatingEntityType,
  ratingLabel,
  roundAverage,
  type RatingEntityType,
} from "../lib/rating-labels";

const router = Router();

const VOTER_TOKEN_MAX = 64;

function isUniqueViolation(err: unknown): boolean {
  let cur: unknown = err;
  for (let i = 0; i < 5 && cur; i++) {
    if (typeof cur === "object" && cur !== null) {
      const obj = cur as { code?: unknown; message?: unknown; cause?: unknown };
      if (String(obj.code ?? "") === "23505") return true;
      if (
        typeof obj.message === "string" &&
        /duplicate key|unique constraint/i.test(obj.message)
      ) {
        return true;
      }
      cur = obj.cause;
      continue;
    }
    break;
  }
  return false;
}

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

function normalizeVoterToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const token = raw.trim();
  if (!token || token.length > VOTER_TOKEN_MAX) return null;
  return token;
}

router.get("/ratings/:entityType/:entityId", async (req, res) => {
  try {
    const parsed = parseEntityParams(req);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

    const { entityType, entityId } = parsed;
    if (!(await entityExists(entityType, entityId))) {
      return res.status(404).json({ error: "Entidade não encontrada" });
    }

    const [agg] = await db
      .select({
        average: avg(ratingsTable.stars),
        count: count(),
      })
      .from(ratingsTable)
      .where(
        and(
          eq(ratingsTable.entityType, entityType),
          eq(ratingsTable.entityId, entityId),
        ),
      );

    const voteCount = Number(agg?.count ?? 0);
    const avgRaw =
      agg?.average != null ? Number(agg.average) : null;
    const average =
      voteCount > 0 && avgRaw != null && Number.isFinite(avgRaw)
        ? roundAverage(avgRaw)
        : null;
    const label =
      average != null ? ratingLabel(entityType, average) : null;

    let myRating: number | null = null;
    const voterToken = normalizeVoterToken(req.query.voterToken);
    if (voterToken) {
      const [mine] = await db
        .select({ stars: ratingsTable.stars })
        .from(ratingsTable)
        .where(
          and(
            eq(ratingsTable.entityType, entityType),
            eq(ratingsTable.entityId, entityId),
            eq(ratingsTable.voterToken, voterToken),
          ),
        )
        .limit(1);
      myRating = mine?.stars ?? null;
    }

    res.json({ average, count: voteCount, label, myRating });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/ratings/:entityType/:entityId", async (req, res) => {
  try {
    const parsed = parseEntityParams(req);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

    const { entityType, entityId } = parsed;
    if (!(await entityExists(entityType, entityId))) {
      return res.status(404).json({ error: "Entidade não encontrada" });
    }

    const body = req.body as { stars?: unknown; voterToken?: unknown };
    const stars =
      typeof body.stars === "number"
        ? body.stars
        : typeof body.stars === "string"
          ? parseInt(body.stars, 10)
          : NaN;
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "stars deve ser inteiro de 1 a 5" });
    }

    const voterToken = normalizeVoterToken(body.voterToken);
    if (!voterToken) {
      return res
        .status(400)
        .json({ error: "voterToken obrigatório (até 64 caracteres)" });
    }

    try {
      const [inserted] = await db
        .insert(ratingsTable)
        .values({
          entityType,
          entityId,
          stars,
          voterToken,
        })
        .returning({
          id: ratingsTable.id,
          stars: ratingsTable.stars,
        });

      const [agg] = await db
        .select({
          average: avg(ratingsTable.stars),
          count: count(),
        })
        .from(ratingsTable)
        .where(
          and(
            eq(ratingsTable.entityType, entityType),
            eq(ratingsTable.entityId, entityId),
          ),
        );

      const voteCount = Number(agg?.count ?? 0);
      const avgRaw = agg?.average != null ? Number(agg.average) : null;
      const average =
        voteCount > 0 && avgRaw != null && Number.isFinite(avgRaw)
          ? roundAverage(avgRaw)
          : null;

      res.status(201).json({
        id: inserted.id,
        stars: inserted.stars,
        average,
        count: voteCount,
        label: average != null ? ratingLabel(entityType, average) : null,
        myRating: inserted.stars,
      });
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: "Você já avaliou este item" });
      }
      throw err;
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
