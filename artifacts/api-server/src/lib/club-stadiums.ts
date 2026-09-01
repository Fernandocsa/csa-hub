import { db } from "@workspace/db";
import { clubStadiumsTable, opponentsTable, stadiumsTable } from "@workspace/db";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";

export type ClubStadiumLink = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  capacity: number | null;
  isPrimary: boolean;
};

export type ClubStadiumInput = {
  stadiumId: number;
  isPrimary?: boolean;
};

async function syncHomeStadiumId(clubId: number): Promise<number | null> {
  const [primary] = await db
    .select({ stadiumId: clubStadiumsTable.stadiumId })
    .from(clubStadiumsTable)
    .where(and(eq(clubStadiumsTable.clubId, clubId), eq(clubStadiumsTable.isPrimary, true)))
    .limit(1);

  const homeStadiumId = primary?.stadiumId ?? null;
  await db
    .update(opponentsTable)
    .set({ homeStadiumId })
    .where(eq(opponentsTable.id, clubId));
  return homeStadiumId;
}

/** If the club has stadiums but no primary, mark the first (by name) as primary. */
export async function ensureClubPrimary(clubId: number): Promise<void> {
  const rows = await db
    .select({
      id: clubStadiumsTable.id,
      isPrimary: clubStadiumsTable.isPrimary,
    })
    .from(clubStadiumsTable)
    .innerJoin(stadiumsTable, eq(clubStadiumsTable.stadiumId, stadiumsTable.id))
    .where(eq(clubStadiumsTable.clubId, clubId))
    .orderBy(desc(clubStadiumsTable.isPrimary), asc(stadiumsTable.name));

  if (rows.length === 0) {
    await db
      .update(opponentsTable)
      .set({ homeStadiumId: null })
      .where(eq(opponentsTable.id, clubId));
    return;
  }
  if (rows.some((r) => r.isPrimary)) {
    await syncHomeStadiumId(clubId);
    return;
  }
  await db
    .update(clubStadiumsTable)
    .set({ isPrimary: true })
    .where(eq(clubStadiumsTable.id, rows[0].id));
  await syncHomeStadiumId(clubId);
}

export async function listClubStadiums(clubId: number): Promise<ClubStadiumLink[]> {
  const rows = await db
    .select({
      id: stadiumsTable.id,
      name: stadiumsTable.name,
      city: stadiumsTable.city,
      state: stadiumsTable.state,
      country: stadiumsTable.country,
      capacity: stadiumsTable.capacity,
      isPrimary: clubStadiumsTable.isPrimary,
    })
    .from(clubStadiumsTable)
    .innerJoin(stadiumsTable, eq(clubStadiumsTable.stadiumId, stadiumsTable.id))
    .where(eq(clubStadiumsTable.clubId, clubId))
    .orderBy(desc(clubStadiumsTable.isPrimary), asc(stadiumsTable.name));

  if (rows.length > 0) return rows;

  const [opponent] = await db
    .select({ homeStadiumId: opponentsTable.homeStadiumId })
    .from(opponentsTable)
    .where(eq(opponentsTable.id, clubId))
    .limit(1);
  if (opponent?.homeStadiumId == null) return [];

  const [stadium] = await db
    .select({
      id: stadiumsTable.id,
      name: stadiumsTable.name,
      city: stadiumsTable.city,
      state: stadiumsTable.state,
      country: stadiumsTable.country,
      capacity: stadiumsTable.capacity,
    })
    .from(stadiumsTable)
    .where(eq(stadiumsTable.id, opponent.homeStadiumId))
    .limit(1);
  if (!stadium) return [];
  return [{ ...stadium, isPrimary: true }];
}

export async function listHomeClubsForStadium(stadiumId: number): Promise<
  {
    id: number;
    name: string;
    city: string | null;
    state: string | null;
    country: string | null;
    isPrimary: boolean;
  }[]
> {
  return db
    .select({
      id: opponentsTable.id,
      name: opponentsTable.name,
      city: opponentsTable.city,
      state: opponentsTable.state,
      country: opponentsTable.country,
      isPrimary: clubStadiumsTable.isPrimary,
    })
    .from(clubStadiumsTable)
    .innerJoin(opponentsTable, eq(clubStadiumsTable.clubId, opponentsTable.id))
    .where(eq(clubStadiumsTable.stadiumId, stadiumId))
    .orderBy(desc(clubStadiumsTable.isPrimary), asc(opponentsTable.name));
}

