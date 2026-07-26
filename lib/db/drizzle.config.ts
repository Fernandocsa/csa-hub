import { defineConfig } from "drizzle-kit";
import path from "path";
import { getDrizzleKitCredentials } from "./src/connection";
import { loadRootEnv } from "./src/load-env";

loadRootEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: getDrizzleKitCredentials(process.env.DATABASE_URL),
});
