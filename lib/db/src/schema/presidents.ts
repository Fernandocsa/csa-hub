import { pgTable, text, serial, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** CSA club presidents / mandate catalog. */
export const presidentsTable = pgTable("presidents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Profile photo: absolute HTTPS URL or site path. */
  photoUrl: text("photo_url"),
  /** Mandate start (date or first day of year). */
  termStart: date("term_start", { mode: "string" }),
  /** Mandate end; null = current / ongoing. */
  termEnd: date("term_end", { mode: "string" }),
  notes: text("notes"),
});

export const insertPresidentSchema = createInsertSchema(presidentsTable).omit({
  id: true,
});
export type InsertPresident = z.infer<typeof insertPresidentSchema>;
export type President = typeof presidentsTable.$inferSelect;
