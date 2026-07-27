import { pgTable, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { opponentsTable, matchesTable } from "./matches";

/**
 * Singleton "featured next match" for the Home card.
 * Always at most one row (id = 1), upserted by admin — not part of historical matches.
 * Optional matchId / opponentId enable Home deep-links.
 */
export const nextMatchTable = pgTable("next_match", {
  id: integer("id").primaryKey().default(1),
  opponent: text("opponent").notNull(),
  matchDate: date("match_date", { mode: "string" }).notNull(),
  competition: text("competition").notNull(),
  homeAway: text("home_away").notNull(), // home | away
  stadium: text("stadium"),
  opponentId: integer("opponent_id").references(() => opponentsTable.id),
  matchId: integer("match_id").references(() => matchesTable.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertNextMatchSchema = createInsertSchema(nextMatchTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertNextMatch = z.infer<typeof insertNextMatchSchema>;
export type NextMatch = typeof nextMatchTable.$inferSelect;
