import { pgTable, integer } from "drizzle-orm/pg-core";

export const seasonsTable = pgTable("seasons", {
  year: integer("year").primaryKey(),
});
