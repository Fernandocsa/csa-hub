import { db } from "@workspace/db";
import {
  matchesTable,
  playersTable,
  opponentsTable,
  competitionsTable,
  managersTable,
  refereesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { replaceCsaMatchSheet } from "../match-sheet";
import type { SeasonPreview, ResolvedName, PreviewGame } from "./types";

function effectiveId(r: ResolvedName | null | undefined): number | null {
  if (!r) return null;
  if (r.selectedId != null) return r.selectedId;
  if (r.createNew) return null;
  if (r.status === "exact" || r.status === "fuzzy" || r.status === "resolved") return r.id;
  return null;
}

async function ensurePlayer(r: ResolvedName): Promise<{ id: number; name: string }> {
  const id = effectiveId(r);
  if (id != null) {
    const [row] = await db
      .select({ id: playersTable.id, name: playersTable.name })
      .from(playersTable)
      .where(eq(playersTable.id, id));
    if (row) return row;
  }
  if (r.createNew || r.status === "missing") {
    const [created] = await db
      .insert(playersTable)
      .values({ name: r.raw.trim() })
      .returning({ id: playersTable.id, name: playersTable.name });
    return created;
  }
  throw new Error(`Jogador não resolvido: ${r.raw}`);
}

async function ensureOpponent(r: ResolvedName): Promise<number> {
  const id = effectiveId(r);
  if (id != null) return id;
  const [created] = await db
    .insert(opponentsTable)
    .values({ name: r.raw.trim() })
    .returning({ id: opponentsTable.id });
  return created.id;
}

async function ensureCompetition(r: ResolvedName): Promise<number> {
  const id = effectiveId(r);
  if (id != null) return id;
  const [created] = await db
    .insert(competitionsTable)
    .values({ name: r.raw.trim() })
    .returning({ id: competitionsTable.id });
  return created.id;
}

async function ensureManager(r: ResolvedName | null): Promise<number | null> {
  if (!r) return null;
  const id = effectiveId(r);
  if (id != null) return id;
  if (r.createNew || r.status === "missing") {
    const [created] = await db
      .insert(managersTable)
      .values({ name: r.raw.trim() })
      .returning({ id: managersTable.id });
    return created.id;
  }
  return null;
}

async function ensureReferee(r: ResolvedName | null): Promise<number | null> {
  if (!r) return null;
  const id = effectiveId(r);
  if (id != null) return id;
  if (r.createNew || r.status === "missing") {
    const [created] = await db
      .insert(refereesTable)
      .values({ name: r.raw.trim() })
      .returning({ id: refereesTable.id });
    return created.id;
  }
  return null;
}

function applyDiffs(game: PreviewGame): Set<string> {
  const set = new Set<string>();
  for (const d of game.fieldDiffs) {
    if (d.apply) set.add(d.field);
  }
  // new match: apply everything
  if (!game.existingMatch) {
    for (const f of [
      "goalsFor",
      "goalsAgainst",
      "result",
      "homeAway",
      "phase",
      "round",
      "attendance",
      "ownGoalsForCount",
      "manager",
      "referee",
      "competition",
    ]) {
      set.add(f);
    }
  }
  return set;
}

export async function commitSeasonPreview(preview: SeasonPreview): Promise<{
  created: number;
  updated: number;
  sheetsApplied: number;
  errors: string[];
}> {
  let created = 0;
  let updated = 0;
  let sheetsApplied = 0;
  const errors: string[] = [];

  for (const game of preview.games) {
    if (!game.include) continue;
    if (game.unresolvedCount > 0) {
      errors.push(`${game.date} ${game.opponent.raw}: ainda há ambiguidades`);
      continue;
    }
    try {
      const opponentId = await ensureOpponent(game.opponent);
      const competitionId = await ensureCompetition(game.competition);
      const managerId = await ensureManager(game.manager);
      const refereeId = await ensureReferee(game.referee);
      const apply = applyDiffs(game);

      const values: Record<string, unknown> = {
        matchDate: game.date,
        season: String(preview.seasonYear),
        opponentId,
        homeAway: game.homeAway,
        competitionId,
        isWalkover: false,
        isFriendly: false,
      };

      if (apply.has("goalsFor")) values.goalsFor = game.goalsFor;
      if (apply.has("goalsAgainst")) values.goalsAgainst = game.goalsAgainst;
      if (apply.has("result")) values.result = game.result;
      if (apply.has("homeAway")) values.homeAway = game.homeAway;
      if (apply.has("phase")) values.phase = game.phase;
      if (apply.has("round")) values.round = game.round;
      if (apply.has("attendance")) values.attendance = game.attendance;
      if (apply.has("ownGoalsForCount")) values.ownGoalsForCount = game.ownGoalsForCount;
      if (apply.has("manager")) values.managerId = managerId;
      if (apply.has("referee")) values.refereeId = refereeId;
      if (apply.has("competition")) values.competitionId = competitionId;
      if (game.penaltiesFor != null) values.penaltiesFor = game.penaltiesFor;
      if (game.penaltiesAgainst != null) values.penaltiesAgainst = game.penaltiesAgainst;

      // Required NOT NULL on create
      if (!game.existingMatch) {
        values.goalsFor = game.goalsFor;
        values.goalsAgainst = game.goalsAgainst;
        values.result = game.result || "unknown";
        values.ownGoalsForCount = game.ownGoalsForCount;
        values.managerId = managerId;
        values.refereeId = refereeId;
        values.phase = game.phase;
        values.round = game.round;
        values.attendance = game.attendance;
      }

      let matchId: number;
      if (game.existingMatch) {
        await db
          .update(matchesTable)
          .set(values)
          .where(eq(matchesTable.id, game.existingMatch.id));
        matchId = game.existingMatch.id;
        updated++;
      } else {
        const [ins] = await db
          .insert(matchesTable)
          .values(values as typeof matchesTable.$inferInsert)
          .returning({ id: matchesTable.id });
        matchId = ins.id;
        created++;
      }

      const shouldSheet =
        game.overwriteSheet || !game.existingMatch || game.existingMatch.sheetLineupCount === 0;
      if (shouldSheet && (game.starters.length > 0 || game.goals.length > 0)) {
        const playerCache = new Map<string, { id: number; name: string }>();
        const resolveP = async (r: ResolvedName) => {
          const key = `${effectiveId(r) ?? "new"}:${r.raw}`;
          if (playerCache.has(key)) return playerCache.get(key)!;
          const p = await ensurePlayer(r);
          playerCache.set(key, p);
          return p;
        };

        const lineups = [];
        for (const s of game.starters) {
          const p = await resolveP(s);
          lineups.push({
            playerId: p.id,
            playerName: p.name,
            role: "starter" as const,
            sortOrder: s.sortOrder ?? 0,
            side: "csa" as const,
          });
        }
        for (const s of game.bench) {
          const p = await resolveP(s);
          lineups.push({
            playerId: p.id,
            playerName: p.name,
            role: "bench" as const,
            sortOrder: s.sortOrder ?? 0,
            side: "csa" as const,
          });
        }
        // Subs may introduce players only on bench implicitly
        for (const s of game.substitutions) {
          for (const side of [s.playerOut, s.playerIn]) {
            const p = await resolveP(side);
            if (!lineups.some((l) => l.playerId === p.id)) {
              lineups.push({
                playerId: p.id,
                playerName: p.name,
                role: "bench" as const,
                sortOrder: lineups.length,
                side: "csa" as const,
              });
            }
          }
        }

        const goals = [];
        for (const g of game.goals) {
          if (g.isOwnGoal) continue;
          if (!g.scorer) continue;
          const scorer = await resolveP(g.scorer);
          const assist = g.assist ? await resolveP(g.assist) : null;
          goals.push({
            scorerPlayerId: scorer.id,
            scorerName: scorer.name,
            assistPlayerId: assist?.id ?? null,
            assistName: assist?.name ?? null,
            minute: g.minute,
            injuryTimeMinute: g.injuryTimeMinute,
            side: "csa" as const,
          });
        }

        const substitutions = [];
        for (const s of game.substitutions) {
          const out = await resolveP(s.playerOut);
          const inn = await resolveP(s.playerIn);
          substitutions.push({
            playerOutId: out.id,
            playerOutName: out.name,
            playerInId: inn.id,
            playerInName: inn.name,
            minute: s.minute,
            injuryTimeMinute: s.injuryTimeMinute,
            side: "csa" as const,
          });
        }

        const cards = [];
        for (const c of game.cards) {
          const p = await resolveP(c.player);
          cards.push({
            cardType: c.cardType,
            playerId: p.id,
            playerName: p.name,
            minute: c.minute,
            injuryTimeMinute: c.injuryTimeMinute,
            side: "csa" as const,
          });
        }

        await replaceCsaMatchSheet(matchId, { lineups, goals, cards, substitutions });
        sheetsApplied++;
      }
    } catch (err) {
      errors.push(
        `${game.date} ${game.opponent.raw}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { created, updated, sheetsApplied, errors };
}
