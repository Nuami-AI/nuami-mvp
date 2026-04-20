import { config as dotenvConfig } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js uses .env.local but Prisma CLI doesn't — load both
dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });

const DB_NAME = process.env["DB_DATABASE"] ?? "nuami";

const SSL_PARAMS = "sslaccept=strict";
function ensureSsl(urlString: string): string {
  try {
    const u = new URL(urlString.replace(/^mysql:\/\//i, "https://"));
    const sslDisabled = process.env["DB_SSL"] === "false";
    if (sslDisabled) return urlString;
    const hasSsl = u.searchParams.has("sslaccept") || u.searchParams.has("sslmode");
    if (!hasSsl) {
      u.searchParams.set("sslaccept", "strict");
      if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    }
    return u.toString().replace(/^https:\/\//i, "mysql://");
  } catch {
    if (urlString.includes("?")) {
      return urlString + (urlString.includes("sslaccept") ? "" : "&" + SSL_PARAMS);
    }
    return urlString + "?" + SSL_PARAMS;
  }
}

function getDatasourceUrl(): string {
  const database = DB_NAME;
  if (process.env["DATABASE_URL"]) {
    const u = process.env["DATABASE_URL"].replace(/^mysql:\/\//i, "https://");
    const url = new URL(u);
    url.pathname = "/" + database;
    const out = url.toString().replace(/^https:\/\//i, "mysql://");
    return ensureSsl(out);
  }
  const host = process.env["DB_HOST"];
  if (!host) {
    return `mysql://user:pass@localhost:3306/${database}`;
  }
  const port = process.env["DB_PORT"] ?? "4000";
  const user = encodeURIComponent(process.env["DB_USERNAME"] ?? "");
  const password = encodeURIComponent(process.env["DB_PASSWORD"] ?? "");
  const ssl = process.env["DB_SSL"] !== "false" ? "?sslaccept=strict&sslmode=require" : "";
  return `mysql://${user}:${password}@${host}:${port}/${database}${ssl}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatasourceUrl(),
  },
});
