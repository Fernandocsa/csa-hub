import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { competitionsTable } from "./matches";

/** Per-season competition record (manual edits or calculated from matches). */
export const seasonCompetitionStatsTable = pgTable(
  "season_competition_stats",
  {
    id: serial("id").primaryKey(),
    season: text("season").notNull(),
    competitionId: integer("competition_id")
      .notNull()
      .references(() => competitionsTable.id, { onDelete: "cascade" }),
    games: integer("games").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    draws: integer("draws").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    goalsFor: integer("goals_for").notNull().default(0),
    goalsAgainst: integer("goals_against").notNull().default(0),
    /** Free-text placement, e.g. "SF", "1º", "QF". Never auto-calculated. */
    classification: text("classification"),
    /** 'manual' | 'calculated' */
    statsSource: text("stats_source").notNull().default("manual"),
    statsRecalculatedAt: timestamp("stats_recalculated_at", {
      withTimezone: true,
    }),
  },
  (t) => [
    uniqueIndex("season_competition_stats_season_comp_uidx").on(
      t.season,
      t.competitionId,
    ),
    index("season_competition_stats_season_idx").on(t.season),
    index("season_competition_stats_competition_idx").on(t.competitionId),
  ],
);

export const insertSeasonCompetitionStatSchema = createInsertSchema(
  seasonCompetitionStatsTable,
).omit({ id: true });
export type InsertSeasonCompetitionStat = z.infer<
  typeof insertSeasonCompetitionStatSchema
>;
export type SeasonCompetitionStat =
  typeof seasonCompetitionStatsTable.$inferSelect;
