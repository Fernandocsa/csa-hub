import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** Public visitor comments on players, managers, and matches. */
export const commentsTable = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(), // player | manager | match
    entityId: integer("entity_id").notNull(),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("comments_entity_created_idx").on(
      t.entityType,
      t.entityId,
      t.createdAt,
    ),
    index("comments_created_idx").on(t.createdAt),
  ],
);

export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
