import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** Temporary AI import sessions (season batch preview before commit). */
export const aiImportSessionsTable = pgTable("ai_import_sessions", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull().default("season_matches"),
  seasonYear: integer("season_year"),
  /** Raw pasted text (optional retention for re-extract). */
  sourceText: text("source_text"),
  /** Parsed + resolved preview payload. */
  preview: jsonb("preview").notNull(),
  /** Claude usage metadata. */
  usage: jsonb("usage"),
  status: text("status").notNull().default("preview"), // preview | committed | expired
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const insertAiImportSessionSchema = createInsertSchema(aiImportSessionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAiImportSession = z.infer<typeof insertAiImportSessionSchema>;
export type AiImportSession = typeof aiImportSessionsTable.$inferSelect;
