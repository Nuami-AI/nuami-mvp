import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function parseDatabaseUrl(url: string): Record<string, unknown> {
  const parsed = new URL(url.replace(/^mysql:\/\//i, "https://"));
  const database = parsed.pathname?.replace(/^\//, "") || "";
  const sslAccept = parsed.searchParams.get("sslaccept");
  const sslMode = parsed.searchParams.get("sslmode");
  const isLocalhost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname?.startsWith("192.168.") ||
    parsed.hostname?.endsWith(".local");
  const urlWantsSsl = sslAccept === "strict" || sslMode === "require";
  const cloudNeedsSsl = !isLocalhost && process.env.DB_SSL !== "false";

  const config: Record<string, unknown> = {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: decodedURIComponent(parsed.username),
    password: decodedURIComponent(parsed.password),
    database: database || undefined,
    ...poolTuning(),
  };
  if (urlWantsSsl || cloudNeedsSsl) {
    config.ssl = { rejectUnauthorized: true };
  }
  return config;
}

function poolTuning(): Record<string, unknown> {
  // mariadb idleTimeout is seconds. minimumIdle: 0 prevents the pool from
  // creating any connection (idle < 0 is never true), which shows up as
  // active=0 idle=0 pool timeout.
  return {
    connectionLimit: 3,
    minimumIdle: 1,
    connectTimeout: 20_000,
    acquireTimeout: 25_000,
    idleTimeout: 600,
    initializationTimeout: 20_000,
  };
}

function decodedURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function getPoolConfig(): Record<string, unknown> {
  if (process.env.DB_HOST) {
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 4000;
    return {
      host: process.env.DB_HOST,
      port: Number.isNaN(port) ? 4000 : port,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE ?? "nuami",
      ...poolTuning(),
      ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: true } : undefined,
    };
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      ".env에 DATABASE_URL 또는 DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE 를 설정하세요."
    );
  }
  const config = parseDatabaseUrl(url);
  if (process.env.DB_DATABASE) config.database = process.env.DB_DATABASE;
  return config;
}

function createPrisma() {
  const poolConfig = getPoolConfig();
  const adapter = new PrismaMariaDb(
    poolConfig as ConstructorParameters<typeof PrismaMariaDb>[0]
  );
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
