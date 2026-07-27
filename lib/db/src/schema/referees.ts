import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** Match referees; state = Brazilian federation UF (optional). */
export const refereesTable = pgTable("referees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Federation UF (AL, SP…); null when unknown — fill gradually. */
  state: text("state"),
});

export const insertRefereeSchema = createInsertSchema(refereesTable).omit({ id: true });
export type InsertReferee = z.infer<typeof insertRefereeSchema>;
export type Referee = typeof refereesTable.$inferSelect;
