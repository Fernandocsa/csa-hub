import { pgTable, text, serial, date, integer, boolean, index } from "drizzle-orm/pg-core";
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
    /** Mandate start (full date, or YYYY-01-01 when only the year is known). */
    termStart: date("term_start", { mode: "string" }),
    /** Mandate end (full date, or YYYY-01-01 when only the year is known). */
    termEnd: date("term_end", { mode: "string" }),
    /**
     * True = mandate still open (term_end should be null).
     * False + null term_end = end date unknown (not "atual").
     */
    isCurrent: boolean("is_current").notNull().default(false),
    /**
     * Groups multiple mandate rows for the same person (e.g. Rafael Tenório ×3).
     * Usually the earliest mandate id; list order remains by term_start.
     */
    personKey: integer("person_key"),
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
    index("presidents_person_key_idx").on(t.personKey),
  ],
);

export const insertPresidentSchema = createInsertSchema(presidentsTable).omit({
  id: true,
});
export type InsertPresident = z.infer<typeof insertPresidentSchema>;
export type President = typeof presidentsTable.$inferSelect;
