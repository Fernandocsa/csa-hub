import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, opponentsTable, stadiumsTable, competitionsTable, managersTable, refereesTable } from "@workspace/db";
import { sql, eq, and, ilike, desc, ne } from "drizzle-orm";
import { loadMatchSheet } from "../lib/match-sheet";
import {
  officialPlayedMatchConditions,
  scoredFieldMatchConditions,
  unknownResultMatchConditions,
} from "../lib/match-filters";
import { formatYmd, saoPauloYmd } from "../lib/birthdays";

const router = Router();

function buildMatchRow(row: any) {
  return {
    id: row.id,
    date: row.matchDate,
    opponentId: row.opponentId,
    opponent: row.opponentName,
    opponentLogoUrl: row.opponentLogoUrl ?? null,
    goalsFor: row.goalsFor ?? null,
    goalsAgainst: row.goalsAgainst ?? null,
    result: row.result,
    homeAway: row.homeAway,
    competition: row.competitionName,
    season: row.season,
    stadium: row.stadiumName ?? null,
    attendance: row.attendance ?? null,
    attendancePaid: row.attendancePaid ?? null,
    grossRevenue: row.grossRevenue ?? null,
    grossRevenueText: row.grossRevenueText ?? null,
    isWalkover: row.isWalkover ?? false,
    isFriendly: row.isFriendly ?? false,
    status: row.status ?? "played",
    isUnknownResult: (row.result ?? "") === "unknown" && (row.status ?? "played") !== "scheduled",
    isScheduled: (row.status ?? "played") === "scheduled",
    phase: row.phase ?? null,
    round: row.round ?? null,
  };
}

const matchSelectFields = {
  id: matchesTable.id,
  matchDate: matchesTable.matchDate,
  season: matchesTable.season,
  goalsFor: matchesTable.goalsFor,
  goalsAgainst: matchesTable.goalsAgainst,
  result: matchesTable.result,
  homeAway: matchesTable.homeAway,
  isWalkover: matchesTable.isWalkover,
  isFriendly: matchesTable.isFriendly,
  status: matchesTable.status,
  phase: matchesTable.phase,
  round: matchesTable.round,
  opponentId: matchesTable.opponentId,
  opponentName: opponentsTable.name,
  opponentLogoUrl: opponentsTable.logoUrl,
  competitionName: competitionsTable.name,
  stadiumName: stadiumsTable.name,
  attendance: matchesTable.attendance,
  attendancePaid: matchesTable.attendancePaid,
  grossRevenue: matchesTable.grossRevenue,
  grossRevenueText: matchesTable.grossRevenueText,
};

