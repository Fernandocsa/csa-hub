import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** Match referees; state = Brazilian federation UF (optional). */
export const refereesTable = pgTable("referees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Federation UF (AL, SP…); null when unknown — fill gradually. */
  state: text("state"),
  /** Profile photo: absolute HTTPS URL or site path. */
  photoUrl: text("photo_url"),
  /**
   * Soft-merge: when set, this row is an inactive alias of another referee.
   * Matches must point at the keep id; list/search APIs hide merged rows.
   */
  mergedIntoId: integer("merged_into_id"),
});

export const insertRefereeSchema = createInsertSchema(refereesTable).omit({ id: true });
export type InsertReferee = z.infer<typeof insertRefereeSchema>;
export type Referee = typeof refereesTable.$inferSelect;
