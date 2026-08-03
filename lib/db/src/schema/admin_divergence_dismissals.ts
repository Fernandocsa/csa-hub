import { pgTable, integer, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

/** Itens de divergência marcados como OK / não-problema pelo admin. */
export const adminDivergenceDismissalsTable = pgTable(
  "admin_divergence_dismissals",
  {
    kind: text("kind").notNull(),
    entityId: integer("entity_id").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.kind, t.entityId] })],
);

export type AdminDivergenceDismissal =
  typeof adminDivergenceDismissalsTable.$inferSelect;