router.get("/matches", async (req, res) => {
  try {
    const { season, competition, competitionId, opponent, home_away, result, walkover, friendly, unknown, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);
    const off = parseInt(offset) || 0;

    let query = db
      .select(matchSelectFields)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .$dynamic();

    const conditions = [];
    // Mode: friendly=true → amistosos | walkover=true → W.O. | unknown=true → resultado desconhecido | default → oficiais
    if (friendly === "true") {
      conditions.push(eq(matchesTable.isFriendly, true));
      conditions.push(ne(matchesTable.status, "scheduled"));
    } else if (walkover === "true") {
      conditions.push(eq(matchesTable.isWalkover, true));
      conditions.push(ne(matchesTable.status, "scheduled"));
    } else if (unknown === "true") {
      conditions.push(unknownResultMatchConditions());
    } else {
      conditions.push(officialPlayedMatchConditions());
      conditions.push(eq(matchesTable.isWalkover, false));
    }
    if (season) conditions.push(eq(matchesTable.season, season));
    if (competitionId) {
      const cid = parseInt(competitionId, 10);
      if (!isNaN(cid)) conditions.push(eq(matchesTable.competitionId, cid));
    } else if (competition) {
      conditions.push(ilike(competitionsTable.name, `%${competition}%`));
    }
    if (opponent) conditions.push(ilike(opponentsTable.name, `%${opponent}%`));
    if (home_away) conditions.push(eq(matchesTable.homeAway, home_away));
    if (result && result !== "unknown") conditions.push(eq(matchesTable.result, result));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(matchesTable.matchDate));

    const allRows = await query;
    const total = allRows.length;
    const data = allRows.slice(off, off + lim).map(buildMatchRow);

    res.json({ data, total, limit: lim, offset: off });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/matches/biggest-victories", async (req, res) => {
  try {
    const { limit = "10" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 10, 50);

    const rows = await db
      .select(matchSelectFields)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(and(eq(matchesTable.result, "win"), scoredFieldMatchConditions()))
      .orderBy(sql`${matchesTable.goalsFor} desc, (${matchesTable.goalsFor} - ${matchesTable.goalsAgainst}) desc`)
      .limit(lim);

    res.json(rows.map(buildMatchRow));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/matches/biggest-defeats", async (req, res) => {
  try {
    const { limit = "10" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 10, 50);

    const rows = await db
      .select(matchSelectFields)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(and(eq(matchesTable.result, "loss"), scoredFieldMatchConditions()))
      .orderBy(sql`${matchesTable.goalsAgainst} desc, (${matchesTable.goalsAgainst} - ${matchesTable.goalsFor}) desc`)
      .limit(lim);

    res.json(rows.map(buildMatchRow));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/** Brazilian currency families for gate revenue rankings (never mix eras). */
type RevenueCurrency = "real" | "cruzado" | "cruzeiro";

const REVENUE_CURRENCIES = new Set<RevenueCurrency>(["real", "cruzado", "cruzeiro"]);

/** Strip leading quotes/spaces so `"Cr$ …` and `Cr$ …` classify the same. */
function revenueTextNormSql() {
  return sql`regexp_replace(coalesce(${matchesTable.grossRevenueText}, ''), '^[\\s\"]+', '')`;
}

/** Numeric sort key: stored integer, else digits parsed from historical text (ignore cents). */
function revenueAmountSql() {
  return sql`COALESCE(
    ${matchesTable.grossRevenue}::bigint,
    NULLIF(
      regexp_replace(
        regexp_replace(
          regexp_replace(coalesce(${matchesTable.grossRevenueText}, ''), '[^0-9,.]', '', 'g'),
          ',[0-9]*$',
          ''
        ),
        '\\.',
        '',
        'g'
      ),
      ''
    )::bigint
  )`;
}

function revenueCurrencyFilterSql(currency: RevenueCurrency) {
  const t = revenueTextNormSql();
  if (currency === "real") {
    return sql`(
      ${t} ~* '^R\\$'
      OR (
        (${matchesTable.grossRevenueText} IS NULL OR btrim(${matchesTable.grossRevenueText}) = '')
        AND ${matchesTable.grossRevenue} IS NOT NULL
      )
    )`;
  }
  if (currency === "cruzado") {
    return sql`${t} ~* '^(NCz|Cz)\\$'`;
  }
  return sql`${t} ~* '^(NCr|CR|Cr)\\$'`;
}

router.get("/matches/biggest-attendance", async (req, res) => {
  try {
    const {
      limit = "50",
      sort_by = "attendance",
      currency: currencyRaw,
    } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);

    if (sort_by === "gross_revenue") {
      const currency = (currencyRaw || "real") as RevenueCurrency;
      if (!REVENUE_CURRENCIES.has(currency)) {
        return res.status(400).json({
          error: "currency inválida (use real, cruzado ou cruzeiro)",
        });
      }
      const amount = revenueAmountSql();
      const rows = await db
        .select(matchSelectFields)
        .from(matchesTable)
        .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
        .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
        .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
        .where(
          and(
            sql`${amount} IS NOT NULL`,
            revenueCurrencyFilterSql(currency),
            eq(matchesTable.homeAway, "home"),
            officialPlayedMatchConditions(),
          ),
        )
        .orderBy(sql`${amount} DESC`)
        .limit(lim);

      return res.json(rows.map(buildMatchRow));
    }

    // Determine which column to sort/filter by
    const sortCol =
      sort_by === "attendance_paid" ? matchesTable.attendancePaid : matchesTable.attendance;

    const rows = await db
      .select(matchSelectFields)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(and(
        sql`${sortCol} is not null`,
        eq(matchesTable.homeAway, "home"),
        officialPlayedMatchConditions(),
      ))
      .orderBy(desc(sortCol))
      .limit(lim);

    res.json(rows.map(buildMatchRow));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/matches/milestones", async (req, res) => {
  try {
    const joins = () =>
      db
        .select(matchSelectFields)
        .from(matchesTable)
        .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
        .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
        .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
        .where(officialPlayedMatchConditions());

    const [firstRows, lastRows] = await Promise.all([
      joins().orderBy(matchesTable.matchDate).limit(1),
      joins().orderBy(desc(matchesTable.matchDate)).limit(1),
    ]);

    res.json({
      first: firstRows.length ? buildMatchRow(firstRows[0]) : null,
      last:  lastRows.length  ? buildMatchRow(lastRows[0])  : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * Official CSA matches played on this calendar day (month/day), any year.
 * Default timezone: America/Sao_Paulo. Optional ?month=&day= for preview.
 */
router.get("/matches/on-this-day", async (req, res) => {
  try {
    const today = saoPauloYmd();
    const qMonth = parseInt(String(req.query.month ?? ""), 10);
    const qDay = parseInt(String(req.query.day ?? ""), 10);
    const month =
      Number.isFinite(qMonth) && qMonth >= 1 && qMonth <= 12 ? qMonth : today.month;
    const day =
      Number.isFinite(qDay) && qDay >= 1 && qDay <= 31 ? qDay : today.day;
    const lim = Math.min(parseInt(String(req.query.limit ?? "20"), 10) || 20, 50);

    const rows = await db
      .select(matchSelectFields)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(
        and(
          officialPlayedMatchConditions(),
          sql`extract(month from ${matchesTable.matchDate})::int = ${month}`,
          sql`extract(day from ${matchesTable.matchDate})::int = ${day}`,
        ),
      )
      .orderBy(desc(matchesTable.matchDate))
      .limit(lim);

    const matches = rows.map((row) => {
      const base = buildMatchRow(row);
      const matchYear = Number(String(base.date).slice(0, 4));
      const yearsAgo =
        Number.isFinite(matchYear) && matchYear > 0 ? today.year - matchYear : null;
      return { ...base, yearsAgo };
    });

    res.json({
      date: formatYmd({ year: today.year, month, day }),
      month,
      day,
      total: matches.length,
      matches,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/matches/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const rows = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        isWalkover: matchesTable.isWalkover,
        isFriendly: matchesTable.isFriendly,
        status: matchesTable.status,
        phase: matchesTable.phase,
        round: matchesTable.round,
        penaltiesFor: matchesTable.penaltiesFor,
        penaltiesAgainst: matchesTable.penaltiesAgainst,
        relatedMatchId: matchesTable.relatedMatchId,
        opponentId: matchesTable.opponentId,
        opponentName: opponentsTable.name,
        opponentLogoUrl: opponentsTable.logoUrl,
        competitionId: matchesTable.competitionId,
        competitionName: competitionsTable.name,
        stadiumId: matchesTable.stadiumId,
        stadiumName: stadiumsTable.name,
        managerId: matchesTable.managerId,
        managerName: managersTable.name,
        managerPhotoUrl: managersTable.photoUrl,
        refereeId: matchesTable.refereeId,
        refereeName: refereesTable.name,
        scorers: matchesTable.scorers,
        attendance: matchesTable.attendance,
        attendancePaid: matchesTable.attendancePaid,
        grossRevenue: matchesTable.grossRevenue,
        grossRevenueText: matchesTable.grossRevenueText,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .leftJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
      .leftJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
      .where(eq(matchesTable.id, id));

    if (rows.length === 0) return res.status(404).json({ error: "Partida não encontrada" });

    const row = rows[0];
    const sheet = await loadMatchSheet(id);

    let relatedMatch: {
      id: number;
      date: string;
      opponent: string;
      goalsFor: number | null;
      goalsAgainst: number | null;
      round: string | null;
      phase: string | null;
    } | null = null;
    if (row.relatedMatchId != null) {
      const [rel] = await db
        .select({
          id: matchesTable.id,
          date: matchesTable.matchDate,
          opponent: opponentsTable.name,
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

    res.json({
      id: row.id,
      date: row.matchDate,
      opponentId: row.opponentId,
      opponent: row.opponentName,
      opponentLogoUrl: row.opponentLogoUrl ?? null,
      goalsFor: row.goalsFor ?? null,
      goalsAgainst: row.goalsAgainst ?? null,
      result: row.result,
      homeAway: row.homeAway,
      competitionId: row.competitionId,
      competition: row.competitionName,
      season: row.season,
      stadiumId: row.stadiumId ?? null,
      stadium: row.stadiumName ?? null,
      managerId: row.managerId ?? null,
      manager: row.managerName ?? null,
      managerPhotoUrl: row.managerPhotoUrl ?? null,
      refereeId: row.refereeId ?? null,
      referee: row.refereeName ?? null,
      scorers: row.scorers ? row.scorers.split(",").map((s) => s.trim()).filter(Boolean) : [],
      attendance: row.attendance ?? null,
      attendancePaid: row.attendancePaid ?? null,
      grossRevenue: row.grossRevenue ?? null,
      grossRevenueText: row.grossRevenueText ?? null,
      isWalkover: row.isWalkover ?? false,
      isFriendly: row.isFriendly ?? false,
      status: row.status ?? "played",
      isUnknownResult:
        (row.result ?? "") === "unknown" && (row.status ?? "played") !== "scheduled",
      isScheduled: (row.status ?? "played") === "scheduled",
      phase: row.phase ?? null,
      round: row.round ?? null,
      penaltiesFor: row.penaltiesFor ?? null,
      penaltiesAgainst: row.penaltiesAgainst ?? null,
      relatedMatchId: row.relatedMatchId ?? null,
      relatedMatch,
      captainPlayerId: sheet.captainPlayerId ?? null,
      lineups: sheet.lineups,
      goals: sheet.goals,
      cards: sheet.cards,
      substitutions: sheet.substitutions,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
