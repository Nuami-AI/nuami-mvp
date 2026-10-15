import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { anthropicModel } from "@/lib/anthropic/client";
import { openaiModel } from "@/lib/openai/client";
import { DEV_DB_NAME, PROD_DB_NAME, sqlIdent } from "@/lib/db-target";

/** 로컬·실서버가 같은 API 키로 토큰을 쓰므로 기록은 실서버 DB 한곳만 본다. */
function llmUsageTable(): string {
  return `${sqlIdent(PROD_DB_NAME)}.\`LlmUsageEvent\``;
}

let sharedReady: Promise<void> | null = null;

async function ensureSharedLlmUsage(): Promise<void> {
  if (!sharedReady) {
    sharedReady = ensureSharedLlmUsageOnce().catch((err) => {
      sharedReady = null;
      throw err;
    });
  }
  await sharedReady;
}

async function ensureSharedLlmUsageOnce(): Promise<void> {
  const shared = llmUsageTable();
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${shared} (
      \`id\` VARCHAR(191) NOT NULL,
      \`provider\` VARCHAR(191) NOT NULL,
      \`model\` VARCHAR(191) NOT NULL,
      \`task\` VARCHAR(191) NOT NULL,
      \`tokensIn\` INTEGER NOT NULL DEFAULT 0,
      \`tokensOut\` INTEGER NOT NULL DEFAULT 0,
      \`ok\` BOOLEAN NOT NULL DEFAULT true,
      \`error\` VARCHAR(500) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX \`LlmUsageEvent_createdAt_idx\`(\`createdAt\`),
      INDEX \`LlmUsageEvent_provider_createdAt_idx\`(\`provider\`, \`createdAt\`),
      INDEX \`LlmUsageEvent_task_createdAt_idx\`(\`task\`, \`createdAt\`),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  if (DEV_DB_NAME === PROD_DB_NAME) return;
  try {
    await prisma.$executeRawUnsafe(
      `INSERT IGNORE INTO ${shared} SELECT * FROM ${sqlIdent(DEV_DB_NAME)}.\`LlmUsageEvent\``,
    );
  } catch {
    /* 로컬 테이블이 아직 없으면 건너뜀 */
  }
}

function toNum(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" || typeof value === "bigint") return Number(value) !== 0;
  if (typeof value === "string") return value === "1" || value.toLowerCase() === "true";
  return Boolean(value);
}

