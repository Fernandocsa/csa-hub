import { pgTable, text, serial, date, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playersTable } from "./players";
import { managersTable } from "./matches";

/** CSA club presidents / mandate catalog. */
export const presidentsTable = pgTable(
  "presidents",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    /** Profile photo: absolute HTTPS URL or site path. */
    photoUrl: text("photo_url"),
    /** Mandate start (date or first day of year). */
    termStart: date("term_start", { mode: "string" }),
    /** Mandate end; null = current / ongoing. */
    termEnd: date("term_end", { mode: "string" }),
    notes: text("notes"),
    /** Optional link to existing player (ex-jogador that became president). */
    linkedPlayerId: integer("linked_player_id").references(() => playersTable.id),
    /** Optional link to existing manager (ex-técnico that became president). */
    linkedManagerId: integer("linked_manager_id").references(
      () => managersTable.id,
    ),
  },
  (t) => [
    index("presidents_linked_player_idx").on(t.linkedPlayerId),
    index("presidents_linked_manager_idx").on(t.linkedManagerId),
  ],
);

export const insertPresidentSchema = createInsertSchema(presidentsTable).omit({
  id: true,
});
export type InsertPresident = z.infer<typeof insertPresidentSchema>;
export type President = typeof presidentsTable.$inferSelect;
