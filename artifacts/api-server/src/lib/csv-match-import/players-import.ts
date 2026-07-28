/**
 * Players CSV import with exact/similar name confirmation (reuses findNameMatches).
 */
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  buildConflictMessage,
  findNameMatches,
  normName,
  type NameCatalogEntry,
} from "./name-match";
import { yearsForPlayers } from "./entity-years";
import type { NameConflict, NameResolution } from "./types";

export type PlayersImportResult = {
  created: number;
  skipped: number;
  needsConfirmation: NameConflict[];
};

function resolutionKey(rowIndex: number, rawName: string): string {
  return `${rowIndex}|player|${normName(rawName)}`;
}

function batchKey(rawName: string): string {
  return `player|${normName(rawName)}`;
}

function profileUpdatesFromRow(row: Record<string, string>): {
  position?: string;
  nationality?: string;
  birthYear?: number;
} {
  const updates: {
    position?: string;
    nationality?: string;
    birthYear?: number;
  } = {};
  if (row.position?.trim()) updates.position = row.position.trim();
  if (row.nationality?.trim()) updates.nationality = row.nationality.trim();
  if (row.birth_year?.trim()) {
    const y = parseInt(row.birth_year.trim(), 10);
    if (!isNaN(y)) updates.birthYear = y;
  }
  return updates;
}

async function applyUseExisting(
  entityId: number,
  row: Record<string, string>,
): Promise<void> {
  const updates = profileUpdatesFromRow(row);
  if (Object.keys(updates).length) {
    await db.update(playersTable).set(updates).where(eq(playersTable.id, entityId));
  }
}

export async function runPlayersCsvImport(
  csv: string,
  parseCSV: (text: string) => Record<string, string>[],
  resolutions: NameResolution[],
  opts?: { onlyRowIndexes?: Set<number> },
): Promise<PlayersImportResult> {
  const rows = parseCSV(csv);
  let created = 0;
  let skipped = 0;
  const needsConfirmation: NameConflict[] = [];

  const catalog: NameCatalogEntry[] = await db
    .select({ id: playersTable.id, name: playersTable.name })
    .from(playersTable);

  const resolutionByKey = new Map<string, NameResolution>();
  for (const r of resolutions) {
    if (r.kind !== "player") continue;
    resolutionByKey.set(resolutionKey(r.rowIndex, r.rawName), r);
    resolutionByKey.set(batchKey(r.rawName), r);
  }

  const sessionResolved = new Map<
    string,
    { action: "use" | "create"; entityId?: number }
  >();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    if (opts?.onlyRowIndexes && !opts.onlyRowIndexes.has(rowIndex)) continue;

    const row = rows[rowIndex];
    const rawName = row.name?.trim() ?? "";
    if (!rawName) {
      skipped++;
      continue;
    }

    const bKey = batchKey(rawName);
    const remembered = sessionResolved.get(bKey);
    const decision =
      resolutionByKey.get(resolutionKey(rowIndex, rawName)) ??
      resolutionByKey.get(bKey);

    // Same name already resolved in this batch → update that player, don't re-insert
    if (!decision && remembered?.entityId != null) {
      await applyUseExisting(remembered.entityId, row);
      skipped++;
      continue;
    }

    if (decision?.action === "use" && decision.entityId != null) {
      await applyUseExisting(decision.entityId, row);
      sessionResolved.set(bKey, { action: "use", entityId: decision.entityId });
      skipped++;
      continue;
    }

    if (decision?.action === "create") {
      const [inserted] = await db
        .insert(playersTable)
        .values({
          name: rawName,
          position: row.position?.trim() || null,
          nationality: row.nationality?.trim() || null,
          birthYear: row.birth_year?.trim()
            ? parseInt(row.birth_year, 10)
            : null,
        })
        .returning({ id: playersTable.id, name: playersTable.name });
      catalog.push({ id: inserted.id, name: inserted.name });
      sessionResolved.set(bKey, { action: "create", entityId: inserted.id });
      created++;
      continue;
    }

    const match = findNameMatches(rawName, catalog);
    if (match.type === "none") {
      const [inserted] = await db
        .insert(playersTable)
        .values({
          name: rawName,
          position: row.position?.trim() || null,
          nationality: row.nationality?.trim() || null,
          birthYear: row.birth_year?.trim()
            ? parseInt(row.birth_year, 10)
            : null,
        })
        .returning({ id: playersTable.id, name: playersTable.name });
      catalog.push({ id: inserted.id, name: inserted.name });
      sessionResolved.set(bKey, { action: "create", entityId: inserted.id });
      created++;
      continue;
    }

    const yearsMap = await yearsForPlayers(match.hits.map((h) => h.id));
    const candidates = match.hits.map((h) => ({
      id: h.id,
      name: h.name,
      yearFrom: yearsMap.get(h.id)?.yearFrom ?? null,
      yearTo: yearsMap.get(h.id)?.yearTo ?? null,
    }));

    needsConfirmation.push({
      rowIndex,
      date: "",
      opponent: "",
      kind: "player",
      rawName,
      matchType: match.type,
      candidates,
      importYear: null,
      message: buildConflictMessage({
        rawName,
        kind: "player",
        matchType: match.type,
        candidates,
        importYear: null,
      }),
    });
  }

  return { created, skipped, needsConfirmation };
}
