/**
 * Copy production schema+data into the isolated dev database on the same host.
 *   npm run db:clone
 *
 * Reads source from .env.production.local (fallback: DATABASE_URL).
 * Never writes into the production database name.
 */
import { config as dotenvConfig } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import {
  databaseNameFromUrl,
  DEV_DB_NAME,
  PROD_DB_NAME,
  withDatabaseName,
} from "../src/lib/db-target";

dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });
dotenvConfig({ path: ".env.production.local", override: true });

function ident(name: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe identifier: ${name}`);
  }
  return `\`${name}\``;
}

function parsePool(url: string) {
  const parsed = new URL(url.replace(/^mysql:\/\//i, "https://"));
  const sslAccept = parsed.searchParams.get("sslaccept");
  const sslMode = parsed.searchParams.get("sslmode");
  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 4000,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, "") || PROD_DB_NAME,
    ssl:
      sslAccept === "strict" || sslMode === "require"
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: true },
    connectionLimit: 2,
    connectTimeout: 20_000,
  };
}

async function main() {
  const sourceUrl = process.env.DATABASE_URL;
  if (!sourceUrl) throw new Error(".env.production.local 또는 DATABASE_URL 이 필요합니다.");

  const sourceDb = databaseNameFromUrl(sourceUrl) || PROD_DB_NAME;
  const destDb = DEV_DB_NAME;
  if (sourceDb !== PROD_DB_NAME) {
    throw new Error(`소스는 프로덕션 DB(${PROD_DB_NAME})여야 합니다. 현재: ${sourceDb}`);
  }
  if (destDb === sourceDb) {
    throw new Error("개발 DB 이름이 프로덕션과 같습니다. DEV_DB_NAME을 확인하세요.");
  }

  process.env.ALLOW_PROD_DB = "1";
  const adapter = new PrismaMariaDb(parsePool(withDatabaseName(sourceUrl, sourceDb)));
  const prisma = new PrismaClient({ adapter });

  console.log(`clone ${sourceDb} → ${destDb}`);
  await prisma.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS ${ident(destDb)}`);

  const tables = await prisma.$queryRawUnsafe<Array<{ TABLE_NAME: string }>>(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`,
    sourceDb,
  );
  if (tables.length === 0) throw new Error(`${sourceDb} 에 테이블이 없습니다.`);

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=0`);
  for (const { TABLE_NAME } of tables) {
    const src = `${ident(sourceDb)}.${ident(TABLE_NAME)}`;
    const dest = `${ident(destDb)}.${ident(TABLE_NAME)}`;
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS ${dest}`);
    await prisma.$executeRawUnsafe(`CREATE TABLE ${dest} LIKE ${src}`);
    const inserted = await prisma.$executeRawUnsafe(`INSERT INTO ${dest} SELECT * FROM ${src}`);
    console.log(`  ${TABLE_NAME}  ${inserted} rows`);
  }
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=1`);
  await prisma.$disconnect();
  console.log(`ok ${tables.length} tables copied to ${destDb}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