export async function recordLlmUsage(input: {
  provider: "openai" | "anthropic";
  task: "guide" | "ingest" | "translate";
  tokensIn?: number;
  tokensOut?: number;
  ok: boolean;
  error?: string;
}): Promise<void> {
  try {
    await ensureSharedLlmUsage();
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${llmUsageTable()}
        (\`id\`, \`provider\`, \`model\`, \`task\`, \`tokensIn\`, \`tokensOut\`, \`ok\`, \`error\`, \`createdAt\`)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      randomUUID(),
      input.provider,
      input.provider === "openai" ? openaiModel() : anthropicModel(),
      input.task,
      input.tokensIn ?? 0,
      input.tokensOut ?? 0,
      input.ok ? 1 : 0,
      input.error?.slice(0, 500) ?? null,
    );
  } catch (err) {
    console.warn("[llm-usage] persist failed:", err instanceof Error ? err.message : err);
  }
}

const TASK_LABEL: Record<string, string> = {
  guide: "실시간 안내",
  ingest: "자료 추출",
  translate: "번역",
};

const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Claude",
};

export function llmTaskLabel(task: string): string {
  return TASK_LABEL[task] ?? task;
}

export function llmProviderLabel(provider: string): string {
  return PROVIDER_LABEL[provider] ?? provider;
}

export type LlmUsageRange = "1" | "7" | "30";

function kstMidnight(daysBack = 0): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCHours(0, 0, 0, 0);
  kst.setUTCDate(kst.getUTCDate() - daysBack);
  return new Date(kst.getTime() - 9 * 60 * 60 * 1000);
}

export function llmUsageSince(range: LlmUsageRange): Date {
  if (range === "1") return kstMidnight(0);
  if (range === "7") return kstMidnight(6);
  return kstMidnight(29);
}

export interface LlmProviderStats {
  provider: string;
  label: string;
  calls: number;
  ok: number;
  tokensIn: number;
  tokensOut: number;
}

export interface LlmUsageDashboard {
  range: LlmUsageRange;
  since: Date;
  totals: { calls: number; ok: number; tokensIn: number; tokensOut: number };
  byProvider: LlmProviderStats[];
  byTask: Array<{ task: string; label: string; calls: number; tokensIn: number; tokensOut: number }>;
  recent: Array<{
    id: string;
    provider: string;
    model: string;
    task: string;
    tokensIn: number;
    tokensOut: number;
    ok: boolean;
    createdAt: Date;
  }>;
}

type TotalsRow = {
  calls: unknown;
  ok: unknown;
  tokensIn: unknown;
  tokensOut: unknown;
};

type ProviderRow = TotalsRow & { provider: string };
type TaskRow = {
  task: string;
  calls: unknown;
  tokensIn: unknown;
  tokensOut: unknown;
};
type RecentRow = {
  id: string;
  provider: string;
  model: string;
  task: string;
  tokensIn: unknown;
  tokensOut: unknown;
  ok: unknown;
  createdAt: Date | string;
};

function emptyDashboard(range: LlmUsageRange, since: Date): LlmUsageDashboard {
  return {
    range,
    since,
    totals: { calls: 0, ok: 0, tokensIn: 0, tokensOut: 0 },
    byProvider: ["openai", "anthropic"].map((id) => ({
      provider: id,
      label: llmProviderLabel(id),
      calls: 0,
      ok: 0,
      tokensIn: 0,
      tokensOut: 0,
    })),
    byTask: [],
    recent: [],
  };
}

export async function getLlmUsageDashboard(range: LlmUsageRange = "7"): Promise<LlmUsageDashboard> {
  const since = llmUsageSince(range);
  const empty = emptyDashboard(range, since);

  try {
    await ensureSharedLlmUsage();
    const table = llmUsageTable();
    const [totalsRows, byProviderRows, byTaskRows, recent] = await Promise.all([
      prisma.$queryRawUnsafe<TotalsRow[]>(
        `SELECT
          COUNT(*) AS calls,
          COALESCE(SUM(CASE WHEN \`ok\` = 1 THEN 1 ELSE 0 END), 0) AS ok,
          COALESCE(SUM(\`tokensIn\`), 0) AS tokensIn,
          COALESCE(SUM(\`tokensOut\`), 0) AS tokensOut
        FROM ${table}
        WHERE \`createdAt\` >= ?`,
        since,
      ),
      prisma.$queryRawUnsafe<ProviderRow[]>(
        `SELECT
          \`provider\`,
          COUNT(*) AS calls,
          COALESCE(SUM(CASE WHEN \`ok\` = 1 THEN 1 ELSE 0 END), 0) AS ok,
          COALESCE(SUM(\`tokensIn\`), 0) AS tokensIn,
          COALESCE(SUM(\`tokensOut\`), 0) AS tokensOut
        FROM ${table}
        WHERE \`createdAt\` >= ?
        GROUP BY \`provider\``,
        since,
      ),
      prisma.$queryRawUnsafe<TaskRow[]>(
        `SELECT
          \`task\`,
          COUNT(*) AS calls,
          COALESCE(SUM(\`tokensIn\`), 0) AS tokensIn,
          COALESCE(SUM(\`tokensOut\`), 0) AS tokensOut
        FROM ${table}
        WHERE \`createdAt\` >= ?
        GROUP BY \`task\``,
        since,
      ),
      prisma.$queryRawUnsafe<RecentRow[]>(
        `SELECT
          \`id\`, \`provider\`, \`model\`, \`task\`,
          \`tokensIn\`, \`tokensOut\`, \`ok\`, \`createdAt\`
        FROM ${table}
        WHERE \`createdAt\` >= ?
        ORDER BY \`createdAt\` DESC
        LIMIT 80`,
        since,
      ),
    ]);

    const totals = totalsRows[0];
    const byProvider = ["openai", "anthropic"].map((id) => {
      const hit = byProviderRows.find((row) => row.provider === id);
      return {
        provider: id,
        label: llmProviderLabel(id),
        calls: toNum(hit?.calls),
        ok: toNum(hit?.ok),
        tokensIn: toNum(hit?.tokensIn),
        tokensOut: toNum(hit?.tokensOut),
      };
    });

    return {
      range,
      since,
      totals: {
        calls: toNum(totals?.calls),
        ok: toNum(totals?.ok),
        tokensIn: toNum(totals?.tokensIn),
        tokensOut: toNum(totals?.tokensOut),
      },
      byProvider,
      byTask: byTaskRows
        .map((row) => ({
          task: row.task,
          label: llmTaskLabel(row.task),
          calls: toNum(row.calls),
          tokensIn: toNum(row.tokensIn),
          tokensOut: toNum(row.tokensOut),
        }))
        .sort((a, b) => b.tokensOut - a.tokensOut),
      recent: recent.map((row) => ({
        id: row.id,
        provider: row.provider,
        model: row.model,
        task: row.task,
        tokensIn: toNum(row.tokensIn),
        tokensOut: toNum(row.tokensOut),
        ok: toBool(row.ok),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
      })),
    };
  } catch (err) {
    console.warn("[llm-usage] dashboard query failed:", err instanceof Error ? err.message : err);
    return empty;
  }
}
