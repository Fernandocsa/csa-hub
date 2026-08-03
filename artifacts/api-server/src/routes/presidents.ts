import { Router } from "express";
import { db } from "@workspace/db";
import { presidentsTable, playersTable, managersTable } from "@workspace/db";
import { asc, eq, sql } from "drizzle-orm";

const router = Router();

type RawPresident = {
  id: number;
  name: string;
  photoUrl: string | null;
  termStart: string | null;
  termEnd: string | null;
  isCurrent: boolean;
  personKey: number | null;
  notes: string | null;
  linkedPlayerId: number | null;
  linkedManagerId: number | null;
  linkedPlayerName: string | null;
  linkedPlayerPhotoUrl: string | null;
  linkedManagerName: string | null;
};

export type PresidentTermSummary = {
  id: number;
  termStart: string | null;
  termEnd: string | null;
  isCurrent: boolean;
  passageIndex: number;
};

function groupKey(r: { id: number; personKey: number | null }): number {
  return r.personKey ?? r.id;
}

function enrichPresidents(rows: RawPresident[]) {
  const byGroup = new Map<number, RawPresident[]>();
  for (const r of rows) {
    const k = groupKey(r);
    const list = byGroup.get(k) ?? [];
    list.push(r);
    byGroup.set(k, list);
  }

  const groupPhoto = new Map<number, string | null>();
  for (const [k, list] of byGroup) {
    const withPhoto = list.find((x) => x.photoUrl || x.linkedPlayerPhotoUrl);
    groupPhoto.set(
      k,
      withPhoto?.photoUrl ?? withPhoto?.linkedPlayerPhotoUrl ?? null,
    );
  }

  return rows.map((r) => {
    const k = groupKey(r);
    const group = byGroup.get(k) ?? [r];
    const passageIndex = group.findIndex((x) => x.id === r.id);
    const otherTerms: PresidentTermSummary[] = group
      .filter((x) => x.id !== r.id)
      .map((x) => ({
        id: x.id,
        termStart: x.termStart ?? null,
        termEnd: x.termEnd ?? null,
        isCurrent: !!x.isCurrent,
        passageIndex: group.findIndex((g) => g.id === x.id),
      }));

    return {
      id: r.id,
      name: r.name,
      photoUrl: r.photoUrl ?? r.linkedPlayerPhotoUrl ?? groupPhoto.get(k) ?? null,
      termStart: r.termStart ?? null,
      termEnd: r.termEnd ?? null,
      isCurrent: !!r.isCurrent,
      personKey: r.personKey ?? null,
      passageIndex: group.length > 1 ? passageIndex : null,
      passageCount: group.length > 1 ? group.length : null,
      otherTerms,
      notes: r.notes ?? null,
      linkedPlayerId: r.linkedPlayerId ?? null,
      linkedPlayerName: r.linkedPlayerName ?? null,
      linkedManagerId: r.linkedManagerId ?? null,
      linkedManagerName: r.linkedManagerName ?? null,
    };
  });
}

const selectFields = {
  id: presidentsTable.id,
  name: presidentsTable.name,
  photoUrl: presidentsTable.photoUrl,
  termStart: presidentsTable.termStart,
  termEnd: presidentsTable.termEnd,
  isCurrent: presidentsTable.isCurrent,
  personKey: presidentsTable.personKey,
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

    res.json(enrichPresidents(rows as RawPresident[]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/presidents/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
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
    const enriched = enrichPresidents(rows as RawPresident[]);
    const row = enriched.find((r) => r.id === id);
    if (!row) return res.status(404).json({ error: "Presidente não encontrado" });
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
