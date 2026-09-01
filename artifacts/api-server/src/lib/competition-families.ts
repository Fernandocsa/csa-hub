import { db, competitionsTable, matchesTable } from "@workspace/db";
import { eq, inArray, sql, type SQL } from "drizzle-orm";
import { foldAccents } from "./accent-fold";

/**
 * Historic national formats that CBF/today treat as the same competition.
 * Matches stay on the original competition row so the era name is preserved;
 * lists, stats and records roll them up under the modern parent.
 */
export const COMPETITION_FAMILIES: ReadonlyArray<{
  parent: string;
  members: readonly string[];
}> = [
  {
    parent: "Campeonato Brasileiro Série A",
    members: [
      "Campeonato Brasileiro Série A",
      "Campeonato Brasileiro",
      "Campeonato Brasileiro Módulo Amarelo",
      "Taça de Ouro",
      "Copa João Havelange",
      "Taça Brasil",
    ],
  },
  {
    parent: "Campeonato Brasileiro Série B",
    members: [
      "Campeonato Brasileiro Série B",
      "Campeonato Brasileiro Divisão Especial",
      "Taça de Prata",
    ],
  },
  {
    parent: "Campeonato Brasileiro Série C",
    members: [
      "Campeonato Brasileiro Série C",
      "Campeonato Brasileiro 3ª Divisão",
      "Campeonato Brasileiro 3a Divisão",
    ],
  },
];

export function foldCompetitionName(name: string | null | undefined): string {
  return foldAccents(name).replace(/\s+/g, " ").trim();
}

export type CompetitionRef = { id: number; name: string };

export type CompetitionFamilyIndex = {
  byId: Map<number, CompetitionRef>;
  /** Parent competition id → member ids (includes parent). */
  parentToMembers: Map<number, number[]>;
  /** Any family member id → parent id. */
  memberToParent: Map<number, number>;
};

export async function loadCompetitionFamilyIndex(): Promise<CompetitionFamilyIndex> {
  const rows = await db
    .select({
      id: competitionsTable.id,
      name: competitionsTable.name,
    })
    .from(competitionsTable);

  const byId = new Map<number, CompetitionRef>();
  const byFolded = new Map<string, CompetitionRef[]>();
  for (const row of rows) {
    byId.set(row.id, row);
    const key = foldCompetitionName(row.name);
    const list = byFolded.get(key) ?? [];
    list.push(row);
    byFolded.set(key, list);
  }

  const parentToMembers = new Map<number, number[]>();
  const memberToParent = new Map<number, number>();

  for (const family of COMPETITION_FAMILIES) {
    const parentKey = foldCompetitionName(family.parent);
    const parent = byFolded.get(parentKey)?.[0];
    if (!parent) continue;

    const memberIds: number[] = [];
    const seen = new Set<number>();
    for (const memberName of family.members) {
      const matches = byFolded.get(foldCompetitionName(memberName)) ?? [];
      for (const match of matches) {
        if (seen.has(match.id)) continue;
        seen.add(match.id);
        memberIds.push(match.id);
        memberToParent.set(match.id, parent.id);
      }
    }
    if (!seen.has(parent.id)) {
      memberIds.unshift(parent.id);
      memberToParent.set(parent.id, parent.id);
    }
    parentToMembers.set(parent.id, memberIds);
  }

  return { byId, parentToMembers, memberToParent };
}

/** IDs that count toward this competition's public stats/records. */
export function familyIdsForCompetition(
  index: CompetitionFamilyIndex,
  competitionId: number,
): number[] {
  return index.parentToMembers.get(competitionId) ?? [competitionId];
}

export function parentIdForCompetition(
  index: CompetitionFamilyIndex,
  competitionId: number,
): number {
  return index.memberToParent.get(competitionId) ?? competitionId;
}

export function isFamilyParent(
  index: CompetitionFamilyIndex,
  competitionId: number,
): boolean {
  const members = index.parentToMembers.get(competitionId);
  return !!members && members.length > 1;
}

export function competitionIdIn(ids: number[]): SQL {
  if (ids.length === 0) return sql`false`;
  if (ids.length === 1) return eq(matchesTable.competitionId, ids[0]!);
  return inArray(matchesTable.competitionId, ids);
}

