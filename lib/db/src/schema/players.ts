import { pgTable, text, serial, integer, boolean, timestamp, date, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fullName: text("full_name"),
  position: text("position"),
  /** Informative only — does not affect lineup sort order. */
  secondaryPositions: text("secondary_positions")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  nationality: text("nationality"),
  nationalityFlag: text("nationality_flag"),
  /** Profile photo: absolute HTTPS URL or site path (e.g. /players/192.jpg). */
  photoUrl: text("photo_url"),
  birthYear: integer("birth_year"),
  birthDate: date("birth_date", { mode: "string" }),
  birthCity: text("birth_city"),
  birthState: text("birth_state"),
  birthCountry: text("birth_country"),
  preferredFoot: text("preferred_foot"), // destro | canhoto | ambidestro
  heightCm: integer("height_cm"),
  weightKg: integer("weight_kg"),
  isDeceased: boolean("is_deceased").notNull().default(false),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),
});

export const playerSeasonStatsTable = pgTable(
  "player_season_stats",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id").notNull().references(() => playersTable.id),
    season: text("season").notNull(),
    appearances: integer("appearances").notNull().default(0),
    goals: integer("goals").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    /** Fixed shirt number for the season (catalog). Independent from match_lineups. */
    shirtNumber: integer("shirt_number"),
  },
  (t) => [
    uniqueIndex("player_season_stats_player_season_uidx").on(t.playerId, t.season),
    index("player_season_stats_season_idx").on(t.season),
  ],
);

/**
 * Season-scoped Ogol paste nicknames (e.g. "Ênio" → Ênio Oliveira in 2025 only).
 * Does not apply to other seasons — avoids cross-season identity mistakes.
 */
export const playerSeasonNameAliasesTable = pgTable(
  "player_season_name_aliases",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id").notNull().references(() => playersTable.id),
    season: text("season").notNull(),
    /** Raw pasted name as shown in Ogol. */
    alias: text("alias").notNull(),
    /** Normalized key used for matching (accent-insensitive). */
    aliasNorm: text("alias_norm").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("player_season_name_aliases_season_norm_uidx").on(t.season, t.aliasNorm),
    index("player_season_name_aliases_season_idx").on(t.season),
    index("player_season_name_aliases_player_idx").on(t.playerId),
  ],
);

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;

export const insertPlayerSeasonStatSchema = createInsertSchema(playerSeasonStatsTable).omit({ id: true });
export type InsertPlayerSeasonStat = z.infer<typeof insertPlayerSeasonStatSchema>;
export type PlayerSeasonStat = typeof playerSeasonStatsTable.$inferSelect;

export type PlayerSeasonNameAlias = typeof playerSeasonNameAliasesTable.$inferSelect;

export const seasonTopScorersTable = pgTable("season_top_scorers", {
  id: serial("id").primaryKey(),
  season: text("season").notNull(),
  playerName: text("player_name").notNull(),
  goals: integer("goals").notNull(),
  verified: boolean("verified").notNull().default(true),
});

export const insertSeasonTopScorerSchema = createInsertSchema(seasonTopScorersTable).omit({ id: true });
export type InsertSeasonTopScorer = z.infer<typeof insertSeasonTopScorerSchema>;
export type SeasonTopScorer = typeof seasonTopScorersTable.$inferSelect;
