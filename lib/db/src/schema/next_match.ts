import { pgTable, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Singleton "featured next match" for the Home card.
 * Always at most one row (id = 1), upserted by admin — not part of historical matches.
 */
export const nextMatchTable = pgTable("next_match", {
  id: integer("id").primaryKey().default(1),
  opponent: text("opponent").notNull(),
  matchDate: date("match_date", { mode: "string" }).notNull(),
  competition: text("competition").notNull(),
  homeAway: text("home_away").notNull(), // home | away
  stadium: text("stadium"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertNextMatchSchema = createInsertSchema(nextMatchTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertNextMatch = z.infer<typeof insertNextMatchSchema>;
export type NextMatch = typeof nextMatchTable.$inferSelect;
