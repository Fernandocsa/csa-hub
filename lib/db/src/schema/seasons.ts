import { pgTable, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const seasonsTable = pgTable("seasons", {
  year: integer("year").primaryKey(),
  /** Season player_season_stats closed enough for auto badges (Artilheiro/Garçom). */
  statsFullyVerified: boolean("stats_fully_verified").notNull().default(false),
  statsVerifiedAt: timestamp("stats_verified_at", { withTimezone: true }),
});
