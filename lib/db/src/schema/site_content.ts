import {
  pgTable,
  text,
  serial,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Editable site copy blocks (simple CMS).
 * key examples: home_intro, about_csa, …
 */
export const siteContentTable = pgTable(
  "site_content",
  {
    id: serial("id").primaryKey(),
    /** Unique block id, e.g. home_intro */
    key: text("key").notNull(),
    /** Markdown-ish body (paragraphs, **bold**, [links](/path)) */
    content: text("content").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("site_content_key_uidx").on(t.key)],
);

export const insertSiteContentSchema = createInsertSchema(siteContentTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteContent = typeof siteContentTable.$inferSelect;
