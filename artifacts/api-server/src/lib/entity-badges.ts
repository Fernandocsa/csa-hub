import { db } from "@workspace/db";
import { entityBadgesTable } from "@workspace/db";
import { and, asc, desc, eq } from "drizzle-orm";

export type PublicBadge = {
  id: number;
  label: string;
  source: string;
  autoKind: string | null;
  seasonYear: number | null;
};

export async function loadEntityBadges(
  entityType: "player" | "manager",
  entityId: number,
): Promise<PublicBadge[]> {
  const rows = await db
    .select({
      id: entityBadgesTable.id,
      label: entityBadgesTable.label,
      source: entityBadgesTable.source,
      autoKind: entityBadgesTable.autoKind,
      seasonYear: entityBadgesTable.seasonYear,
    })
    .from(entityBadgesTable)
    .where(
      and(
        eq(entityBadgesTable.entityType, entityType),
        eq(entityBadgesTable.entityId, entityId),
      ),
    )
    .orderBy(
      desc(entityBadgesTable.seasonYear),
      asc(entityBadgesTable.source),
      asc(entityBadgesTable.label),
    );

  return rows;
}
