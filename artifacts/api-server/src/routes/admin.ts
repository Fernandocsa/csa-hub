import { Router } from "express";
import crypto from "node:crypto";
import { db, pool as pgPool } from "@workspace/db";
import {
  playersTable,
  playerSeasonStatsTable,
  playerSeasonNameAliasesTable,
  matchesTable,
  opponentsTable,
  stadiumsTable,
  competitionsTable,
  managersTable,
  managerSeasonStatsTable,
  refereesTable,
  nextMatchTable,
  entityBadgesTable,
  seasonsTable,
  commentsTable,
  suggestionsTable,
  ratingsTable,
  seasonCompetitionStatsTable,
  transfersTable,
  presidentsTable,
  siteContentTable,
  matchLineupsTable,
} from "@workspace/db";
import {
  isRatingEntityType,
  ratingLabel,
  type RatingEntityType,
} from "../lib/rating-labels";
import {
  getAdminQueue,
  blockDailyPlayer,
  unblockDailyPlayer,
  replaceDailyPlayer,
} from "../lib/guess-player";
import { eq, asc, desc, sql, ilike, and, or, inArray, notInArray, ne, isNull, lt, gt } from "drizzle-orm";
import { accentInsensitiveLike } from "../lib/accent-fold";
import { loadMatchSheet, replaceCsaMatchSheet, replaceCsaLineup, replaceCsaSubstitutions, appendCsaEvents, deleteMatchGoal, deleteMatchCard, deleteMatchManagerCard, deleteMatchPenaltyEvent, updateMatchGoal } from "../lib/match-sheet";
import { syncRelatedMatchLink, parsePenaltyShootoutFields } from "../lib/match-links";
import { findDuplicateNameCandidates } from "../lib/admin-name-check";
import {
  buildAndWriteCsaSheet,
  computeOwnGoalsForCount,
  loadEntityMaps,
  parsePenaltyShootout,
  resolveNamesForRow,
  type NameResolution,
} from "../lib/csv-match-import";
import { runPlayersCsvImport } from "../lib/csv-match-import/players-import";
import {
  recalculateSeasonAutoBadges,
  setSeasonStatsVerification,
  getSeasonCompetitionBadgeStatuses,
} from "../lib/auto-badges";
import { unknownResultMatchConditions } from "../lib/match-filters";
import { loadAdminDataDivergences, dismissDivergence, undismissDivergence } from "../lib/admin-data-divergences";
import {
  loadBirthdays,
  parseYmd,
  saoPauloYmd,
} from "../lib/birthdays";
import {
  buildManualBadgeLabel,
  deriveBadgeYearFromMatch,
  duplicateManualBadgeMessage,
  parseMatchId,
  parseCompetitionId,
  parseSeasonYear,
  templateNeedsMatch,
  validateManualBadgeInput,
} from "../lib/manual-badge-templates";
import {
  managerStoredStatsChanged,
  periodFromSeasons,
  recalculateManagerSeasonStats,
  syncManagerCareerFromSeasonRows,
} from "../lib/manager-stats";
import { syncPlayerSeasonStatsFromSheets } from "../lib/player-stats-floor";
import {
  listSeasonCompetitionStats,
  recalculateSeasonCompetitionStats,
} from "../lib/season-competition-stats";
import { computeClubRecords } from "../lib/records";
import { resolveTransferOpponentId } from "../lib/transfer-opponent";
import {
  listChampionCampaigns,
  playerIdsForChampionCampaign,
  managerIdsForChampionCampaign,
} from "../lib/titles";
import countriesList from "../../../portal-marujo/src/lib/countries.json" with { type: "json" };

const VALID_COUNTRY_CODES = new Set(
  (countriesList as { code: string }[]).map((c) => c.code.toUpperCase()),
);

const VALID_BRAZIL_UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

function normalizeOptionalUf(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null || String(raw).trim() === "") return { ok: true, value: null };
  const uf = String(raw).trim().toUpperCase();
  if (!VALID_BRAZIL_UFS.has(uf)) {
    return { ok: false, error: "UF inválida (use sigla brasileira, ex: AL)" };
  }
  return { ok: true, value: uf };
}

const NEXT_MATCH_ID = 1;

const router = Router();

function getAdminToken(): string {
  const secret = process.env.SESSION_SECRET ?? "fallback-secret";
  const password = process.env.ADMIN_PASSWORD ?? "admin";
  return crypto.createHmac("sha256", secret).update(`marujo-admin:${password}`).digest("hex");
}

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  const token = auth.slice(7);
  if (token !== getAdminToken()) {
    return res.status(401).json({ error: "Token inválido" });
  }
  next();
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] ?? "";
      });
      return row;
    });
}

function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown): string => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join(
    "\n",
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────

router.post("/admin/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";
  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: "Senha incorreta" });
  }
  res.json({ token: getAdminToken() });
});

