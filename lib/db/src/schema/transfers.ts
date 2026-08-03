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
import { opponentsTable } from "./matches";

/**
 * Club player movements (arrivals / departures), catalogued by season.
 * club = origin when direction=in, destination when direction=out.
 * opponentId = optional link to adversaries catalog (crest + profile).
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
    /** Linked opponent when the club exists in the adversaries catalog. */
    opponentId: integer("opponent_id").references(() => opponentsTable.id),
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
    index("transfers_opponent_idx").on(t.opponentId),
  ],
);

export const insertTransferSchema = createInsertSchema(transfersTable).omit({
  id: true,
});
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;
