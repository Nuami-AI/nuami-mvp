export const PROD_DB_NAME = (process.env.PROD_DB_NAME ?? "nuami").trim();
export const DEV_DB_NAME = (process.env.DEV_DB_NAME ?? "nuami_dev").trim();

export function databaseNameFromUrl(urlString: string | undefined): string {
  if (!urlString) return "";
  try {
    const parsed = new URL(urlString.replace(/^mysql:\/\//i, "https://"));
    return decodeURIComponent(parsed.pathname.replace(/^\//, "").split("/")[0] ?? "");
  } catch {
    return "";
  }
}

export function hostFromUrl(urlString: string | undefined): string {
  if (!urlString) return "";
  try {
    return new URL(urlString.replace(/^mysql:\/\//i, "https://")).hostname;
  } catch {
    return "";
  }
}

export function withDatabaseName(urlString: string, database: string): string {
  const parsed = new URL(urlString.replace(/^mysql:\/\//i, "https://"));
  parsed.pathname = `/${database}`;
  return parsed.toString().replace(/^https:\/\//i, "mysql://");
}

export function resolveDatabaseName(): string {
  if (process.env.DB_DATABASE?.trim()) return process.env.DB_DATABASE.trim();
  return databaseNameFromUrl(process.env.DATABASE_URL) || DEV_DB_NAME;
}

export function allowProductionDatabase(): boolean {
  return process.env.ALLOW_PROD_DB === "1" || process.env.VERCEL === "1";
}

/** MySQL identifier — only [A-Za-z0-9_]. */
export function sqlIdent(name: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe identifier: ${name}`);
  }
  return `\`${name}\``;
}

export function assertSafeDatabase(database = resolveDatabaseName()): string {
  if (database === PROD_DB_NAME && !allowProductionDatabase()) {
    throw new Error(
      `로컬/개발에서는 프로덕션 DB \`${PROD_DB_NAME}\`에 연결하지 않습니다. ` +
        `.env.local의 DATABASE_URL 경로를 \`/${DEV_DB_NAME}\`로 두세요. ` +
        `실서버 작업이 필요하면 ALLOW_PROD_DB=1 을 명시하세요.`,
    );
  }
  return database;
}