router.get("/admin/session", requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

router.get("/admin/birthdays", requireAdmin, async (req, res) => {
  try {
    const raw = typeof req.query.date === "string" ? req.query.date : null;
    const ymd = parseYmd(raw) ?? saoPauloYmd();
    const data = await loadBirthdays(ymd, true);
    res.json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Next match (Home card singleton) ──────────────────────────────────────────

function serializeNextMatch(row: typeof nextMatchTable.$inferSelect) {
  return {
    opponent: row.opponent,
    matchDate: row.matchDate,
    competition: row.competition,
    homeAway: row.homeAway,
    stadium: row.stadium,
    opponentId: row.opponentId ?? null,
    matchId: row.matchId ?? null,
  };
}

router.get("/admin/next-match", requireAdmin, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(nextMatchTable)
      .where(eq(nextMatchTable.id, NEXT_MATCH_ID))
      .limit(1);
    res.json(row ? serializeNextMatch(row) : null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/next-match", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      opponent?: string;
      matchDate?: string;
      competition?: string;
      homeAway?: string;
      stadium?: string | null;
      opponentId?: number | null;
      matchId?: number | null;
      clear?: boolean;
    };

    if (body.clear === true) {
      await db.delete(nextMatchTable).where(eq(nextMatchTable.id, NEXT_MATCH_ID));
      return res.json(null);
    }

    const opponent = body.opponent?.trim() ?? "";
    const matchDate = body.matchDate?.trim() ?? "";
    const competition = body.competition?.trim() ?? "";
    const homeAway = body.homeAway?.trim() ?? "";
    const stadium = body.stadium?.trim() ? body.stadium.trim() : null;
    const opponentId =
      body.opponentId == null || body.opponentId === ("" as unknown)
        ? null
        : Number(body.opponentId);
    const matchId =
      body.matchId == null || body.matchId === ("" as unknown)
        ? null
        : Number(body.matchId);

    if (!opponent || !matchDate || !competition) {
      return res.status(400).json({ error: "adversário, data e competição são obrigatórios" });
    }
    if (homeAway !== "home" && homeAway !== "away") {
      return res.status(400).json({ error: "mando deve ser home ou away" });
    }
    if (opponentId != null && !Number.isInteger(opponentId)) {
      return res.status(400).json({ error: "opponentId inválido" });
    }
    if (matchId != null && !Number.isInteger(matchId)) {
      return res.status(400).json({ error: "matchId inválido" });
    }

    const [row] = await db
      .insert(nextMatchTable)
      .values({
        id: NEXT_MATCH_ID,
        opponent,
        matchDate,
        competition,
        homeAway,
        stadium,
        opponentId,
        matchId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: nextMatchTable.id,
        set: {
          opponent,
          matchDate,
          competition,
          homeAway,
          stadium,
          opponentId,
          matchId,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json(serializeNextMatch(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Lookup (dropdowns) ────────────────────────────────────────────────────────

router.get("/admin/lookup", requireAdmin, async (req, res) => {
  try {
    const [opponents, competitions, stadiums, managers, referees] = await Promise.all([
      db.select().from(opponentsTable).orderBy(asc(opponentsTable.name)),
      db.select().from(competitionsTable).orderBy(asc(competitionsTable.name)),
      db.select().from(stadiumsTable).orderBy(asc(stadiumsTable.name)),
      db.select().from(managersTable).orderBy(asc(managersTable.name)),
      db
        .select({
          id: refereesTable.id,
          name: refereesTable.name,
          state: refereesTable.state,
        })
        .from(refereesTable)
        .orderBy(asc(refereesTable.name)),
    ]);
    res.json({ opponents, competitions, stadiums, managers, referees });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Players ───────────────────────────────────────────────────────────────────

router.get("/admin/players", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(playersTable).orderBy(asc(playersTable.name));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/players/name-check", requireAdmin, async (req, res) => {
  try {
    const q = String((req.query as { q?: string }).q ?? "").trim();
    const fullName = String((req.query as { fullName?: string }).fullName ?? "").trim();
    const excludeRaw = (req.query as { excludeId?: string }).excludeId;
    const excludeId = excludeRaw != null && excludeRaw !== "" ? parseInt(excludeRaw, 10) : null;
    if (!q && !fullName) {
      return res.json({ matches: [] });
    }
    const rows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        fullName: playersTable.fullName,
        photoUrl: playersTable.photoUrl,
      })
      .from(playersTable);
    const matches = findDuplicateNameCandidates(
      { name: q, fullName },
      rows,
      Number.isInteger(excludeId) ? excludeId : null,
    ).slice(0, 8);
    res.json({ matches });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Substring search on display name + full name (for Ogol confirm / pickers). */
router.get("/admin/players/search", requireAdmin, async (req, res) => {
  try {
    const q = String((req.query as { q?: string }).q ?? "").trim();
    const limitRaw = parseInt(String((req.query as { limit?: string }).limit ?? "20"), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 40) : 20;
    if (q.length < 2) return res.json([]);

    const rows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        fullName: playersTable.fullName,
        position: playersTable.position,
        photoUrl: playersTable.photoUrl,
      })
      .from(playersTable)
      .where(
        or(
          accentInsensitiveLike(playersTable.name, q),
          accentInsensitiveLike(playersTable.fullName, q),
        ),
      )
      .orderBy(asc(playersTable.name))
      .limit(limit);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/players/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, id));
    if (!player) return res.status(404).json({ error: "Jogador não encontrado" });
    const [linkedManager] = await db
      .select({ id: managersTable.id, name: managersTable.name })
      .from(managersTable)
      .where(eq(managersTable.playerId, id))
      .limit(1);
    res.json({
      ...player,
      linkedManagerId: linkedManager?.id ?? null,
      linkedManagerName: linkedManager?.name ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/players", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      name: string;
      fullName?: string | null;
      position?: string | null;
      secondaryPositions?: string[] | null;
      nationality?: string | null;
      photoUrl?: string | null;
      birthYear?: number | null;
      birthDate?: string | null;
      birthCity?: string | null;
      birthState?: string | null;
      birthCountry?: string | null;
      preferredFoot?: string | null;
      heightCm?: number | null;
      weightKg?: number | null;
      isDeceased?: boolean;
      verificationStatus?: string | null;
      verifiedBy?: string | null;
      linkedManagerId?: number | null;
    };
    if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });

    const foot = body.preferredFoot?.trim() || null;
    if (foot && !["destro", "canhoto", "ambidestro"].includes(foot)) {
      return res.status(400).json({ error: "Pé preferencial inválido" });
    }
    const verificationStatus = body.verificationStatus === "verified" ? "verified" : "unverified";
    const verifiedBy = verificationStatus === "verified" ? body.verifiedBy?.trim() || null : null;
    const verifiedAt = verificationStatus === "verified" ? new Date() : null;
    const birthDate = body.birthDate?.trim() || null;
    const birthYear =
      birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
        ? parseInt(birthDate.slice(0, 4), 10)
        : body.birthYear ?? null;
    const primaryPosition = body.position?.trim() || null;
    const secondaryPositions = Array.isArray(body.secondaryPositions)
      ? [
          ...new Set(
            body.secondaryPositions
              .map((p) => (typeof p === "string" ? p.trim() : ""))
              .filter((p) => p && p !== primaryPosition),
          ),
        ]
      : [];

    const birthCountry = body.birthCountry?.trim() || null;
    const nationality =
      birthCountry ||
      (typeof body.nationality === "string" ? body.nationality.trim() || null : null);

    const [player] = await db
      .insert(playersTable)
      .values({
        name: body.name.trim(),
        fullName: body.fullName?.trim() || null,
        position: primaryPosition,
        secondaryPositions,
        nationality,
        photoUrl: body.photoUrl?.trim() || null,
        birthYear,
        birthDate,
        birthCity: body.birthCity?.trim() || null,
        birthState: body.birthState?.trim() || null,
        birthCountry,
        preferredFoot: foot,
        heightCm: body.heightCm ?? null,
        weightKg: body.weightKg ?? null,
        isDeceased: body.isDeceased ?? false,
        verificationStatus,
        verifiedAt,
        verifiedBy,
      })
      .returning();

    if (body.linkedManagerId != null && body.linkedManagerId !== ("" as unknown)) {
      const linkedManagerId = Number(body.linkedManagerId);
      if (Number.isInteger(linkedManagerId) && linkedManagerId > 0) {
        const [mgr] = await db
          .select({ id: managersTable.id })
          .from(managersTable)
          .where(eq(managersTable.id, linkedManagerId))
          .limit(1);
        if (mgr) {
          await db
            .update(managersTable)
            .set({ playerId: null })
            .where(eq(managersTable.playerId, player.id));
          await db
            .update(managersTable)
            .set({ playerId: player.id })
            .where(eq(managersTable.id, linkedManagerId));
        }
      }
    }

    const [linkedManager] = await db
      .select({ id: managersTable.id, name: managersTable.name })
      .from(managersTable)
      .where(eq(managersTable.playerId, player.id))
      .limit(1);
    res.status(201).json({
      ...player,
      linkedManagerId: linkedManager?.id ?? null,
      linkedManagerName: linkedManager?.name ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/players/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const body = req.body as {
      name: string;
      fullName?: string | null;
      position?: string | null;
      secondaryPositions?: string[] | null;
      nationality?: string | null;
      photoUrl?: string | null;
      birthYear?: number | null;
      birthDate?: string | null;
      birthCity?: string | null;
      birthState?: string | null;
      birthCountry?: string | null;
      preferredFoot?: string | null;
      heightCm?: number | null;
      weightKg?: number | null;
      isDeceased?: boolean;
      verificationStatus?: string | null;
      verifiedBy?: string | null;
      linkedManagerId?: number | null;
    };
    if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });

    const foot = body.preferredFoot?.trim() || null;
    if (foot && !["destro", "canhoto", "ambidestro"].includes(foot)) {
      return res.status(400).json({ error: "Pé preferencial inválido" });
    }
    const verificationStatus = body.verificationStatus === "verified" ? "verified" : "unverified";
    const verifiedBy = verificationStatus === "verified" ? body.verifiedBy?.trim() || null : null;
    const verifiedAt = verificationStatus === "verified" ? new Date() : null;
    const birthDate = body.birthDate?.trim() || null;
    const birthYear =
      birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
        ? parseInt(birthDate.slice(0, 4), 10)
        : body.birthYear ?? null;
    const primaryPosition = body.position?.trim() || null;
    const secondaryPositions = Array.isArray(body.secondaryPositions)
      ? [
          ...new Set(
            body.secondaryPositions
              .map((p) => (typeof p === "string" ? p.trim() : ""))
              .filter((p) => p && p !== primaryPosition),
          ),
        ]
      : [];

    const birthCountry = body.birthCountry?.trim() || null;
    const nationality =
      birthCountry ||
      (typeof body.nationality === "string" ? body.nationality.trim() || null : null);

    const [updated] = await db
      .update(playersTable)
      .set({
        name: body.name.trim(),
        fullName: body.fullName?.trim() || null,
        position: primaryPosition,
        secondaryPositions,
        nationality,
        photoUrl: body.photoUrl?.trim() || null,
        birthYear,
        birthDate,
        birthCity: body.birthCity?.trim() || null,
        birthState: body.birthState?.trim() || null,
        birthCountry,
        preferredFoot: foot,
        heightCm: body.heightCm ?? null,
        weightKg: body.weightKg ?? null,
        isDeceased: body.isDeceased ?? false,
        verificationStatus,
        verifiedAt,
        verifiedBy,
      })
      .where(eq(playersTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Jogador não encontrado" });

    // Lineup rows store a position snapshot; keep them aligned with the catalog
    // so public match sheets reflect admin position edits.
    await db
      .update(matchLineupsTable)
      .set({ position: primaryPosition })
      .where(eq(matchLineupsTable.playerId, id));

    if (Object.prototype.hasOwnProperty.call(body, "linkedManagerId")) {
      const raw = body.linkedManagerId;
      const linkedManagerId =
        raw == null || raw === ("" as unknown) ? null : Number(raw);
      if (linkedManagerId != null && (!Number.isInteger(linkedManagerId) || linkedManagerId < 1)) {
        return res.status(400).json({ error: "linkedManagerId inválido" });
      }
      if (linkedManagerId != null) {
        const [mgr] = await db
          .select({ id: managersTable.id })
          .from(managersTable)
          .where(eq(managersTable.id, linkedManagerId))
          .limit(1);
        if (!mgr) return res.status(400).json({ error: "Técnico vinculado não encontrado" });
      }
      // Detach this player from any manager, then attach to the chosen one.
      await db
        .update(managersTable)
        .set({ playerId: null })
        .where(eq(managersTable.playerId, id));
      if (linkedManagerId != null) {
        await db
          .update(managersTable)
          .set({ playerId: id })
          .where(eq(managersTable.id, linkedManagerId));
      }
    }

    const [linkedManager] = await db
      .select({ id: managersTable.id, name: managersTable.name })
      .from(managersTable)
      .where(eq(managersTable.playerId, id))
      .limit(1);
    res.json({
      ...updated,
      linkedManagerId: linkedManager?.id ?? null,
      linkedManagerName: linkedManager?.name ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/players/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    await db.delete(playerSeasonStatsTable).where(eq(playerSeasonStatsTable.playerId, id));
    await db.delete(playersTable).where(eq(playersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Player Season Stats ───────────────────────────────────────────────────────

router.get("/admin/players/:id/stats", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const stats = await db
      .select()
      .from(playerSeasonStatsTable)
      .where(eq(playerSeasonStatsTable.playerId, id))
      .orderBy(desc(playerSeasonStatsTable.season));
    res.json(stats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/players/:id/stats", requireAdmin, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) return res.status(400).json({ error: "ID inválido" });
    const { season, appearances, goals, assists } = req.body as {
      season: string;
      appearances: number;
      goals: number;
      assists?: number;
    };
    if (!season) return res.status(400).json({ error: "Temporada obrigatória" });
    const [stat] = await db
      .insert(playerSeasonStatsTable)
      .values({
        playerId,
        season,
        appearances: appearances ?? 0,
        goals: goals ?? 0,
        assists: assists ?? 0,
      })
      .returning();
    res.status(201).json(stat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/player-stats/:statId", requireAdmin, async (req, res) => {
  try {
    const statId = parseInt(req.params.statId);
    if (isNaN(statId)) return res.status(400).json({ error: "ID inválido" });
    const { season, appearances, goals, assists } = req.body as {
      season: string;
      appearances: number;
      goals: number;
      assists?: number;
    };
    const [updated] = await db
      .update(playerSeasonStatsTable)
      .set({ season, appearances: appearances ?? 0, goals: goals ?? 0, assists: assists ?? 0 })
      .where(eq(playerSeasonStatsTable.id, statId))
      .returning();
    if (!updated) return res.status(404).json({ error: "Stat não encontrada" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/player-stats/:statId", requireAdmin, async (req, res) => {
  try {
    const statId = parseInt(req.params.statId);
    if (isNaN(statId)) return res.status(400).json({ error: "ID inválido" });
    await db.delete(playerSeasonStatsTable).where(eq(playerSeasonStatsTable.id, statId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/players/:id/stats/bulk", requireAdmin, async (req, res) => {
  const client = await pgPool.connect();
  try {
    const playerId = parseInt(req.params.id, 10);
    if (isNaN(playerId)) return res.status(400).json({ error: "ID inválido" });

    const raw = (req.body as { stats?: unknown })?.stats;
    if (!Array.isArray(raw)) {
      return res.status(400).json({ error: "stats deve ser um array" });
    }
    if (raw.length === 0) {
      return res.json([]);
    }

    const updates: { id: number; appearances: number; goals: number; assists: number }[] = [];
    for (const row of raw) {
      const item = row as {
        id?: unknown;
        appearances?: unknown;
        goals?: unknown;
        assists?: unknown;
      };
      const id = typeof item.id === "number" ? item.id : parseInt(String(item.id), 10);
      const appearances =
        typeof item.appearances === "number"
          ? item.appearances
          : parseInt(String(item.appearances ?? 0), 10);
      const goals =
        typeof item.goals === "number" ? item.goals : parseInt(String(item.goals ?? 0), 10);
      const assists =
        typeof item.assists === "number" ? item.assists : parseInt(String(item.assists ?? 0), 10);
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "id de stat inválido" });
      }
      if (
        !Number.isInteger(appearances) ||
        appearances < 0 ||
        !Number.isInteger(goals) ||
        goals < 0 ||
        !Number.isInteger(assists) ||
        assists < 0
      ) {
        return res.status(400).json({ error: "valores numéricos inválidos" });
      }
      updates.push({ id, appearances, goals, assists });
    }

    await client.query("BEGIN");
    const updated = [];
    for (const u of updates) {
      const r = await client.query(
        `UPDATE player_season_stats
         SET appearances = $1, goals = $2, assists = $3
         WHERE id = $4 AND player_id = $5
         RETURNING id, player_id, season, appearances, goals, assists`,
        [u.appearances, u.goals, u.assists, u.id, playerId],
      );
      if (r.rowCount !== 1) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          error: `Stat ${u.id} não encontrada para este jogador`,
        });
      }
      const row = r.rows[0];
      updated.push({
        id: row.id,
        playerId: row.player_id,
        season: row.season,
        appearances: row.appearances,
        goals: row.goals,
        assists: row.assists,
      });
    }
    await client.query("COMMIT");
    res.json(updated);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  } finally {
    client.release();
  }
});

// ── Matches ───────────────────────────────────────────────────────────────────

// Standardize Alagoano club names: append -AL to all clubs that play in Alagoano competitions
router.post("/admin/fix/alagoano-names", requireAdmin, async (req, res) => {
  try {
    // Alagoano competition IDs: Campeonato Alagoano (5), Copa Alagoas (12), Alagoano 2ª Divisão (14)
    const ALAGOANO_COMPS = [5, 12, 14];

    // Step 1: Move Corinthians-SP (national) Alagoano matches to Corinthians-AL
    // Find Corinthians-SP and Corinthians-AL by name
    const [corpSP] = await db.select().from(opponentsTable).where(eq(opponentsTable.name, "Corinthians-SP"));
    const [corpAL] = await db.select().from(opponentsTable).where(eq(opponentsTable.name, "Corinthians-AL"));
    let corinthiansLog = "Corinthians-SP not found or Corinthians-AL not found — skipped";
    if (corpSP && corpAL) {
      const result = await db.update(matchesTable)
        .set({ opponentId: corpAL.id })
        .where(sql`${matchesTable.opponentId} = ${corpSP.id} AND ${matchesTable.competitionId} IN (${sql.join(ALAGOANO_COMPS.map(id => sql`${id}`), sql`, `)})`);
      corinthiansLog = `Moved Corinthians-SP Alagoano matches → Corinthians-AL`;
    }

    // Step 2: Find all opponents in Alagoano competitions without -AL suffix (and not CSA or state-suffixed)
    const alagoanoOpponents = await db
      .selectDistinct({ id: matchesTable.opponentId })
      .from(matchesTable)
      .where(sql`${matchesTable.competitionId} = ANY(ARRAY[5,12,14]::int[])`);

    const ids = alagoanoOpponents.map(r => r.id);
    if (ids.length === 0) return res.json({ ok: true, renamed: 0, log: [corinthiansLog] });

    const candidates = await db.select().from(opponentsTable)
      .where(sql`${opponentsTable.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}]::int[])`);

    const EXCLUDED_SUFFIXES = ["-AL", "-SP", "-MG", "-PE", "-BA", "-RN", "-RS", "-ES", "-PI"];
    const toRename = candidates.filter(o =>
      o.name !== "CSA" &&
      !EXCLUDED_SUFFIXES.some(suffix => o.name.endsWith(suffix))
    );

    const log: string[] = [corinthiansLog];
    for (const opp of toRename) {
      const newName = opp.name + "-AL";
      await db.update(opponentsTable).set({ name: newName }).where(eq(opponentsTable.id, opp.id));
      log.push(`${opp.id}: "${opp.name}" → "${newName}"`);
    }

    res.json({ ok: true, renamed: toRename.length, log });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// One-shot fix for 2015 Campeonato Alagoano inconsistencies
router.post("/admin/fix/2015-alagoano", requireAdmin, async (req, res) => {
  try {
    const COMP = 5; // Campeonato Alagoano
    const SEASON = "2015";
    const CEO_ID = 85;
    const MURICI_ID = 44;

    // Find all 2015 Alagoano matches involving CEO
    const ceoMatches = await db
      .select()
      .from(matchesTable)
      .where(
        sql`${matchesTable.season} = ${SEASON}
        AND ${matchesTable.competitionId} = ${COMP}
        AND ${matchesTable.opponentId} = ${CEO_ID}`
      )
      .orderBy(matchesTable.matchDate);

    // Find any Murici match on 2015-02-01
    const muriciOnFeb1 = await db
      .select()
      .from(matchesTable)
      .where(
        sql`${matchesTable.season} = ${SEASON}
        AND ${matchesTable.competitionId} = ${COMP}
        AND ${matchesTable.opponentId} = ${MURICI_ID}
        AND ${matchesTable.matchDate} = '2015-02-01'`
      );

    const log: string[] = [];

    // Fix 1: CEO match on 01/03 that is home+1-1+draw → should be 08/02 (game #4)
    const wrongDateMatch = ceoMatches.find(
      m => m.matchDate === "2015-03-01" && m.homeAway === "home" && m.goalsFor === 1 && m.goalsAgainst === 1
    );
    if (wrongDateMatch) {
      await db.update(matchesTable)
        .set({ matchDate: "2015-02-08" })
        .where(eq(matchesTable.id, wrongDateMatch.id));
      log.push(`Fixed date of match ${wrongDateMatch.id}: 2015-03-01 → 2015-02-08`);
    }

    // Fix 2: Delete duplicate CEO match on 17/04 (wrong, erroneously classified)
    const dupMatch = ceoMatches.find(
      m => m.matchDate === "2015-04-17" && m.homeAway === "away"
    );
    if (dupMatch) {
      await db.delete(matchesTable).where(eq(matchesTable.id, dupMatch.id));
      log.push(`Deleted duplicate CEO match ${dupMatch.id} (2015-04-17)`);
    }

    // Fix 3: Insert missing Murici 01/02 (away, 1-1, draw) if not present
    if (muriciOnFeb1.length === 0) {
      const [m] = await db.insert(matchesTable).values({
        matchDate: "2015-02-01", season: SEASON, opponentId: MURICI_ID,
        goalsFor: 1, goalsAgainst: 1, result: "draw",
        homeAway: "away", competitionId: COMP, stadiumId: null,
      }).returning();
      log.push(`Inserted missing Murici 01/02 match (id=${m.id})`);
    } else {
      log.push(`Murici 01/02 already present (id=${muriciOnFeb1[0].id})`);
    }

    // Fix 4: Insert missing CEO 01/03 away loss (Semifinal 1º Turno) if not present
    const ceoApr1Away = ceoMatches.find(
      m => m.matchDate === "2015-03-01" && m.homeAway === "away"
    );
    const ceoFeb8Fixed = ceoMatches.find(m => m.id === wrongDateMatch?.id);
    if (!ceoApr1Away) {
      const [m] = await db.insert(matchesTable).values({
        matchDate: "2015-03-01", season: SEASON, opponentId: CEO_ID,
        goalsFor: 0, goalsAgainst: 1, result: "loss",
        homeAway: "away", competitionId: COMP, stadiumId: null,
      }).returning();
      log.push(`Inserted missing CEO 01/03 away loss (id=${m.id})`);
    } else {
      log.push(`CEO 01/03 away already present (id=${ceoApr1Away.id})`);
    }

    // Verify totals
    const [totals] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        wins:  sql<number>`cast(count(*) filter (where result='win') as int)`,
        draws: sql<number>`cast(count(*) filter (where result='draw') as int)`,
        losses:sql<number>`cast(count(*) filter (where result='loss') as int)`,
        gf:    sql<number>`cast(sum(goals_for) as int)`,
        gc:    sql<number>`cast(sum(goals_against) as int)`,
      })
      .from(matchesTable)
      .where(sql`season=${SEASON} AND competition_id=${COMP}`);

    res.json({ ok: true, log, totals });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/matches", requireAdmin, async (req, res) => {
  try {
    const { limit = "100", offset = "0", season, status } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 100, 500);
    const off = parseInt(offset) || 0;
    const conditions = [];
    if (season && /^\d{4}$/.test(season)) {
      conditions.push(eq(matchesTable.season, season));
    }
    if (status === "scheduled" || status === "played") {
      conditions.push(eq(matchesTable.status, status));
    }
    const rows = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        status: matchesTable.status,
        attendance: matchesTable.attendance,
        scorers: matchesTable.scorers,
        opponentId: matchesTable.opponentId,
        opponentName: opponentsTable.name,
        competitionId: matchesTable.competitionId,
        competitionName: competitionsTable.name,
        stadiumId: matchesTable.stadiumId,
        stadiumName: stadiumsTable.name,
        managerId: matchesTable.managerId,
        managerName: managersTable.name,
        ownGoalsForCount: matchesTable.ownGoalsForCount,
        phase: matchesTable.phase,
        round: matchesTable.round,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .leftJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(
        status === "scheduled" ? asc(matchesTable.matchDate) : desc(matchesTable.matchDate),
      );
    const total = rows.length;
    res.json({ data: rows.slice(off, off + lim), total });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/matches/search", requireAdmin, async (req, res) => {
  try {
    const { q = "", limit = "20" } = req.query as Record<string, string>;
    const term = q.trim();
    const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const whereClause = term
      ? or(
          accentInsensitiveLike(opponentsTable.name, term),
          accentInsensitiveLike(competitionsTable.name, term),
          sql`to_char(${matchesTable.matchDate}, 'YYYY-MM-DD') ilike ${`%${term}%`}`,
          ilike(matchesTable.season, `%${term}%`),
        )
      : undefined;

    const rows = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        opponentName: opponentsTable.name,
        competitionId: matchesTable.competitionId,
        competitionName: competitionsTable.name,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .where(whereClause)
      .orderBy(desc(matchesTable.matchDate))
      .limit(lim);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Groups of matches that share the same match_date (for admin review). */
router.get("/admin/matches/duplicate-dates", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        isFriendly: matchesTable.isFriendly,
        isWalkover: matchesTable.isWalkover,
        phase: matchesTable.phase,
        round: matchesTable.round,
        opponentName: opponentsTable.name,
        competitionName: competitionsTable.name,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .where(
        sql`${matchesTable.matchDate} IN (
          SELECT match_date FROM matches
          GROUP BY match_date
          HAVING count(*) > 1
        )`,
      )
      .orderBy(desc(matchesTable.matchDate), asc(matchesTable.id));

    type MatchRow = (typeof rows)[number];
    const byDate = new Map<string, MatchRow[]>();
    for (const row of rows) {
      const key = row.matchDate;
      const list = byDate.get(key);
      if (list) list.push(row);
      else byDate.set(key, [row]);
    }

    const groups = [...byDate.entries()].map(([matchDate, matches]) => {
      const year = parseInt(matchDate.slice(0, 4), 10);
      const is1920sPlaceholder = year >= 1920 && year < 1930;
      return {
        matchDate,
        year: Number.isFinite(year) ? year : null,
        is1920sPlaceholder,
        count: matches.length,
        matches,
      };
    });

    res.json({
      groups,
      totalGroups: groups.length,
      totalMatches: rows.length,
      placeholder1920sGroups: groups.filter((g) => g.is1920sPlaceholder).length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Official matches with result = unknown (same concept as public ?status=unknown). */
router.get("/admin/matches/unknown-results", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        phase: matchesTable.phase,
        round: matchesTable.round,
        opponentName: opponentsTable.name,
        competitionName: competitionsTable.name,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .where(unknownResultMatchConditions())
      .orderBy(desc(matchesTable.matchDate), asc(matchesTable.id));

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

const reviewMatchColumns = {
  id: matchesTable.id,
  matchDate: matchesTable.matchDate,
  season: matchesTable.season,
  goalsFor: matchesTable.goalsFor,
  goalsAgainst: matchesTable.goalsAgainst,
  result: matchesTable.result,
  homeAway: matchesTable.homeAway,
  phase: matchesTable.phase,
  round: matchesTable.round,
  opponentName: opponentsTable.name,
  competitionName: competitionsTable.name,
};

/** Official played matches (known result) — base for sheet/manager gap tabs. */
function sheetGapBaseConditions() {
  return and(
    eq(matchesTable.isFriendly, false),
    eq(matchesTable.isWalkover, false),
    ne(matchesTable.status, "scheduled"),
    ne(matchesTable.result, "unknown"),
  );
}

const noCsaLineupSql = sql`NOT EXISTS (
  SELECT 1 FROM match_lineups ml
  WHERE ml.match_id = ${matchesTable.id} AND ml.side = 'csa'
)`;

const hasGoalAttributionSql = sql`(
  EXISTS (SELECT 1 FROM match_goals mg WHERE mg.match_id = ${matchesTable.id})
  OR NULLIF(trim(coalesce(${matchesTable.scorers}, '')), '') IS NOT NULL
)`;

const noGoalAttributionSql = sql`(
  NOT EXISTS (SELECT 1 FROM match_goals mg WHERE mg.match_id = ${matchesTable.id})
  AND NULLIF(trim(coalesce(${matchesTable.scorers}, '')), '') IS NULL
)`;

/** Goals attributed (match_goals or scorers text) but no CSA lineup. */
router.get("/admin/matches/incomplete-sheets", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select(reviewMatchColumns)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .where(and(sheetGapBaseConditions(), noCsaLineupSql, hasGoalAttributionSql))
      .orderBy(desc(matchesTable.matchDate), asc(matchesTable.id));

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** No CSA lineup and no goal attribution at all. */
router.get("/admin/matches/missing-sheets", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select(reviewMatchColumns)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .where(and(sheetGapBaseConditions(), noCsaLineupSql, noGoalAttributionSql))
      .orderBy(desc(matchesTable.matchDate), asc(matchesTable.id));

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Official played matches without a CSA manager. */
router.get("/admin/matches/missing-managers", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select(reviewMatchColumns)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .where(and(sheetGapBaseConditions(), isNull(matchesTable.managerId)))
      .orderBy(desc(matchesTable.matchDate), asc(matchesTable.id));

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Auto-detected player/manager data divergences for admin home review. */
router.get("/admin/data-divergences", requireAdmin, async (req, res) => {
  try {
    const payload = await loadAdminDataDivergences();
    res.json(payload);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Marca item como “não é problema” (some da lista ativa). */
router.post("/admin/data-divergences/dismiss", requireAdmin, async (req, res) => {
  try {
    const kind = String(req.body?.kind ?? "");
    const entityId = Number(req.body?.entityId);
    const note =
      typeof req.body?.note === "string" ? req.body.note : undefined;
    const payload = await dismissDivergence(kind, entityId, note);
    res.json({ ok: true, ...payload });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    req.log.error(err);
    res.status(status).json({
      error: err instanceof Error ? err.message : "Erro ao ignorar divergência",
    });
  }
});

/** Restaura item ignorado para a lista ativa. */
router.delete(
  "/admin/data-divergences/dismiss/:kind/:entityId",
  requireAdmin,
  async (req, res) => {
    try {
      const kind = decodeURIComponent(String(req.params.kind ?? ""));
      const entityId = Number(req.params.entityId);
      const payload = await undismissDivergence(kind, entityId);
      res.json({ ok: true, ...payload });
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      req.log.error(err);
      res.status(status).json({
        error:
          err instanceof Error ? err.message : "Erro ao restaurar divergência",
      });
    }
  },
);

router.get("/admin/matches/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [row] = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        attendance: matchesTable.attendance,
        scorers: matchesTable.scorers,
        opponentId: matchesTable.opponentId,
        opponentName: opponentsTable.name,
        opponentLogoUrl: opponentsTable.logoUrl,
        competitionId: matchesTable.competitionId,
        competitionName: competitionsTable.name,
        stadiumId: matchesTable.stadiumId,
        stadiumName: stadiumsTable.name,
        managerId: matchesTable.managerId,
        managerName: managersTable.name,
        captainPlayerId: matchesTable.captainPlayerId,
        refereeId: matchesTable.refereeId,
        refereeName: refereesTable.name,
        ownGoalsForCount: matchesTable.ownGoalsForCount,
        isWalkover: matchesTable.isWalkover,
        isFriendly: matchesTable.isFriendly,
        status: matchesTable.status,
        phase: matchesTable.phase,
        round: matchesTable.round,
        relatedMatchId: matchesTable.relatedMatchId,
        penaltiesFor: matchesTable.penaltiesFor,
        penaltiesAgainst: matchesTable.penaltiesAgainst,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .leftJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
      .leftJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
      .where(eq(matchesTable.id, id))
      .limit(1);
    if (!row) return res.status(404).json({ error: "Partida não encontrada" });

    let relatedMatch: {
      id: number;
      matchDate: string;
      opponentName: string;
      goalsFor: number | null;
      goalsAgainst: number | null;
      round: string | null;
      phase: string | null;
    } | null = null;
    if (row.relatedMatchId != null) {
      const [rel] = await db
        .select({
          id: matchesTable.id,
          matchDate: matchesTable.matchDate,
          opponentName: opponentsTable.name,
          goalsFor: matchesTable.goalsFor,
          goalsAgainst: matchesTable.goalsAgainst,
          round: matchesTable.round,
          phase: matchesTable.phase,
        })
        .from(matchesTable)
        .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
        .where(eq(matchesTable.id, row.relatedMatchId))
        .limit(1);
      relatedMatch = rel ?? null;
    }

    const adjacentSelect = {
      id: matchesTable.id,
      matchDate: matchesTable.matchDate,
      opponentName: opponentsTable.name,
      goalsFor: matchesTable.goalsFor,
      goalsAgainst: matchesTable.goalsAgainst,
    };
    const [[previousMatch], [nextMatch]] = await Promise.all([
      db
        .select(adjacentSelect)
        .from(matchesTable)
        .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
        .where(
          or(
            lt(matchesTable.matchDate, row.matchDate),
            and(eq(matchesTable.matchDate, row.matchDate), lt(matchesTable.id, id)),
          ),
        )
        .orderBy(desc(matchesTable.matchDate), desc(matchesTable.id))
        .limit(1),
      db
        .select(adjacentSelect)
        .from(matchesTable)
        .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
        .where(
          or(
            gt(matchesTable.matchDate, row.matchDate),
            and(eq(matchesTable.matchDate, row.matchDate), gt(matchesTable.id, id)),
          ),
        )
        .orderBy(asc(matchesTable.matchDate), asc(matchesTable.id))
        .limit(1),
    ]);

    res.json({
      ...row,
      relatedMatch,
      previousMatch: previousMatch ?? null,
      nextMatch: nextMatch ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/matches", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      matchDate: string;
      season: string;
      opponentId: number;
      goalsFor: number;
      goalsAgainst: number;
      result: string;
      homeAway: string;
      competitionId: number;
      stadiumId?: number | null;
      managerId?: number | null;
      refereeId?: number | null;
      attendance?: number | null;
      scorers?: string | null;
      ownGoalsForCount?: number | null;
      phase?: string | null;
      round?: string | null;
      relatedMatchId?: number | null;
      penaltiesFor?: number | null;
      penaltiesAgainst?: number | null;
      isWalkover?: boolean;
      isFriendly?: boolean;
      status?: "played" | "scheduled";
    };
    const ownGoals = Math.max(0, body.ownGoalsForCount ?? 0);
    const phase =
      body.phase == null || String(body.phase).trim() === ""
        ? null
        : String(body.phase).trim();
    const round =
      body.round == null || String(body.round).trim() === ""
        ? null
        : String(body.round).trim();
    const status = body.status === "scheduled" ? "scheduled" : "played";
    const isScheduled = status === "scheduled";
    let penalties: { penaltiesFor: number | null; penaltiesAgainst: number | null };
    try {
      penalties = parsePenaltyShootoutFields(body) ?? {
        penaltiesFor: null,
        penaltiesAgainst: null,
      };
    } catch (e: any) {
      return res.status(e.status ?? 400).json({ error: e.message ?? "Pênaltis inválidos" });
    }
    const relatedMatchId =
      body.relatedMatchId == null
        ? null
        : parseInt(String(body.relatedMatchId), 10);
    if (relatedMatchId != null && (!Number.isInteger(relatedMatchId) || relatedMatchId < 1)) {
      return res.status(400).json({ error: "Partida relacionada inválida" });
    }
    const [match] = await db
      .insert(matchesTable)
      .values({
        matchDate: body.matchDate,
        season: body.season,
        opponentId: body.opponentId,
        goalsFor: isScheduled ? null : body.goalsFor,
        goalsAgainst: isScheduled ? null : body.goalsAgainst,
        result: isScheduled ? "unknown" : body.result,
        homeAway: body.homeAway,
        competitionId: body.competitionId,
        stadiumId: body.stadiumId ?? null,
        managerId: body.managerId ?? null,
        refereeId: body.refereeId ?? null,
        attendance: body.attendance ?? null,
        scorers: body.scorers ?? null,
        ownGoalsForCount: ownGoals,
        phase,
        round,
        penaltiesFor: isScheduled ? null : penalties.penaltiesFor,
        penaltiesAgainst: isScheduled ? null : penalties.penaltiesAgainst,
        isWalkover: body.isWalkover === true,
        isFriendly: body.isFriendly === true,
        status,
      })
      .returning();
    if (relatedMatchId != null) {
      try {
        await syncRelatedMatchLink(match.id, relatedMatchId);
      } catch (e: any) {
        return res.status(e.status ?? 400).json({ error: e.message ?? "Erro ao vincular partida" });
      }
      const [updated] = await db
        .select()
        .from(matchesTable)
        .where(eq(matchesTable.id, match.id))
        .limit(1);
      return res.status(201).json(updated ?? match);
    }
    res.status(201).json(match);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/matches/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const body = req.body as {
      matchDate: string;
      season: string;
      opponentId: number;
      goalsFor: number;
      goalsAgainst: number;
      result: string;
      homeAway: string;
      competitionId: number;
      stadiumId?: number | null;
      managerId?: number | null;
      refereeId?: number | null;
      attendance?: number | null;
      scorers?: string | null;
      isWalkover?: boolean;
      isFriendly?: boolean;
      status?: "played" | "scheduled";
      grossRevenue?: number | null;
      grossRevenueText?: string | null;
      ownGoalsForCount?: number | null;
      phase?: string | null;
      round?: string | null;
      relatedMatchId?: number | null;
      penaltiesFor?: number | null;
      penaltiesAgainst?: number | null;
    };
    const ownGoals = Math.max(0, body.ownGoalsForCount ?? 0);
    const phase =
      body.phase == null || String(body.phase).trim() === ""
        ? null
        : String(body.phase).trim();
    const round =
      body.round == null || String(body.round).trim() === ""
        ? null
        : String(body.round).trim();
    let penaltiesPatch: { penaltiesFor: number | null; penaltiesAgainst: number | null } | undefined;
    try {
      penaltiesPatch = parsePenaltyShootoutFields(body);
    } catch (e: any) {
      return res.status(e.status ?? 400).json({ error: e.message ?? "Pênaltis inválidos" });
    }
    const patch: Record<string, unknown> = {
      matchDate: body.matchDate,
      season: body.season,
      opponentId: body.opponentId,
      goalsFor: body.goalsFor,
      goalsAgainst: body.goalsAgainst,
      result: body.result,
      homeAway: body.homeAway,
      competitionId: body.competitionId,
      stadiumId: body.stadiumId ?? null,
      managerId: body.managerId ?? null,
      refereeId: body.refereeId ?? null,
      attendance: body.attendance ?? null,
      scorers: body.scorers ?? null,
      grossRevenue: body.grossRevenue ?? null,
      grossRevenueText: body.grossRevenueText ?? null,
      ownGoalsForCount: ownGoals,
      phase,
      round,
    };
    if (penaltiesPatch) {
      patch.penaltiesFor = penaltiesPatch.penaltiesFor;
      patch.penaltiesAgainst = penaltiesPatch.penaltiesAgainst;
    }
    if (body.status === "scheduled" || body.status === "played") {
      const knownResult =
        body.result === "win" || body.result === "draw" || body.result === "loss";
      const hasScore =
        body.goalsFor != null &&
        body.goalsAgainst != null &&
        Number.isFinite(Number(body.goalsFor)) &&
        Number.isFinite(Number(body.goalsAgainst));
      // Safety: if client still sends status=scheduled but also a real score,
      // promote to played instead of wiping the placar (legacy admin bug).
      if (body.status === "scheduled" && knownResult && hasScore) {
        patch.status = "played";
      } else {
        patch.status = body.status;
        if (body.status === "scheduled") {
          patch.goalsFor = null;
          patch.goalsAgainst = null;
          patch.result = "unknown";
          patch.penaltiesFor = null;
          patch.penaltiesAgainst = null;
        }
      }
    }
    // Only update flags when explicitly sent — never default missing to false
    // (would wipe W.O./amistoso on unrelated edits, e.g. manager-only save).
    if (typeof body.isWalkover === "boolean") patch.isWalkover = body.isWalkover;
    if (typeof body.isFriendly === "boolean") patch.isFriendly = body.isFriendly;

    const [updated] = await db
      .update(matchesTable)
      .set(patch)
      .where(eq(matchesTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Partida não encontrada" });

    if (body.relatedMatchId !== undefined) {
      const relatedMatchId =
        body.relatedMatchId == null
          ? null
          : parseInt(String(body.relatedMatchId), 10);
      if (relatedMatchId != null && (!Number.isInteger(relatedMatchId) || relatedMatchId < 1)) {
        return res.status(400).json({ error: "Partida relacionada inválida" });
      }
      try {
        await syncRelatedMatchLink(id, relatedMatchId);
      } catch (e: any) {
        return res.status(e.status ?? 400).json({ error: e.message ?? "Erro ao vincular partida" });
      }
      const [fresh] = await db
        .select()
        .from(matchesTable)
        .where(eq(matchesTable.id, id))
        .limit(1);
      return res.json(fresh ?? updated);
    }

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/matches/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    await db.delete(matchesTable).where(eq(matchesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Match sheet (lineups / goals / cards — CSA Phase 1) ───────────────────────

router.get("/admin/matches/:id/sheet", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [match] = await db
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.id, id))
      .limit(1);
    if (!match) return res.status(404).json({ error: "Partida não encontrada" });
    res.json(await loadMatchSheet(id));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Legacy full replace (CSV/AI). Prefer lineup / events / subs endpoints for the admin UI. */
router.put("/admin/matches/:id/sheet", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [match] = await db
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.id, id))
      .limit(1);
    if (!match) return res.status(404).json({ error: "Partida não encontrada" });

    const body = req.body as {
      lineups?: Parameters<typeof replaceCsaMatchSheet>[1]["lineups"];
      goals?: Parameters<typeof replaceCsaMatchSheet>[1]["goals"];
      cards?: Parameters<typeof replaceCsaMatchSheet>[1]["cards"];
      substitutions?: Parameters<typeof replaceCsaMatchSheet>[1]["substitutions"];
    };

    const sheet = await replaceCsaMatchSheet(id, body);
    res.json(sheet);
  } catch (err: any) {
    if (err?.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Replace CSA lineup (+ optional manager) without wiping events/subs. */
router.put("/admin/matches/:id/sheet/lineup", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [match] = await db
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.id, id))
      .limit(1);
    if (!match) return res.status(404).json({ error: "Partida não encontrada" });

    const body = req.body as {
      lineups?: Parameters<typeof replaceCsaLineup>[1]["lineups"];
      managerId?: number | null;
    };
    res.json(await replaceCsaLineup(id, body));
  } catch (err: any) {
    if (err?.status === 400) return res.status(400).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Append CSA events (goals/cards/assists/manager cards/captain). */
router.post("/admin/matches/:id/sheet/events", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [match] = await db
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.id, id))
      .limit(1);
    if (!match) return res.status(404).json({ error: "Partida não encontrada" });

    const body = req.body as Parameters<typeof appendCsaEvents>[1];
    res.json(await appendCsaEvents(id, body));
  } catch (err: any) {
    if (err?.status === 400) return res.status(400).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/matches/:id/sheet/goals/:goalId", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const goalId = parseInt(req.params.goalId);
    if (isNaN(id) || isNaN(goalId)) return res.status(400).json({ error: "ID inválido" });
    res.json(await deleteMatchGoal(id, goalId));
  } catch (err: any) {
    if (err?.status === 404) return res.status(404).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/matches/:id/sheet/goals/:goalId", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const goalId = parseInt(req.params.goalId);
    if (isNaN(id) || isNaN(goalId)) return res.status(400).json({ error: "ID inválido" });
    const body = req.body as {
      minute?: unknown;
      injuryTimeMinute?: unknown;
      isPenalty?: boolean;
      isFreeKick?: boolean;
    };
    res.json(await updateMatchGoal(id, goalId, body));
  } catch (err: any) {
    if (err?.status === 404) return res.status(404).json({ error: err.message });
    if (err?.status === 400) return res.status(400).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/matches/:id/sheet/cards/:cardId", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cardId = parseInt(req.params.cardId);
    if (isNaN(id) || isNaN(cardId)) return res.status(400).json({ error: "ID inválido" });
    res.json(await deleteMatchCard(id, cardId));
  } catch (err: any) {
    if (err?.status === 404) return res.status(404).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/matches/:id/sheet/manager-cards/:cardId", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cardId = parseInt(req.params.cardId);
    if (isNaN(id) || isNaN(cardId)) return res.status(400).json({ error: "ID inválido" });
    res.json(await deleteMatchManagerCard(id, cardId));
  } catch (err: any) {
    if (err?.status === 404) return res.status(404).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/matches/:id/sheet/penalty-events/:eventId", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const eventId = parseInt(req.params.eventId);
    if (isNaN(id) || isNaN(eventId)) return res.status(400).json({ error: "ID inválido" });
    res.json(await deleteMatchPenaltyEvent(id, eventId));
  } catch (err: any) {
    if (err?.status === 404) return res.status(404).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Replace CSA substitutions only. */
router.put("/admin/matches/:id/sheet/substitutions", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [match] = await db
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.id, id))
      .limit(1);
    if (!match) return res.status(404).json({ error: "Partida não encontrada" });

    const body = req.body as { substitutions?: Parameters<typeof replaceCsaSubstitutions>[1] };
    res.json(await replaceCsaSubstitutions(id, body.substitutions ?? []));
  } catch (err: any) {
    if (err?.status === 400) return res.status(400).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** CSA roster for a season (+ optional name search fallback). */
router.get("/admin/matches/:id/roster", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const q = String((req.query as { q?: string }).q ?? "").trim();
    const seasonOverride = String((req.query as { season?: string }).season ?? "").trim();

    const [match] = await db
      .select({ id: matchesTable.id, season: matchesTable.season })
      .from(matchesTable)
      .where(eq(matchesTable.id, id))
      .limit(1);
    if (!match) return res.status(404).json({ error: "Partida não encontrada" });

    const season = seasonOverride || match.season;

    const seasonRows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        photoUrl: playersTable.photoUrl,
        shirtNumber: playerSeasonStatsTable.shirtNumber,
        appearances: playerSeasonStatsTable.appearances,
        goals: playerSeasonStatsTable.goals,
        assists: playerSeasonStatsTable.assists,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(eq(playerSeasonStatsTable.season, season))
      .orderBy(desc(playerSeasonStatsTable.appearances), asc(playersTable.name));

    let searchRows: Array<{
      id: number;
      name: string;
      position: string | null;
      nationality: string | null;
      nationalityFlag: string | null;
      photoUrl: string | null;
      shirtNumber: number | null;
      appearances: number;
      goals: number;
      assists: number;
    }> = [];
    if (q.length >= 2) {
      searchRows = await db
        .select({
          id: playersTable.id,
          name: playersTable.name,
          position: playersTable.position,
          nationality: playersTable.nationality,
          nationalityFlag: playersTable.nationalityFlag,
          photoUrl: playersTable.photoUrl,
          shirtNumber: sql<number | null>`null`.as("shirt_number"),
          appearances: sql<number>`0`.as("appearances"),
          goals: sql<number>`0`.as("goals"),
          assists: sql<number>`0`.as("assists"),
        })
        .from(playersTable)
        .where(accentInsensitiveLike(playersTable.name, q))
        .orderBy(asc(playersTable.name))
        .limit(30);
    }

    const byId = new Map<number, (typeof seasonRows)[0] & { inSeason: boolean }>();
    for (const p of seasonRows) {
      byId.set(p.id, { ...p, inSeason: true });
    }
    for (const p of searchRows) {
      if (!byId.has(p.id)) {
        byId.set(p.id, { ...p, inSeason: false });
      }
    }

    res.json({
      season,
      matchSeason: match.season,
      players: Array.from(byId.values()),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Stadiums ──────────────────────────────────────────────────────────────────

const BRAZIL_UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

function parseLocationProfile(body: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}):
  | { ok: true; city: string | null; state: string | null; country: string | null }
  | { ok: false; error: string } {
  const city =
    body.city == null || String(body.city).trim() === ""
      ? null
      : String(body.city).trim();
  let state =
    body.state == null || String(body.state).trim() === ""
      ? null
      : String(body.state).trim().toUpperCase();
  let country =
    body.country == null || String(body.country).trim() === ""
      ? null
      : String(body.country).trim().toUpperCase();

  if (country === "BRA" || country === "BR" || country === "BRASIL" || country === "BRAZIL") {
    country = null;
  }

  if (country != null && !VALID_COUNTRY_CODES.has(country)) {
    return { ok: false, error: "País inválido" };
  }
  if (country != null && state != null) {
    return { ok: false, error: "País e UF não podem ser preenchidos ao mesmo tempo" };
  }
  if (country != null) {
    state = null;
  }
  if (state != null && !BRAZIL_UFS.has(state)) {
    return { ok: false, error: "UF inválida" };
  }
  return { ok: true, city, state, country };
}

function parseOptionalUrl(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s || null;
}

function parseStadiumBody(body: {
  name?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  capacity?: number | string | null;
  photoUrl?: string | null;
}):
  | {
      ok: true;
      name: string;
      city: string | null;
      state: string | null;
      country: string | null;
      capacity: number | null;
      photoUrl: string | null;
    }
  | { ok: false; error: string } {
  if (!body.name?.trim()) return { ok: false, error: "Nome obrigatório" };
  const location = parseLocationProfile(body);
  if (!location.ok) return location;
  let capacity: number | null = null;
  if (body.capacity != null && String(body.capacity).trim() !== "") {
    const n =
      typeof body.capacity === "number"
        ? body.capacity
        : parseInt(String(body.capacity), 10);
    if (!Number.isInteger(n) || n < 0) {
      return { ok: false, error: "capacidade inválida" };
    }
    capacity = n;
  }
  return {
    ok: true,
    name: body.name.trim(),
    city: location.city,
    state: location.state,
    country: location.country,
    capacity,
    photoUrl: parseOptionalUrl(body.photoUrl),
  };
}

router.get("/admin/stadiums", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(stadiumsTable).orderBy(asc(stadiumsTable.name));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/stadiums/search", requireAdmin, async (req, res) => {
  try {
    const { q = "", limit = "20" } = req.query as Record<string, string>;
    const term = q.trim();
    const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const whereClause = term
      ? or(
          accentInsensitiveLike(stadiumsTable.name, term),
          accentInsensitiveLike(stadiumsTable.city, term),
          accentInsensitiveLike(stadiumsTable.state, term),
        )
      : undefined;
    const rows = await db
      .select({
        id: stadiumsTable.id,
        name: stadiumsTable.name,
        city: stadiumsTable.city,
        state: stadiumsTable.state,
        country: stadiumsTable.country,
        capacity: stadiumsTable.capacity,
      })
      .from(stadiumsTable)
      .where(whereClause)
      .orderBy(asc(stadiumsTable.name))
      .limit(lim);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/stadiums", requireAdmin, async (req, res) => {
  try {
    const parsed = parseStadiumBody(req.body as {
      name?: string;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      capacity?: number | string | null;
      photoUrl?: string | null;
    });
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    const [stadium] = await db
      .insert(stadiumsTable)
      .values({
        name: parsed.name,
        city: parsed.city,
        state: parsed.state,
        country: parsed.country,
        capacity: parsed.capacity,
        photoUrl: parsed.photoUrl,
      })
      .returning();
    res.status(201).json(stadium);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/stadiums/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [stadium] = await db
      .select()
      .from(stadiumsTable)
      .where(eq(stadiumsTable.id, id))
      .limit(1);
    if (!stadium) return res.status(404).json({ error: "Estádio não encontrado" });

    const homeClubs = await db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
        city: opponentsTable.city,
        state: opponentsTable.state,
        country: opponentsTable.country,
      })
      .from(opponentsTable)
      .where(eq(opponentsTable.homeStadiumId, id))
      .orderBy(asc(opponentsTable.name));

    const matches = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        competitionName: competitionsTable.name,
        opponentName: opponentsTable.name,
        isFriendly: matchesTable.isFriendly,
      })
      .from(matchesTable)
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(eq(matchesTable.stadiumId, id))
      .orderBy(desc(matchesTable.matchDate));

    res.json({ ...stadium, homeClubs, matches });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/stadiums/:id/home-clubs", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [stadium] = await db
      .select({ id: stadiumsTable.id })
      .from(stadiumsTable)
      .where(eq(stadiumsTable.id, id))
      .limit(1);
    if (!stadium) return res.status(404).json({ error: "Estádio não encontrado" });

    const raw = (req.body as { opponentIds?: unknown })?.opponentIds;
    if (!Array.isArray(raw)) {
      return res.status(400).json({ error: "opponentIds deve ser um array" });
    }
    const opponentIds = [...new Set(
      raw.map((v) => (typeof v === "number" ? v : parseInt(String(v), 10))),
    )].filter((n) => Number.isInteger(n) && n > 0);

    if (opponentIds.length > 0) {
      const found = await db
        .select({ id: opponentsTable.id })
        .from(opponentsTable)
        .where(inArray(opponentsTable.id, opponentIds));
      if (found.length !== opponentIds.length) {
        return res.status(400).json({ error: "Um ou mais adversários não encontrados" });
      }
    }

    await db
      .update(opponentsTable)
      .set({ homeStadiumId: null })
      .where(
        and(
          eq(opponentsTable.homeStadiumId, id),
          opponentIds.length > 0
            ? notInArray(opponentsTable.id, opponentIds)
            : sql`true`,
        ),
      );

    if (opponentIds.length > 0) {
      await db
        .update(opponentsTable)
        .set({ homeStadiumId: id })
        .where(inArray(opponentsTable.id, opponentIds));
    }

    const homeClubs = await db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
        city: opponentsTable.city,
        state: opponentsTable.state,
        country: opponentsTable.country,
      })
      .from(opponentsTable)
      .where(eq(opponentsTable.homeStadiumId, id))
      .orderBy(asc(opponentsTable.name));

    res.json({ homeClubs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/stadiums/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const parsed = parseStadiumBody(req.body as {
      name?: string;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      capacity?: number | string | null;
      photoUrl?: string | null;
    });
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    const [updated] = await db
      .update(stadiumsTable)
      .set({
        name: parsed.name,
        city: parsed.city,
        state: parsed.state,
        country: parsed.country,
        capacity: parsed.capacity,
        photoUrl: parsed.photoUrl,
      })
      .where(eq(stadiumsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Estádio não encontrado" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/stadiums/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [matchUse] = await db
      .select({ n: sql<number>`cast(count(*) as int)` })
      .from(matchesTable)
      .where(eq(matchesTable.stadiumId, id));
    if ((matchUse?.n ?? 0) > 0) {
      return res.status(400).json({
        error: "Estádio vinculado a partidas — não é possível excluir",
      });
    }

    await db
      .update(opponentsTable)
      .set({ homeStadiumId: null })
      .where(eq(opponentsTable.homeStadiumId, id));

    const deleted = await db
      .delete(stadiumsTable)
      .where(eq(stadiumsTable.id, id))
      .returning({ id: stadiumsTable.id });
    if (!deleted.length) return res.status(404).json({ error: "Estádio não encontrado" });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Merge multiple stadiums into one: move all match references, rename, delete duplicates
router.post("/admin/stadiums/merge", requireAdmin, async (req, res) => {
  try {
    const { keepId, mergeIds, newName } = req.body as {
      keepId: number;
      mergeIds: number[];
      newName?: string;
    };
    if (!keepId || !Array.isArray(mergeIds) || mergeIds.length === 0) {
      return res.status(400).json({ error: "keepId e mergeIds obrigatórios" });
    }
    let matchesMoved = 0;
    // Move all match references from mergeIds to keepId
    for (const oldId of mergeIds) {
      const r = await pgPool.query(
        `UPDATE matches SET stadium_id=$1 WHERE stadium_id=$2`,
        [keepId, oldId]
      );
      matchesMoved += r.rowCount ?? 0;
      await pgPool.query(
        `UPDATE opponents SET home_stadium_id=$1 WHERE home_stadium_id=$2`,
        [keepId, oldId],
      );
    }
    // Rename if requested
    if (newName?.trim()) {
      await pgPool.query(`UPDATE stadiums SET name=$1 WHERE id=$2`, [newName.trim(), keepId]);
    }
    // Delete merged stadiums
    await pgPool.query(
      `DELETE FROM stadiums WHERE id = ANY($1::int[])`,
      [mergeIds]
    );
    const kept = await pgPool.query(`SELECT * FROM stadiums WHERE id=$1`, [keepId]);
    res.json({ ok: true, matchesMoved, deletedIds: mergeIds, kept: kept.rows[0] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Bulk update matches by date+opponent — fix stadium_id, gross_revenue, gross_revenue_text
router.post("/admin/matches/bulk-patch", requireAdmin, async (req, res) => {
  try {
    const { patches } = req.body as {
      patches: {
        match_date: string;
        opponent_id: number;
        season: string;
        stadium_id?: number | null;
        gross_revenue?: number | null;
        gross_revenue_text?: string | null;
      }[];
    };
    if (!Array.isArray(patches)) return res.status(400).json({ error: "patches obrigatório" });
    let updated = 0; let notFound = 0;
    for (const p of patches) {
      const result = await pgPool.query(
        `UPDATE matches SET
           stadium_id        = COALESCE($1, stadium_id),
           gross_revenue     = COALESCE($2, gross_revenue),
           gross_revenue_text = COALESCE($3, gross_revenue_text)
         WHERE match_date = $4 AND opponent_id = $5 AND season = $6
         RETURNING id`,
        [
          p.stadium_id ?? null,
          p.gross_revenue ?? null,
          p.gross_revenue_text ?? null,
          p.match_date,
          p.opponent_id,
          p.season,
        ]
      );
      if (result.rowCount && result.rowCount > 0) updated += result.rowCount; else notFound++;
    }
    res.json({ updated, notFound });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Opponents ─────────────────────────────────────────────────────────────────

router.get("/admin/opponents", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(opponentsTable).orderBy(asc(opponentsTable.name));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

function parseOpponentProfile(body: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}):
  | { ok: true; city: string | null; state: string | null; country: string | null }
  | { ok: false; error: string } {
  return parseLocationProfile(body);
}

function parseHomeStadiumId(
  raw: unknown,
  present: boolean,
): { ok: true; set: boolean; value: number | null } | { ok: false; error: string } {
  if (!present) return { ok: true, set: false, value: null };
  if (raw == null || String(raw).trim() === "") {
    return { ok: true, set: true, value: null };
  }
  const id = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "homeStadiumId inválido" };
  }
  return { ok: true, set: true, value: id };
}

router.get("/admin/opponents/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [opponent] = await db
      .select()
      .from(opponentsTable)
      .where(eq(opponentsTable.id, id))
      .limit(1);
    if (!opponent) return res.status(404).json({ error: "Adversário não encontrado" });

    let homeStadium = null;
    if (opponent.homeStadiumId != null) {
      const [stadium] = await db
        .select()
        .from(stadiumsTable)
        .where(eq(stadiumsTable.id, opponent.homeStadiumId))
        .limit(1);
      homeStadium = stadium ?? null;
    }

    const matches = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        competitionName: competitionsTable.name,
        stadiumName: stadiumsTable.name,
        isFriendly: matchesTable.isFriendly,
      })
      .from(matchesTable)
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(eq(matchesTable.opponentId, id))
      .orderBy(desc(matchesTable.matchDate));

    res.json({ ...opponent, homeStadium, matches });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/opponents", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      name?: string;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      logoUrl?: string | null;
      homeStadiumId?: number | null;
    };
    if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const profile = parseOpponentProfile(body);
    if (!profile.ok) return res.status(400).json({ error: profile.error });
    const homeParsed = parseHomeStadiumId(
      body.homeStadiumId,
      Object.prototype.hasOwnProperty.call(body, "homeStadiumId"),
    );
    if (!homeParsed.ok) return res.status(400).json({ error: homeParsed.error });

    let homeStadiumId: number | null = null;
    if (homeParsed.set && homeParsed.value != null) {
      const [stadium] = await db
        .select({ id: stadiumsTable.id })
        .from(stadiumsTable)
        .where(eq(stadiumsTable.id, homeParsed.value))
        .limit(1);
      if (!stadium) return res.status(400).json({ error: "estádio sede não encontrado" });
      homeStadiumId = stadium.id;
    }

    const [opponent] = await db
      .insert(opponentsTable)
      .values({
        name: body.name.trim(),
        city: profile.city,
        state: profile.state,
        country: profile.country,
        logoUrl: parseOptionalUrl(body.logoUrl),
        homeStadiumId: homeParsed.set ? homeStadiumId : null,
      })
      .returning();
    res.status(201).json(opponent);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/opponents/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const body = req.body as {
      name?: string;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      logoUrl?: string | null;
      homeStadiumId?: number | null;
    };
    if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const profile = parseOpponentProfile(body);
    if (!profile.ok) return res.status(400).json({ error: profile.error });

    const values: {
      name: string;
      city: string | null;
      state: string | null;
      country: string | null;
      logoUrl?: string | null;
      homeStadiumId?: number | null;
    } = {
      name: body.name.trim(),
      city: profile.city,
      state: profile.state,
      country: profile.country,
    };

    if (Object.prototype.hasOwnProperty.call(body, "logoUrl")) {
      values.logoUrl = parseOptionalUrl(body.logoUrl);
    }

    if (Object.prototype.hasOwnProperty.call(body, "homeStadiumId")) {
      const homeParsed = parseHomeStadiumId(body.homeStadiumId, true);
      if (!homeParsed.ok) return res.status(400).json({ error: homeParsed.error });
      if (homeParsed.value != null) {
        const [stadium] = await db
          .select({ id: stadiumsTable.id })
          .from(stadiumsTable)
          .where(eq(stadiumsTable.id, homeParsed.value))
          .limit(1);
        if (!stadium) return res.status(400).json({ error: "estádio sede não encontrado" });
        values.homeStadiumId = stadium.id;
      } else {
        values.homeStadiumId = null;
      }
    }

    const [updated] = await db
      .update(opponentsTable)
      .set(values)
      .where(eq(opponentsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Adversário não encontrado" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/opponents/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    await db.delete(opponentsTable).where(eq(opponentsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Referees ──────────────────────────────────────────────────────────────────

router.get("/admin/referees", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(refereesTable).orderBy(asc(refereesTable.name));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/referees/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [referee] = await db.select().from(refereesTable).where(eq(refereesTable.id, id));
    if (!referee) return res.status(404).json({ error: "Árbitro não encontrado" });

    const matches = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        opponentName: opponentsTable.name,
        competitionName: competitionsTable.name,
        stadiumName: stadiumsTable.name,
        phase: matchesTable.phase,
        round: matchesTable.round,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(eq(matchesTable.refereeId, id))
      .orderBy(desc(matchesTable.matchDate));

    res.json({ ...referee, matches });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/referees", requireAdmin, async (req, res) => {
  try {
    const body = req.body as { name?: string; state?: string | null; photoUrl?: string | null };
    if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const uf = normalizeOptionalUf(body.state);
    if (!uf.ok) return res.status(400).json({ error: uf.error });
    const [referee] = await db
      .insert(refereesTable)
      .values({
        name: body.name.trim(),
        state: uf.value,
        photoUrl: parseOptionalUrl(body.photoUrl),
      })
      .returning();
    res.status(201).json(referee);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/referees/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [current] = await db.select().from(refereesTable).where(eq(refereesTable.id, id));
    if (!current) return res.status(404).json({ error: "Árbitro não encontrado" });

    const body = req.body as { name?: string; state?: string | null; photoUrl?: string | null };
    const values: { name?: string; state?: string | null; photoUrl?: string | null } = {};
    if (body.name !== undefined) {
      if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
      values.name = body.name.trim();
    }
    if (body.state !== undefined) {
      const uf = normalizeOptionalUf(body.state);
      if (!uf.ok) return res.status(400).json({ error: uf.error });
      values.state = uf.value;
    }
    if (body.photoUrl !== undefined) {
      values.photoUrl = parseOptionalUrl(body.photoUrl);
    }

    const [updated] = await db
      .update(refereesTable)
      .set(values)
      .where(eq(refereesTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/referees/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    await db
      .update(matchesTable)
      .set({ refereeId: null })
      .where(eq(matchesTable.refereeId, id));
    await db.delete(refereesTable).where(eq(refereesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Managers ──────────────────────────────────────────────────────────────────

function serializeManagerSeasonStat(row: typeof managerSeasonStatsTable.$inferSelect) {
  return {
    id: row.id,
    managerId: row.managerId,
    season: row.season,
    games: row.games,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    statsSource: row.statsSource,
    statsRecalculatedAt:
      row.statsRecalculatedAt instanceof Date
        ? row.statsRecalculatedAt.toISOString()
        : row.statsRecalculatedAt,
  };
}

function parseNonNegInt(raw: unknown, fallback = 0): number | null {
  const n =
    typeof raw === "number" ? raw : raw == null || raw === "" ? fallback : parseInt(String(raw), 10);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

async function seasonsByManagerIds(managerIds: number[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (managerIds.length === 0) return map;
  const periodRows = await db
    .select({
      managerId: managerSeasonStatsTable.managerId,
      season: managerSeasonStatsTable.season,
    })
    .from(managerSeasonStatsTable)
    .where(inArray(managerSeasonStatsTable.managerId, managerIds));
  for (const p of periodRows) {
    const list = map.get(p.managerId) ?? [];
    list.push(p.season);
    map.set(p.managerId, list);
  }
  return map;
}

function withDerivedPeriod<T extends { id: number }>(
  manager: T,
  seasons: string[],
): T & { startYear: number | null; endYear: number | null } {
  const period = periodFromSeasons(seasons);
  return { ...manager, startYear: period.startYear, endYear: period.endYear };
}

function serializeManagerAdmin<T extends Record<string, unknown>>(manager: T) {
  const verifiedAt = manager.verifiedAt;
  return {
    ...manager,
    verifiedAt:
      verifiedAt instanceof Date
        ? verifiedAt.toISOString()
        : (verifiedAt as string | null | undefined) ?? null,
  };
}

router.get("/admin/managers", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(managersTable).orderBy(asc(managersTable.name));
    const seasonsMap = await seasonsByManagerIds(rows.map((r) => r.id));
    res.json(
      rows.map((r) =>
        serializeManagerAdmin(withDerivedPeriod(r, seasonsMap.get(r.id) ?? [])),
      ),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/managers/name-check", requireAdmin, async (req, res) => {
  try {
    const q = String((req.query as { q?: string }).q ?? "").trim();
    const fullName = String((req.query as { fullName?: string }).fullName ?? "").trim();
    const excludeRaw = (req.query as { excludeId?: string }).excludeId;
    const excludeId = excludeRaw != null && excludeRaw !== "" ? parseInt(excludeRaw, 10) : null;
    if (!q && !fullName) {
      return res.json({ matches: [] });
    }
    const rows = await db
      .select({
        id: managersTable.id,
        name: managersTable.name,
        fullName: managersTable.fullName,
        photoUrl: managersTable.photoUrl,
      })
      .from(managersTable);
    const matches = findDuplicateNameCandidates(
      { name: q, fullName },
      rows,
      Number.isInteger(excludeId) ? excludeId : null,
    ).slice(0, 8);
    res.json({ matches });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/managers/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [manager] = await db.select().from(managersTable).where(eq(managersTable.id, id));
    if (!manager) return res.status(404).json({ error: "Técnico não encontrado" });
    const seasonsMap = await seasonsByManagerIds([id]);
    let playerName: string | null = null;
    if (manager.playerId != null) {
      const [p] = await db
        .select({ name: playersTable.name })
        .from(playersTable)
        .where(eq(playersTable.id, manager.playerId))
        .limit(1);
      playerName = p?.name ?? null;
    }
    res.json({
      ...serializeManagerAdmin(withDerivedPeriod(manager, seasonsMap.get(id) ?? [])),
      playerName,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/managers", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      name: string;
      fullName?: string | null;
      nationality?: string | null;
      birthDate?: string | null;
      birthCity?: string | null;
      birthState?: string | null;
      birthCountry?: string | null;
      isDeceased?: boolean;
      photoUrl?: string | null;
      verificationStatus?: string | null;
      verifiedBy?: string | null;
      playerId?: number | null;
    };
    if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const birthDate = body.birthDate?.trim() || null;
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return res.status(400).json({ error: "birthDate inválida (YYYY-MM-DD)" });
    }
    const verificationStatus =
      body.verificationStatus === "verified" ? "verified" : "unverified";
    const verifiedBy =
      verificationStatus === "verified" ? body.verifiedBy?.trim() || null : null;
    const verifiedAt = verificationStatus === "verified" ? new Date() : null;
    let playerId: number | null = null;
    if (body.playerId != null && body.playerId !== ("" as unknown)) {
      playerId = Number(body.playerId);
      if (!Number.isInteger(playerId) || playerId < 1) {
        return res.status(400).json({ error: "playerId inválido" });
      }
      const [p] = await db
        .select({ id: playersTable.id })
        .from(playersTable)
        .where(eq(playersTable.id, playerId))
        .limit(1);
      if (!p) return res.status(400).json({ error: "Jogador vinculado não encontrado" });
      await db
        .update(managersTable)
        .set({ playerId: null })
        .where(eq(managersTable.playerId, playerId));
    }
    const [manager] = await db
      .insert(managersTable)
      .values({
        name: body.name.trim(),
        fullName: body.fullName?.trim() || null,
        nationality: body.nationality?.trim() || "Brasil",
        birthDate,
        birthCity: body.birthCity?.trim() || null,
        birthState: body.birthState?.trim() || null,
        birthCountry: body.birthCountry?.trim() || null,
        isDeceased: body.isDeceased ?? false,
        photoUrl: parseOptionalUrl(body.photoUrl),
        playerId,
        verificationStatus,
        verifiedBy,
        verifiedAt,
        statsSource: null,
        statsRecalculatedAt: null,
      })
      .returning();
    res.status(201).json(serializeManagerAdmin(withDerivedPeriod(manager, [])));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/managers/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [current] = await db.select().from(managersTable).where(eq(managersTable.id, id));
    if (!current) return res.status(404).json({ error: "Técnico não encontrado" });

    const body = req.body as {
      name?: string;
      fullName?: string | null;
      nationality?: string | null;
      birthDate?: string | null;
      birthCity?: string | null;
      birthState?: string | null;
      birthCountry?: string | null;
      isDeceased?: boolean;
      photoUrl?: string | null;
      verificationStatus?: string | null;
      verifiedBy?: string | null;
      playerId?: number | null;
      // career totals: prefer season-stats endpoints; still accepted for rare overrides
      storedGames?: number | null;
      storedWins?: number | null;
      storedDraws?: number | null;
      storedLosses?: number | null;
      storedGoalsFor?: number | null;
      storedGoalsAgainst?: number | null;
    };

    if (body.birthDate !== undefined && body.birthDate != null && body.birthDate !== "") {
      const bd = String(body.birthDate).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bd)) {
        return res.status(400).json({ error: "birthDate inválida (YYYY-MM-DD)" });
      }
    }

    const verificationStatus =
      body.verificationStatus === undefined
        ? undefined
        : body.verificationStatus === "verified"
          ? "verified"
          : "unverified";
    const verifiedBy =
      verificationStatus === undefined
        ? undefined
        : verificationStatus === "verified"
          ? body.verifiedBy?.trim() || null
          : null;
    const verifiedAt =
      verificationStatus === undefined
        ? undefined
        : verificationStatus === "verified"
          ? new Date()
          : null;

    let playerIdUpdate: { playerId: number | null } | undefined;
    if (Object.prototype.hasOwnProperty.call(body, "playerId")) {
      const raw = body.playerId;
      const playerId = raw == null || raw === ("" as unknown) ? null : Number(raw);
      if (playerId != null && (!Number.isInteger(playerId) || playerId < 1)) {
        return res.status(400).json({ error: "playerId inválido" });
      }
      if (playerId != null) {
        const [p] = await db
          .select({ id: playersTable.id })
          .from(playersTable)
          .where(eq(playersTable.id, playerId))
          .limit(1);
        if (!p) return res.status(400).json({ error: "Jogador vinculado não encontrado" });
        await db
          .update(managersTable)
          .set({ playerId: null })
          .where(and(eq(managersTable.playerId, playerId), ne(managersTable.id, id)));
      }
      playerIdUpdate = { playerId };
    }

    const statsChanged = managerStoredStatsChanged(current, body);
    const [updated] = await db
      .update(managersTable)
      .set({
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.fullName !== undefined && { fullName: body.fullName?.trim() || null }),
        ...(body.nationality !== undefined && {
          nationality: body.nationality?.trim() || null,
        }),
        ...(body.birthDate !== undefined && {
          birthDate: body.birthDate?.trim() || null,
        }),
        ...(body.birthCity !== undefined && {
          birthCity: body.birthCity?.trim() || null,
        }),
        ...(body.birthState !== undefined && {
          birthState: body.birthState?.trim() || null,
        }),
        ...(body.birthCountry !== undefined && {
          birthCountry: body.birthCountry?.trim() || null,
        }),
        ...(body.isDeceased !== undefined && { isDeceased: !!body.isDeceased }),
        ...(body.photoUrl !== undefined && { photoUrl: parseOptionalUrl(body.photoUrl) }),
        ...(verificationStatus !== undefined && {
          verificationStatus,
          verifiedBy,
          verifiedAt,
        }),
        ...(playerIdUpdate ?? {}),
        ...(body.storedGames !== undefined && { storedGames: body.storedGames }),
        ...(body.storedWins !== undefined && { storedWins: body.storedWins }),
        ...(body.storedDraws !== undefined && { storedDraws: body.storedDraws }),
        ...(body.storedLosses !== undefined && { storedLosses: body.storedLosses }),
        ...(body.storedGoalsFor !== undefined && { storedGoalsFor: body.storedGoalsFor }),
        ...(body.storedGoalsAgainst !== undefined && {
          storedGoalsAgainst: body.storedGoalsAgainst,
        }),
        ...(statsChanged && { statsSource: "manual" as const }),
      })
      .where(eq(managersTable.id, id))
      .returning();
    const seasonsMap = await seasonsByManagerIds([id]);
    let playerName: string | null = null;
    if (updated.playerId != null) {
      const [p] = await db
        .select({ name: playersTable.name })
        .from(playersTable)
        .where(eq(playersTable.id, updated.playerId))
        .limit(1);
      playerName = p?.name ?? null;
    }
    res.json({
      ...serializeManagerAdmin(withDerivedPeriod(updated, seasonsMap.get(id) ?? [])),
      playerName,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/managers/:id/stats", requireAdmin, async (req, res) => {
  try {
    const managerId = parseInt(req.params.id, 10);
    if (isNaN(managerId)) return res.status(400).json({ error: "ID inválido" });
    const [manager] = await db
      .select({ id: managersTable.id })
      .from(managersTable)
      .where(eq(managersTable.id, managerId));
    if (!manager) return res.status(404).json({ error: "Técnico não encontrado" });

    const rows = await db
      .select()
      .from(managerSeasonStatsTable)
      .where(eq(managerSeasonStatsTable.managerId, managerId))
      .orderBy(desc(managerSeasonStatsTable.season));
    res.json(rows.map(serializeManagerSeasonStat));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/managers/:id/stats", requireAdmin, async (req, res) => {
  try {
    const managerId = parseInt(req.params.id, 10);
    if (isNaN(managerId)) return res.status(400).json({ error: "ID inválido" });
    const [manager] = await db
      .select({ id: managersTable.id })
      .from(managersTable)
      .where(eq(managersTable.id, managerId));
    if (!manager) return res.status(404).json({ error: "Técnico não encontrado" });

    const body = req.body as {
      season?: unknown;
      games?: unknown;
      wins?: unknown;
      draws?: unknown;
      losses?: unknown;
      goalsFor?: unknown;
      goalsAgainst?: unknown;
    };
    const season = typeof body.season === "string" ? body.season.trim() : "";
    if (!season) return res.status(400).json({ error: "season obrigatória" });

    const games = parseNonNegInt(body.games, 0);
    const wins = parseNonNegInt(body.wins, 0);
    const draws = parseNonNegInt(body.draws, 0);
    const losses = parseNonNegInt(body.losses, 0);
    const goalsFor = parseNonNegInt(body.goalsFor, 0);
    const goalsAgainst = parseNonNegInt(body.goalsAgainst, 0);
    if (
      games == null ||
      wins == null ||
      draws == null ||
      losses == null ||
      goalsFor == null ||
      goalsAgainst == null
    ) {
      return res.status(400).json({ error: "valores numéricos inválidos" });
    }

    try {
      const [inserted] = await db
        .insert(managerSeasonStatsTable)
        .values({
          managerId,
          season,
          games,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          statsSource: "manual",
          statsRecalculatedAt: null,
        })
        .returning();
      await syncManagerCareerFromSeasonRows(managerId);
      res.status(201).json(serializeManagerSeasonStat(inserted));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/unique|duplicate/i.test(msg)) {
        return res.status(409).json({ error: "Já existe temporada para este técnico" });
      }
      throw err;
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/managers/:id/stats/bulk", requireAdmin, async (req, res) => {
  const client = await pgPool.connect();
  try {
    const managerId = parseInt(req.params.id, 10);
    if (isNaN(managerId)) return res.status(400).json({ error: "ID inválido" });

    const raw = (req.body as { stats?: unknown })?.stats;
    if (!Array.isArray(raw)) {
      return res.status(400).json({ error: "stats deve ser um array" });
    }
    if (raw.length === 0) {
      return res.json([]);
    }

    const updates: {
      id: number;
      games: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    }[] = [];

    for (const row of raw) {
      const item = row as Record<string, unknown>;
      const id = typeof item.id === "number" ? item.id : parseInt(String(item.id), 10);
      const games = parseNonNegInt(item.games, 0);
      const wins = parseNonNegInt(item.wins, 0);
      const draws = parseNonNegInt(item.draws, 0);
      const losses = parseNonNegInt(item.losses, 0);
      const goalsFor = parseNonNegInt(item.goalsFor, 0);
      const goalsAgainst = parseNonNegInt(item.goalsAgainst, 0);
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "id de stat inválido" });
      }
      if (
        games == null ||
        wins == null ||
        draws == null ||
        losses == null ||
        goalsFor == null ||
        goalsAgainst == null
      ) {
        return res.status(400).json({ error: "valores numéricos inválidos" });
      }
      updates.push({ id, games, wins, draws, losses, goalsFor, goalsAgainst });
    }

    await client.query("BEGIN");
    const updated = [];
    for (const u of updates) {
      const r = await client.query(
        `UPDATE manager_season_stats
         SET games = $1, wins = $2, draws = $3, losses = $4,
             goals_for = $5, goals_against = $6,
             stats_source = 'manual', stats_recalculated_at = NULL
         WHERE id = $7 AND manager_id = $8
         RETURNING id, manager_id, season, games, wins, draws, losses,
                   goals_for, goals_against, stats_source, stats_recalculated_at`,
        [
          u.games,
          u.wins,
          u.draws,
          u.losses,
          u.goalsFor,
          u.goalsAgainst,
          u.id,
          managerId,
        ],
      );
      if (r.rowCount !== 1) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          error: `Stat ${u.id} não encontrada para este técnico`,
        });
      }
      const row = r.rows[0];
      updated.push({
        id: row.id,
        managerId: row.manager_id,
        season: row.season,
        games: row.games,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalsFor: row.goals_for,
        goalsAgainst: row.goals_against,
        statsSource: row.stats_source,
        statsRecalculatedAt: row.stats_recalculated_at,
      });
    }
    await client.query("COMMIT");
    await syncManagerCareerFromSeasonRows(managerId);
    res.json(updated);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  } finally {
    client.release();
  }
});

router.delete("/admin/manager-stats/:statId", requireAdmin, async (req, res) => {
  try {
    const statId = parseInt(req.params.statId, 10);
    if (isNaN(statId)) return res.status(400).json({ error: "ID inválido" });
    const [row] = await db
      .delete(managerSeasonStatsTable)
      .where(eq(managerSeasonStatsTable.id, statId))
      .returning();
    if (!row) return res.status(404).json({ error: "Stat não encontrada" });
    await syncManagerCareerFromSeasonRows(row.managerId);
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/managers/:id/recalculate-stats", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const result = await recalculateManagerSeasonStats(id);
    if (!result) return res.status(404).json({ error: "Técnico não encontrado" });
    res.json({
      manager: result.manager,
      matchCount: result.matchCount,
      seasonsFromMatches: result.seasonsFromMatches,
      upserted: result.upserted,
      preservedManual: result.preservedManual,
      removedCalculated: result.removedCalculated,
      seasonStats: result.seasonRows.map(serializeManagerSeasonStat),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Badges (manual admin; auto are read-only here) ─────────────────────────────

type BadgeEntityType = "player" | "manager";

function parseBadgeEntity(
  entityTypeRaw: string,
  entityIdRaw: string,
):
  | { ok: true; entityType: BadgeEntityType; entityId: number }
  | { ok: false; status: number; error: string } {
  const entityType = entityTypeRaw.toLowerCase();
  if (entityType !== "player" && entityType !== "manager") {
    return { ok: false, status: 400, error: "entityType inválido (player | manager)" };
  }
  const entityId = parseInt(entityIdRaw, 10);
  if (!Number.isFinite(entityId) || entityId < 1) {
    return { ok: false, status: 400, error: "entityId inválido" };
  }
  return { ok: true, entityType, entityId };
}

async function badgeEntityExists(
  entityType: BadgeEntityType,
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
  const [row] = await db
    .select({ id: managersTable.id })
    .from(managersTable)
    .where(eq(managersTable.id, entityId))
    .limit(1);
  return !!row;
}

router.get("/admin/badges/:entityType/:entityId", requireAdmin, async (req, res) => {
  try {
    const parsed = parseBadgeEntity(req.params.entityType, req.params.entityId);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
    if (!(await badgeEntityExists(parsed.entityType, parsed.entityId))) {
      return res.status(404).json({ error: "Entidade não encontrada" });
    }
    const rows = await db
      .select()
      .from(entityBadgesTable)
      .where(
        and(
          eq(entityBadgesTable.entityType, parsed.entityType),
          eq(entityBadgesTable.entityId, parsed.entityId),
        ),
      )
      .orderBy(desc(entityBadgesTable.seasonYear), asc(entityBadgesTable.label));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/badges/:entityType/:entityId", requireAdmin, async (req, res) => {
  try {
    const parsed = parseBadgeEntity(req.params.entityType, req.params.entityId);
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
    if (!(await badgeEntityExists(parsed.entityType, parsed.entityId))) {
      return res.status(404).json({ error: "Entidade não encontrada" });
    }

    const body = req.body as {
      template?: string;
      year?: number | null;
      competitionId?: number | null;
      matchId?: number | null;
    };
    const templateRaw = body.template?.trim() ?? "";
    if (!templateRaw) {
      return res.status(400).json({ error: "template obrigatório" });
    }

    const yearParsed = parseSeasonYear(body.year);
    if (!yearParsed.ok) {
      return res.status(400).json({ error: yearParsed.error });
    }
    const competitionParsed = parseCompetitionId(body.competitionId);
    if (!competitionParsed.ok) {
      return res.status(400).json({ error: competitionParsed.error });
    }
    const matchParsed = parseMatchId(body.matchId);
    if (!matchParsed.ok) {
      return res.status(400).json({ error: matchParsed.error });
    }

    const validated = validateManualBadgeInput(
      parsed.entityType,
      templateRaw,
      yearParsed.value,
      competitionParsed.value,
      matchParsed.value,
    );
    if (!validated.ok) {
      return res.status(400).json({ error: validated.error });
    }

    let competitionName: string | undefined;
    let competitionId: number | null = null;
    let seasonYear: number | null = yearParsed.value;
    let matchId: number | null = null;

    if (templateNeedsMatch(validated.template)) {
      const [match] = await db
        .select({
          id: matchesTable.id,
          matchDate: matchesTable.matchDate,
          season: matchesTable.season,
          competitionId: matchesTable.competitionId,
          competitionName: competitionsTable.name,
        })
        .from(matchesTable)
        .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
        .where(eq(matchesTable.id, matchParsed.value!))
        .limit(1);
      if (!match) {
        return res.status(400).json({ error: "partida não encontrada" });
      }
      const derivedYear = deriveBadgeYearFromMatch(match.matchDate, match.season);
      if (derivedYear == null) {
        return res.status(400).json({ error: "não foi possível derivar o ano da partida" });
      }
      competitionName = match.competitionName;
      competitionId = match.competitionId;
      seasonYear = derivedYear;
      matchId = match.id;
    } else if (competitionParsed.value != null) {
      const [comp] = await db
        .select({ id: competitionsTable.id, name: competitionsTable.name })
        .from(competitionsTable)
        .where(eq(competitionsTable.id, competitionParsed.value))
        .limit(1);
      if (!comp) {
        return res.status(400).json({ error: "competição não encontrada" });
      }
      competitionName = comp.name;
      competitionId = comp.id;
    }

    const label = buildManualBadgeLabel(validated.template, {
      year: seasonYear ?? undefined,
      competitionName,
    });
    if (label.length > 120) {
      return res.status(400).json({ error: "label gerado muito longo (máx. 120)" });
    }

    const [row] = await db
      .insert(entityBadgesTable)
      .values({
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        label,
        source: "manual",
        template: validated.template,
        autoKind: null,
        seasonYear,
        competitionId,
        matchId,
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    const errCode =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code?: string }).code
        : typeof err === "object"
            && err !== null
            && "cause" in err
            && typeof (err as { cause?: unknown }).cause === "object"
            && (err as { cause?: unknown }).cause !== null
            && "code" in ((err as { cause: { code?: string } }).cause)
          ? (err as { cause: { code?: string } }).cause.code
          : undefined;
    const errMessage =
      err instanceof Error ? err.message : typeof err === "string" ? err : "";
    if (
      errCode === "23505"
      || errMessage.includes("duplicate key value violates unique constraint")
    ) {
      const templateRaw = (req.body as { template?: string } | undefined)?.template?.trim() ?? "";
      if (
        [
          "cria_do_mutange",
          "garcom",
          "artilheiro",
          "artilheiro_comp",
          "campeao",
          "acesso",
          "heroi_do_acesso",
          "gol_do_titulo",
          "gol_historico",
        ].includes(templateRaw)
      ) {
        return res.status(409).json({
          error: duplicateManualBadgeMessage(templateRaw as Parameters<typeof duplicateManualBadgeMessage>[0]),
        });
      }
      return res.status(409).json({ error: "Este badge já existe para esta pessoa" });
    }
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/badges/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const [existing] = await db
      .select()
      .from(entityBadgesTable)
      .where(eq(entityBadgesTable.id, id))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Badge não encontrado" });
    if (existing.source !== "manual") {
      return res.status(400).json({
        error: "Badges automáticos não podem ser removidos por aqui",
      });
    }
    await db.delete(entityBadgesTable).where(eq(entityBadgesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Seasons (stats verification + auto badges) ────────────────────────────────

router.get("/admin/seasons", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        year: seasonsTable.year,
        statsFullyVerified: seasonsTable.statsFullyVerified,
        statsVerifiedAt: seasonsTable.statsVerifiedAt,
      })
      .from(seasonsTable)
      .orderBy(desc(seasonsTable.year));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

function serializeSeasonCompetitionStat(
  row: Awaited<ReturnType<typeof listSeasonCompetitionStats>>[number],
) {
  return {
    id: row.id,
    season: row.season,
    competitionId: row.competitionId,
    competitionName: row.competitionName,
    games: row.games,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    classification: row.classification,
    isChampion: row.isChampion,
    finalMatchId: row.finalMatchId,
    statsSource: row.statsSource,
    statsRecalculatedAt:
      row.statsRecalculatedAt instanceof Date
        ? row.statsRecalculatedAt.toISOString()
        : row.statsRecalculatedAt,
  };
}

router.get("/admin/seasons/:year/competition-stats", requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const rows = await listSeasonCompetitionStats(season);
    const totals = rows.reduce(
      (acc, r) => ({
        games: acc.games + r.games,
        wins: acc.wins + r.wins,
        draws: acc.draws + r.draws,
        losses: acc.losses + r.losses,
        goalsFor: acc.goalsFor + r.goalsFor,
        goalsAgainst: acc.goalsAgainst + r.goalsAgainst,
      }),
      { games: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
    );
    res.json({
      season,
      data: rows.map(serializeSeasonCompetitionStat),
      totals,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/seasons/:year/competition-stats", requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const body = req.body as {
      competitionId?: unknown;
      games?: unknown;
      wins?: unknown;
      draws?: unknown;
      losses?: unknown;
      goalsFor?: unknown;
      goalsAgainst?: unknown;
      classification?: unknown;
    };
    const competitionId =
      typeof body.competitionId === "number"
        ? body.competitionId
        : parseInt(String(body.competitionId ?? ""), 10);
    if (!Number.isInteger(competitionId) || competitionId < 1) {
      return res.status(400).json({ error: "competitionId inválido" });
    }
    const [comp] = await db
      .select({ id: competitionsTable.id })
      .from(competitionsTable)
      .where(eq(competitionsTable.id, competitionId))
      .limit(1);
    if (!comp) return res.status(404).json({ error: "Competição não encontrada" });

    const games = parseNonNegInt(body.games, 0);
    const wins = parseNonNegInt(body.wins, 0);
    const draws = parseNonNegInt(body.draws, 0);
    const losses = parseNonNegInt(body.losses, 0);
    const goalsFor = parseNonNegInt(body.goalsFor, 0);
    const goalsAgainst = parseNonNegInt(body.goalsAgainst, 0);
    if (
      games == null ||
      wins == null ||
      draws == null ||
      losses == null ||
      goalsFor == null ||
      goalsAgainst == null
    ) {
      return res.status(400).json({ error: "valores numéricos inválidos" });
    }
    const classification =
      typeof body.classification === "string"
        ? body.classification.trim() || null
        : null;

    try {
      const [inserted] = await db
        .insert(seasonCompetitionStatsTable)
        .values({
          season,
          competitionId,
          games,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          classification,
          statsSource: "manual",
          statsRecalculatedAt: null,
        })
        .returning();
      const rows = await listSeasonCompetitionStats(season);
      const row = rows.find((r) => r.id === inserted.id);
      if (!row) {
        return res.status(201).json({
          id: inserted.id,
          season: inserted.season,
          competitionId: inserted.competitionId,
          competitionName: "",
          games: inserted.games,
          wins: inserted.wins,
          draws: inserted.draws,
          losses: inserted.losses,
          goalsFor: inserted.goalsFor,
          goalsAgainst: inserted.goalsAgainst,
          classification: inserted.classification,
          statsSource: inserted.statsSource,
          statsRecalculatedAt: null,
        });
      }
      res.status(201).json(serializeSeasonCompetitionStat(row));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/unique|duplicate/i.test(msg)) {
        return res.status(409).json({
          error: "Já existe resumo para esta competição nesta temporada",
        });
      }
      throw err;
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put(
  "/admin/seasons/:year/competition-stats/bulk",
  requireAdmin,
  async (req, res) => {
    const client = await pgPool.connect();
    try {
      const year = parseInt(req.params.year, 10);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return res.status(400).json({ error: "Ano inválido" });
      }
      const season = String(year);
      const raw = (req.body as { stats?: unknown })?.stats;
      if (!Array.isArray(raw)) {
        return res.status(400).json({ error: "stats deve ser um array" });
      }
      if (raw.length === 0) {
        const rows = await listSeasonCompetitionStats(season);
        return res.json(rows.map(serializeSeasonCompetitionStat));
      }

      const updates: {
        id: number;
        games: number;
        wins: number;
        draws: number;
        losses: number;
        goalsFor: number;
        goalsAgainst: number;
        classification: string | null;
        isChampion: boolean | null;
        finalMatchId: number | null | undefined;
      }[] = [];

      for (const row of raw) {
        const item = row as Record<string, unknown>;
        const id =
          typeof item.id === "number" ? item.id : parseInt(String(item.id), 10);
        const games = parseNonNegInt(item.games, 0);
        const wins = parseNonNegInt(item.wins, 0);
        const draws = parseNonNegInt(item.draws, 0);
        const losses = parseNonNegInt(item.losses, 0);
        const goalsFor = parseNonNegInt(item.goalsFor, 0);
        const goalsAgainst = parseNonNegInt(item.goalsAgainst, 0);
        if (
          !Number.isInteger(id) ||
          games == null ||
          wins == null ||
          draws == null ||
          losses == null ||
          goalsFor == null ||
          goalsAgainst == null
        ) {
          return res.status(400).json({ error: "linha inválida em stats" });
        }
        const classification =
          typeof item.classification === "string"
            ? item.classification.trim() || null
            : item.classification === null
              ? null
              : undefined;
        if (classification === undefined && item.classification != null) {
          return res.status(400).json({ error: "classification inválida" });
        }
        const isChampionProvided = Object.prototype.hasOwnProperty.call(
          item,
          "isChampion",
        );
        let isChampion: boolean | null = null;
        if (isChampionProvided) {
          if (typeof item.isChampion === "boolean") {
            isChampion = item.isChampion;
          } else if (item.isChampion === "true" || item.isChampion === 1) {
            isChampion = true;
          } else if (item.isChampion === "false" || item.isChampion === 0) {
            isChampion = false;
          } else {
            return res.status(400).json({ error: "isChampion inválido" });
          }
        }
        const finalMatchProvided = Object.prototype.hasOwnProperty.call(
          item,
          "finalMatchId",
        );
        let finalMatchId: number | null | undefined = undefined;
        if (finalMatchProvided) {
          if (
            item.finalMatchId === null ||
            item.finalMatchId === "" ||
            item.finalMatchId === undefined
          ) {
            finalMatchId = null;
          } else {
            const parsed =
              typeof item.finalMatchId === "number"
                ? item.finalMatchId
                : parseInt(String(item.finalMatchId), 10);
            if (!Number.isInteger(parsed) || parsed < 1) {
              return res.status(400).json({ error: "finalMatchId inválido" });
            }
            finalMatchId = parsed;
          }
        }
        updates.push({
          id,
          games,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          classification: classification ?? null,
          isChampion,
          finalMatchId,
        });
      }

      await client.query("BEGIN");
      for (const u of updates) {
        const result = await client.query(
          `UPDATE season_competition_stats SET
             games = $1, wins = $2, draws = $3, losses = $4,
             goals_for = $5, goals_against = $6,
             classification = $7,
             is_champion = COALESCE($8::boolean, is_champion),
             final_match_id = CASE WHEN $9::boolean THEN $10::integer ELSE final_match_id END,
             stats_source = 'manual',
             stats_recalculated_at = NULL
           WHERE id = $11 AND season = $12
           RETURNING id`,
          [
            u.games,
            u.wins,
            u.draws,
            u.losses,
            u.goalsFor,
            u.goalsAgainst,
            u.classification,
            u.isChampion,
            u.finalMatchId !== undefined,
            u.finalMatchId ?? null,
            u.id,
            season,
          ],
        );
        if (result.rowCount === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: `Linha #${u.id} não encontrada` });
        }
      }
      await client.query("COMMIT");

      const rows = await listSeasonCompetitionStats(season);
      res.json(rows.map(serializeSeasonCompetitionStat));
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      req.log.error(err);
      res.status(500).json({ error: "Erro interno" });
    } finally {
      client.release();
    }
  },
);

router.post(
  "/admin/seasons/:year/recalculate-competition-stats",
  requireAdmin,
  async (req, res) => {
    try {
      const year = parseInt(req.params.year, 10);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return res.status(400).json({ error: "Ano inválido" });
      }
      const result = await recalculateSeasonCompetitionStats(String(year));
      res.json({
        season: result.season,
        upserted: result.upserted,
        preservedManual: result.preservedManual,
        removedCalculated: result.removedCalculated,
        data: result.rows.map(serializeSeasonCompetitionStat),
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erro interno" });
    }
  },
);

router.delete(
  "/admin/season-competition-stats/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
      const deleted = await db
        .delete(seasonCompetitionStatsTable)
        .where(eq(seasonCompetitionStatsTable.id, id))
        .returning({ id: seasonCompetitionStatsTable.id });
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Linha não encontrada" });
      }
      res.json({ ok: true });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erro interno" });
    }
  },
);

router.get("/admin/records", requireAdmin, async (req, res) => {
  try {
    const data = await computeClubRecords();
    res.json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/titles", requireAdmin, async (req, res) => {
  try {
    const campaigns = await listChampionCampaigns();
    const withCounts = await Promise.all(
      campaigns.map(async (c) => {
        const [playerIds, managerIds] = await Promise.all([
          playerIdsForChampionCampaign(c.season, c.competitionId),
          managerIdsForChampionCampaign(c.season, c.competitionId),
        ]);
        return {
          ...c,
          playerCount: playerIds.length,
          managerCount: managerIds.length,
        };
      }),
    );
    res.json({ total: withCounts.length, campaigns: withCounts });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/titles/:id/holders", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [row] = await db
      .select({
        id: seasonCompetitionStatsTable.id,
        season: seasonCompetitionStatsTable.season,
        competitionId: seasonCompetitionStatsTable.competitionId,
        competitionName: competitionsTable.name,
        isChampion: seasonCompetitionStatsTable.isChampion,
      })
      .from(seasonCompetitionStatsTable)
      .innerJoin(
        competitionsTable,
        eq(seasonCompetitionStatsTable.competitionId, competitionsTable.id),
      )
      .where(eq(seasonCompetitionStatsTable.id, id))
      .limit(1);
    if (!row) return res.status(404).json({ error: "Campanha não encontrada" });
    if (!row.isChampion) {
      return res.status(400).json({ error: "Campanha não marcada como título" });
    }

    const [playerIds, managerIds] = await Promise.all([
      playerIdsForChampionCampaign(row.season, row.competitionId),
      managerIdsForChampionCampaign(row.season, row.competitionId),
    ]);

    const players =
      playerIds.length === 0
        ? []
        : await db
            .select({ id: playersTable.id, name: playersTable.name })
            .from(playersTable)
            .where(inArray(playersTable.id, playerIds))
            .orderBy(asc(playersTable.name));

    const managers =
      managerIds.length === 0
        ? []
        : await db
            .select({ id: managersTable.id, name: managersTable.name })
            .from(managersTable)
            .where(inArray(managersTable.id, managerIds))
            .orderBy(asc(managersTable.name));

    res.json({
      id: row.id,
      season: row.season,
      competitionId: row.competitionId,
      competitionName: row.competitionName,
      players,
      managers,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.patch(
  "/admin/season-competition-stats/:id/champion",
  requireAdmin,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
      const body = req.body as {
        isChampion?: unknown;
        finalMatchId?: unknown;
      };

      const [existing] = await db
        .select()
        .from(seasonCompetitionStatsTable)
        .where(eq(seasonCompetitionStatsTable.id, id))
        .limit(1);
      if (!existing) return res.status(404).json({ error: "Linha não encontrada" });

      const patch: {
        isChampion?: boolean;
        finalMatchId?: number | null;
      } = {};

      if (typeof body.isChampion === "boolean") {
        patch.isChampion = body.isChampion;
      }
      if (body.finalMatchId === null || body.finalMatchId === "") {
        patch.finalMatchId = null;
      } else if (body.finalMatchId !== undefined) {
        const mid =
          typeof body.finalMatchId === "number"
            ? body.finalMatchId
            : parseInt(String(body.finalMatchId), 10);
        if (!Number.isInteger(mid) || mid < 1) {
          return res.status(400).json({ error: "finalMatchId inválido" });
        }
        const [match] = await db
          .select({
            id: matchesTable.id,
            season: matchesTable.season,
            competitionId: matchesTable.competitionId,
          })
          .from(matchesTable)
          .where(eq(matchesTable.id, mid))
          .limit(1);
        if (!match) return res.status(404).json({ error: "Partida não encontrada" });
        if (
          match.season !== existing.season ||
          match.competitionId !== existing.competitionId
        ) {
          return res.status(400).json({
            error: "A final deve ser da mesma temporada e competição",
          });
        }
        patch.finalMatchId = mid;
      }

      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ error: "Nada para atualizar" });
      }

      await db
        .update(seasonCompetitionStatsTable)
        .set(patch)
        .where(eq(seasonCompetitionStatsTable.id, id));

      const rows = await listSeasonCompetitionStats(existing.season);
      const row = rows.find((r) => r.id === id);
      if (!row) return res.status(404).json({ error: "Linha não encontrada" });
      res.json(serializeSeasonCompetitionStat(row));
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erro interno" });
    }
  },
);

function serializeSeasonPlayerStat(row: {
  id: number;
  playerId: number;
  playerName: string;
  position: string | null;
  photoUrl?: string | null;
  season: string;
  appearances: number;
  goals: number;
  assists: number;
  shirtNumber: number | null;
}) {
  return {
    id: row.id,
    playerId: row.playerId,
    playerName: row.playerName,
    position: row.position,
    photoUrl: row.photoUrl ?? null,
    season: row.season,
    appearances: row.appearances,
    goals: row.goals,
    assists: row.assists,
    shirtNumber: row.shirtNumber,
  };
}

async function listSeasonPlayerStats(season: string) {
  return db
    .select({
      id: playerSeasonStatsTable.id,
      playerId: playerSeasonStatsTable.playerId,
      playerName: playersTable.name,
      position: playersTable.position,
      photoUrl: playersTable.photoUrl,
      season: playerSeasonStatsTable.season,
      appearances: playerSeasonStatsTable.appearances,
      goals: playerSeasonStatsTable.goals,
      assists: playerSeasonStatsTable.assists,
      shirtNumber: playerSeasonStatsTable.shirtNumber,
    })
    .from(playerSeasonStatsTable)
    .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
    .where(eq(playerSeasonStatsTable.season, season))
    .orderBy(desc(playerSeasonStatsTable.appearances), asc(playersTable.name));
}

function parseOptionalShirtNumber(raw: unknown): number | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
}

/** Drizzle wraps PG errors — walk cause chain for unique violations (23505). */
function isPgUniqueViolation(err: unknown): boolean {
  let cur: unknown = err;
  for (let i = 0; i < 6 && cur; i++) {
    if (typeof cur === "object" && cur !== null) {
      const obj = cur as { code?: unknown; message?: unknown; cause?: unknown };
      if (String(obj.code ?? "") === "23505") return true;
      if (
        typeof obj.message === "string" &&
        /duplicate key|unique constraint|unique|duplicate/i.test(obj.message)
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

router.get("/admin/seasons/:year/players", requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const rows = await listSeasonPlayerStats(season);
    res.json({ season, data: rows.map(serializeSeasonPlayerStat), total: rows.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/seasons/:year/players", requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const body = req.body as {
      playerId?: unknown;
      appearances?: unknown;
      goals?: unknown;
      assists?: unknown;
      shirtNumber?: unknown;
    };
    const playerId =
      typeof body.playerId === "number"
        ? body.playerId
        : parseInt(String(body.playerId ?? ""), 10);
    if (!Number.isInteger(playerId) || playerId < 1) {
      return res.status(400).json({ error: "playerId inválido" });
    }
    const [player] = await db
      .select({ id: playersTable.id, name: playersTable.name })
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .limit(1);
    if (!player) return res.status(404).json({ error: "Jogador não encontrado" });

    const appearances = parseNonNegInt(body.appearances, 0);
    const goals = parseNonNegInt(body.goals, 0);
    const assists = parseNonNegInt(body.assists, 0);
    const shirtNumber = parseOptionalShirtNumber(body.shirtNumber);
    if (
      appearances == null ||
      goals == null ||
      assists == null ||
      shirtNumber === undefined
    ) {
      return res.status(400).json({ error: "valores numéricos inválidos" });
    }

    try {
      // Idempotent: already on roster → treat as linked (Ogol "outra temporada").
      const [already] = await db
        .select({ id: playerSeasonStatsTable.id })
        .from(playerSeasonStatsTable)
        .where(
          and(
            eq(playerSeasonStatsTable.playerId, playerId),
            eq(playerSeasonStatsTable.season, season),
          ),
        )
        .limit(1);
      if (already) {
        try {
          await syncPlayerSeasonStatsFromSheets(playerId);
        } catch (syncErr) {
          req.log.warn({ err: syncErr, playerId }, "sync after season link failed");
        }
        return res.status(409).json({
          error: "Jogador já está no elenco desta temporada",
        });
      }

      const [inserted] = await db
        .insert(playerSeasonStatsTable)
        .values({
          playerId,
          season,
          appearances,
          goals,
          assists,
          shirtNumber,
        })
        .returning();
      // Re-sync from sheets so unused-bench / other lineup seasons stay on the profile
      // when a player is linked into a new season (e.g. Ogol "outra temporada").
      try {
        await syncPlayerSeasonStatsFromSheets(playerId);
      } catch (syncErr) {
        req.log.warn({ err: syncErr, playerId }, "sync after season link failed");
      }
      const rows = await listSeasonPlayerStats(season);
      const row = rows.find((r) => r.id === inserted.id);
      res.status(201).json(
        serializeSeasonPlayerStat(
          row ?? {
            id: inserted.id,
            playerId: inserted.playerId,
            playerName: player.name,
            position: null,
            season: inserted.season,
            appearances: inserted.appearances,
            goals: inserted.goals,
            assists: inserted.assists,
            shirtNumber: inserted.shirtNumber,
          },
        ),
      );
    } catch (err: unknown) {
      if (isPgUniqueViolation(err)) {
        // Still refresh sheet-backed seasons when the row already existed.
        try {
          await syncPlayerSeasonStatsFromSheets(playerId);
        } catch (syncErr) {
          req.log.warn({ err: syncErr, playerId }, "sync after season link failed");
        }
        return res.status(409).json({
          error: "Jogador já está no elenco desta temporada",
        });
      }
      throw err;
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Normalize Ogol paste names the same way as the admin client. */
function normalizeOgolAlias(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Season-scoped Ogol nicknames (valid only for that year). */
router.get("/admin/seasons/:year/player-aliases", requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const rows = await db
      .select({
        id: playerSeasonNameAliasesTable.id,
        playerId: playerSeasonNameAliasesTable.playerId,
        playerName: playersTable.name,
        position: playersTable.position,
        photoUrl: playersTable.photoUrl,
        fullName: playersTable.fullName,
        season: playerSeasonNameAliasesTable.season,
        alias: playerSeasonNameAliasesTable.alias,
        aliasNorm: playerSeasonNameAliasesTable.aliasNorm,
      })
      .from(playerSeasonNameAliasesTable)
      .innerJoin(
        playersTable,
        eq(playerSeasonNameAliasesTable.playerId, playersTable.id),
      )
      .where(eq(playerSeasonNameAliasesTable.season, season))
      .orderBy(asc(playerSeasonNameAliasesTable.aliasNorm));
    res.json({
      season,
      data: rows.map((r) => ({
        id: r.id,
        playerId: r.playerId,
        playerName: r.playerName,
        position: r.position,
        photoUrl: r.photoUrl ?? null,
        fullName: r.fullName ?? null,
        alias: r.alias,
        aliasNorm: r.aliasNorm,
      })),
      total: rows.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/seasons/:year/player-aliases", requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const body = req.body as { alias?: unknown; playerId?: unknown };
    const alias =
      typeof body.alias === "string" ? body.alias.trim() : String(body.alias ?? "").trim();
    const playerId =
      typeof body.playerId === "number"
        ? body.playerId
        : parseInt(String(body.playerId ?? ""), 10);
    if (!alias) return res.status(400).json({ error: "alias obrigatório" });
    if (!Number.isInteger(playerId) || playerId < 1) {
      return res.status(400).json({ error: "playerId inválido" });
    }
    const aliasNorm = normalizeOgolAlias(alias);
    if (!aliasNorm) return res.status(400).json({ error: "alias inválido" });

    const [player] = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        photoUrl: playersTable.photoUrl,
        fullName: playersTable.fullName,
      })
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .limit(1);
    if (!player) return res.status(404).json({ error: "Jogador não encontrado" });

    // Raw upsert — Drizzle onConflictDoUpdate against a uniqueIndex is unreliable here.
    const upsert = await pgPool.query(
      `
      INSERT INTO player_season_name_aliases (player_id, season, alias, alias_norm)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (season, alias_norm)
      DO UPDATE SET player_id = EXCLUDED.player_id, alias = EXCLUDED.alias
      RETURNING id, player_id, season, alias, alias_norm
      `,
      [playerId, season, alias, aliasNorm],
    );
    const row = upsert.rows[0] as {
      id: number;
      player_id: number;
      season: string;
      alias: string;
      alias_norm: string;
    };

    res.status(201).json({
      id: row.id,
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      photoUrl: player.photoUrl ?? null,
      fullName: player.fullName ?? null,
      season: row.season,
      alias: row.alias,
      aliasNorm: row.alias_norm,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/seasons/:year/players/bulk", requireAdmin, async (req, res) => {
  const client = await pgPool.connect();
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const raw = (req.body as { stats?: unknown })?.stats;
    if (!Array.isArray(raw)) {
      return res.status(400).json({ error: "stats deve ser um array" });
    }
    if (raw.length === 0) {
      const rows = await listSeasonPlayerStats(season);
      return res.json(rows.map(serializeSeasonPlayerStat));
    }

    const updates: {
      id: number;
      appearances: number;
      goals: number;
      assists: number;
      shirtNumber: number | null;
    }[] = [];

    for (const row of raw) {
      const item = row as Record<string, unknown>;
      const id =
        typeof item.id === "number" ? item.id : parseInt(String(item.id), 10);
      const appearances = parseNonNegInt(item.appearances, 0);
      const goals = parseNonNegInt(item.goals, 0);
      const assists = parseNonNegInt(item.assists, 0);
      const shirtNumber = parseOptionalShirtNumber(item.shirtNumber);
      if (
        !Number.isInteger(id) ||
        appearances == null ||
        goals == null ||
        assists == null ||
        shirtNumber === undefined
      ) {
        return res.status(400).json({ error: "linha inválida em stats" });
      }
      updates.push({ id, appearances, goals, assists, shirtNumber });
    }

    await client.query("BEGIN");
    for (const u of updates) {
      const result = await client.query(
        `UPDATE player_season_stats SET
           appearances = $1, goals = $2, assists = $3, shirt_number = $4
         WHERE id = $5 AND season = $6
         RETURNING id`,
        [u.appearances, u.goals, u.assists, u.shirtNumber, u.id, season],
      );
      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: `Linha #${u.id} não encontrada` });
      }
    }
    await client.query("COMMIT");

    const rows = await listSeasonPlayerStats(season);
    res.json(rows.map(serializeSeasonPlayerStat));
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  } finally {
    client.release();
  }
});

function serializeSeasonManagerStat(row: {
  id: number;
  managerId: number;
  managerName: string;
  photoUrl?: string | null;
  season: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  statsSource: string;
  statsRecalculatedAt: Date | string | null;
}) {
  return {
    id: row.id,
    managerId: row.managerId,
    managerName: row.managerName,
    photoUrl: row.photoUrl ?? null,
    season: row.season,
    games: row.games,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    statsSource: row.statsSource,
    statsRecalculatedAt:
      row.statsRecalculatedAt instanceof Date
        ? row.statsRecalculatedAt.toISOString()
        : row.statsRecalculatedAt,
  };
}

async function listSeasonManagerStats(season: string) {
  return db
    .select({
      id: managerSeasonStatsTable.id,
      managerId: managerSeasonStatsTable.managerId,
      managerName: managersTable.name,
      photoUrl: managersTable.photoUrl,
      season: managerSeasonStatsTable.season,
      games: managerSeasonStatsTable.games,
      wins: managerSeasonStatsTable.wins,
      draws: managerSeasonStatsTable.draws,
      losses: managerSeasonStatsTable.losses,
      goalsFor: managerSeasonStatsTable.goalsFor,
      goalsAgainst: managerSeasonStatsTable.goalsAgainst,
      statsSource: managerSeasonStatsTable.statsSource,
      statsRecalculatedAt: managerSeasonStatsTable.statsRecalculatedAt,
    })
    .from(managerSeasonStatsTable)
    .innerJoin(managersTable, eq(managerSeasonStatsTable.managerId, managersTable.id))
    .where(eq(managerSeasonStatsTable.season, season))
    .orderBy(desc(managerSeasonStatsTable.games), asc(managersTable.name));
}

router.get("/admin/seasons/:year/managers", requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const rows = await listSeasonManagerStats(season);
    res.json({
      season,
      data: rows.map(serializeSeasonManagerStat),
      total: rows.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/seasons/:year/managers", requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const body = req.body as {
      managerId?: unknown;
      games?: unknown;
      wins?: unknown;
      draws?: unknown;
      losses?: unknown;
      goalsFor?: unknown;
      goalsAgainst?: unknown;
    };
    const managerId =
      typeof body.managerId === "number"
        ? body.managerId
        : parseInt(String(body.managerId ?? ""), 10);
    if (!Number.isInteger(managerId) || managerId < 1) {
      return res.status(400).json({ error: "managerId inválido" });
    }
    const [manager] = await db
      .select({ id: managersTable.id, name: managersTable.name })
      .from(managersTable)
      .where(eq(managersTable.id, managerId))
      .limit(1);
    if (!manager) return res.status(404).json({ error: "Técnico não encontrado" });

    const games = parseNonNegInt(body.games, 0);
    const wins = parseNonNegInt(body.wins, 0);
    const draws = parseNonNegInt(body.draws, 0);
    const losses = parseNonNegInt(body.losses, 0);
    const goalsFor = parseNonNegInt(body.goalsFor, 0);
    const goalsAgainst = parseNonNegInt(body.goalsAgainst, 0);
    if (
      games == null ||
      wins == null ||
      draws == null ||
      losses == null ||
      goalsFor == null ||
      goalsAgainst == null
    ) {
      return res.status(400).json({ error: "valores numéricos inválidos" });
    }

    try {
      const [inserted] = await db
        .insert(managerSeasonStatsTable)
        .values({
          managerId,
          season,
          games,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          statsSource: "manual",
          statsRecalculatedAt: null,
        })
        .returning();
      await syncManagerCareerFromSeasonRows(managerId);
      const rows = await listSeasonManagerStats(season);
      const row = rows.find((r) => r.id === inserted.id);
      res.status(201).json(
        serializeSeasonManagerStat(
          row ?? {
            id: inserted.id,
            managerId: inserted.managerId,
            managerName: manager.name,
            season: inserted.season,
            games: inserted.games,
            wins: inserted.wins,
            draws: inserted.draws,
            losses: inserted.losses,
            goalsFor: inserted.goalsFor,
            goalsAgainst: inserted.goalsAgainst,
            statsSource: inserted.statsSource,
            statsRecalculatedAt: inserted.statsRecalculatedAt,
          },
        ),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/unique|duplicate/i.test(msg)) {
        return res.status(409).json({
          error: "Técnico já vinculado a esta temporada",
        });
      }
      throw err;
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/seasons/:year/managers/bulk", requireAdmin, async (req, res) => {
  const client = await pgPool.connect();
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const season = String(year);
    const raw = (req.body as { stats?: unknown })?.stats;
    if (!Array.isArray(raw)) {
      return res.status(400).json({ error: "stats deve ser um array" });
    }
    if (raw.length === 0) {
      const rows = await listSeasonManagerStats(season);
      return res.json(rows.map(serializeSeasonManagerStat));
    }

    const updates: {
      id: number;
      games: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    }[] = [];

    for (const row of raw) {
      const item = row as Record<string, unknown>;
      const id =
        typeof item.id === "number" ? item.id : parseInt(String(item.id), 10);
      const games = parseNonNegInt(item.games, 0);
      const wins = parseNonNegInt(item.wins, 0);
      const draws = parseNonNegInt(item.draws, 0);
      const losses = parseNonNegInt(item.losses, 0);
      const goalsFor = parseNonNegInt(item.goalsFor, 0);
      const goalsAgainst = parseNonNegInt(item.goalsAgainst, 0);
      if (
        !Number.isInteger(id) ||
        games == null ||
        wins == null ||
        draws == null ||
        losses == null ||
        goalsFor == null ||
        goalsAgainst == null
      ) {
        return res.status(400).json({ error: "linha inválida em stats" });
      }
      updates.push({ id, games, wins, draws, losses, goalsFor, goalsAgainst });
    }

    const touchedManagerIds = new Set<number>();
    await client.query("BEGIN");
    for (const u of updates) {
      const result = await client.query(
        `UPDATE manager_season_stats SET
           games = $1, wins = $2, draws = $3, losses = $4,
           goals_for = $5, goals_against = $6,
           stats_source = 'manual', stats_recalculated_at = NULL
         WHERE id = $7 AND season = $8
         RETURNING id, manager_id`,
        [
          u.games,
          u.wins,
          u.draws,
          u.losses,
          u.goalsFor,
          u.goalsAgainst,
          u.id,
          season,
        ],
      );
      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: `Linha #${u.id} não encontrada` });
      }
      touchedManagerIds.add(result.rows[0].manager_id as number);
    }
    await client.query("COMMIT");

    for (const mid of touchedManagerIds) {
      await syncManagerCareerFromSeasonRows(mid);
    }

    const rows = await listSeasonManagerStats(season);
    res.json(rows.map(serializeSeasonManagerStat));
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  } finally {
    client.release();
  }
});

router.put("/admin/seasons/:year/verification", requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: "Ano inválido" });
    }
    const body = req.body as { verified?: unknown };
    if (typeof body.verified !== "boolean") {
      return res.status(400).json({ error: "verified (boolean) obrigatório" });
    }
    try {
      const result = await setSeasonStatsVerification(year, body.verified);
      res.json(result);
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? Number((err as { status: unknown }).status)
          : 0;
      if (status === 404) {
        return res.status(404).json({ error: "Temporada não encontrada" });
      }
      throw err;
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post(
  "/admin/seasons/:year/recalculate-badges",
  requireAdmin,
  async (req, res) => {
    try {
      const year = parseInt(req.params.year, 10);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return res.status(400).json({ error: "Ano inválido" });
      }
      const [season] = await db
        .select({
          year: seasonsTable.year,
          statsFullyVerified: seasonsTable.statsFullyVerified,
        })
        .from(seasonsTable)
        .where(eq(seasonsTable.year, year))
        .limit(1);
      if (!season) {
        return res.status(404).json({ error: "Temporada não encontrada" });
      }
      if (!season.statsFullyVerified) {
        return res.status(400).json({
          error:
            "Marque a temporada como completamente verificada antes de recalcular",
        });
      }
      const result = await recalculateSeasonAutoBadges(year);
      res.json(result);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erro interno" });
    }
  },
);

router.get(
  "/admin/seasons/:year/competition-badges",
  requireAdmin,
  async (req, res) => {
    try {
      const year = parseInt(req.params.year, 10);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return res.status(400).json({ error: "Ano inválido" });
      }
      const [season] = await db
        .select({ year: seasonsTable.year })
        .from(seasonsTable)
        .where(eq(seasonsTable.year, year))
        .limit(1);
      if (!season) {
        return res.status(404).json({ error: "Temporada não encontrada" });
      }
      const details = await getSeasonCompetitionBadgeStatuses(year);
      res.json({ year, details });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erro interno" });
    }
  },
);

// ── CSV Export ────────────────────────────────────────────────────────────────

router.get("/admin/export/players", requireAdmin, async (req, res) => {
  try {
    const players = await db.select().from(playersTable).orderBy(asc(playersTable.name));
    const csv = toCSV(["id", "name", "position", "nationality", "birth_year"], players as Record<string, unknown>[]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="jogadores.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/export/player-stats", requireAdmin, async (req, res) => {
  try {
    const stats = await db
      .select({
        player_id: playerSeasonStatsTable.playerId,
        player_name: playersTable.name,
        season: playerSeasonStatsTable.season,
        appearances: playerSeasonStatsTable.appearances,
        goals: playerSeasonStatsTable.goals,
        assists: playerSeasonStatsTable.assists,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .orderBy(asc(playersTable.name), asc(playerSeasonStatsTable.season));
    const csv = toCSV(["player_id", "player_name", "season", "appearances", "goals", "assists"], stats as Record<string, unknown>[]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="estatisticas_jogadores.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/export/matches", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: matchesTable.id,
        date: matchesTable.matchDate,
        season: matchesTable.season,
        opponent: opponentsTable.name,
        goals_for: matchesTable.goalsFor,
        goals_against: matchesTable.goalsAgainst,
        own_goals_for_count: matchesTable.ownGoalsForCount,
        result: matchesTable.result,
        home_away: matchesTable.homeAway,
        competition: competitionsTable.name,
        phase: matchesTable.phase,
        round: matchesTable.round,
        stadium: stadiumsTable.name,
        manager: managersTable.name,
        referee: refereesTable.name,
        scorers: matchesTable.scorers,
        attendance: matchesTable.attendance,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .leftJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
      .leftJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
      .orderBy(asc(matchesTable.matchDate));
    const csv = toCSV(
      [
        "id",
        "date",
        "season",
        "opponent",
        "goals_for",
        "goals_against",
        "own_goals_for_count",
        "result",
        "home_away",
        "competition",
        "phase",
        "round",
        "stadium",
        "manager",
        "referee",
        "scorers",
        "attendance",
      ],
      rows as Record<string, unknown>[],
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="partidas.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/export/opponents", requireAdmin, async (req, res) => {
  try {
    const opponents = await db.select().from(opponentsTable).orderBy(asc(opponentsTable.name));
    const csv = toCSV(["id", "name"], opponents as Record<string, unknown>[]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="adversarios.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── CSV Import ────────────────────────────────────────────────────────────────

router.post("/admin/import/players", requireAdmin, async (req, res) => {
  try {
    const { csv, resolutions } = req.body as {
      csv: string;
      resolutions?: NameResolution[];
    };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    const result = await runPlayersCsvImport(csv, parseCSV, resolutions ?? []);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Erro interno",
    });
  }
});

router.post("/admin/import/players/resolve", requireAdmin, async (req, res) => {
  try {
    const { csv, resolutions } = req.body as {
      csv: string;
      resolutions?: NameResolution[];
    };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    if (!resolutions?.length) {
      return res.status(400).json({ error: "resolutions obrigatório" });
    }
    const onlyRowIndexes = new Set(resolutions.map((r) => r.rowIndex));
    const result = await runPlayersCsvImport(csv, parseCSV, resolutions, {
      onlyRowIndexes,
    });
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Erro interno",
    });
  }
});

router.post("/admin/import/player-stats", requireAdmin, async (req, res) => {
  try {
    const { csv } = req.body as { csv: string };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    const rows = parseCSV(csv);
    let created = 0;
    let skipped = 0;
    for (const row of rows) {
      const playerId = parseInt(row.player_id);
      if (isNaN(playerId) || !row.season) { skipped++; continue; }
      await db.insert(playerSeasonStatsTable).values({
        playerId,
        season: row.season,
        appearances: parseInt(row.appearances) || 0,
        goals: parseInt(row.goals) || 0,
        assists: parseInt(row.assists) || 0,
      });
      created++;
    }
    res.json({ created, skipped });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

async function runMatchesCsvImport(
  csv: string,
  resolutions: NameResolution[],
  opts?: { onlyRowIndexes?: Set<number> },
): Promise<{
  created: number;
  skipped: number;
  needsConfirmation: Awaited<ReturnType<typeof resolveNamesForRow>>["conflicts"];
}> {
  const rows = parseCSV(csv);
  let created = 0;
  let skipped = 0;
  const needsConfirmation: Awaited<ReturnType<typeof resolveNamesForRow>>["conflicts"] = [];

  const allOpponents = await db.select().from(opponentsTable);
  const allCompetitions = await db.select().from(competitionsTable);
  const allStadiums = await db.select().from(stadiumsTable);
  const allReferees = await db.select().from(refereesTable);
  const entityMaps = await loadEntityMaps();
  const sessionResolved = new Map<string, number>();

  const opponentMap = new Map(allOpponents.map((o) => [o.name.toLowerCase(), o.id]));
  const competitionMap = new Map(allCompetitions.map((c) => [c.name.toLowerCase(), c.id]));
  const stadiumMap = new Map(allStadiums.map((s) => [s.name.toLowerCase(), s.id]));
  const refereeMap = new Map(allReferees.map((r) => [r.name.toLowerCase(), r.id]));

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    if (opts?.onlyRowIndexes && !opts.onlyRowIndexes.has(rowIndex)) continue;

    const row = rows[rowIndex];
    if (!row.date || !row.opponent || !row.competition) {
      skipped++;
      continue;
    }

    const { managerId, playerIds, conflicts } = await resolveNamesForRow(
      rowIndex,
      row,
      entityMaps,
      resolutions,
      sessionResolved,
    );
    if (conflicts.length) {
      needsConfirmation.push(...conflicts);
      continue;
    }

    let opponentId = opponentMap.get(row.opponent.toLowerCase());
    if (!opponentId) {
      const [newOpp] = await db.insert(opponentsTable).values({ name: row.opponent }).returning();
      opponentId = newOpp.id;
      opponentMap.set(row.opponent.toLowerCase(), opponentId);
    }

    let competitionId = competitionMap.get(row.competition.toLowerCase());
    if (!competitionId) {
      const [newComp] = await db.insert(competitionsTable).values({ name: row.competition }).returning();
      competitionId = newComp.id;
      competitionMap.set(row.competition.toLowerCase(), competitionId);
    }

    let stadiumId: number | null = null;
    if (row.stadium) {
      stadiumId = stadiumMap.get(row.stadium.toLowerCase()) ?? null;
      if (!stadiumId) {
        const [newStad] = await db.insert(stadiumsTable).values({ name: row.stadium }).returning();
        stadiumId = newStad.id;
        stadiumMap.set(row.stadium.toLowerCase(), stadiumId);
      }
    }

    let refereeId: number | null = null;
    if (row.referee?.trim()) {
      const refKey = row.referee.trim().toLowerCase();
      refereeId = refereeMap.get(refKey) ?? null;
      if (!refereeId) {
        const [newRef] = await db
          .insert(refereesTable)
          .values({ name: row.referee.trim() })
          .returning();
        refereeId = newRef.id;
        refereeMap.set(refKey, refereeId);
      }
    }

    const gfRaw = row.goals_for !== "" ? parseInt(row.goals_for) : null;
    const gaRaw = row.goals_against !== "" ? parseInt(row.goals_against) : null;
    const gf = gfRaw !== null && !isNaN(gfRaw) ? gfRaw : null;
    const ga = gaRaw !== null && !isNaN(gaRaw) ? gaRaw : null;
    const ownGoalsForCount = computeOwnGoalsForCount(row);
    const result =
      row.result ||
      (gf != null && ga != null ? (gf > ga ? "win" : gf < ga ? "loss" : "draw") : "unknown");

    const grossRevenue = row.gross_revenue ? parseInt(row.gross_revenue) : null;
    const grossRevenueText = row.gross_revenue_text || null;
    const phase = row.phase?.trim() || null;
    const round = row.round?.trim() || null;
    const penalties = parsePenaltyShootout(row.penalty_shootout);
    const attendancePaidRaw =
      row.attendance_paid !== undefined && row.attendance_paid !== ""
        ? parseInt(row.attendance_paid, 10)
        : null;
    const attendancePaid =
      attendancePaidRaw !== null && !isNaN(attendancePaidRaw) ? attendancePaidRaw : null;

    const [inserted] = await db
      .insert(matchesTable)
      .values({
        matchDate: row.date,
        season: row.season || row.date.substring(0, 4),
        opponentId,
        goalsFor: gf,
        goalsAgainst: ga,
        ownGoalsForCount,
        result,
        homeAway: row.home_away || "home",
        competitionId,
        phase,
        round,
        stadiumId,
        managerId,
        refereeId,
        attendance: row.attendance ? parseInt(row.attendance) : null,
        attendancePaid,
        scorers: row.scorers || null,
        penaltiesFor: penalties?.for ?? null,
        penaltiesAgainst: penalties?.against ?? null,
        grossRevenue: isNaN(grossRevenue as number) ? null : grossRevenue,
        grossRevenueText,
        isWalkover: row.is_walkover === "true",
        isFriendly: row.is_friendly === "true",
      })
      .returning({ id: matchesTable.id });

    try {
      await buildAndWriteCsaSheet(inserted.id, row, playerIds, entityMaps);
    } catch (sheetErr) {
      // Match already created; surface sheet error but keep import going
      throw Object.assign(
        sheetErr instanceof Error ? sheetErr : new Error(String(sheetErr)),
        { matchId: inserted.id, rowIndex },
      );
    }
    created++;
  }

  return { created, skipped, needsConfirmation };
}

router.post("/admin/import/matches", requireAdmin, async (req, res) => {
  try {
    const { csv, resolutions } = req.body as {
      csv: string;
      resolutions?: NameResolution[];
    };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    const result = await runMatchesCsvImport(csv, resolutions ?? []);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Erro interno",
    });
  }
});

router.post("/admin/import/matches/resolve", requireAdmin, async (req, res) => {
  try {
    const { csv, resolutions } = req.body as {
      csv: string;
      resolutions?: NameResolution[];
    };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    if (!resolutions?.length) {
      return res.status(400).json({ error: "resolutions obrigatório" });
    }
    const onlyRowIndexes = new Set(resolutions.map((r) => r.rowIndex));
    const result = await runMatchesCsvImport(csv, resolutions, { onlyRowIndexes });
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Erro interno",
    });
  }
});

// Competition management
const COMPETITION_TYPES = new Set(["state", "league", "regional", "cup", "friendly"]);

function parseCompetitionType(
  raw: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null || String(raw).trim() === "") return { ok: true, value: null };
  const type = String(raw).trim().toLowerCase();
  if (!COMPETITION_TYPES.has(type)) {
    return {
      ok: false,
      error: "type inválido (state, league, regional, cup, friendly)",
    };
  }
  return { ok: true, value: type };
}

router.get("/admin/competitions", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: competitionsTable.id,
        name: competitionsTable.name,
        type: competitionsTable.type,
        matchCount: sql<number>`cast(count(${matchesTable.id}) as int)`,
      })
      .from(competitionsTable)
      .leftJoin(matchesTable, eq(matchesTable.competitionId, competitionsTable.id))
      .groupBy(competitionsTable.id, competitionsTable.name, competitionsTable.type)
      .orderBy(asc(competitionsTable.name));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/competitions", requireAdmin, async (req, res) => {
  try {
    const body = req.body as { name?: string; type?: string | null };
    const name = body.name?.trim() ?? "";
    if (!name) return res.status(400).json({ error: "Nome obrigatório" });
    const typed = parseCompetitionType(body.type);
    if (!typed.ok) return res.status(400).json({ error: typed.error });

    const [existing] = await db
      .select({ id: competitionsTable.id })
      .from(competitionsTable)
      .where(eq(competitionsTable.name, name))
      .limit(1);
    if (existing) {
      return res.status(409).json({ error: "Já existe uma competição com este nome" });
    }

    const [competition] = await db
      .insert(competitionsTable)
      .values({ name, type: typed.value })
      .returning();
    res.status(201).json(competition);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/competitions/merge", requireAdmin, async (req, res) => {
  try {
    const { keepId, removeId } = req.body as { keepId: number; removeId: number };
    if (!keepId || !removeId) return res.status(400).json({ error: "keepId e removeId obrigatórios" });
    if (keepId === removeId) {
      return res.status(400).json({ error: "keepId e removeId devem ser diferentes" });
    }
    await db.update(matchesTable).set({ competitionId: keepId }).where(eq(matchesTable.competitionId, removeId));
    await db.delete(competitionsTable).where(eq(competitionsTable.id, removeId));
    const [kept] = await db.select({ name: competitionsTable.name }).from(competitionsTable).where(eq(competitionsTable.id, keepId));
    res.json({ ok: true, kept: kept?.name, removedId: removeId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/competitions/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [competition] = await db
      .select()
      .from(competitionsTable)
      .where(eq(competitionsTable.id, id))
      .limit(1);
    if (!competition) return res.status(404).json({ error: "Competição não encontrada" });

    const [{ count: matchCount }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(matchesTable)
      .where(eq(matchesTable.competitionId, id));

    const seasons = await db
      .select({
        season: matchesTable.season,
        matchCount: sql<number>`cast(count(*) as int)`,
      })
      .from(matchesTable)
      .where(eq(matchesTable.competitionId, id))
      .groupBy(matchesTable.season)
      .orderBy(desc(matchesTable.season));

    res.json({ ...competition, matchCount, seasons });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/competitions/:id/matches", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const season =
      typeof req.query.season === "string" ? req.query.season.trim() : "";
    if (!season) return res.status(400).json({ error: "season obrigatório" });

    const [competition] = await db
      .select({ id: competitionsTable.id })
      .from(competitionsTable)
      .where(eq(competitionsTable.id, id))
      .limit(1);
    if (!competition) return res.status(404).json({ error: "Competição não encontrada" });

    const matches = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        opponentName: opponentsTable.name,
        phase: matchesTable.phase,
        round: matchesTable.round,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(
        and(eq(matchesTable.competitionId, id), eq(matchesTable.season, season)),
      )
      .orderBy(desc(matchesTable.matchDate), desc(matchesTable.id));

    res.json({ season, matches });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/competitions/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Only delete if no matches reference it
    const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(matchesTable).where(eq(matchesTable.competitionId, id));
    if (count > 0) return res.status(400).json({ error: `Competição possui ${count} partidas vinculadas` });
    await db.delete(competitionsTable).where(eq(competitionsTable.id, id));
    res.json({ ok: true, deletedId: id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/competitions/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, type } = req.body as { name?: string; type?: string | null };
    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) return res.status(400).json({ error: "Nome obrigatório" });
      updates.name = trimmed;
    }
    if (type !== undefined) {
      const typed = parseCompetitionType(type);
      if (!typed.ok) return res.status(400).json({ error: typed.error });
      updates.type = typed.value;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: "Nenhum campo para atualizar" });

    if (typeof updates.name === "string") {
      const [dup] = await db
        .select({ id: competitionsTable.id })
        .from(competitionsTable)
        .where(
          and(
            eq(competitionsTable.name, updates.name as string),
            sql`${competitionsTable.id} <> ${id}`,
          ),
        )
        .limit(1);
      if (dup) {
        return res.status(409).json({ error: "Já existe uma competição com este nome" });
      }
    }

    await db.update(competitionsTable).set(updates).where(eq(competitionsTable.id, id));
    const [updated] = await db.select().from(competitionsTable).where(eq(competitionsTable.id, id));
    res.json({ ok: true, competition: updated });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Merge two opponents: reassign all matches from removeId to keepId, then delete removeId
router.post("/admin/opponents/merge", requireAdmin, async (req, res) => {
  try {
    const { keepId, removeId } = req.body as { keepId: number; removeId: number };
    if (!keepId || !removeId) return res.status(400).json({ error: "keepId e removeId obrigatórios" });
    if (keepId === removeId) return res.status(400).json({ error: "IDs devem ser diferentes" });
    const [keep] = await db.select({ id: opponentsTable.id, name: opponentsTable.name }).from(opponentsTable).where(eq(opponentsTable.id, keepId));
    const [remove] = await db.select({ id: opponentsTable.id }).from(opponentsTable).where(eq(opponentsTable.id, removeId));
    if (!keep || !remove) return res.status(404).json({ error: "Adversário não encontrado" });
    await db.update(matchesTable).set({ opponentId: keepId }).where(eq(matchesTable.opponentId, removeId));
    await db.delete(opponentsTable).where(eq(opponentsTable.id, removeId));
    res.json({ ok: true, kept: keep.name, removedId: removeId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Merge two players: re-point sheet FKs + season stats, then delete removeId
router.post("/admin/players/merge", requireAdmin, async (req, res) => {
  try {
    const { keepId, removeId } = req.body as { keepId: number; removeId: number };
    if (!keepId || !removeId) return res.status(400).json({ error: "keepId e removeId obrigatórios" });
    if (keepId === removeId) return res.status(400).json({ error: "IDs devem ser diferentes" });

    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      const keepP = await client.query(`SELECT id, name FROM players WHERE id=$1`, [keepId]);
      const removeP = await client.query(`SELECT id, name FROM players WHERE id=$1`, [removeId]);
      if (!keepP.rows[0] || !removeP.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Jogador não encontrado" });
      }
      const keepName = keepP.rows[0].name as string;

      const conflicts = await client.query(
        `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id
         FROM match_lineups a
         JOIN match_lineups b
           ON a.match_id=b.match_id AND a.side=b.side AND b.player_id=$2
         WHERE a.player_id=$1`,
        [removeId, keepId],
      );
      for (const c of conflicts.rows) {
        await client.query(`UPDATE match_goals SET scorer_lineup_id=$2 WHERE scorer_lineup_id=$1`, [
          c.from_lineup_id,
          c.to_lineup_id,
        ]);
        await client.query(`UPDATE match_goals SET assist_lineup_id=$2 WHERE assist_lineup_id=$1`, [
          c.from_lineup_id,
          c.to_lineup_id,
        ]);
        await client.query(`UPDATE match_cards SET lineup_id=$2 WHERE lineup_id=$1`, [
          c.from_lineup_id,
          c.to_lineup_id,
        ]);
        await client.query(
          `UPDATE match_substitutions SET player_out_lineup_id=$2 WHERE player_out_lineup_id=$1`,
          [c.from_lineup_id, c.to_lineup_id],
        );
        await client.query(
          `UPDATE match_substitutions SET player_in_lineup_id=$2 WHERE player_in_lineup_id=$1`,
          [c.from_lineup_id, c.to_lineup_id],
        );
        await client.query(`DELETE FROM match_lineups WHERE id=$1`, [c.from_lineup_id]);
      }

      await client.query(
        `UPDATE match_lineups SET player_id=$2, player_name=$3 WHERE player_id=$1`,
        [removeId, keepId, keepName],
      );
      await client.query(
        `UPDATE match_goals SET scorer_player_id=$2, scorer_name=$3 WHERE scorer_player_id=$1`,
        [removeId, keepId, keepName],
      );
      await client.query(
        `UPDATE match_goals SET assist_player_id=$2, assist_name=$3 WHERE assist_player_id=$1`,
        [removeId, keepId, keepName],
      );
      await client.query(
        `UPDATE match_cards SET player_id=$2, player_name=$3 WHERE player_id=$1`,
        [removeId, keepId, keepName],
      );
      await client.query(
        `UPDATE match_substitutions SET player_out_id=$2, player_out_name=$3 WHERE player_out_id=$1`,
        [removeId, keepId, keepName],
      );
      await client.query(
        `UPDATE match_substitutions SET player_in_id=$2, player_in_name=$3 WHERE player_in_id=$1`,
        [removeId, keepId, keepName],
      );
      await client.query(`UPDATE matches SET captain_player_id=$2 WHERE captain_player_id=$1`, [
        removeId,
        keepId,
      ]);

      const pss = await client.query(
        `SELECT season, appearances, goals, assists FROM player_season_stats WHERE player_id=$1`,
        [removeId],
      );
      for (const row of pss.rows) {
        const exist = await client.query(
          `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
          [keepId, row.season],
        );
        if (exist.rows[0]) {
          // Prefer max for now; exact sheet totals are rebuilt below.
          await client.query(
            `UPDATE player_season_stats SET
               appearances = GREATEST(appearances, $2),
               goals = GREATEST(goals, $3),
               assists = GREATEST(assists, $4)
             WHERE id=$1`,
            [exist.rows[0].id, row.appearances ?? 0, row.goals ?? 0, row.assists ?? 0],
          );
          await client.query(
            `DELETE FROM player_season_stats WHERE player_id=$1 AND season=$2`,
            [removeId, row.season],
          );
        } else {
          await client.query(
            `UPDATE player_season_stats SET player_id=$2 WHERE player_id=$1 AND season=$3`,
            [removeId, keepId, row.season],
          );
        }
      }

      await client.query(
        `UPDATE entity_badges SET entity_id=$2
         WHERE entity_type='player' AND entity_id=$1
           AND NOT EXISTS (
             SELECT 1 FROM entity_badges b
             WHERE b.entity_type='player' AND b.entity_id=$2
               AND b.label = entity_badges.label
               AND COALESCE(b.season_year, -1) = COALESCE(entity_badges.season_year, -1)
           )`,
        [removeId, keepId],
      );
      await client.query(
        `DELETE FROM entity_badges WHERE entity_type='player' AND entity_id=$1`,
        [removeId],
      );
      await client.query(`DELETE FROM players WHERE id=$1`, [removeId]);
      await client.query("COMMIT");

      // Rebuild kept player season totals from sheets (apps/goals/assists).
      try {
        await syncPlayerSeasonStatsFromSheets(keepId);
      } catch (syncErr) {
        req.log.warn({ err: syncErr, keepId }, "player merge: season stats sync failed");
      }

      res.json({ ok: true, kept: keepName, removedId: removeId });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Merge two managers: reassign matches + season stats, then delete removeId
router.post("/admin/managers/merge", requireAdmin, async (req, res) => {
  try {
    const { keepId, removeId } = req.body as { keepId: number; removeId: number };
    if (!keepId || !removeId) return res.status(400).json({ error: "keepId e removeId obrigatórios" });
    if (keepId === removeId) return res.status(400).json({ error: "IDs devem ser diferentes" });

    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      const keepM = await client.query(`SELECT id, name FROM managers WHERE id=$1`, [keepId]);
      const removeM = await client.query(`SELECT id FROM managers WHERE id=$1`, [removeId]);
      if (!keepM.rows[0] || !removeM.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Técnico não encontrado" });
      }
      const keepName = keepM.rows[0].name as string;

      await client.query(`UPDATE matches SET manager_id=$2 WHERE manager_id=$1`, [removeId, keepId]);

      const mss = await client.query(
        `SELECT season, games, wins, draws, losses, goals_for, goals_against, stats_source
         FROM manager_season_stats WHERE manager_id=$1`,
        [removeId],
      );
      for (const row of mss.rows) {
        const exist = await client.query(
          `SELECT id FROM manager_season_stats WHERE manager_id=$1 AND season=$2`,
          [keepId, row.season],
        );
        if (exist.rows[0]) {
          await client.query(
            `UPDATE manager_season_stats SET
               games = GREATEST(games, $2),
               wins = GREATEST(wins, $3),
               draws = GREATEST(draws, $4),
               losses = GREATEST(losses, $5),
               goals_for = GREATEST(goals_for, $6),
               goals_against = GREATEST(goals_against, $7),
               stats_source = CASE
                 WHEN stats_source = 'manual' OR $8 = 'manual' THEN 'manual'
                 ELSE stats_source
               END
             WHERE id=$1`,
            [
              exist.rows[0].id,
              row.games ?? 0,
              row.wins ?? 0,
              row.draws ?? 0,
              row.losses ?? 0,
              row.goals_for ?? 0,
              row.goals_against ?? 0,
              row.stats_source,
            ],
          );
          await client.query(
            `DELETE FROM manager_season_stats WHERE manager_id=$1 AND season=$2`,
            [removeId, row.season],
          );
        } else {
          await client.query(
            `UPDATE manager_season_stats SET manager_id=$2 WHERE manager_id=$1 AND season=$3`,
            [removeId, keepId, row.season],
          );
        }
      }

      await client.query(
        `UPDATE entity_badges SET entity_id=$2
         WHERE entity_type='manager' AND entity_id=$1
           AND NOT EXISTS (
             SELECT 1 FROM entity_badges b
             WHERE b.entity_type='manager' AND b.entity_id=$2
               AND b.label = entity_badges.label
               AND COALESCE(b.season_year, -1) = COALESCE(entity_badges.season_year, -1)
           )`,
        [removeId, keepId],
      );
      await client.query(
        `DELETE FROM entity_badges WHERE entity_type='manager' AND entity_id=$1`,
        [removeId],
      );
      await client.query(`DELETE FROM managers WHERE id=$1`, [removeId]);
      await client.query("COMMIT");
      res.json({ ok: true, kept: keepName, removedId: removeId });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Update a single season entry for a player (upsert)
router.put("/admin/players/:id/season-stats/:season", requireAdmin, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const season = req.params.season;
    const { appearances, goals, assists } = req.body as {
      appearances?: number; goals?: number; assists?: number;
    };
    if (!season) return res.status(400).json({ error: "season obrigatório" });
    const result = await pgPool.query(
      `UPDATE player_season_stats SET appearances=$1, goals=$2, assists=$3 WHERE player_id=$4 AND season=$5 RETURNING *`,
      [appearances ?? 0, goals ?? 0, assists ?? 0, playerId, season]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Entrada não encontrada para esse jogador/temporada" });
    }
    res.json({ ok: true, row: result.rows[0] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Legacy: upsert ONE season row without wiping the rest of the profile.
// (Older clients used to DELETE all seasons then insert one — that wiped history.)
router.put("/admin/players/:id/stats", requireAdmin, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId) || playerId < 1) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const { season, appearances, goals, assists } = req.body as {
      season: string; appearances: number; goals: number; assists?: number;
    };
    if (!season) return res.status(400).json({ error: "season obrigatório" });
    const apps = appearances ?? 0;
    const g = goals ?? 0;
    const a = assists ?? 0;

    const [existing] = await db
      .select({ id: playerSeasonStatsTable.id })
      .from(playerSeasonStatsTable)
      .where(
        and(
          eq(playerSeasonStatsTable.playerId, playerId),
          eq(playerSeasonStatsTable.season, season),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(playerSeasonStatsTable)
        .set({ appearances: apps, goals: g, assists: a })
        .where(eq(playerSeasonStatsTable.id, existing.id));
    } else {
      await db.insert(playerSeasonStatsTable).values({
        playerId,
        season,
        appearances: apps,
        goals: g,
        assists: a,
      });
    }
    res.json({ ok: true, playerId, season, appearances: apps, goals: g, assists: a });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/import/opponents", requireAdmin, async (req, res) => {
  try {
    const { csv } = req.body as { csv: string };
    if (!csv) return res.status(400).json({ error: "CSV obrigatório" });
    const rows = parseCSV(csv);
    let created = 0;
    let skipped = 0;
    for (const row of rows) {
      if (!row.name?.trim()) { skipped++; continue; }
      try {
        await db.insert(opponentsTable).values({ name: row.name.trim() });
        created++;
      } catch {
        skipped++;
      }
    }
    res.json({ created, skipped });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Sync Apply ────────────────────────────────────────────────────────────────

router.post("/admin/sync/apply", requireAdmin, async (req, res) => {
  const {
    competitions_upsert = [],
    opponents_update = [],
    opponents_insert = [],
    managers_upsert = [],
    players_upsert = [],
    pss_upsert = [],
    matches_insert = [],
    static_opponent_map = {},
  } = req.body as {
    competitions_upsert: { id: number; name: string; type: string | null }[];
    opponents_update:    { id: number; name: string }[];
    opponents_insert:    { devId: number; name: string }[];
    managers_upsert:     Record<string, unknown>[];
    players_upsert:      { id: number; name: string; position?: string; nationality?: string }[];
    pss_upsert:          { player_id: number; season: string; goals: number; appearances: number; assists: number }[];
    matches_insert:      Record<string, unknown>[];
    static_opponent_map: Record<string, number>;
  };

  const client = await (pgPool as any).connect();
  const report: Record<string, unknown> = {};

  try {
    await client.query("BEGIN");

    // 1. Competitions upsert
    let compUpserted = 0;
    for (const c of competitions_upsert) {
      await client.query(
        `INSERT INTO competitions (id, name, type) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = COALESCE(EXCLUDED.type, competitions.type)`,
        [c.id, c.name, c.type ?? null]
      );
      compUpserted++;
    }
    report.competitions_upserted = compUpserted;

    // 2. Opponent name updates
    let oppUpdated = 0;
    for (const o of opponents_update) {
      await client.query(`UPDATE opponents SET name = $1 WHERE id = $2`, [o.name, o.id]);
      oppUpdated++;
    }
    report.opponents_updated = oppUpdated;

    // 3. Opponent inserts — collect new IDs for remapping
    const newOppMap: Record<number, number> = {};
    let oppInserted = 0;
    for (const o of opponents_insert) {
      const { rows } = await client.query(
        `INSERT INTO opponents (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [o.name]
      );
      newOppMap[o.devId] = rows[0].id;
      oppInserted++;
    }
    report.opponents_inserted = oppInserted;
    report.new_opponent_id_map = newOppMap;

    // Build full opponent remapping
    const oppRemap: Record<number, number> = {};
    for (const [devId, prodId] of Object.entries(static_opponent_map)) {
      oppRemap[Number(devId)] = Number(prodId);
    }
    Object.assign(oppRemap, newOppMap);

    // 4. Managers upsert
    let mgrUpserted = 0;
    for (const m of managers_upsert as any[]) {
      await client.query(
        `INSERT INTO managers (id, name, nationality,
           stored_games, stored_wins, stored_draws, stored_losses, stored_goals_for, stored_goals_against)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           nationality = EXCLUDED.nationality,
           stored_games = COALESCE(EXCLUDED.stored_games, managers.stored_games),
           stored_wins = COALESCE(EXCLUDED.stored_wins, managers.stored_wins),
           stored_draws = COALESCE(EXCLUDED.stored_draws, managers.stored_draws),
           stored_losses = COALESCE(EXCLUDED.stored_losses, managers.stored_losses),
           stored_goals_for = COALESCE(EXCLUDED.stored_goals_for, managers.stored_goals_for),
           stored_goals_against = COALESCE(EXCLUDED.stored_goals_against, managers.stored_goals_against)`,
        [m.id, m.name, m.nationality,
         m.stored_games, m.stored_wins, m.stored_draws, m.stored_losses,
         m.stored_goals_for, m.stored_goals_against]
      );
      mgrUpserted++;
    }
    report.managers_upserted = mgrUpserted;

    // 5. Players upsert
    let playersUpserted = 0;
    for (const p of players_upsert) {
      await client.query(
        `INSERT INTO players (id, name, position, nationality, birth_year)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, nationality = EXCLUDED.nationality`,
        [p.id, (p as any).name, (p as any).position, (p as any).nationality, (p as any).birth_year ?? null]
      );
      playersUpserted++;
    }
    report.players_upserted = playersUpserted;

    // 6. Player season stats insert (no unique constraint — check existence first)
    let pssInserted = 0, pssSkipped = 0;
    for (const s of pss_upsert) {
      const exists = await client.query(
        `SELECT 1 FROM player_season_stats WHERE player_id=$1 AND season=$2 LIMIT 1`,
        [s.player_id, s.season]
      );
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
           VALUES ($1, $2, $3, $4, $5)`,
          [s.player_id, s.season, s.appearances ?? 0, s.goals ?? 0, s.assists ?? 0]
        );
        pssInserted++;
      } else {
        pssSkipped++;
      }
    }
    report.pss_inserted = pssInserted;
    report.pss_skipped = pssSkipped;

    // 7. Matches insert — auto-increment ID, deduplicate by content
    let matchesInserted = 0, matchesSkipped = 0;
    for (const m of matches_insert as any[]) {
      const finalOppId = oppRemap[Number(m.opponent_id)] ?? Number(m.opponent_id);
      // Deduplicate: skip if same date/competition/opponent/home_away/season already exists
      const exists = await client.query(
        `SELECT 1 FROM matches WHERE match_date=$1 AND competition_id=$2 AND opponent_id=$3 AND home_away=$4 AND season=$5 LIMIT 1`,
        [m.match_date, m.competition_id, finalOppId, m.home_away, m.season]
      );
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO matches (match_date, season, competition_id, opponent_id,
             home_away, goals_for, goals_against, result, stadium_id, manager_id, attendance, scorers)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [m.match_date, m.season, m.competition_id, finalOppId,
           m.home_away, m.goals_for, m.goals_against, m.result,
           m.stadium_id ?? null, m.manager_id ?? null, m.attendance ?? null, m.scorers ?? null]
        );
        matchesInserted++;
      } else {
        matchesSkipped++;
      }
    }
    report.matches_inserted = matchesInserted;
    report.matches_skipped = matchesSkipped;

    // Reset sequences to max ID + 1 to avoid future conflicts
    for (const tbl of ['competitions','opponents','managers','players','player_season_stats','matches']) {
      await client.query(`SELECT setval(pg_get_serial_sequence('${tbl}', 'id'), COALESCE(MAX(id), 1)) FROM ${tbl}`);
    }
    report.sequences_reset = true;

    await client.query("COMMIT");
    report.success = true;
    res.json(report);
  } catch (err: any) {
    await client.query("ROLLBACK");
    req.log.error(err);
    res.status(500).json({ error: err.message, report });
  } finally {
    client.release();
  }
});

// ── Full matches table replacement (DEV → PROD) ───────────────────────────────
//
// POST /admin/sync/full-matches-replace
//
// Body:
//   opponents_to_create  [{name}]          — new opponents to INSERT before replace
//   managers_to_create   [{name}]          — upsert all managers by name
//   matches              [{...devMatch}]   — all 1051 rows from DEV with DEV FK IDs
//   opp_id_map           {devId: prodId}   — remap opponent_id
//   comp_id_map          {devId: prodId}   — remap competition_id
//   man_id_map           {devId: prodId}   — remap manager_id (unmapped → null)
//   stad_id_map          {devId: prodId}   — remap stadium_id (unmapped → null)
//   dry_run?             boolean           — if true, run all checks but ROLLBACK at the end

router.post("/admin/sync/full-matches-replace", requireAdmin, async (req, res) => {
  const {
    opponents_to_create = [],
    managers_to_create  = [],
    matches             = [],
    opp_id_map          = {},
    comp_id_map         = {},
    man_id_map          = {},
    stad_id_map         = {},
    dry_run             = false,
  } = req.body as {
    opponents_to_create?: { name: string }[];
    managers_to_create?:  { name: string }[];
    matches?:             any[];
    opp_id_map?:          Record<string, number>;
    comp_id_map?:         Record<string, number>;
    man_id_map?:          Record<string, number>;
    stad_id_map?:         Record<string, number>;
    dry_run?:             boolean;
  };

  const report: Record<string, any> = { dry_run };
  const client = await pgPool.connect();

  try {
    await client.query("BEGIN");

    // 1. Backup current matches table
    const ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const backupTable = `matches_backup_${ts}`;
    await client.query(`CREATE TABLE ${backupTable} AS SELECT * FROM matches`);
    const backupCount = await client.query(`SELECT count(*) FROM ${backupTable}`);
    report.backup_table   = backupTable;
    report.backup_rows    = parseInt(backupCount.rows[0].count, 10);

    // 2. Create missing opponents (by name — skip if already exists)
    let opponentsCreated = 0;
    const newOppIdByName: Record<string, number> = {};
    for (const o of opponents_to_create) {
      const existing = await client.query(
        `SELECT id FROM opponents WHERE lower(name) = lower($1) LIMIT 1`,
        [o.name]
      );
      if (existing.rows.length > 0) {
        newOppIdByName[o.name.toLowerCase()] = existing.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO opponents (name) VALUES ($1) RETURNING id`,
          [o.name]
        );
        newOppIdByName[o.name.toLowerCase()] = ins.rows[0].id;
        opponentsCreated++;
      }
    }
    report.opponents_created = opponentsCreated;

    // Build final opponent map: opp_id_map covers existing, newOppIdByName covers created.
    // opponents_to_create must include dev_id so we can complete the map for new entries.
    const finalOppMap: Record<number, number> = {};
    for (const [devId, prodId] of Object.entries(opp_id_map)) {
      finalOppMap[Number(devId)] = Number(prodId);
    }
    // Patch with newly created opponents (dev_id required in each entry)
    for (const o of opponents_to_create) {
      if ((o as any).dev_id && newOppIdByName[(o.name as string).toLowerCase()] !== undefined) {
        finalOppMap[Number((o as any).dev_id)] = newOppIdByName[(o.name as string).toLowerCase()];
      }
    }

    // 3. Upsert all managers by name (INSERT … ON CONFLICT DO NOTHING)
    let managersCreated = 0;
    const prodManIdByName: Record<string, number> = {};
    for (const m of managers_to_create) {
      const existing = await client.query(
        `SELECT id FROM managers WHERE lower(name) = lower($1) LIMIT 1`,
        [m.name]
      );
      if (existing.rows.length > 0) {
        prodManIdByName[m.name.toLowerCase()] = existing.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO managers (name) VALUES ($1) RETURNING id`,
          [m.name]
        );
        prodManIdByName[m.name.toLowerCase()] = ins.rows[0].id;
        managersCreated++;
      }
    }
    report.managers_created = managersCreated;

    // 4. Truncate matches
    await client.query("TRUNCATE TABLE matches RESTART IDENTITY CASCADE");
    report.truncated = true;

    // 5. Insert all DEV matches with remapped FK ids
    let inserted = 0;
    const unmappedOpps = new Set<number>();
    const unmappedComps = new Set<number>();

    for (const m of matches) {
      const devOppId  = Number(m.opponent_id);
      const devCompId = Number(m.competition_id);
      const devManId  = m.manager_id ? Number(m.manager_id) : null;
      const devStadId = m.stadium_id ? Number(m.stadium_id) : null;

      const prodOppId  = finalOppMap[devOppId];
      const prodCompId = Number(comp_id_map[devCompId] ?? devCompId);
      const prodStadId = devStadId !== null ? (Number(stad_id_map[devStadId] ?? devStadId) || null) : null;

      // Manager: use explicit map first, then fallback to name-based lookup
      let prodManId: number | null = null;
      if (devManId !== null) {
        if (man_id_map[devManId] !== undefined) {
          prodManId = Number(man_id_map[devManId]);
        } else {
          // Try name-based lookup from the upserted managers
          const manRes = await client.query(
            `SELECT id FROM managers WHERE id = $1 LIMIT 1`,
            [devManId]
          );
          if (manRes.rows.length > 0) prodManId = manRes.rows[0].id;
        }
      }

      if (prodOppId === undefined) {
        unmappedOpps.add(devOppId);
        continue; // skip — FK would fail
      }
      if (!prodCompId) {
        unmappedComps.add(devCompId);
        continue;
      }

      await client.query(
        `INSERT INTO matches
           (match_date, season, competition_id, opponent_id,
            home_away, goals_for, goals_against, result,
            stadium_id, manager_id, attendance, scorers)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          m.match_date, m.season, prodCompId, prodOppId,
          m.home_away, m.goals_for, m.goals_against, m.result,
          prodStadId, prodManId, m.attendance ?? null, m.scorers ?? null,
        ]
      );
      inserted++;
    }

    report.matches_inserted = inserted;
    report.unmapped_opp_ids  = [...unmappedOpps];
    report.unmapped_comp_ids = [...unmappedComps];

    // 6. Reset sequence
    await client.query(
      `SELECT setval(pg_get_serial_sequence('matches', 'id'), COALESCE(MAX(id), 1)) FROM matches`
    );
    report.sequence_reset = true;

    // 7. Final count validation
    const finalCount = await client.query(`SELECT count(*) FROM matches`);
    report.final_count = parseInt(finalCount.rows[0].count, 10);
    report.success = unmappedOpps.size === 0 && unmappedComps.size === 0 && inserted === matches.length;

    if (dry_run) {
      await client.query("ROLLBACK");
      report.rolled_back = true;
    } else {
      await client.query("COMMIT");
    }

    res.json(report);
  } catch (err: any) {
    await client.query("ROLLBACK");
    req.log?.error?.(err);
    res.status(500).json({ error: err.message, report });
  } finally {
    client.release();
  }
});

// ── Comments moderation ───────────────────────────────────────────────────────

router.get("/admin/comments", requireAdmin, async (req, res) => {
  try {
    const limitRaw = parseInt(String(req.query.limit ?? 50), 10);
    const offsetRaw = parseInt(String(req.query.offset ?? 0), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

    const totalR = await pgPool.query(`SELECT count(*)::int AS total FROM comments`);
    const total = totalR.rows[0]?.total ?? 0;

    const { rows } = await pgPool.query(
      `SELECT
         c.id,
         c.entity_type AS "entityType",
         c.entity_id AS "entityId",
         c.author_name AS "authorName",
         c.body,
         c.created_at AS "createdAt",
         CASE
           WHEN c.entity_type = 'player' THEN p.name
           WHEN c.entity_type = 'manager' THEN m.name
           WHEN c.entity_type = 'match' THEN
             COALESCE(to_char(mt.match_date::timestamp, 'YYYY-MM-DD'), '?') ||
             CASE WHEN o.name IS NOT NULL THEN ' vs ' || o.name ELSE '' END
           ELSE NULL
         END AS "entityLabel"
       FROM comments c
       LEFT JOIN players p
         ON c.entity_type = 'player' AND c.entity_id = p.id
       LEFT JOIN managers m
         ON c.entity_type = 'manager' AND c.entity_id = m.id
       LEFT JOIN matches mt
         ON c.entity_type = 'match' AND c.entity_id = mt.id
       LEFT JOIN opponents o
         ON mt.opponent_id = o.id
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    res.json({
      data: rows.map((r: {
        id: number;
        entityType: string;
        entityId: number;
        authorName: string;
        body: string;
        createdAt: Date | string;
        entityLabel: string | null;
      }) => {
        let publicPath = "/";
        let adminPath = "/admin";
        let entityLabel = r.entityLabel ?? `#${r.entityId}`;
        if (r.entityType === "player") {
          publicPath = `/jogadores/${r.entityId}`;
          adminPath = `/admin/jogadores/${r.entityId}`;
          if (!r.entityLabel) entityLabel = `Jogador #${r.entityId}`;
        } else if (r.entityType === "manager") {
          publicPath = `/tecnicos/${r.entityId}`;
          adminPath = `/admin/tecnicos/${r.entityId}`;
          if (!r.entityLabel) entityLabel = `Técnico #${r.entityId}`;
        } else if (r.entityType === "match") {
          publicPath = `/partidas/${r.entityId}`;
          adminPath = `/admin/partidas/${r.entityId}`;
          if (!r.entityLabel) entityLabel = `Partida #${r.entityId}`;
        }
        return {
          id: r.id,
          entityType: r.entityType,
          entityId: r.entityId,
          entityLabel,
          publicPath,
          adminPath,
          authorName: r.authorName,
          body: r.body,
          createdAt:
            r.createdAt instanceof Date
              ? r.createdAt.toISOString()
              : String(r.createdAt),
        };
      }),
      total,
      limit,
      offset,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/comments/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const deleted = await db
      .delete(commentsTable)
      .where(eq(commentsTable.id, id))
      .returning({ id: commentsTable.id });
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Suggestions review ────────────────────────────────────────────────────────

router.get("/admin/suggestions", requireAdmin, async (req, res) => {
  try {
    const limitRaw = parseInt(String(req.query.limit ?? 50), 10);
    const offsetRaw = parseInt(String(req.query.offset ?? 0), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
    const statusFilter =
      typeof req.query.status === "string" &&
      (req.query.status === "new" || req.query.status === "reviewed")
        ? req.query.status
        : null;

    const totalR = statusFilter
      ? await pgPool.query(
          `SELECT count(*)::int AS total FROM suggestions WHERE status = $1`,
          [statusFilter],
        )
      : await pgPool.query(`SELECT count(*)::int AS total FROM suggestions`);
    const total = totalR.rows[0]?.total ?? 0;

    const params: unknown[] = [];
    let where = "";
    if (statusFilter) {
      params.push(statusFilter);
      where = `WHERE s.status = $${params.length}`;
    }
    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const { rows } = await pgPool.query(
      `SELECT
         s.id,
         s.entity_type AS "entityType",
         s.entity_id AS "entityId",
         s.author_name AS "authorName",
         s.message,
         s.contact,
         s.status,
         s.created_at AS "createdAt",
         CASE
           WHEN s.entity_type = 'player' THEN p.name
           WHEN s.entity_type = 'manager' THEN m.name
           WHEN s.entity_type = 'match' THEN
             COALESCE(to_char(mt.match_date::timestamp, 'YYYY-MM-DD'), '?') ||
             CASE WHEN o_match.name IS NOT NULL THEN ' vs ' || o_match.name ELSE '' END
           WHEN s.entity_type = 'opponent' THEN o_ent.name
           WHEN s.entity_type = 'stadium' THEN st.name
           WHEN s.entity_type = 'referee' THEN rf.name
           WHEN s.entity_type = 'season' THEN s.entity_id::text
           WHEN s.entity_type = 'general' THEN 'Sugestão geral'
           ELSE NULL
         END AS "entityLabel"
       FROM suggestions s
       LEFT JOIN players p
         ON s.entity_type = 'player' AND s.entity_id = p.id
       LEFT JOIN managers m
         ON s.entity_type = 'manager' AND s.entity_id = m.id
       LEFT JOIN matches mt
         ON s.entity_type = 'match' AND s.entity_id = mt.id
       LEFT JOIN opponents o_match
         ON mt.opponent_id = o_match.id
       LEFT JOIN opponents o_ent
         ON s.entity_type = 'opponent' AND s.entity_id = o_ent.id
       LEFT JOIN stadiums st
         ON s.entity_type = 'stadium' AND s.entity_id = st.id
       LEFT JOIN referees rf
         ON s.entity_type = 'referee' AND s.entity_id = rf.id
       ${where}
       ORDER BY s.created_at DESC, s.id DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    );

    res.json({
      data: rows.map(
        (r: {
          id: number;
          entityType: string;
          entityId: number | null;
          authorName: string;
          message: string;
          contact: string | null;
          status: string;
          createdAt: Date | string;
          entityLabel: string | null;
        }) => {
          let publicPath: string | null = null;
          let adminPath: string | null = null;
          let entityLabel = r.entityLabel ?? (r.entityId != null ? `#${r.entityId}` : "—");
          if (r.entityType === "player" && r.entityId != null) {
            publicPath = `/jogadores/${r.entityId}`;
            adminPath = `/admin/jogadores/${r.entityId}`;
            if (!r.entityLabel) entityLabel = `Jogador #${r.entityId}`;
          } else if (r.entityType === "manager" && r.entityId != null) {
            publicPath = `/tecnicos/${r.entityId}`;
            adminPath = `/admin/tecnicos/${r.entityId}`;
            if (!r.entityLabel) entityLabel = `Técnico #${r.entityId}`;
          } else if (r.entityType === "match" && r.entityId != null) {
            publicPath = `/partidas/${r.entityId}`;
            adminPath = `/admin/partidas/${r.entityId}`;
            if (!r.entityLabel) entityLabel = `Partida #${r.entityId}`;
          } else if (r.entityType === "opponent" && r.entityId != null) {
            publicPath = `/adversarios/${r.entityId}`;
            adminPath = `/admin/adversarios/${r.entityId}`;
            if (!r.entityLabel) entityLabel = `Adversário #${r.entityId}`;
          } else if (r.entityType === "stadium" && r.entityId != null) {
            publicPath = `/estadios/${r.entityId}`;
            adminPath = `/admin/estadios/${r.entityId}`;
            if (!r.entityLabel) entityLabel = `Estádio #${r.entityId}`;
          } else if (r.entityType === "referee" && r.entityId != null) {
            publicPath = `/arbitros/${r.entityId}`;
            adminPath = `/admin/arbitros/${r.entityId}`;
            if (!r.entityLabel) entityLabel = `Árbitro #${r.entityId}`;
          } else if (r.entityType === "season" && r.entityId != null) {
            publicPath = `/temporadas/${r.entityId}`;
            adminPath = `/admin/temporadas/${r.entityId}`;
            entityLabel = r.entityLabel ?? `Temporada ${r.entityId}`;
          } else if (r.entityType === "general") {
            publicPath = null;
            adminPath = null;
            entityLabel = "Sugestão geral";
          }
          return {
            id: r.id,
            entityType: r.entityType,
            entityId: r.entityId,
            entityLabel,
            publicPath,
            adminPath,
            authorName: r.authorName,
            message: r.message,
            contact: r.contact,
            status: r.status,
            createdAt:
              r.createdAt instanceof Date
                ? r.createdAt.toISOString()
                : String(r.createdAt),
          };
        },
      ),
      total,
      limit,
      offset,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/admin/suggestions/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const status = (req.body as { status?: unknown })?.status;
    if (status !== "new" && status !== "reviewed") {
      return res.status(400).json({ error: "status deve ser new ou reviewed" });
    }
    const updated = await db
      .update(suggestionsTable)
      .set({ status })
      .where(eq(suggestionsTable.id, id))
      .returning({
        id: suggestionsTable.id,
        status: suggestionsTable.status,
      });
    if (updated.length === 0) {
      return res.status(404).json({ error: "Sugestão não encontrada" });
    }
    res.json(updated[0]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/suggestions/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const deleted = await db
      .delete(suggestionsTable)
      .where(eq(suggestionsTable.id, id))
      .returning({ id: suggestionsTable.id });
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Sugestão não encontrada" });
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Ratings moderation ────────────────────────────────────────────────────────

router.get("/admin/ratings", requireAdmin, async (req, res) => {
  try {
    const limitRaw = parseInt(String(req.query.limit ?? 50), 10);
    const offsetRaw = parseInt(String(req.query.offset ?? 0), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
    const typeFilter =
      typeof req.query.entityType === "string" &&
      isRatingEntityType(req.query.entityType)
        ? req.query.entityType
        : null;

    const totalR = typeFilter
      ? await pgPool.query(
          `SELECT count(*)::int AS total FROM ratings WHERE entity_type = $1`,
          [typeFilter],
        )
      : await pgPool.query(`SELECT count(*)::int AS total FROM ratings`);
    const total = totalR.rows[0]?.total ?? 0;

    const params: unknown[] = [];
    let where = "";
    if (typeFilter) {
      params.push(typeFilter);
      where = `WHERE r.entity_type = $${params.length}`;
    }
    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const { rows } = await pgPool.query(
      `SELECT
         r.id,
         r.entity_type AS "entityType",
         r.entity_id AS "entityId",
         r.stars,
         r.created_at AS "createdAt",
         CASE
           WHEN r.entity_type = 'player' THEN p.name
           WHEN r.entity_type = 'manager' THEN m.name
           WHEN r.entity_type = 'match' THEN
             COALESCE(to_char(mt.match_date::timestamp, 'YYYY-MM-DD'), '?') ||
             CASE WHEN o.name IS NOT NULL THEN ' vs ' || o.name ELSE '' END
           ELSE NULL
         END AS "entityLabel"
       FROM ratings r
       LEFT JOIN players p
         ON r.entity_type = 'player' AND r.entity_id = p.id
       LEFT JOIN managers m
         ON r.entity_type = 'manager' AND r.entity_id = m.id
       LEFT JOIN matches mt
         ON r.entity_type = 'match' AND r.entity_id = mt.id
       LEFT JOIN opponents o
         ON mt.opponent_id = o.id
       ${where}
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    );

    res.json({
      data: rows.map(
        (r: {
          id: number;
          entityType: string;
          entityId: number;
          stars: number;
          createdAt: Date | string;
          entityLabel: string | null;
        }) => {
          let publicPath = "/";
          let adminPath = "/admin";
          let entityLabel = r.entityLabel ?? `#${r.entityId}`;
          if (r.entityType === "player") {
            publicPath = `/jogadores/${r.entityId}`;
            adminPath = `/admin/jogadores/${r.entityId}`;
            if (!r.entityLabel) entityLabel = `Jogador #${r.entityId}`;
          } else if (r.entityType === "manager") {
            publicPath = `/tecnicos/${r.entityId}`;
            adminPath = `/admin/tecnicos/${r.entityId}`;
            if (!r.entityLabel) entityLabel = `Técnico #${r.entityId}`;
          } else if (r.entityType === "match") {
            publicPath = `/partidas/${r.entityId}`;
            adminPath = `/admin/partidas/${r.entityId}`;
            if (!r.entityLabel) entityLabel = `Partida #${r.entityId}`;
          }
          const entityType = r.entityType as RatingEntityType;
          return {
            id: r.id,
            entityType: r.entityType,
            entityId: r.entityId,
            entityLabel,
            publicPath,
            adminPath,
            stars: r.stars,
            label: isRatingEntityType(r.entityType)
              ? ratingLabel(entityType, r.stars)
              : null,
            createdAt:
              r.createdAt instanceof Date
                ? r.createdAt.toISOString()
                : String(r.createdAt),
          };
        },
      ),
      total,
      limit,
      offset,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/ratings/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const deleted = await db
      .delete(ratingsTable)
      .where(eq(ratingsTable.id, id))
      .returning({ id: ratingsTable.id });
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Avaliação não encontrada" });
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Transfers ─────────────────────────────────────────────────────────────────

function parseTransferDirection(
  raw: unknown,
): { ok: true; value: "in" | "out" } | { ok: false; error: string } {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "in" || v === "out") return { ok: true, value: v };
  return { ok: false, error: "Direção inválida (use in ou out)" };
}

function parseOptionalYmd(raw: unknown): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const s = String(raw).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function parseOptionalOpponentId(
  raw: unknown,
): { ok: true; value: number | null | undefined } | { ok: false; error: string } {
  if (raw === undefined) return { ok: true, value: undefined };
  if (raw == null || raw === "") return { ok: true, value: null };
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    return { ok: false, error: "opponentId inválido" };
  }
  return { ok: true, value: n };
}

router.get("/admin/transfers", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: transfersTable.id,
        playerId: transfersTable.playerId,
        playerName: playersTable.name,
        direction: transfersTable.direction,
        club: transfersTable.club,
        opponentId: transfersTable.opponentId,
        transferDate: transfersTable.transferDate,
        season: transfersTable.season,
        transferType: transfersTable.transferType,
        notes: transfersTable.notes,
      })
      .from(transfersTable)
      .innerJoin(playersTable, eq(transfersTable.playerId, playersTable.id))
      .orderBy(desc(transfersTable.season), desc(transfersTable.transferDate), asc(playersTable.name));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/transfers/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [row] = await db
      .select({
        id: transfersTable.id,
        playerId: transfersTable.playerId,
        playerName: playersTable.name,
        direction: transfersTable.direction,
        club: transfersTable.club,
        opponentId: transfersTable.opponentId,
        transferDate: transfersTable.transferDate,
        season: transfersTable.season,
        transferType: transfersTable.transferType,
        notes: transfersTable.notes,
      })
      .from(transfersTable)
      .innerJoin(playersTable, eq(transfersTable.playerId, playersTable.id))
      .where(eq(transfersTable.id, id));
    if (!row) return res.status(404).json({ error: "Transferência não encontrada" });
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/transfers", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      playerId?: number;
      direction?: string;
      club?: string | null;
      opponentId?: number | null;
      transferDate?: string | null;
      season?: string;
      transferType?: string | null;
      notes?: string | null;
    };
    const playerId = Number(body.playerId);
    if (!Number.isFinite(playerId) || playerId < 1) {
      return res.status(400).json({ error: "Jogador obrigatório" });
    }
    const [player] = await db
      .select({ id: playersTable.id })
      .from(playersTable)
      .where(eq(playersTable.id, playerId));
    if (!player) return res.status(400).json({ error: "Jogador não encontrado" });

    const dir = parseTransferDirection(body.direction);
    if (!dir.ok) return res.status(400).json({ error: dir.error });

    const season = body.season?.trim();
    if (!season) return res.status(400).json({ error: "Temporada obrigatória" });

    const oppParsed = parseOptionalOpponentId(body.opponentId);
    if (!oppParsed.ok) return res.status(400).json({ error: oppParsed.error });

    const club = body.club?.trim() || null;
    const opponentId = await resolveTransferOpponentId({
      opponentId: oppParsed.value === undefined ? null : oppParsed.value,
      club,
    });
    if (oppParsed.value != null && opponentId == null) {
      return res.status(400).json({ error: "Adversário não encontrado" });
    }

    const [created] = await db
      .insert(transfersTable)
      .values({
        playerId,
        direction: dir.value,
        club,
        opponentId,
        transferDate: parseOptionalYmd(body.transferDate),
        season,
        transferType: body.transferType?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/transfers/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [current] = await db.select().from(transfersTable).where(eq(transfersTable.id, id));
    if (!current) return res.status(404).json({ error: "Transferência não encontrada" });

    const body = req.body as {
      playerId?: number;
      direction?: string;
      club?: string | null;
      opponentId?: number | null;
      transferDate?: string | null;
      season?: string;
      transferType?: string | null;
      notes?: string | null;
    };

    const values: Partial<typeof transfersTable.$inferInsert> = {};
    if (body.playerId !== undefined) {
      const playerId = Number(body.playerId);
      if (!Number.isFinite(playerId) || playerId < 1) {
        return res.status(400).json({ error: "Jogador inválido" });
      }
      const [player] = await db
        .select({ id: playersTable.id })
        .from(playersTable)
        .where(eq(playersTable.id, playerId));
      if (!player) return res.status(400).json({ error: "Jogador não encontrado" });
      values.playerId = playerId;
    }
    if (body.direction !== undefined) {
      const dir = parseTransferDirection(body.direction);
      if (!dir.ok) return res.status(400).json({ error: dir.error });
      values.direction = dir.value;
    }
    if (body.club !== undefined) values.club = body.club?.trim() || null;
    if (body.transferDate !== undefined) {
      values.transferDate = parseOptionalYmd(body.transferDate);
    }
    if (body.season !== undefined) {
      const season = body.season?.trim();
      if (!season) return res.status(400).json({ error: "Temporada obrigatória" });
      values.season = season;
    }
    if (body.transferType !== undefined) {
      values.transferType = body.transferType?.trim() || null;
    }
    if (body.notes !== undefined) values.notes = body.notes?.trim() || null;

    const clubForResolve =
      body.club !== undefined ? body.club?.trim() || null : current.club;
    const oppParsed = parseOptionalOpponentId(body.opponentId);
    if (!oppParsed.ok) return res.status(400).json({ error: oppParsed.error });

    if (body.opponentId !== undefined || body.club !== undefined) {
      const opponentId = await resolveTransferOpponentId({
        opponentId:
          oppParsed.value === undefined ? current.opponentId : oppParsed.value,
        club: clubForResolve,
      });
      if (oppParsed.value != null && opponentId == null) {
        return res.status(400).json({ error: "Adversário não encontrado" });
      }
      // Re-resolve from club text when opponentId omitted but club changed
      if (body.opponentId !== undefined) {
        values.opponentId = opponentId;
      } else if (body.club !== undefined) {
        values.opponentId = opponentId;
      }
    }

    const [updated] = await db
      .update(transfersTable)
      .set(values)
      .where(eq(transfersTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/transfers/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const deleted = await db
      .delete(transfersTable)
      .where(eq(transfersTable.id, id))
      .returning({ id: transfersTable.id });
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Transferência não encontrada" });
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Presidents ────────────────────────────────────────────────────────────────

router.get("/admin/presidents", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(presidentsTable)
      .orderBy(
        sql`${presidentsTable.termStart} ASC NULLS LAST`,
        asc(presidentsTable.name),
      );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/presidents/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [row] = await db.select().from(presidentsTable).where(eq(presidentsTable.id, id));
    if (!row) return res.status(404).json({ error: "Presidente não encontrado" });
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/presidents", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      name?: string;
      photoUrl?: string | null;
      termStart?: string | null;
      termEnd?: string | null;
      isCurrent?: boolean;
      samePersonAsId?: number | null;
      notes?: string | null;
      linkedPlayerId?: number | null;
      linkedManagerId?: number | null;
    };
    if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });

    let linkedPlayerId: number | null = null;
    if (body.linkedPlayerId != null && body.linkedPlayerId !== ("" as unknown)) {
      const n = Number(body.linkedPlayerId);
      if (!Number.isInteger(n) || n < 1) {
        return res.status(400).json({ error: "linkedPlayerId inválido" });
      }
      const [p] = await db.select({ id: playersTable.id }).from(playersTable).where(eq(playersTable.id, n)).limit(1);
      if (!p) return res.status(400).json({ error: "Jogador vinculado não encontrado" });
      linkedPlayerId = n;
    }

    let linkedManagerId: number | null = null;
    if (body.linkedManagerId != null && body.linkedManagerId !== ("" as unknown)) {
      const n = Number(body.linkedManagerId);
      if (!Number.isInteger(n) || n < 1) {
        return res.status(400).json({ error: "linkedManagerId inválido" });
      }
      const [m] = await db.select({ id: managersTable.id }).from(managersTable).where(eq(managersTable.id, n)).limit(1);
      if (!m) return res.status(400).json({ error: "Técnico vinculado não encontrado" });
      linkedManagerId = n;
    }

    let personKey: number | null = null;
    if (body.samePersonAsId != null && body.samePersonAsId !== ("" as unknown)) {
      const n = Number(body.samePersonAsId);
      if (!Number.isInteger(n) || n < 1) {
        return res.status(400).json({ error: "samePersonAsId inválido" });
      }
      const [other] = await db.select().from(presidentsTable).where(eq(presidentsTable.id, n)).limit(1);
      if (!other) return res.status(400).json({ error: "Presidente vinculado não encontrado" });
      personKey = other.personKey ?? other.id;
      if (other.personKey == null) {
        await db
          .update(presidentsTable)
          .set({ personKey })
          .where(eq(presidentsTable.id, other.id));
      }
    }

    const isCurrent = !!body.isCurrent;
    const [created] = await db
      .insert(presidentsTable)
      .values({
        name: body.name.trim(),
        photoUrl: parseOptionalUrl(body.photoUrl),
        termStart: parseOptionalYmd(body.termStart),
        termEnd: isCurrent ? null : parseOptionalYmd(body.termEnd),
        isCurrent,
        personKey,
        notes: body.notes?.trim() || null,
        linkedPlayerId,
        linkedManagerId,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/presidents/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const [current] = await db.select().from(presidentsTable).where(eq(presidentsTable.id, id));
    if (!current) return res.status(404).json({ error: "Presidente não encontrado" });

    const body = req.body as {
      name?: string;
      photoUrl?: string | null;
      termStart?: string | null;
      termEnd?: string | null;
      isCurrent?: boolean;
      samePersonAsId?: number | null;
      notes?: string | null;
      linkedPlayerId?: number | null;
      linkedManagerId?: number | null;
    };
    const values: Partial<typeof presidentsTable.$inferInsert> = {};
    if (body.name !== undefined) {
      if (!body.name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
      values.name = body.name.trim();
    }
    if (body.photoUrl !== undefined) values.photoUrl = parseOptionalUrl(body.photoUrl);
    if (body.termStart !== undefined) values.termStart = parseOptionalYmd(body.termStart);
    if (body.isCurrent !== undefined) values.isCurrent = !!body.isCurrent;
    if (body.termEnd !== undefined || body.isCurrent !== undefined) {
      const isCurrent =
        body.isCurrent !== undefined ? !!body.isCurrent : !!current.isCurrent;
      values.isCurrent = isCurrent;
      values.termEnd = isCurrent ? null : parseOptionalYmd(body.termEnd);
    }
    if (body.notes !== undefined) values.notes = body.notes?.trim() || null;

    if (Object.prototype.hasOwnProperty.call(body, "samePersonAsId")) {
      const raw = body.samePersonAsId;
      if (raw == null || raw === ("" as unknown)) {
        values.personKey = null;
      } else {
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 1) {
          return res.status(400).json({ error: "samePersonAsId inválido" });
        }
        if (n === id) {
          return res.status(400).json({ error: "Não é possível vincular o mandato a si mesmo" });
        }
        const [other] = await db.select().from(presidentsTable).where(eq(presidentsTable.id, n)).limit(1);
        if (!other) return res.status(400).json({ error: "Presidente vinculado não encontrado" });
        const personKey = other.personKey ?? other.id;
        values.personKey = personKey;
        if (other.personKey == null) {
          await db
            .update(presidentsTable)
            .set({ personKey })
            .where(eq(presidentsTable.id, other.id));
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "linkedPlayerId")) {
      const raw = body.linkedPlayerId;
      if (raw == null || raw === ("" as unknown)) {
        values.linkedPlayerId = null;
      } else {
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 1) {
          return res.status(400).json({ error: "linkedPlayerId inválido" });
        }
        const [p] = await db.select({ id: playersTable.id }).from(playersTable).where(eq(playersTable.id, n)).limit(1);
        if (!p) return res.status(400).json({ error: "Jogador vinculado não encontrado" });
        values.linkedPlayerId = n;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "linkedManagerId")) {
      const raw = body.linkedManagerId;
      if (raw == null || raw === ("" as unknown)) {
        values.linkedManagerId = null;
      } else {
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 1) {
          return res.status(400).json({ error: "linkedManagerId inválido" });
        }
        const [m] = await db.select({ id: managersTable.id }).from(managersTable).where(eq(managersTable.id, n)).limit(1);
        if (!m) return res.status(400).json({ error: "Técnico vinculado não encontrado" });
        values.linkedManagerId = n;
      }
    }

    const [updated] = await db
      .update(presidentsTable)
      .set(values)
      .where(eq(presidentsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/presidents/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const deleted = await db
      .delete(presidentsTable)
      .where(eq(presidentsTable.id, id))
      .returning({ id: presidentsTable.id });
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Presidente não encontrado" });
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── Site content (editable copy blocks) ──────────────────────────────────────

function serializeSiteContent(row: typeof siteContentTable.$inferSelect) {
  return {
    key: row.key,
    content: row.content,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  };
}

router.get("/admin/site-content", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(siteContentTable)
      .orderBy(asc(siteContentTable.key));
    res.json(rows.map(serializeSiteContent));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/site-content/:key", requireAdmin, async (req, res) => {
  try {
    const key = String(req.params.key ?? "").trim();
    if (!key) return res.status(400).json({ error: "key inválida" });
    const [row] = await db
      .select()
      .from(siteContentTable)
      .where(eq(siteContentTable.key, key))
      .limit(1);
    if (!row) return res.status(404).json({ error: "Bloco não encontrado" });
    res.json(serializeSiteContent(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/site-content/:key", requireAdmin, async (req, res) => {
  try {
    const key = String(req.params.key ?? "").trim();
    if (!key || key.length > 80) {
      return res.status(400).json({ error: "key inválida" });
    }
    const content =
      typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) return res.status(400).json({ error: "content obrigatório" });
    if (content.length > 50_000) {
      return res.status(400).json({ error: "content muito longo" });
    }

    const now = new Date();
    const [existing] = await db
      .select({ id: siteContentTable.id })
      .from(siteContentTable)
      .where(eq(siteContentTable.key, key))
      .limit(1);

    let row: typeof siteContentTable.$inferSelect;
    if (existing) {
      const [updated] = await db
        .update(siteContentTable)
        .set({ content, updatedAt: now })
        .where(eq(siteContentTable.key, key))
        .returning();
      row = updated;
    } else {
      const [inserted] = await db
        .insert(siteContentTable)
        .values({ key, content, updatedAt: now })
        .returning();
      row = inserted;
    }
    res.json(serializeSiteContent(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** Fila dos próximos N dias do jogo Quem é o Jogador? (com histórico de aparições). */
router.get("/admin/quem-e-o-jogador", requireAdmin, async (req, res) => {
  try {
    const daysRaw = parseInt(String(req.query.days ?? 30), 10);
    const days = Number.isFinite(daysRaw)
      ? Math.min(Math.max(daysRaw, 1), 60)
      : 30;
    const queue = await getAdminQueue(days);
    res.json({
      days,
      poolSize: queue.poolSize,
      noRepeatDays: queue.noRepeatDays,
      blocked: queue.blocked,
      data: queue.days,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao carregar fila do jogo" });
  }
});

/** Bloqueia jogador do pool (não entra mais no sorteio). */
router.post("/admin/quem-e-o-jogador/block", requireAdmin, async (req, res) => {
  try {
    const playerId = Number(req.body?.playerId);
    if (!Number.isFinite(playerId) || playerId <= 0) {
      return res.status(400).json({ error: "playerId inválido" });
    }
    const note =
      typeof req.body?.note === "string" ? req.body.note : undefined;
    const queue = await blockDailyPlayer(playerId, note);
    res.json({
      ok: true,
      poolSize: queue.poolSize,
      noRepeatDays: queue.noRepeatDays,
      blocked: queue.blocked,
      data: queue.days,
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    req.log.error(err);
    res.status(status).json({
      error:
        err instanceof Error ? err.message : "Erro ao bloquear jogador",
    });
  }
});

/** Remove bloqueio e devolve o jogador ao pool. */
router.delete(
  "/admin/quem-e-o-jogador/block/:playerId",
  requireAdmin,
  async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      if (!Number.isFinite(playerId) || playerId <= 0) {
        return res.status(400).json({ error: "playerId inválido" });
      }
      const queue = await unblockDailyPlayer(playerId);
      res.json({
        ok: true,
        poolSize: queue.poolSize,
        noRepeatDays: queue.noRepeatDays,
        blocked: queue.blocked,
        data: queue.days,
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erro ao desbloquear jogador" });
    }
  },
);

/** Troca o jogador sorteado de uma data (hoje ou futura). */
router.post(
  "/admin/quem-e-o-jogador/replace",
  requireAdmin,
  async (req, res) => {
    try {
      const date = String(req.body?.date ?? "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "date inválida (YYYY-MM-DD)" });
      }
      const queue = await replaceDailyPlayer(date);
      res.json({
        ok: true,
        poolSize: queue.poolSize,
        noRepeatDays: queue.noRepeatDays,
        blocked: queue.blocked,
        data: queue.days,
      });
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      req.log.error(err);
      res.status(status).json({
        error:
          err instanceof Error ? err.message : "Erro ao trocar jogador",
      });
    }
  },
);

export default router;
