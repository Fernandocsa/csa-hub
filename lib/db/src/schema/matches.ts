import { pgTable, text, serial, integer, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const opponentsTable = pgTable("opponents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const stadiumsTable = pgTable("stadiums", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  capacity: integer("capacity"),
});

export const competitionsTable = pgTable("competitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type"), // league, cup, state, friendly
});

export const managersTable = pgTable("managers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nationality: text("nationality"),
  startYear: integer("start_year"),
  endYear: integer("end_year"),
  // Comma-separated season years, e.g. "2018,2019,2024"
  seasons: text("seasons"),
  // Stored aggregate stats — used as fallback when match data is incomplete
  storedGames:      integer("stored_games"),
  storedWins:       integer("stored_wins"),
  storedDraws:      integer("stored_draws"),
  storedLosses:     integer("stored_losses"),
  storedGoalsFor:   integer("stored_goals_for"),
  storedGoalsAgainst: integer("stored_goals_against"),
});

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  matchDate: date("match_date", { mode: "string" }).notNull(),
  season: text("season").notNull(),
  opponentId: integer("opponent_id").notNull().references(() => opponentsTable.id),
  goalsFor: integer("goals_for"),
  goalsAgainst: integer("goals_against"),
  result: text("result").notNull(), // win, draw, loss, walkover
  homeAway: text("home_away").notNull(), // home, away, neutral
  competitionId: integer("competition_id").notNull().references(() => competitionsTable.id),
  stadiumId: integer("stadium_id").references(() => stadiumsTable.id),
  managerId: integer("manager_id").references(() => managersTable.id),
  attendance: integer("attendance"),
  attendancePaid: integer("attendance_paid"),
  grossRevenue: integer("gross_revenue"), // in BRL (reais), for modern matches
  grossRevenueText: text("gross_revenue_text"), // for historical currencies (Cr$, Cz$, etc.)
  scorers: text("scorers"), // comma-separated player names
  isWalkover: boolean("is_walkover").notNull().default(false),
  isFriendly: boolean("is_friendly").notNull().default(false),
  /** CSA goals from opponent own-goals (not in match_goals). Used for sheet completeness gate. */
  ownGoalsForCount: integer("own_goals_for_count").notNull().default(0),
});

export const insertOpponentSchema = createInsertSchema(opponentsTable).omit({ id: true });
export type InsertOpponent = z.infer<typeof insertOpponentSchema>;
export type Opponent = typeof opponentsTable.$inferSelect;

export const insertStadiumSchema = createInsertSchema(stadiumsTable).omit({ id: true });
export type InsertStadium = z.infer<typeof insertStadiumSchema>;
export type Stadium = typeof stadiumsTable.$inferSelect;

export const insertCompetitionSchema = createInsertSchema(competitionsTable).omit({ id: true });
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type Competition = typeof competitionsTable.$inferSelect;

export const insertManagerSchema = createInsertSchema(managersTable).omit({ id: true });
export type InsertManager = z.infer<typeof insertManagerSchema>;
export type Manager = typeof managersTable.$inferSelect;

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
