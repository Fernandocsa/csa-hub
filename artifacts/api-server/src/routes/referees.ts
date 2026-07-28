import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  opponentsTable,
  competitionsTable,
  stadiumsTable,
  refereesTable,
} from "@workspace/db";
import { sql, eq, and, or, desc, asc, ilike, isNull } from "drizzle-orm";
import { officialPlayedMatchConditions } from "../lib/match-filters";

const router = Router();

const BRAZIL_UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

function hasRefereeStateCondition() {
  return and(
    sql`${refereesTable.state} is not null`,
    sql`trim(${refereesTable.state}) <> ''`,
  );
}

function semRefereeStateCondition() {
  return or(
    isNull(refereesTable.state),
    sql`trim(${refereesTable.state}) = ''`,
  );
}

/** Only official played matches that have a linked referee (omit unassigned). */
function linkedNonFriendlyMatch() {
  return and(
    officialPlayedMatchConditions(),
    sql`${matchesTable.refereeId} is not null`,
  );
}
type RecordRow = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

function mapRecord(row: Partial<RecordRow> | undefined): RecordRow {
  return {
    matches: row?.matches ?? 0,
    wins: row?.wins ?? 0,
    draws: row?.draws ?? 0,
    losses: row?.losses ?? 0,
    goalsFor: row?.goalsFor ?? 0,
    goalsAgainst: row?.goalsAgainst ?? 0,
  };
}

function winPercentage(wins: number, matches: number) {
  return matches > 0 ? Math.round((wins / matches) * 1000) / 10 : 0;
}

router.get("/referees", async (req, res) => {
  try {
    const { search } = req.query as Record<string, string>;

    let query = db
      .select({
        id: refereesTable.id,
        name: refereesTable.name,
        state: refereesTable.state,
        matches: sql<number>`cast(count(${matchesTable.id}) as int)`,
        wins: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end), 0) as int)`,
        draws: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end), 0) as int)`,
        losses: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end), 0) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(refereesTable)
      .leftJoin(
        matchesTable,
        and(eq(matchesTable.refereeId, refereesTable.id), officialPlayedMatchConditions()),
      )
      .$dynamic();

    if (search?.trim()) {
      query = query.where(ilike(refereesTable.name, `%${search.trim()}%`));
    }

    const rows = await query
      .groupBy(refereesTable.id, refereesTable.name, refereesTable.state)
      .orderBy(sql`count(${matchesTable.id}) desc`, asc(refereesTable.name));

    res.json(
      rows.map((r) => ({
        ...r,
        winPercentage: winPercentage(r.wins, r.matches),
      })),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/referees/by-state", async (req, res) => {
  try {
    const rows = await db
      .select({
        state: refereesTable.state,
        refereeCount: sql<number>`cast(count(distinct ${refereesTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .innerJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
      .where(and(linkedNonFriendlyMatch(), hasRefereeStateCondition()))
      .groupBy(refereesTable.state)
      .orderBy(desc(sql`count(*)`));

    const unknown = await db
      .select({
        refereeCount: sql<number>`cast(count(distinct ${refereesTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .innerJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
      .where(and(linkedNonFriendlyMatch(), semRefereeStateCondition()));

    const unknownRow = unknown[0];
    res.json({
      states: rows
        .filter((r) => r.state)
        .map((r) => ({
          state: String(r.state).toUpperCase(),
          refereeCount: r.refereeCount ?? 0,
          matches: r.matches ?? 0,
          wins: r.wins ?? 0,
          draws: r.draws ?? 0,
          losses: r.losses ?? 0,
          goalsFor: r.goalsFor ?? 0,
          goalsAgainst: r.goalsAgainst ?? 0,
        })),
      unknown:
        unknownRow && (unknownRow.matches ?? 0) > 0
          ? {
              state: null,
              refereeCount: unknownRow.refereeCount ?? 0,
              matches: unknownRow.matches ?? 0,
              wins: unknownRow.wins ?? 0,
              draws: unknownRow.draws ?? 0,
              losses: unknownRow.losses ?? 0,
              goalsFor: unknownRow.goalsFor ?? 0,
              goalsAgainst: unknownRow.goalsAgainst ?? 0,
            }
          : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/referees/by-state/:uf", async (req, res) => {
  try {
    const raw = (req.params.uf ?? "").trim();
    const isUnknown =
      raw.toLowerCase() === "sem-estado" || raw.toLowerCase() === "unknown";
    const uf = raw.toUpperCase();
    if (!isUnknown && !BRAZIL_UFS.has(uf)) {
      return res.status(400).json({ error: "UF inválida" });
    }

    const stateCondition = isUnknown
      ? semRefereeStateCondition()
      : and(eq(refereesTable.state, uf), hasRefereeStateCondition());
    const where = and(linkedNonFriendlyMatch(), stateCondition);

    const [overall] = await db
      .select({
        refereeCount: sql<number>`cast(count(distinct ${refereesTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .innerJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
      .where(where);

    const [homeRecord] = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .innerJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
      .where(and(where, eq(matchesTable.homeAway, "home")));

    const [awayRecord] = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .innerJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
      .where(and(where, eq(matchesTable.homeAway, "away")));

    const referees = await db
      .select({
        id: refereesTable.id,
        name: refereesTable.name,
        state: refereesTable.state,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .innerJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
      .where(where)
      .groupBy(refereesTable.id, refereesTable.name, refereesTable.state)
      .orderBy(desc(sql`count(*)`), asc(refereesTable.name));

    res.json({
      state: isUnknown ? null : uf,
      matches: overall?.matches ?? 0,
      wins: overall?.wins ?? 0,
      draws: overall?.draws ?? 0,
      losses: overall?.losses ?? 0,
      goalsFor: overall?.goalsFor ?? 0,
      goalsAgainst: overall?.goalsAgainst ?? 0,
      refereeCount: overall?.refereeCount ?? 0,
      homeRecord: mapRecord(homeRecord),
      awayRecord: mapRecord(awayRecord),
      referees,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/referees/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [referee] = await db
      .select()
      .from(refereesTable)
      .where(eq(refereesTable.id, id))
      .limit(1);
    if (!referee) return res.status(404).json({ error: "Árbitro não encontrado" });

    const baseWhere = and(eq(matchesTable.refereeId, id), officialPlayedMatchConditions());

    const overall = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .where(baseWhere);

    const homeRecord = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .where(and(baseWhere, eq(matchesTable.homeAway, "home")));

    const awayRecord = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .where(and(baseWhere, eq(matchesTable.homeAway, "away")));

    const allMatchRows = await db
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
      .where(baseWhere)
      .orderBy(desc(matchesTable.matchDate));

    const stats = mapRecord(overall[0]);
    res.json({
      id: referee.id,
      name: referee.name,
      state: referee.state,
      photoUrl: referee.photoUrl ?? null,
      ...stats,
      winPercentage: winPercentage(stats.wins, stats.matches),
      homeRecord: mapRecord(homeRecord[0]),
      awayRecord: mapRecord(awayRecord[0]),
      allMatches: allMatchRows.map((m) => ({
        id: m.id,
        date: m.matchDate,
        opponent: m.opponentName,
        goalsFor: m.goalsFor,
        goalsAgainst: m.goalsAgainst,
        result: m.result,
        homeAway: m.homeAway,
        competition: m.competitionName,
        season: m.season,
        stadium: m.stadiumName,
        phase: m.phase,
        round: m.round,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
