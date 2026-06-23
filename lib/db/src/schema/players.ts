import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position"),
  nationality: text("nationality"),
  birthYear: integer("birth_year"),
});

export const playerSeasonStatsTable = pgTable("player_season_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id),
  season: text("season").notNull(),
  appearances: integer("appearances").notNull().default(0),
  goals: integer("goals").notNull().default(0),
  assists: integer("assists").notNull().default(0),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;

export const insertPlayerSeasonStatSchema = createInsertSchema(playerSeasonStatsTable).omit({ id: true });
export type InsertPlayerSeasonStat = z.infer<typeof insertPlayerSeasonStatSchema>;
export type PlayerSeasonStat = typeof playerSeasonStatsTable.$inferSelect;
