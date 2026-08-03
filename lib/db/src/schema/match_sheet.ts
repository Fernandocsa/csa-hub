import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { matchesTable } from "./matches";
import { playersTable } from "./players";

/**
 * CSA match sheet (Phase 1). Column `side` is always 'csa' for now;
 * 'opponent' reserved for a later phase without schema migration.
 */

export const matchLineupsTable = pgTable(
  "match_lineups",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matchesTable.id, { onDelete: "cascade" }),
    side: text("side").notNull().default("csa"), // csa | opponent
    playerId: integer("player_id").references(() => playersTable.id),
    playerName: text("player_name").notNull(),
    role: text("role").notNull(), // starter | bench
    shirtNumber: integer("shirt_number"),
    position: text("position"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("match_lineups_match_side_player_uidx").on(
      t.matchId,
      t.side,
      t.playerId,
    ),
  ],
);

export const matchGoalsTable = pgTable("match_goals", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matchesTable.id, { onDelete: "cascade" }),
  side: text("side").notNull().default("csa"),
  scorerLineupId: integer("scorer_lineup_id").references(
    () => matchLineupsTable.id,
    { onDelete: "set null" },
  ),
  scorerPlayerId: integer("scorer_player_id").references(() => playersTable.id),
  scorerName: text("scorer_name").notNull(),
  minute: integer("minute").notNull(),
  injuryTimeMinute: integer("injury_time_minute"),
  assistLineupId: integer("assist_lineup_id").references(
    () => matchLineupsTable.id,
    { onDelete: "set null" },
  ),
  assistPlayerId: integer("assist_player_id").references(() => playersTable.id),
  assistName: text("assist_name"),
  isPenalty: boolean("is_penalty").notNull().default(false),
  isFreeKick: boolean("is_free_kick").notNull().default(false),
  isOwnGoal: boolean("is_own_goal").notNull().default(false),
  /** 'for' = GPF / g.c. a favor do CSA; 'against' = GPD sofrido */
  ownGoalDirection: text("own_goal_direction"),
});

export const matchCardsTable = pgTable("match_cards", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matchesTable.id, { onDelete: "cascade" }),
  side: text("side").notNull().default("csa"),
  cardType: text("card_type").notNull(), // yellow | red
  lineupId: integer("lineup_id").references(() => matchLineupsTable.id, {
    onDelete: "set null",
  }),
  playerId: integer("player_id").references(() => playersTable.id),
  playerName: text("player_name").notNull(),
  minute: integer("minute").notNull(),
  injuryTimeMinute: integer("injury_time_minute"),
});

export const matchSubstitutionsTable = pgTable("match_substitutions", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matchesTable.id, { onDelete: "cascade" }),
  side: text("side").notNull().default("csa"), // csa | opponent
  playerOutLineupId: integer("player_out_lineup_id").references(
    () => matchLineupsTable.id,
    { onDelete: "set null" },
  ),
  playerOutId: integer("player_out_id").references(() => playersTable.id),
  playerOutName: text("player_out_name").notNull(),
  playerInLineupId: integer("player_in_lineup_id").references(
    () => matchLineupsTable.id,
    { onDelete: "set null" },
  ),
  playerInId: integer("player_in_id").references(() => playersTable.id),
  playerInName: text("player_in_name").notNull(),
  minute: integer("minute").notNull(),
  injuryTimeMinute: integer("injury_time_minute"),
});

/** Yellow/red cards shown to the CSA manager for a match. */
export const matchManagerCardsTable = pgTable("match_manager_cards", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matchesTable.id, { onDelete: "cascade" }),
  cardType: text("card_type").notNull(), // yellow | red
  minute: integer("minute").notNull(),
  injuryTimeMinute: integer("injury_time_minute"),
});

/**
 * Missed / saved penalties — NOT goals.
 * Must never feed scorer, goals-against, or W/D/L aggregates.
 */
export const matchPenaltyEventsTable = pgTable("match_penalty_events", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matchesTable.id, { onDelete: "cascade" }),
  side: text("side").notNull().default("csa"), // csa | opponent
  /** missed = A (bater); saved = C (goleiro defendeu) */
  eventType: text("event_type").notNull(), // missed | saved
  playerId: integer("player_id").references(() => playersTable.id),
  playerName: text("player_name").notNull(),
  minute: integer("minute").notNull(),
  injuryTimeMinute: integer("injury_time_minute"),
});

export const insertMatchLineupSchema = createInsertSchema(matchLineupsTable).omit({
  id: true,
});
export type InsertMatchLineup = z.infer<typeof insertMatchLineupSchema>;
export type MatchLineup = typeof matchLineupsTable.$inferSelect;

export const insertMatchGoalSchema = createInsertSchema(matchGoalsTable).omit({
  id: true,
});
export type InsertMatchGoal = z.infer<typeof insertMatchGoalSchema>;
export type MatchGoal = typeof matchGoalsTable.$inferSelect;

export const insertMatchCardSchema = createInsertSchema(matchCardsTable).omit({
  id: true,
});
export type InsertMatchCard = z.infer<typeof insertMatchCardSchema>;
export type MatchCard = typeof matchCardsTable.$inferSelect;

export const insertMatchSubstitutionSchema = createInsertSchema(
  matchSubstitutionsTable,
).omit({ id: true });
export type InsertMatchSubstitution = z.infer<typeof insertMatchSubstitutionSchema>;
export type MatchSubstitution = typeof matchSubstitutionsTable.$inferSelect;

export const insertMatchManagerCardSchema = createInsertSchema(
  matchManagerCardsTable,
).omit({ id: true });
export type InsertMatchManagerCard = z.infer<typeof insertMatchManagerCardSchema>;
export type MatchManagerCard = typeof matchManagerCardsTable.$inferSelect;

export const insertMatchPenaltyEventSchema = createInsertSchema(
  matchPenaltyEventsTable,
).omit({ id: true });
export type InsertMatchPenaltyEvent = z.infer<typeof insertMatchPenaltyEventSchema>;
export type MatchPenaltyEvent = typeof matchPenaltyEventsTable.$inferSelect;
