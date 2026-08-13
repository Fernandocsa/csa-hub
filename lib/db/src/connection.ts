import type { ConnectionOptions } from "tls";

export type PgPoolOptions = {
  connectionString: string;
  ssl?: ConnectionOptions | boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
};

export type DrizzleKitCredentials = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: ConnectionOptions | boolean;
};

function requiresSsl(url: URL): boolean {
  const host = url.hostname;
  const sslMode = url.searchParams.get("sslmode");
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host.endsWith("supabase.co") || host.includes("pooler.supabase.com")) {
    return true;
  }
  return (
    sslMode === "require" ||
    sslMode === "verify-full" ||
    sslMode === "no-verify"
  );
}

export function getPgPoolOptions(connectionString: string): PgPoolOptions {
  const url = new URL(connectionString);
  const local =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return {
    connectionString,
    ...(requiresSsl(url) ? { ssl: { rejectUnauthorized: false } } : {}),
    // Vercel lambdas: default max 10 exhausts Supabase and waits forever.
    ...(local
      ? {}
      : {
          max: 1,
          idleTimeoutMillis: 10_000,
          connectionTimeoutMillis: 20_000,
        }),
  };
}

export function getDrizzleKitCredentials(
  connectionString: string,
): DrizzleKitCredentials {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || "postgres",
    ...(requiresSsl(url) ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}
