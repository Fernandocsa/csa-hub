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

function sqlLabel(arg: unknown): string {
  if (typeof arg === "string") return arg;
  if (arg && typeof arg === "object" && "text" in arg) {
    return String((arg as { text: string }).text);
  }
  return "?";
}

function instrumentPool(p: pg.Pool): pg.Pool {
  let querySeq = 0;
  let connectSeq = 0;
  const originalQuery = p.query.bind(p);
  const originalConnect = p.connect.bind(p);

  p.query = ((...args: Parameters<pg.Pool["query"]>) => {
    const n = ++querySeq;
    const label = sqlLabel(args[0]).replace(/\s+/g, " ").slice(0, 140);
    const t0 = Date.now();
    console.log(
      `[pg] query#${n} start waiting=${p.waitingCount} idle=${p.idleCount} total=${p.totalCount} ${label}`,
    );
    const result = originalQuery(...(args as Parameters<typeof originalQuery>));
    return Promise.resolve(result).then(
      (rows) => {
        console.log(`[pg] query#${n} ok ${Date.now() - t0}ms ${label}`);
        return rows;
      },
      (err) => {
        console.log(`[pg] query#${n} fail ${Date.now() - t0}ms ${label}`);
        throw err;
      },
    );
  }) as typeof p.query;

  p.connect = (async () => {
    const n = ++connectSeq;
    const t0 = Date.now();
    console.log(
      `[pg] connect#${n} wait waiting=${p.waitingCount} idle=${p.idleCount} total=${p.totalCount}`,
    );
    try {
      const client = await originalConnect();
      console.log(`[pg] connect#${n} acquired ${Date.now() - t0}ms`);
      const originalRelease = client.release.bind(client);
      client.release = ((err?: Error | boolean) => {
        console.log(`[pg] release#${n} held ${Date.now() - t0}ms`);
        return originalRelease(err as Error | boolean | undefined);
      }) as typeof client.release;
      return client;
    } catch (err) {
      console.log(`[pg] connect#${n} fail ${Date.now() - t0}ms`);
      throw err;
    }
  }) as typeof p.connect;

  return p;
}

export const pool = instrumentPool(new Pool(getPgPoolOptions(process.env.DATABASE_URL)));
export const db = drizzle(pool, { schema });

export * from "./schema";
