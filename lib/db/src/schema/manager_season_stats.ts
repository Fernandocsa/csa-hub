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
import { managersTable } from "./matches";

/** Per-season manager record (manual edits or calculated from matches). */
export const managerSeasonStatsTable = pgTable(
  "manager_season_stats",
  {
    id: serial("id").primaryKey(),
    managerId: integer("manager_id")
      .notNull()
      .references(() => managersTable.id, { onDelete: "cascade" }),
    season: text("season").notNull(),
    games: integer("games").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    draws: integer("draws").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    goalsFor: integer("goals_for").notNull().default(0),
    goalsAgainst: integer("goals_against").notNull().default(0),
    /** 'manual' | 'calculated' */
    statsSource: text("stats_source").notNull().default("manual"),
    statsRecalculatedAt: timestamp("stats_recalculated_at", {
      withTimezone: true,
    }),
  },
  (t) => [
    uniqueIndex("manager_season_stats_manager_season_uidx").on(
      t.managerId,
      t.season,
    ),
    index("manager_season_stats_manager_idx").on(t.managerId),
    index("manager_season_stats_season_idx").on(t.season),
  ],
);

export const insertManagerSeasonStatSchema = createInsertSchema(
  managerSeasonStatsTable,
).omit({ id: true });
export type InsertManagerSeasonStat = z.infer<
  typeof insertManagerSeasonStatSchema
>;
export type ManagerSeasonStat = typeof managerSeasonStatsTable.$inferSelect;
