import { pgTable, text, serial, integer, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { refereesTable } from "./referees";

export const stadiumsTable = pgTable("stadiums", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  capacity: integer("capacity"),
});

export const opponentsTable = pgTable("opponents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  homeStadiumId: integer("home_stadium_id").references(() => stadiumsTable.id),
});

export const competitionsTable = pgTable("competitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type"), // league, cup, state, friendly
});

export const managersTable = pgTable("managers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fullName: text("full_name"),
  nationality: text("nationality"),
  birthDate: date("birth_date", { mode: "string" }),
  birthCity: text("birth_city"),
  birthState: text("birth_state"),
  birthCountry: text("birth_country"),
  isDeceased: boolean("is_deceased").notNull().default(false),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),
  // Stored aggregate stats — synced from season rows / matches
  storedGames: integer("stored_games"),
  storedWins: integer("stored_wins"),
  storedDraws: integer("stored_draws"),
  storedLosses: integer("stored_losses"),
  storedGoalsFor: integer("stored_goals_for"),
  storedGoalsAgainst: integer("stored_goals_against"),
  /** 'manual' | 'calculated' — origin of stored_* aggregate stats */
  statsSource: text("stats_source"),
  statsRecalculatedAt: timestamp("stats_recalculated_at", { withTimezone: true }),
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
  refereeId: integer("referee_id").references(() => refereesTable.id),
  attendance: integer("attendance"),
  attendancePaid: integer("attendance_paid"),
  grossRevenue: integer("gross_revenue"), // in BRL (reais), for modern matches
  grossRevenueText: text("gross_revenue_text"), // for historical currencies (Cr$, Cz$, etc.)
  scorers: text("scorers"), // comma-separated player names
  isWalkover: boolean("is_walkover").notNull().default(false),
  isFriendly: boolean("is_friendly").notNull().default(false),
  /** CSA goals from opponent own-goals (not in match_goals). Used for sheet completeness gate. */
  ownGoalsForCount: integer("own_goals_for_count").notNull().default(0),
  /** Competition phase label, e.g. "Final", "1º Turno", "Oitavas de Final". */
  phase: text("phase"),
  /** Round / leg label, e.g. "15", "15ª rodada", "Ida", "Volta". */
  round: text("round"),
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
