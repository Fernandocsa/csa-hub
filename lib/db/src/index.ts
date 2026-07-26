import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getPgPoolOptions } from "./connection";
import { loadRootEnv } from "./load-env";
import * as schema from "./schema";

const { Pool } = pg;

loadRootEnv();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool(getPgPoolOptions(process.env.DATABASE_URL));
export const db = drizzle(pool, { schema });

export * from "./schema";
