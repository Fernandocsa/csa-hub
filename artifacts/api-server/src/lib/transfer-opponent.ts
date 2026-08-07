import { db } from "@workspace/db";
import { opponentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { normName } from "./ai-import/norm";

export type OpponentCrestHit = {
  id: number;
  name: string;
  logoUrl: string | null;
};

/** Strip trailing UF suffix: "Volta Redonda-RJ" → "Volta Redonda". */
export function stripClubStateSuffix(name: string): string {
  return name.replace(/\s*-\s*[A-Za-z]{2}\s*$/, "").trim();
}

function clubNameKeys(raw: string): string[] {
  const keys = new Set<string>();
  const full = normName(raw);
  if (full) keys.add(full);
  const stripped = normName(stripClubStateSuffix(raw));
  if (stripped) keys.add(stripped);
  return [...keys];
}

/**
 * Match free-text transfer club to an adversaries catalog row (for crest + link).
 * Handles "Volta Redonda-RJ" ↔ "Volta Redonda" style mismatches.
 */
export function findOpponentByClubName(
  club: string | null | undefined,
  opponents: OpponentCrestHit[],
): OpponentCrestHit | null {
  if (!club?.trim()) return null;
  const raw = club.trim();

  const byNorm = new Map<string, OpponentCrestHit[]>();
  for (const o of opponents) {
    for (const key of clubNameKeys(o.name)) {
      const list = byNorm.get(key) ?? [];
      if (!list.some((x) => x.id === o.id)) list.push(o);
      byNorm.set(key, list);
    }
  }

  for (const key of clubNameKeys(raw)) {
    const hits = byNorm.get(key) ?? [];
    if (hits.length === 1) return hits[0];
  }

  for (const key of clubNameKeys(raw)) {
    const soft: OpponentCrestHit[] = [];
    for (const [k, list] of byNorm) {
      if (k.includes(key) || key.includes(k)) soft.push(...list);
    }
    const uniq = [...new Map(soft.map((x) => [x.id, x])).values()];
    if (uniq.length === 1) return uniq[0];
  }

  return null;
}

export async function loadOpponentCrestCatalog(): Promise<OpponentCrestHit[]> {
  return db
    .select({
      id: opponentsTable.id,
      name: opponentsTable.name,
      logoUrl: opponentsTable.logoUrl,
    })
    .from(opponentsTable);
}

/** Fill opponentId / clubLogoUrl when the transfer only has free-text club. */
export function enrichTransferOpponentFields<
  T extends {
    club: string | null;
    opponentId: number | null;
    clubLogoUrl: string | null;
  },
>(row: T, opponents: OpponentCrestHit[]): T {
  if (row.opponentId != null) {
    if (row.clubLogoUrl) return row;
    const byId = opponents.find((o) => o.id === row.opponentId);
    if (!byId) return row;
    return { ...row, clubLogoUrl: byId.logoUrl ?? null };
  }

  const hit = findOpponentByClubName(row.club, opponents);
  if (!hit) return row;
  return {
    ...row,
    opponentId: hit.id,
    clubLogoUrl: hit.logoUrl ?? null,
  };
}

/** Resolve opponent id to persist on transfer save (explicit id wins). */
export async function resolveTransferOpponentId(opts: {
  opponentId?: number | null;
  club?: string | null;
}): Promise<number | null> {
  if (opts.opponentId != null && Number.isInteger(opts.opponentId) && opts.opponentId > 0) {
    const [row] = await db
      .select({ id: opponentsTable.id })
      .from(opponentsTable)
      .where(eq(opponentsTable.id, opts.opponentId))
      .limit(1);
    return row?.id ?? null;
  }
  if (!opts.club?.trim()) return null;
  const opponents = await loadOpponentCrestCatalog();
  return findOpponentByClubName(opts.club, opponents)?.id ?? null;
}
