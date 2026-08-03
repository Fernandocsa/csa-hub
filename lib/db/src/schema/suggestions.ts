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

/**
 * Private visitor suggestions / error reports (admin-only visibility).
 * entityId is null only when entityType = 'general'.
 */
export const suggestionsTable = pgTable(
  "suggestions",
  {
    id: serial("id").primaryKey(),
    /** player | manager | match | opponent | stadium | referee | season | general */
    entityType: text("entity_type").notNull(),
    entityId: integer("entity_id"),
    authorName: text("author_name").notNull(),
    message: text("message").notNull(),
    contact: text("contact"),
    status: text("status").notNull().default("new"), // new | reviewed
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("suggestions_created_idx").on(t.createdAt),
    index("suggestions_status_created_idx").on(t.status, t.createdAt),
  ],
);

export const insertSuggestionSchema = createInsertSchema(suggestionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestionsTable.$inferSelect;
