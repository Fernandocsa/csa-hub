import { db } from "@workspace/db";
import {
  playersTable,
  playerSeasonStatsTable,
  managersTable,
  managerSeasonStatsTable,
  matchesTable,
  matchLineupsTable,
  adminDivergenceDismissalsTable,
} from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { officialPlayedMatchConditions } from "./match-filters";
import { csaLineupActuallyPlayedCondition } from "./player-appeared";

export type DivergenceEntityType = "player" | "manager";

export type DivergenceItem = {
  id: number;
  name: string;
  href: string;
  summary: string;
  /** Ano(s) de temporada p/ identificação no admin (ex.: "1960" ou "2000–2003"). */
  seasonHint?: string | null;
  photoUrl?: string | null;
  meta?: Record<string, string | number | null>;
};

export type DivergenceGroup = {
  kind: string;
  entityType: DivergenceEntityType;
  title: string;
  description: string;
  count: number;
  items: DivergenceItem[];
};

const DEMONYM_NATIONALITIES = [
  "Brasileiro",
  "Brasileira",
  "Brasileiros",
  "Brasileiras",
      "Argentino",
      "Uruguaio",
      "Uruguaia",
  "Paraguaio",
  "Paraguaia",
  "Chileno",
  "Chilena",
  "Colombiano",
  "Colombiana",
  "Peruano",
  "Peruana",
  "Boliviano",
  "Boliviana",
  "Venezuelano",
  "Venezuelana",
  "Equatoriano",
  "Equatoriana",
  "Mexicano",
  "Mexicana",
  "Americano",
  "Americana",
  "Portugues",
  "Português",
  "Portuguesa",
  "Espanhol",
  "Espanhola",
  "Italiano",
  "Italiana",
  "Frances",
  "Francês",
  "Francesa",
  "Alemao",
  "Alemão",
  "Alema",
  "Alemã",
  "Japones",
  "Japonês",
  "Japonesa",
  "Nigeriano",
  "Nigeriana",
];

function normalizeNameKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function demonymSet() {
  return new Set(DEMONYM_NATIONALITIES.map((d) => d.toLowerCase()));
}

function hasCompleteFullName(fullName: string | null | undefined): boolean {
  return Boolean(fullName && fullName.trim());
}

function yearFromSeason(season: string | null | undefined): string | null {
  if (!season) return null;
  const m = String(season).match(/^(\d{4})/);
  return m?.[1] ?? null;
}

async function loadPlayerSeasonHints(
  playerIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (playerIds.length === 0) return map;

  const rows = await db
    .select({
      playerId: playerSeasonStatsTable.playerId,
      firstSeason: sql<string | null>`min(${playerSeasonStatsTable.season})`,
      lastSeason: sql<string | null>`max(${playerSeasonStatsTable.season})`,
    })
    .from(playerSeasonStatsTable)
    .where(inArray(playerSeasonStatsTable.playerId, playerIds))
    .groupBy(playerSeasonStatsTable.playerId);

  for (const r of rows) {
    const first = yearFromSeason(r.firstSeason);
    const last = yearFromSeason(r.lastSeason);
    if (!first) continue;
    map.set(r.playerId, last && last !== first ? `${first}–${last}` : first);
  }
  return map;
}

async function attachPlayerSeasonHints(groups: DivergenceGroup[]) {
  const ids = [
    ...new Set(
      groups
        .filter((g) => g.entityType === "player")
        .flatMap((g) => g.items.map((i) => i.id)),
    ),
  ];
  const hints = await loadPlayerSeasonHints(ids);
  for (const g of groups) {
    if (g.entityType !== "player") continue;
    for (const item of g.items) {
      item.seasonHint = hints.get(item.id) ?? null;
    }
  }
}