export async function replaceClubStadiums(
  clubId: number,
  stadiums: ClubStadiumInput[],
): Promise<ClubStadiumLink[]> {
  const unique = new Map<number, boolean>();
  for (const row of stadiums) {
    if (!Number.isInteger(row.stadiumId) || row.stadiumId < 1) {
      throw new Error("stadiumId inválido");
    }
    if (!unique.has(row.stadiumId)) {
      unique.set(row.stadiumId, !!row.isPrimary);
    } else if (row.isPrimary) {
      unique.set(row.stadiumId, true);
    }
  }

  const ids = [...unique.keys()];
  if (ids.length > 0) {
    const found = await db
      .select({ id: stadiumsTable.id })
      .from(stadiumsTable)
      .where(inArray(stadiumsTable.id, ids));
    if (found.length !== ids.length) {
      throw new Error("Um ou mais estádios não encontrados");
    }
  }

  let primaryId: number | null = null;
  for (const [id, isPrimary] of unique) {
    if (isPrimary && primaryId == null) primaryId = id;
  }
  if (primaryId == null && ids.length > 0) primaryId = ids[0];

  await db.delete(clubStadiumsTable).where(eq(clubStadiumsTable.clubId, clubId));
  if (ids.length > 0) {
    await db.insert(clubStadiumsTable).values(
      ids.map((stadiumId) => ({
        clubId,
        stadiumId,
        isPrimary: stadiumId === primaryId,
      })),
    );
  }
  await syncHomeStadiumId(clubId);
  return listClubStadiums(clubId);
}

export async function setStadiumHomeClubs(
  stadiumId: number,
  opponentIds: number[],
): Promise<Awaited<ReturnType<typeof listHomeClubsForStadium>>> {
  const nextIds = [...new Set(opponentIds)].filter((n) => Number.isInteger(n) && n > 0);
  if (nextIds.length > 0) {
    const found = await db
      .select({ id: opponentsTable.id })
      .from(opponentsTable)
      .where(inArray(opponentsTable.id, nextIds));
    if (found.length !== nextIds.length) {
      throw new Error("Um ou mais adversários não encontrados");
    }
  }

  const current = await db
    .select({
      id: clubStadiumsTable.id,
      clubId: clubStadiumsTable.clubId,
    })
    .from(clubStadiumsTable)
    .where(eq(clubStadiumsTable.stadiumId, stadiumId));

  const nextSet = new Set(nextIds);
  const currentSet = new Set(current.map((r) => r.clubId));
  const removedClubIds = current.filter((r) => !nextSet.has(r.clubId)).map((r) => r.clubId);
  const addedClubIds = nextIds.filter((id) => !currentSet.has(id));

  if (removedClubIds.length > 0) {
    await db
      .delete(clubStadiumsTable)
      .where(
        and(
          eq(clubStadiumsTable.stadiumId, stadiumId),
          inArray(clubStadiumsTable.clubId, removedClubIds),
        ),
      );
    for (const clubId of removedClubIds) {
      await ensureClubPrimary(clubId);
    }
  }

  for (const clubId of addedClubIds) {
    const existing = await db
      .select({ id: clubStadiumsTable.id })
      .from(clubStadiumsTable)
      .where(and(eq(clubStadiumsTable.clubId, clubId), eq(clubStadiumsTable.isPrimary, true)))
      .limit(1);
    await db.insert(clubStadiumsTable).values({
      clubId,
      stadiumId,
      isPrimary: existing.length === 0,
    });
    await syncHomeStadiumId(clubId);
  }

  return listHomeClubsForStadium(stadiumId);
}

/** Move club_stadiums rows from merged stadium ids onto keepId. */
export async function reassignClubStadiumsOnMerge(
  keepId: number,
  mergeIds: number[],
): Promise<void> {
  const oldIds = mergeIds.filter((id) => id !== keepId);
  if (oldIds.length === 0) return;

  const rows = await db
    .select()
    .from(clubStadiumsTable)
    .where(inArray(clubStadiumsTable.stadiumId, oldIds));

  const keepLinks = await db
    .select({ clubId: clubStadiumsTable.clubId, isPrimary: clubStadiumsTable.isPrimary })
    .from(clubStadiumsTable)
    .where(eq(clubStadiumsTable.stadiumId, keepId));
  const keepByClub = new Map(keepLinks.map((r) => [r.clubId, r]));

  const touched = new Set<number>();
  for (const row of rows) {
    touched.add(row.clubId);
    const existing = keepByClub.get(row.clubId);
    if (existing) {
      const shouldPromote = row.isPrimary && !existing.isPrimary;
      await db.delete(clubStadiumsTable).where(eq(clubStadiumsTable.id, row.id));
      if (shouldPromote) {
        await db
          .update(clubStadiumsTable)
          .set({ isPrimary: false })
          .where(
            and(eq(clubStadiumsTable.clubId, row.clubId), ne(clubStadiumsTable.stadiumId, keepId)),
          );
        await db
          .update(clubStadiumsTable)
          .set({ isPrimary: true })
          .where(
            and(
              eq(clubStadiumsTable.clubId, row.clubId),
              eq(clubStadiumsTable.stadiumId, keepId),
            ),
          );
      }
    } else {
      await db
        .update(clubStadiumsTable)
        .set({ stadiumId: keepId })
        .where(eq(clubStadiumsTable.id, row.id));
      keepByClub.set(row.clubId, { clubId: row.clubId, isPrimary: row.isPrimary });
    }
  }

  await db
    .update(opponentsTable)
    .set({ homeStadiumId: keepId })
    .where(inArray(opponentsTable.homeStadiumId, oldIds));

  for (const clubId of touched) {
    await ensureClubPrimary(clubId);
  }
}
