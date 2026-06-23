import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leaguePositionsTable = pgTable("league_positions", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  league: text("league").notNull(),
  position: integer("position"),
  matches: integer("matches").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  goalsFor: integer("goals_for").notNull().default(0),
  goalsAgainst: integer("goals_against").notNull().default(0),
  points: integer("points").notNull().default(0),
});

export const insertLeaguePositionSchema = createInsertSchema(leaguePositionsTable).omit({ id: true });
export type InsertLeaguePosition = z.infer<typeof insertLeaguePositionSchema>;
export type LeaguePosition = typeof leaguePositionsTable.$inferSelect;