async function attachEntityPhotos(groups: DivergenceGroup[]) {
  const playerIds = [
    ...new Set(
      groups
        .filter((g) => g.entityType === "player")
        .flatMap((g) => g.items.map((i) => i.id)),
    ),
  ];
  const managerIds = [
    ...new Set(
      groups
        .filter((g) => g.entityType === "manager")
        .flatMap((g) => g.items.map((i) => i.id)),
    ),
  ];

  const photoByKey = new Map<string, string | null>();

  if (playerIds.length > 0) {
    const rows = await db
      .select({ id: playersTable.id, photoUrl: playersTable.photoUrl })
      .from(playersTable)
      .where(inArray(playersTable.id, playerIds));
    for (const r of rows) {
      photoByKey.set(`player:${r.id}`, r.photoUrl?.trim() || null);
    }
  }

  if (managerIds.length > 0) {
    const rows = await db
      .select({ id: managersTable.id, photoUrl: managersTable.photoUrl })
      .from(managersTable)
      .where(inArray(managersTable.id, managerIds));
    for (const r of rows) {
      photoByKey.set(`manager:${r.id}`, r.photoUrl?.trim() || null);
    }
  }

  for (const g of groups) {
    for (const item of g.items) {
      item.photoUrl = photoByKey.get(`${g.entityType}:${item.id}`) ?? null;
    }
  }
}

async function playerDuplicateNames(): Promise<DivergenceGroup> {
  const rows = await db
    .select({
      id: playersTable.id,
      name: playersTable.name,
      fullName: playersTable.fullName,
    })
    .from(playersTable);

  const byKey = new Map<
    string,
    { id: number; name: string; fullName: string | null }[]
  >();
  for (const r of rows) {
    const key = normalizeNameKey(r.name);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(r);
    byKey.set(key, list);
  }

  const items: DivergenceItem[] = [];
  for (const [, list] of byKey) {
    if (list.length < 2) continue;
    const withFull = list.filter((p) => hasCompleteFullName(p.fullName));
    const withoutFull = list.filter((p) => !hasCompleteFullName(p.fullName));
    // Só alerta quando há mistura: um(s) com nome completo e outro(s) sem.
    // Dois (ou mais) com nome completo = homônimos OK; todos sem = não entra aqui.
    if (withFull.length === 0 || withoutFull.length === 0) continue;

    const ids = list.map((x) => x.id).sort((a, b) => a - b);
    for (const p of list) {
      const complete = hasCompleteFullName(p.fullName);
      items.push({
        id: p.id,
        name: p.name,
        href: `/admin/jogadores/${p.id}`,
        summary: complete
          ? `Com nome completo · ${withoutFull.length} cadastro(s) só com apelido no mesmo nome · IDs ${ids.join(", ")}`
          : `Sem nome completo · ${withFull.length} com nome completo no mesmo apelido · IDs ${ids.join(", ")}`,
        meta: {
          duplicates: list.length,
          withFullName: withFull.length,
          withoutFullName: withoutFull.length,
        },
      });
    }
  }
  items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || a.id - b.id);

  return {
    kind: "player_duplicate_name",
    entityType: "player",
    title: "Jogadores com nome duplicado",
    description:
      "Mesmo apelido em mais de um cadastro, com pelo menos um com nome completo e outro sem. Homônimos em que todos já têm nome completo não entram.",
    count: items.length,
    items,
  };
}

async function managerDuplicateNames(): Promise<DivergenceGroup> {
  const rows = await db
    .select({ id: managersTable.id, name: managersTable.name })
    .from(managersTable);

  const byKey = new Map<string, { id: number; name: string }[]>();
  for (const r of rows) {
    const key = normalizeNameKey(r.name);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(r);
    byKey.set(key, list);
  }

  const items: DivergenceItem[] = [];
  for (const [, list] of byKey) {
    if (list.length < 2) continue;
    const ids = list.map((x) => x.id).sort((a, b) => a - b);
    for (const m of list) {
      items.push({
        id: m.id,
        name: m.name,
        href: `/admin/tecnicos/${m.id}`,
        summary: `${list.length} cadastros com o mesmo nome · IDs ${ids.join(", ")}`,
        meta: { duplicates: list.length },
      });
    }
  }
  items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || a.id - b.id);

  return {
    kind: "manager_duplicate_name",
    entityType: "manager",
    title: "Técnicos com nome duplicado",
    description:
      "Dois ou mais cadastros com o mesmo nome (ignorando maiúsculas/acentos).",
    count: items.length,
    items,
  };
}

