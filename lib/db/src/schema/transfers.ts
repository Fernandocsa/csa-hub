import {
  pgTable,
  text,
  serial,
  integer,
  date,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playersTable } from "./players";

/**
 * Club player movements (arrivals / departures), catalogued by season.
 * club = origin when direction=in, destination when direction=out.
 */
export const transfersTable = pgTable(
  "transfers",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => playersTable.id),
    /** "in" = arrival at CSA; "out" = departure from CSA */
    direction: text("direction").notNull(),
    club: text("club"),
    /** Optional exact/approx date (YYYY-MM-DD). */
    transferDate: date("transfer_date", { mode: "string" }),
    season: text("season").notNull(),
    /** e.g. empréstimo, definitiva, fim de contrato */
    transferType: text("transfer_type"),
    notes: text("notes"),
  },
  (t) => [
    index("transfers_season_idx").on(t.season),
    index("transfers_player_idx").on(t.playerId),
    index("transfers_direction_idx").on(t.direction),
  ],
);

export const insertTransferSchema = createInsertSchema(transfersTable).omit({
  id: true,
});
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;