export type NumericCompetitionStats = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  lastParticipation?: string | null;
};

function n(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function sumCompetitionStats<T extends NumericCompetitionStats>(
  rows: T[],
): NumericCompetitionStats {
  let matches = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsScored = 0;
  let goalsConceded = 0;
  let lastParticipation: string | null = null;
  for (const row of rows) {
    matches += n(row.matches);
    wins += n(row.wins);
    draws += n(row.draws);
    losses += n(row.losses);
    goalsScored += n(row.goalsScored);
    goalsConceded += n(row.goalsConceded);
    const last = row.lastParticipation ?? null;
    if (last && (!lastParticipation || last > lastParticipation)) {
      lastParticipation = last;
    }
  }
  return {
    matches,
    wins,
    draws,
    losses,
    goalsScored,
    goalsConceded,
    lastParticipation,
  };
}

export type ListedCompetition = NumericCompetitionStats & {
  id: number;
  name: string;
  type?: string | null;
  titles?: number | null;
  variants?: ListedCompetition[];
};

/**
 * Collapse family members under the modern parent. Children disappear from
 * the top-level list and reappear as `variants` on the parent.
 */
export function foldListedCompetitions(
  rows: ListedCompetition[],
  index: CompetitionFamilyIndex,
): ListedCompetition[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const used = new Set<number>();
  const folded: ListedCompetition[] = [];

  for (const [parentId, memberIds] of index.parentToMembers) {
    const members = memberIds
      .map((id) => byId.get(id))
      .filter((row): row is ListedCompetition => !!row);
    if (members.length === 0) continue;

    const parent = byId.get(parentId) ?? members[0]!;
    const withMatches = members.filter((m) => n(m.matches) > 0);
    const variants = (withMatches.length > 0 ? withMatches : members).map(
      (m) => ({ ...m, variants: undefined }),
    );
    const totals = sumCompetitionStats(members);
    const hasHistoric = variants.some((v) => v.id !== parent.id);
    folded.push({
      ...parent,
      ...totals,
      variants: hasHistoric ? variants : undefined,
    });
    for (const member of members) used.add(member.id);
  }

  for (const row of rows) {
    if (!used.has(row.id)) folded.push({ ...row, variants: undefined });
  }

  folded.sort(
    (a, b) =>
      n(b.matches) - n(a.matches) || a.name.localeCompare(b.name, "pt-BR"),
  );
  return folded;
}

export type NamedCompetitionStat = {
  competitionId: number;
  competitionName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  variants?: NamedCompetitionStat[];
};

export function foldNamedCompetitionStats(
  rows: NamedCompetitionStat[],
  index: CompetitionFamilyIndex,
): NamedCompetitionStat[] {
  const groups = new Map<number, NamedCompetitionStat[]>();
  const order: number[] = [];

  for (const row of rows) {
    const parentId = parentIdForCompetition(index, row.competitionId);
    let group = groups.get(parentId);
    if (!group) {
      group = [];
      groups.set(parentId, group);
      order.push(parentId);
    }
    group.push(row);
  }

  const folded: NamedCompetitionStat[] = [];
  for (const parentId of order) {
    const group = groups.get(parentId) ?? [];
    if (group.length === 1) {
      folded.push(group[0]!);
      continue;
    }
    const parentName = index.byId.get(parentId)?.name ?? group[0]!.competitionName;
    folded.push({
      competitionId: parentId,
      competitionName: parentName,
      matches: group.reduce((sum, r) => sum + n(r.matches), 0),
      wins: group.reduce((sum, r) => sum + n(r.wins), 0),
      draws: group.reduce((sum, r) => sum + n(r.draws), 0),
      losses: group.reduce((sum, r) => sum + n(r.losses), 0),
      goalsFor: group.reduce((sum, r) => sum + n(r.goalsFor), 0),
      goalsAgainst: group.reduce((sum, r) => sum + n(r.goalsAgainst), 0),
      variants: group,
    });
  }

  folded.sort(
    (a, b) =>
      n(b.matches) - n(a.matches) ||
      a.competitionName.localeCompare(b.competitionName, "pt-BR"),
  );
  return folded;
}