async function playerBirthYearMismatch(): Promise<DivergenceGroup> {
  const rows = await db
    .select({
      id: playersTable.id,
      name: playersTable.name,
      birthYear: playersTable.birthYear,
      birthDate: playersTable.birthDate,
    })
    .from(playersTable)
    .where(
      and(
        sql`${playersTable.birthYear} IS NOT NULL`,
        sql`${playersTable.birthDate} IS NOT NULL`,
        sql`extract(year from ${playersTable.birthDate}::date)::int <> ${playersTable.birthYear}`,
      ),
    )
    .orderBy(playersTable.name);

  return {
    kind: "player_birth_year_mismatch",
    entityType: "player",
    title: "Ano de nascimento ≠ data de nascimento",
    description:
      "birth_year não confere com o ano de birth_date. A data de nascimento tem prioridade — o ano deve ser o mesmo da data.",
    count: rows.length,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      href: `/admin/jogadores/${r.id}`,
      summary: `Ano ${r.birthYear} · data ${r.birthDate}`,
      meta: { birthYear: r.birthYear, birthDate: r.birthDate },
    })),
  };
}

async function playerNationalityDemonyms(): Promise<DivergenceGroup> {
  const demonyms = demonymSet();
  const rows = await db
    .select({
      id: playersTable.id,
      name: playersTable.name,
      nationality: playersTable.nationality,
    })
    .from(playersTable)
    .where(sql`${playersTable.nationality} IS NOT NULL AND trim(${playersTable.nationality}) <> ''`)
    .orderBy(playersTable.name);

  const items = rows
    .filter((r) => demonyms.has(String(r.nationality).trim().toLowerCase()))
    .map((r) => ({
      id: r.id,
      name: r.name,
      href: `/admin/jogadores/${r.id}`,
      summary: `Nacionalidade cadastrada como gentílico: “${r.nationality}”`,
      meta: { nationality: r.nationality },
    }));

  return {
    kind: "player_nationality_demonym",
    entityType: "player",
    title: "Nacionalidade como gentílico (jogadores)",
    description:
      "Valor parece gentílico (ex.: Brasileiro, Argentino) em vez do nome do país (Brasil, Argentina).",
    count: items.length,
    items,
  };
}

async function managerNationalityDemonyms(): Promise<DivergenceGroup> {
  const demonyms = demonymSet();
  const rows = await db
    .select({
      id: managersTable.id,
      name: managersTable.name,
      nationality: managersTable.nationality,
    })
    .from(managersTable)
    .where(sql`${managersTable.nationality} IS NOT NULL AND trim(${managersTable.nationality}) <> ''`)
    .orderBy(managersTable.name);

  const items = rows
    .filter((r) => demonyms.has(String(r.nationality).trim().toLowerCase()))
    .map((r) => ({
      id: r.id,
      name: r.name,
      href: `/admin/tecnicos/${r.id}`,
      summary: `Nacionalidade cadastrada como gentílico: “${r.nationality}”`,
      meta: { nationality: r.nationality },
    }));

  return {
    kind: "manager_nationality_demonym",
    entityType: "manager",
    title: "Nacionalidade como gentílico (técnicos)",
    description:
      "Valor parece gentílico em vez do nome do país.",
    count: items.length,
    items,
  };
}

