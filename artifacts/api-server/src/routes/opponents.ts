import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, opponentsTable, competitionsTable, stadiumsTable } from "@workspace/db";
import { sql, eq, and, or, ilike, desc, isNull, isNotNull, asc, inArray } from "drizzle-orm";
import {
  BRAZIL_REGIONS,
  regionFromUf,
  regionFromSlug,
  regionSlug,
  REGION_UFS,
  type BrazilRegion,
} from "../lib/br-regions.js";
import {
  getOpponentCompetitionStats,
  getOpponentHighlights,
} from "../lib/opponent-detail.js";
import { officialPlayedMatchConditions, scoredFieldMatchConditions } from "../lib/match-filters";

const router = Router();

const BRAZIL_UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

const COUNTRY_NAMES: Record<string, string> = {
  ARG: "Argentina",
  AUS: "Austrália",
  BEL: "Bélgica",
  BOL: "Bolívia",
  CAN: "Canadá",
  CHL: "Chile",
  CHN: "China",
  COL: "Colômbia",
  DEU: "Alemanha",
  ECU: "Equador",
  ENG: "Inglaterra",
  ESP: "Espanha",
  FRA: "França",
  GBR: "Reino Unido",
  GER: "Alemanha",
  ITA: "Itália",
  JPN: "Japão",
  KOR: "Coreia do Sul",
  MEX: "México",
  NED: "Países Baixos",
  NLD: "Países Baixos",
  PAR: "Paraguai",
  PER: "Peru",
  POR: "Portugal",
  PRY: "Paraguai",
  URY: "Uruguai",
  URU: "Uruguai",
  USA: "Estados Unidos",
  VEN: "Venezuela",
};

function foreignMatchCondition() {
  return and(
    officialPlayedMatchConditions(),
    isNotNull(opponentsTable.country),
    sql`trim(${opponentsTable.country}) <> ''`,
  );
}

type AggregateRow = {
  opponentCount?: number | null;
  matches?: number | null;
  wins?: number | null;
  draws?: number | null;
  losses?: number | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
};

function mapAggregate(row: AggregateRow) {
  return {
    opponentCount: row.opponentCount ?? 0,
    matches: row.matches ?? 0,
    wins: row.wins ?? 0,
    draws: row.draws ?? 0,
    losses: row.losses ?? 0,
    goalsFor: row.goalsFor ?? 0,
    goalsAgainst: row.goalsAgainst ?? 0,
  };
}

function emptyAggregate() {
  return mapAggregate({});
}

/** Opponents without a foreign country code (Brazilian state-based grouping). */
function noCountrySetCondition() {
  return or(
    isNull(opponentsTable.country),
    sql`trim(${opponentsTable.country}) = ''`,
  );
}

function brStateMatchCondition() {
  return and(
    officialPlayedMatchConditions(),
    isNotNull(opponentsTable.state),
    sql`trim(${opponentsTable.state}) <> ''`,
    noCountrySetCondition(),
  );
}

/** Brazilian opponents missing state only — excludes foreign clubs (country set). */
function semStateBrazilOnlyCondition() {
  return and(
    or(
      isNull(opponentsTable.state),
      sql`trim(${opponentsTable.state}) = ''`,
    ),
    noCountrySetCondition(),
  );
}

