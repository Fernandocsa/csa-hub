import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";
import { playersTable } from "./players";

/** Jogadores excluídos do sorteio de Quem é o Jogador? */
export const dailyPlayerBlocksTable = pgTable("daily_player_blocks", {
  playerId: integer("player_id")
    .primaryKey()
    .references(() => playersTable.id, { onDelete: "cascade" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type DailyPlayerBlock = typeof dailyPlayerBlocksTable.$inferSelect;