async function managerManualVsLinked(): Promise<DivergenceGroup> {
  const managers = await db
    .select({
      id: managersTable.id,
      name: managersTable.name,
      storedGames: managersTable.storedGames,
      statsSource: managersTable.statsSource,
    })
    .from(managersTable)
    .where(
      and(
        eq(managersTable.statsSource, "manual"),
        sql`${managersTable.storedGames} IS NOT NULL`,
      ),
    );

  const linkedRows = await db
    .select({
      managerId: matchesTable.managerId,
      linked: sql<number>`cast(count(*) as int)`,
    })
    .from(matchesTable)
    .where(
      and(
        sql`${matchesTable.managerId} IS NOT NULL`,
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(matchesTable.managerId);

  const linkedById = new Map(
    linkedRows
      .filter((r) => r.managerId != null)
      .map((r) => [r.managerId as number, r.linked]),
  );

  const items: DivergenceItem[] = [];
  for (const m of managers) {
    const linked = linkedById.get(m.id) ?? 0;
    const stored = m.storedGames ?? 0;
    if (linked <= stored) continue;
    items.push({
      id: m.id,
      name: m.name,
      href: `/admin/tecnicos/${m.id}`,
      summary: `Manual ${stored}J · linkados ${linked}J (+${linked - stored})`,
      meta: { storedGames: stored, linkedMatches: linked },
    });
  }
  items.sort((a, b) => {
    const da = Number(a.meta?.linkedMatches ?? 0) - Number(a.meta?.storedGames ?? 0);
    const db_ = Number(b.meta?.linkedMatches ?? 0) - Number(b.meta?.storedGames ?? 0);
    return db_ - da || a.name.localeCompare(b.name, "pt-BR");
  });

  return {
    kind: "manager_manual_vs_linked",
    entityType: "manager",
    title: "Carreira manual vs jogos linkados (técnicos)",
    description:
      "stats_source = manual, mas há mais partidas oficiais com esse técnico do que o total curado — vínculos provavelmente errados.",
    count: items.length,
    items,
  };
}

async function managerSeasonSumVsStored(): Promise<DivergenceGroup> {
  const rows = await db
    .select({
      id: managersTable.id,
      name: managersTable.name,
      storedGames: managersTable.storedGames,
      seasonSum: sql<number>`cast(coalesce(sum(${managerSeasonStatsTable.games}), 0) as int)`,
      seasonCount: sql<number>`cast(count(${managerSeasonStatsTable.id}) as int)`,
    })
    .from(managersTable)
    .leftJoin(
      managerSeasonStatsTable,
      eq(managerSeasonStatsTable.managerId, managersTable.id),
    )
    .where(sql`${managersTable.storedGames} IS NOT NULL`)
    .groupBy(managersTable.id, managersTable.name, managersTable.storedGames)
    .having(
      sql`cast(coalesce(sum(${managerSeasonStatsTable.games}), 0) as int) <> ${managersTable.storedGames}`,
    );

  const items = rows
    .map((r) => ({
      id: r.id,
      name: r.name,
      href: `/admin/tecnicos/${r.id}`,
      summary: `Carreira ${r.storedGames}J · soma das temporadas ${r.seasonSum}J (${r.seasonCount} temp.)`,
      meta: {
        storedGames: r.storedGames,
        seasonSum: r.seasonSum,
        seasonCount: r.seasonCount,
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return {
    kind: "manager_season_sum_vs_stored",
    entityType: "manager",
    title: "Soma das temporadas ≠ carreira (técnicos)",
    description:
      "Total stored_games diverge da soma de games em manager_season_stats.",
    count: items.length,
    items,
  };
}

async function managerWdlInconsistent(): Promise<DivergenceGroup> {
  const rows = await db
    .select({
      id: managersTable.id,
      name: managersTable.name,
      storedGames: managersTable.storedGames,
      storedWins: managersTable.storedWins,
      storedDraws: managersTable.storedDraws,
      storedLosses: managersTable.storedLosses,
    })
    .from(managersTable)
    .where(
      and(
        sql`${managersTable.storedGames} IS NOT NULL`,
        sql`${managersTable.storedWins} IS NOT NULL`,
        sql`${managersTable.storedDraws} IS NOT NULL`,
        sql`${managersTable.storedLosses} IS NOT NULL`,
        sql`(coalesce(${managersTable.storedWins},0) + coalesce(${managersTable.storedDraws},0) + coalesce(${managersTable.storedLosses},0)) <> ${managersTable.storedGames}`,
      ),
    )
    .orderBy(managersTable.name);

  return {
    kind: "manager_career_wdl",
    entityType: "manager",
    title: "V+E+D ≠ jogos (carreira de técnicos)",
    description: "Vitórias + empates + derrotas não fecham o total de jogos da carreira.",
    count: rows.length,
    items: rows.map((r) => {
      const sum = (r.storedWins ?? 0) + (r.storedDraws ?? 0) + (r.storedLosses ?? 0);
      return {
        id: r.id,
        name: r.name,
        href: `/admin/tecnicos/${r.id}`,
        summary: `${r.storedGames}J · V${r.storedWins} E${r.storedDraws} D${r.storedLosses} (soma ${sum})`,
        meta: {
          storedGames: r.storedGames,
          wdlSum: sum,
        },
      };
    }),
  };
}

async function managerSeasonWdlInconsistent(): Promise<DivergenceGroup> {
  const rows = await db
    .select({
      id: managersTable.id,
      name: managersTable.name,
      season: managerSeasonStatsTable.season,
      games: managerSeasonStatsTable.games,
      wins: managerSeasonStatsTable.wins,
      draws: managerSeasonStatsTable.draws,
      losses: managerSeasonStatsTable.losses,
    })
    .from(managerSeasonStatsTable)
    .innerJoin(managersTable, eq(managerSeasonStatsTable.managerId, managersTable.id))
    .where(
      sql`(coalesce(${managerSeasonStatsTable.wins},0) + coalesce(${managerSeasonStatsTable.draws},0) + coalesce(${managerSeasonStatsTable.losses},0)) <> ${managerSeasonStatsTable.games}`,
    )
    .orderBy(managersTable.name, managerSeasonStatsTable.season);

  return {
    kind: "manager_season_wdl",
    entityType: "manager",
    title: "V+E+D ≠ jogos (temporada de técnicos)",
    description: "Em alguma temporada, V+E+D não fecha o número de jogos.",
    count: rows.length,
    items: rows.map((r) => {
      const sum = (r.wins ?? 0) + (r.draws ?? 0) + (r.losses ?? 0);
      return {
        id: r.id,
        name: r.name,
        href: `/admin/tecnicos/${r.id}`,
        summary: `${r.season}: ${r.games}J · V${r.wins} E${r.draws} D${r.losses} (soma ${sum})`,
        meta: { season: r.season, games: r.games, wdlSum: sum },
      };
    }),
  };
}

async function playerLinkedVsManualSeason(): Promise<DivergenceGroup> {
  const linked = await db
    .select({
      playerId: matchLineupsTable.playerId,
      season: matchesTable.season,
      linkedApps: sql<number>`cast(count(distinct ${matchLineupsTable.matchId}) as int)`,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .where(
      and(
        eq(matchLineupsTable.side, "csa"),
        csaLineupActuallyPlayedCondition(),
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(matchLineupsTable.playerId, matchesTable.season);

  const manuals = await db
    .select({
      playerId: playerSeasonStatsTable.playerId,
      season: playerSeasonStatsTable.season,
      appearances: playerSeasonStatsTable.appearances,
    })
    .from(playerSeasonStatsTable);

  const manualMap = new Map(
    manuals.map((r) => [`${r.playerId}|${r.season}`, r.appearances ?? 0]),
  );

  const playerNames = await db
    .select({ id: playersTable.id, name: playersTable.name })
    .from(playersTable);
  const nameById = new Map(playerNames.map((p) => [p.id, p.name]));

  const items: DivergenceItem[] = [];
  for (const row of linked) {
    if (row.playerId == null) continue;
    const playerId = row.playerId;
    const manual = manualMap.get(`${playerId}|${row.season}`) ?? 0;
    if (row.linkedApps <= manual) continue;
    // Only flag meaningful overcounts (digitization noise of +1 can happen; focus on clear excess)
    if (row.linkedApps - manual < 2 && manual > 0) continue;
    if (manual === 0 && row.linkedApps < 3) continue;
    const name = nameById.get(playerId) ?? `#${playerId}`;
    items.push({
      id: playerId,
      name,
      href: `/admin/jogadores/${row.playerId}`,
      summary: `${row.season}: manual ${manual}J · fichas ${row.linkedApps}J`,
      meta: {
        season: row.season,
        manualAppearances: manual,
        linkedAppearances: row.linkedApps,
      },
    });
  }

  items.sort((a, b) => {
    const da =
      Number(a.meta?.linkedAppearances ?? 0) - Number(a.meta?.manualAppearances ?? 0);
    const db_ =
      Number(b.meta?.linkedAppearances ?? 0) - Number(b.meta?.manualAppearances ?? 0);
    return db_ - da || a.name.localeCompare(b.name, "pt-BR");
  });

  return {
    kind: "player_linked_vs_manual_season",
    entityType: "player",
    title: "Fichas linkadas > stats manuais (jogadores)",
    description:
      "Em alguma temporada, jogos nas fichas CSA excedem as aparições manuais — possível jogador errado na escalação ou stats desatualizados.",
    count: items.length,
    items: items.slice(0, 200),
  };
}

export async function loadAdminDataDivergences(): Promise<{
  groups: DivergenceGroup[];
  totalItems: number;
  dismissedGroups: DivergenceGroup[];
  dismissedTotal: number;
  generatedAt: string;
}> {
  const rawGroups = await Promise.all([
    managerManualVsLinked(),
    managerSeasonSumVsStored(),
    managerWdlInconsistent(),
    managerSeasonWdlInconsistent(),
    managerDuplicateNames(),
    managerNationalityDemonyms(),
    playerDuplicateNames(),
    playerBirthYearMismatch(),
    playerNationalityDemonyms(),
    playerLinkedVsManualSeason(),
  ]);

  await attachPlayerSeasonHints(rawGroups);
  await attachEntityPhotos(rawGroups);

  for (const g of rawGroups) {
    if (g.kind !== "player_duplicate_name") continue;
    g.items.sort((a, b) => {
      const nameCmp = a.name.localeCompare(b.name, "pt-BR");
      if (nameCmp !== 0) return nameCmp;
      const ya = parseInt(String(a.seasonHint ?? "9999").slice(0, 4), 10);
      const yb = parseInt(String(b.seasonHint ?? "9999").slice(0, 4), 10);
      return (ya || 9999) - (yb || 9999) || a.id - b.id;
    });
  }

  const dismissedRows = await db
    .select({
      kind: adminDivergenceDismissalsTable.kind,
      entityId: adminDivergenceDismissalsTable.entityId,
    })
    .from(adminDivergenceDismissalsTable);
  const dismissed = new Set(
    dismissedRows.map((r) => `${r.kind}:${r.entityId}`),
  );

  const groups: DivergenceGroup[] = [];
  const dismissedGroups: DivergenceGroup[] = [];

  for (const g of rawGroups) {
    const active = g.items.filter((i) => !dismissed.has(`${g.kind}:${i.id}`));
    const ignored = g.items.filter((i) => dismissed.has(`${g.kind}:${i.id}`));
    if (active.length > 0) {
      groups.push({ ...g, items: active, count: active.length });
    }
    if (ignored.length > 0) {
      dismissedGroups.push({ ...g, items: ignored, count: ignored.length });
    }
  }

  groups.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "pt-BR"));
  dismissedGroups.sort(
    (a, b) => b.count - a.count || a.title.localeCompare(b.title, "pt-BR"),
  );

  return {
    groups,
    totalItems: groups.reduce((n, g) => n + g.count, 0),
    dismissedGroups,
    dismissedTotal: dismissedGroups.reduce((n, g) => n + g.count, 0),
    generatedAt: new Date().toISOString(),
  };
}

export async function dismissDivergence(
  kind: string,
  entityId: number,
  note?: string | null,
) {
  const k = String(kind ?? "").trim();
  if (!k || !Number.isFinite(entityId) || entityId <= 0) {
    throw Object.assign(new Error("kind/entityId inválidos"), { status: 400 });
  }
  await db
    .insert(adminDivergenceDismissalsTable)
    .values({ kind: k, entityId, note: note?.trim() || null })
    .onConflictDoNothing();
  return loadAdminDataDivergences();
}

export async function undismissDivergence(kind: string, entityId: number) {
  const k = String(kind ?? "").trim();
  if (!k || !Number.isFinite(entityId) || entityId <= 0) {
    throw Object.assign(new Error("kind/entityId inválidos"), { status: 400 });
  }
  await db
    .delete(adminDivergenceDismissalsTable)
    .where(
      and(
        eq(adminDivergenceDismissalsTable.kind, k),
        eq(adminDivergenceDismissalsTable.entityId, entityId),
      ),
    );
  return loadAdminDataDivergences();
}