router.get("/opponents", async (req, res) => {
  try {
    const { search, sort, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);
    const off = parseInt(offset) || 0;

    let query = db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
        logoUrl: opponentsTable.logoUrl,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .$dynamic();

    const conditions = [officialPlayedMatchConditions()];
    if (search) conditions.push(ilike(opponentsTable.name, `%${search}%`));
    query = query.where(and(...conditions));

    query = query.groupBy(opponentsTable.id, opponentsTable.name, opponentsTable.logoUrl);

    if (sort === "wins") {
      query = query.orderBy(sql`sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) desc`);
    } else if (sort === "goals") {
      query = query.orderBy(sql`sum(${matchesTable.goalsFor}) desc`);
    } else {
      query = query.orderBy(sql`count(*) desc`);
    }

    const allRows = await query;
    const total = allRows.length;
    const data = allRows.slice(off, off + lim).map((r) => ({
      id: r.id,
      name: r.name,
      logoUrl: r.logoUrl ?? null,
      matches: r.matches,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
    }));

    res.json({ data, total, limit: lim, offset: off });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/opponents/by-state", async (req, res) => {
  try {
    const rows = await db
      .select({
        state: opponentsTable.state,
        opponentCount: sql<number>`cast(count(distinct ${opponentsTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(brStateMatchCondition())
      .groupBy(opponentsTable.state)
      .orderBy(desc(sql`count(*)`));

    const unknown = await db
      .select({
        opponentCount: sql<number>`cast(count(distinct ${opponentsTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(
        and(
          officialPlayedMatchConditions(),
          semStateBrazilOnlyCondition(),
        ),
      );

    const unknownRow = unknown[0];
    res.json({
      states: rows
        .filter((r) => r.state)
        .map((r) => ({
          state: String(r.state).toUpperCase(),
          opponentCount: r.opponentCount ?? 0,
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
              opponentCount: unknownRow.opponentCount ?? 0,
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

router.get("/opponents/by-state/:uf", async (req, res) => {
  try {
    const raw = (req.params.uf ?? "").trim();
    const isUnknown = raw.toLowerCase() === "sem-estado" || raw.toLowerCase() === "unknown";
    const uf = raw.toUpperCase();
    if (!isUnknown && !BRAZIL_UFS.has(uf)) {
      return res.status(400).json({ error: "UF inválida" });
    }

    const stateCondition = isUnknown
      ? semStateBrazilOnlyCondition()
      : and(eq(opponentsTable.state, uf), noCountrySetCondition());

    const [overall] = await db
      .select({
        opponentCount: sql<number>`cast(count(distinct ${opponentsTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(and(officialPlayedMatchConditions(), stateCondition));

    const opponents = await db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
        city: opponentsTable.city,
        state: opponentsTable.state,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(and(officialPlayedMatchConditions(), stateCondition))
      .groupBy(
        opponentsTable.id,
        opponentsTable.name,
        opponentsTable.city,
        opponentsTable.state,
      )
      .orderBy(desc(sql`count(*)`), asc(opponentsTable.name));

    res.json({
      state: isUnknown ? null : uf,
      matches: overall?.matches ?? 0,
      wins: overall?.wins ?? 0,
      draws: overall?.draws ?? 0,
      losses: overall?.losses ?? 0,
      goalsFor: overall?.goalsFor ?? 0,
      goalsAgainst: overall?.goalsAgainst ?? 0,
      opponentCount: overall?.opponentCount ?? 0,
      opponents,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/opponents/by-foreign", async (req, res) => {
  try {
    const whereForeign = foreignMatchCondition();

    const [overall] = await db
      .select({
        opponentCount: sql<number>`cast(count(distinct ${opponentsTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(whereForeign);

    const countryRows = await db
      .select({
        country: opponentsTable.country,
        opponentCount: sql<number>`cast(count(distinct ${opponentsTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(whereForeign)
      .groupBy(opponentsTable.country)
      .orderBy(desc(sql`count(*)`));

    const opponents = await db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
        city: opponentsTable.city,
        country: opponentsTable.country,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(whereForeign)
      .groupBy(
        opponentsTable.id,
        opponentsTable.name,
        opponentsTable.city,
        opponentsTable.country,
      )
      .orderBy(desc(sql`count(*)`), asc(opponentsTable.name));

    res.json({
      overall: mapAggregate(overall ?? {}),
      countries: countryRows
        .filter((r) => r.country)
        .map((r) => {
          const code = String(r.country).toUpperCase();
          return {
            code,
            name: COUNTRY_NAMES[code] ?? code,
            ...mapAggregate(r),
          };
        }),
      opponents: opponents.map((o) => ({
        id: o.id,
        name: o.name,
        city: o.city ?? null,
        country: o.country ? String(o.country).toUpperCase() : null,
        countryName: o.country
          ? COUNTRY_NAMES[String(o.country).toUpperCase()] ?? String(o.country).toUpperCase()
          : null,
        ...mapAggregate(o),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/opponents/by-region", async (req, res) => {
  try {
    const stateRows = await db
      .select({
        state: opponentsTable.state,
        opponentCount: sql<number>`cast(count(distinct ${opponentsTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(brStateMatchCondition())
      .groupBy(opponentsTable.state);

    const regionBuckets = new Map<
      BrazilRegion,
      ReturnType<typeof emptyAggregate> & { stateCount: number; states: Set<string> }
    >();
    for (const region of BRAZIL_REGIONS) {
      regionBuckets.set(region, { ...emptyAggregate(), stateCount: 0, states: new Set() });
    }

    for (const row of stateRows) {
      const uf = String(row.state).toUpperCase();
      const region = regionFromUf(uf);
      if (!region) continue;
      const bucket = regionBuckets.get(region)!;
      bucket.states.add(uf);
      bucket.stateCount = bucket.states.size;
      bucket.opponentCount += row.opponentCount ?? 0;
      bucket.matches += row.matches ?? 0;
      bucket.wins += row.wins ?? 0;
      bucket.draws += row.draws ?? 0;
      bucket.losses += row.losses ?? 0;
      bucket.goalsFor += row.goalsFor ?? 0;
      bucket.goalsAgainst += row.goalsAgainst ?? 0;
    }

    res.json({
      regions: BRAZIL_REGIONS.map((region) => {
        const bucket = regionBuckets.get(region)!;
        return {
          region,
          slug: regionSlug(region),
          stateCount: bucket.stateCount,
          opponentCount: bucket.opponentCount,
          matches: bucket.matches,
          wins: bucket.wins,
          draws: bucket.draws,
          losses: bucket.losses,
          goalsFor: bucket.goalsFor,
          goalsAgainst: bucket.goalsAgainst,
        };
      }).filter((r) => r.matches > 0),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/opponents/by-region/:slug", async (req, res) => {
  try {
    const region = regionFromSlug(req.params.slug);
    if (!region) {
      return res.status(400).json({ error: "Região inválida" });
    }

    const ufs = [...REGION_UFS[region]];
    const regionCondition = and(
      brStateMatchCondition(),
      inArray(opponentsTable.state, ufs),
    );

    const [overall] = await db
      .select({
        opponentCount: sql<number>`cast(count(distinct ${opponentsTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(regionCondition);

    const statesBreakdown = await db
      .select({
        state: opponentsTable.state,
        opponentCount: sql<number>`cast(count(distinct ${opponentsTable.id}) as int)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(regionCondition)
      .groupBy(opponentsTable.state)
      .orderBy(desc(sql`count(*)`));

    const opponents = await db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
        city: opponentsTable.city,
        state: opponentsTable.state,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(regionCondition)
      .groupBy(
        opponentsTable.id,
        opponentsTable.name,
        opponentsTable.city,
        opponentsTable.state,
      )
      .orderBy(desc(sql`count(*)`), asc(opponentsTable.name));

    res.json({
      region,
      slug: regionSlug(region),
      states: ufs,
      ...mapAggregate(overall ?? {}),
      statesBreakdown: statesBreakdown
        .filter((r) => r.state)
        .map((r) => ({
          state: String(r.state).toUpperCase(),
          ...mapAggregate(r),
        })),
      opponents: opponents.map((o) => ({
        id: o.id,
        name: o.name,
        city: o.city ?? null,
        state: o.state ? String(o.state).toUpperCase() : null,
        ...mapAggregate(o),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/opponents/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const opponent = await db.query.opponentsTable.findFirst({
      where: eq(opponentsTable.id, id),
    });
    if (!opponent) return res.status(404).json({ error: "Adversário não encontrado" });

    const overall = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(and(eq(matchesTable.opponentId, id), officialPlayedMatchConditions()));

    const homeRecord = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(and(eq(matchesTable.opponentId, id), eq(matchesTable.homeAway, "home"), officialPlayedMatchConditions()));

    const awayRecord = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(and(eq(matchesTable.opponentId, id), eq(matchesTable.homeAway, "away"), officialPlayedMatchConditions()));

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
      .where(and(eq(matchesTable.opponentId, id), officialPlayedMatchConditions()))
      .orderBy(desc(matchesTable.matchDate));

    const victoryRows = await db
      .select({
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        matchDate: matchesTable.matchDate,
      })
      .from(matchesTable)
      .where(and(eq(matchesTable.opponentId, id), eq(matchesTable.result, "win"), scoredFieldMatchConditions()))
      .orderBy(sql`${matchesTable.goalsFor} desc, (${matchesTable.goalsFor} - ${matchesTable.goalsAgainst}) desc`)
      .limit(1);

    const defeatRows = await db
      .select({
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        matchDate: matchesTable.matchDate,
      })
      .from(matchesTable)
      .where(and(eq(matchesTable.opponentId, id), eq(matchesTable.result, "loss"), scoredFieldMatchConditions()))
      .orderBy(sql`${matchesTable.goalsAgainst} desc, (${matchesTable.goalsAgainst} - ${matchesTable.goalsFor}) desc`)
      .limit(1);

    const [competitionStats, highlights] = await Promise.all([
      getOpponentCompetitionStats(id),
      getOpponentHighlights(id),
    ]);

    const stats = overall[0];
    res.json({
      id: opponent.id,
      name: opponent.name,
      city: opponent.city ?? null,
      state: opponent.state ?? null,
      country: opponent.country ? String(opponent.country).toUpperCase() : null,
      logoUrl: opponent.logoUrl ?? null,
      matches: stats?.matches || 0,
      wins: stats?.wins || 0,
      draws: stats?.draws || 0,
      losses: stats?.losses || 0,
      goalsFor: stats?.goalsFor || 0,
      goalsAgainst: stats?.goalsAgainst || 0,
      competitionStats,
      highlights,
      homeRecord: homeRecord[0] || { matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      awayRecord: awayRecord[0] || { matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      allMatches: allMatchRows.map((r) => ({
        id: r.id,
        date: r.matchDate,
        opponent: r.opponentName,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        result: r.result,
        homeAway: r.homeAway,
        competition: r.competitionName,
        season: r.season,
        stadium: r.stadiumName ?? null,
        phase: r.phase ?? null,
        round: r.round ?? null,
      })),
      biggestVictory: victoryRows[0] ? `${victoryRows[0].goalsFor}-${victoryRows[0].goalsAgainst}` : null,
      biggestDefeat: defeatRows[0] ? `${defeatRows[0].goalsFor}-${defeatRows[0].goalsAgainst}` : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
