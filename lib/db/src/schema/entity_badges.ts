import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Badges for players and managers (manual + auto).
 * Auto ties: multiple players may share the same auto_kind + season_year;
 * the same player cannot receive the same auto badge twice for that year.
 */
export const entityBadgesTable = pgTable(
  "entity_badges",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(), // player | manager
    entityId: integer("entity_id").notNull(),
    label: text("label").notNull(),
    source: text("source").notNull(), // manual | auto
    autoKind: text("auto_kind"), // top_scorer | top_assister (auto only)
    seasonYear: integer("season_year"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("entity_badges_auto_uidx")
      .on(t.entityType, t.entityId, t.autoKind, t.seasonYear)
      .where(
        sql`${t.source} = 'auto' AND ${t.autoKind} IS NOT NULL AND ${t.seasonYear} IS NOT NULL`,
      ),
    index("entity_badges_entity_idx").on(t.entityType, t.entityId),
    index("entity_badges_season_auto_idx").on(t.seasonYear, t.autoKind),
  ],
);

export const insertEntityBadgeSchema = createInsertSchema(entityBadgesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEntityBadge = z.infer<typeof insertEntityBadgeSchema>;
export type EntityBadge = typeof entityBadgesTable.$inferSelect;
