import {
  pgTable,
  integer,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { playersTable } from "./players";

/**
 * Persistência do "jogador do dia" do jogo Quem é o Jogador?
 * play_date = calendário America/Sao_Paulo (YYYY-MM-DD).
 */
export const dailyPlayerTable = pgTable(
  "daily_player",
  {
    playDate: date("play_date").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => playersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("daily_player_player_id_idx").on(t.playerId),
    index("daily_player_player_date_idx").on(t.playerId, t.playDate),
  ],
);

export type DailyPlayer = typeof dailyPlayerTable.$inferSelect;
