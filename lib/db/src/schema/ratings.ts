import {
  pgTable,
  text,
  serial,
  integer,
  smallint,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** Public 1–5 star ratings for players, managers, and matches. */
export const ratingsTable = pgTable(
  "ratings",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(), // player | manager | match
    entityId: integer("entity_id").notNull(),
    stars: smallint("stars").notNull(),
    voterToken: text("voter_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("ratings_entity_voter_uidx").on(
      t.entityType,
      t.entityId,
      t.voterToken,
    ),
    index("ratings_entity_idx").on(t.entityType, t.entityId),
  ],
);

export const insertRatingSchema = createInsertSchema(ratingsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingsTable.$inferSelect;
