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
import { competitionsTable } from "./matches";

/**
 * Badges for players and managers (manual + auto).
 * Auto ties: multiple players may share the same auto_kind + season_year
 * (+ competition_id for top_scorer_competition).
 */
export const entityBadgesTable = pgTable(
  "entity_badges",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(), // player | manager
    entityId: integer("entity_id").notNull(),
    label: text("label").notNull(),
    source: text("source").notNull(), // manual | auto
    autoKind: text("auto_kind"), // top_scorer | top_assister | top_scorer_competition
    seasonYear: integer("season_year"),
    competitionId: integer("competition_id").references(
      () => competitionsTable.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Season-level auto (no competition)
    uniqueIndex("entity_badges_auto_season_uidx")
      .on(t.entityType, t.entityId, t.autoKind, t.seasonYear)
      .where(
        sql`${t.source} = 'auto' AND ${t.autoKind} IN ('top_scorer', 'top_assister') AND ${t.seasonYear} IS NOT NULL`,
      ),
    // Competition-level auto
    uniqueIndex("entity_badges_auto_comp_uidx")
      .on(t.entityType, t.entityId, t.autoKind, t.seasonYear, t.competitionId)
      .where(
        sql`${t.source} = 'auto' AND ${t.autoKind} = 'top_scorer_competition' AND ${t.competitionId} IS NOT NULL AND ${t.seasonYear} IS NOT NULL`,
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
