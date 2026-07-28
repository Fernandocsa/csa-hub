import { convertHalfMinute } from "./norm";
import {
  resolvePlayer,
  resolveOpponent,
  resolveCompetition,
  resolveManager,
  resolveReferee,
  findExistingMatch,
  countCsaLineups,
  type EntityCatalog,
} from "./resolve";
import type {
  ClaudeSeasonGame,
  PreviewGame,
  SeasonPreview,
  ResolvedName,
  FieldDiff,
  ExistingMatchSnap,
} from "./types";

function deriveResult(
  gf: number | null,
  ga: number | null,
  result: string | null | undefined,
): string {
  if (result && result !== "unknown") return result;
  if (gf == null || ga == null) return "unknown";
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

function isUnresolved(r: ResolvedName | null | undefined): boolean {
  if (!r) return false;
  if (r.createNew) return false;
  if (r.selectedId != null) return false;
  return r.status === "ambiguous" || r.status === "missing";
}

function countUnresolved(game: Omit<PreviewGame, "unresolvedCount">): number {
  let n = 0;
  if (isUnresolved(game.opponent)) n++;
  if (isUnresolved(game.competition)) n++;
  if (isUnresolved(game.manager)) n++;
  if (isUnresolved(game.referee)) n++;
  for (const p of game.starters) if (isUnresolved(p)) n++;
  for (const p of game.bench) if (isUnresolved(p)) n++;
  for (const g of game.goals) {
    if (!g.isOwnGoal && isUnresolved(g.scorer)) n++;
    if (isUnresolved(g.assist)) n++;
  }
  for (const s of game.substitutions) {
    if (isUnresolved(s.playerOut)) n++;
    if (isUnresolved(s.playerIn)) n++;
  }
  for (const c of game.cards) if (isUnresolved(c.player)) n++;
  return n;
}

function buildDiffs(
  existing: ExistingMatchSnap,
  proposed: {
    goalsFor: number | null;
    goalsAgainst: number | null;
    result: string;
    homeAway: string;
    phase: string | null;
    round: string | null;
    attendance: number | null;
    ownGoalsForCount: number;
    manager: ResolvedName | null;
    referee: ResolvedName | null;
    competition: ResolvedName;
  },
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const push = (
    field: string,
    label: string,
    current: string | number | null,
    next: string | number | null,
  ) => {
    if (String(current ?? "") === String(next ?? "")) return;
    diffs.push({ field, label, current, proposed: next, apply: true });
  };
  push("goalsFor", "Gols pró", existing.goalsFor, proposed.goalsFor);
  push("goalsAgainst", "Gols contra", existing.goalsAgainst, proposed.goalsAgainst);
  push("result", "Resultado", existing.result, proposed.result);
  push("homeAway", "Casa/fora", existing.homeAway, proposed.homeAway);
  push("phase", "Fase", existing.phase, proposed.phase);
  push("round", "Rodada", existing.round, proposed.round);
  push("attendance", "Público", existing.attendance, proposed.attendance);
  push("ownGoalsForCount", "Gols contra (próprios)", existing.ownGoalsForCount, proposed.ownGoalsForCount);
  push(
    "manager",
    "Técnico",
    existing.managerName,
    proposed.manager?.name ?? proposed.manager?.raw ?? null,
  );
  push(
    "referee",
    "Árbitro",
    existing.refereeName,
    proposed.referee?.name ?? proposed.referee?.raw ?? null,
  );
  push(
    "competition",
    "Competição",
    existing.competitionName,
    proposed.competition.name ?? proposed.competition.raw,
  );
  return diffs;
}

async function buildOneGame(
  g: ClaudeSeasonGame,
  index: number,
  cat: EntityCatalog,
): Promise<PreviewGame> {
  const opponent = resolveOpponent(g.opponentName, cat)!;
  const competition = resolveCompetition(g.competitionName, cat)!;
  const manager = resolveManager(g.managerName, cat);
  const referee = resolveReferee(g.refereeName, cat);

  const starters = (g.csaStarters ?? []).map((name, i) => {
    const r = resolvePlayer(name, cat)!;
    return { ...r, role: "starter" as const, sortOrder: i };
  });
  const bench = (g.csaBench ?? []).map((name, i) => {
    const r = resolvePlayer(name, cat)!;
    return { ...r, role: "bench" as const, sortOrder: i };
  });

  const goals = (g.csaGoals ?? []).map((goal) => {
    const half = (goal.half === 2 ? 2 : 1) as 1 | 2;
    const conv = convertHalfMinute(goal.minuteRaw, half);
    const isOwnGoal = Boolean(goal.isOwnGoal);
    return {
      isOwnGoal,
      scorer: isOwnGoal ? null : resolvePlayer(goal.scorerName, cat),
      assist: goal.assistName ? resolvePlayer(goal.assistName, cat) : null,
      minuteRaw: goal.minuteRaw,
      half,
      minute: conv.minute,
      injuryTimeMinute: conv.injuryTimeMinute,
    };
  });

  const ownFromGoals = goals.filter((x) => x.isOwnGoal).length;
  const ownGoalsForCount = Math.max(g.ownGoalsForCount ?? 0, ownFromGoals);

  const substitutions = (g.csaSubstitutions ?? []).map((s) => {
    const half = s.half === 1 || s.half === 2 ? s.half : null;
    const raw = s.minuteRaw ?? 0;
    const conv =
      half != null ? convertHalfMinute(raw, half) : { minute: raw || 0, injuryTimeMinute: null };
    return {
      playerOut: resolvePlayer(s.playerOut, cat)!,
      playerIn: resolvePlayer(s.playerIn, cat)!,
      minuteRaw: raw,
      half,
      minute: conv.minute,
      injuryTimeMinute: conv.injuryTimeMinute,
    };
  });

  const cards = (g.csaCards ?? []).map((c) => {
    const half = c.half === 1 || c.half === 2 ? c.half : null;
    const raw = c.minuteRaw ?? 0;
    const conv =
      half != null ? convertHalfMinute(raw, half) : { minute: raw || 0, injuryTimeMinute: null };
    return {
      player: resolvePlayer(c.playerName, cat)!,
      cardType: c.cardType,
      minute: conv.minute,
      injuryTimeMinute: conv.injuryTimeMinute,
    };
  });

  const goalsFor = g.goalsFor;
  const goalsAgainst = g.goalsAgainst;
  const result = deriveResult(goalsFor, goalsAgainst, g.result);

  const playerGoals = goals.filter((x) => !x.isOwnGoal).length;
  let scoreConsistencyWarning: string | null = null;
  if (goalsFor != null && playerGoals + ownGoalsForCount !== goalsFor) {
    scoreConsistencyWarning = `Placar GF=${goalsFor} ≠ gols CSA (${playerGoals}) + gols contra (${ownGoalsForCount})`;
  }

  const existingRow = await findExistingMatch({
    date: g.date,
    opponentId: opponent.id,
    opponentRaw: g.opponentName,
    homeAway: g.homeAway,
  });

  let existingMatch: ExistingMatchSnap | null = null;
  let overwriteSheet = true;
  let fieldDiffs: FieldDiff[] = [];

  if (existingRow) {
    const sheetLineupCount = await countCsaLineups(existingRow.id);
    existingMatch = { ...existingRow, sheetLineupCount };
    overwriteSheet = sheetLineupCount === 0;
    fieldDiffs = buildDiffs(existingMatch, {
      goalsFor,
      goalsAgainst,
      result,
      homeAway: g.homeAway,
      phase: g.phase?.trim() || null,
      round: g.round?.trim() || null,
      attendance: g.attendance ?? null,
      ownGoalsForCount,
      manager,
      referee,
      competition,
    });
  }

  const base = {
    key: `g${index}-${g.date}-${g.opponentName}`,
    include: true,
    date: g.date,
    homeAway: g.homeAway,
    opponent,
    competition,
    phase: g.phase?.trim() || null,
    round: g.round?.trim() || null,
    goalsFor,
    goalsAgainst,
    result,
    penaltiesFor: g.penaltiesFor ?? null,
    penaltiesAgainst: g.penaltiesAgainst ?? null,
    manager,
    referee,
    attendance: g.attendance ?? null,
    attendancePaid: g.attendancePaid ?? null,
    ownGoalsForCount,
    starters,
    bench,
    goals,
    substitutions,
    cards,
    notes: g.notes ?? [],
    scoreConsistencyWarning,
    existingMatch,
    overwriteSheet,
    fieldDiffs,
  };

  return { ...base, unresolvedCount: countUnresolved(base) };
}

export async function buildSeasonPreview(
  seasonYear: number,
  games: ClaudeSeasonGame[],
  cat: EntityCatalog,
): Promise<SeasonPreview> {
  const built: PreviewGame[] = [];
  for (let i = 0; i < games.length; i++) {
    built.push(await buildOneGame(games[i], i, cat));
  }
  const unresolved = built.reduce((a, g) => a + g.unresolvedCount, 0);
  const existing = built.filter((g) => g.existingMatch).length;
  return {
    seasonYear,
    games: built,
    summary: {
      total: built.length,
      unresolved,
      existing,
      create: built.length - existing,
    },
  };
}

/** Recompute unresolved counts after UI resolutions patched into preview. */
export function refreshUnresolved(preview: SeasonPreview): SeasonPreview {
  const games = preview.games.map((g) => {
    const { unresolvedCount: _, ...rest } = g;
    return { ...rest, unresolvedCount: countUnresolved(rest) };
  });
  return {
    ...preview,
    games,
    summary: {
      ...preview.summary,
      total: games.length,
      unresolved: games.reduce((a, g) => a + g.unresolvedCount, 0),
      existing: games.filter((g) => g.existingMatch).length,
      create: games.filter((g) => !g.existingMatch).length,
    },
  };
}
