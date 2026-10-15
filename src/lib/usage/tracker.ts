// Design Ref: §8 lib/usage/tracker.ts — UsageEvent DB helpers
// Plan SC: FR-04, FR-05, FR-06, FR-09, FR-10
import { prisma, prismaAccounts } from "@/lib/db";

export type UsageAction =
  | "video_ai_use"
  | "paywall_shown"
  | "paywall_cta_click"
  | "paywall_dismiss"
  | "guide_bonus_claimed"
  | "guide_completed"
  | "guide_rated"
  | "guide_researched";

const USAGE_LIMIT = parseInt(process.env.USAGE_LIMIT ?? "100", 10);

export function defaultCreditsLimit(): number {
  return Number.isFinite(USAGE_LIMIT) && USAGE_LIMIT > 0 ? USAGE_LIMIT : 100;
}

export function resolveCreditsLimit(stored: number | null | undefined): number {
  return stored != null && stored > 0 ? stored : defaultCreditsLimit();
}

export async function getCount(userEmail: string, action: UsageAction): Promise<number> {
  return prisma.usageEvent.count({
    where: { userEmail, action },
  });
}

export async function logEvent(
  userEmail: string,
  action: UsageAction,
  metadata?: object
): Promise<void> {
  await prisma.usageEvent.create({
    data: {
      userEmail,
      action,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}

export interface GateResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export async function checkGate(userEmail: string): Promise<GateResult> {
  const [used, bonusCount, user] = await Promise.all([
    getCount(userEmail, "video_ai_use"),
    getCount(userEmail, "guide_bonus_claimed"),
    prismaAccounts.authUser.findUnique({ where: { email: userEmail }, select: { creditsLimit: true } }),
  ]);
  const effectiveLimit = resolveCreditsLimit(user?.creditsLimit) + bonusCount * 2;
  const allowed = used < effectiveLimit;
  return { allowed, used, limit: effectiveLimit, remaining: Math.max(0, effectiveLimit - used) };
}

export async function resetCreditsUsed(userEmail: string): Promise<void> {
  await prisma.usageEvent.deleteMany({ where: { userEmail, action: "video_ai_use" } });
}

export async function claimGuideBonus(
  userEmail: string
): Promise<{ claimed: boolean; alreadyClaimed: boolean }> {
  const existing = await getCount(userEmail, "guide_bonus_claimed");
  if (existing > 0) return { claimed: false, alreadyClaimed: true };
  await logEvent(userEmail, "guide_bonus_claimed");
  return { claimed: true, alreadyClaimed: false };
}

export interface TesterStats {
  email: string;
  video_ai_use: number;
  paywall_shown: number;
  paywall_cta_click: number;
  paywall_dismiss: number;
}

export interface AdminUserDetail extends TesterStats {
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  lastLoginAt: Date | null;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
}

const TESTER_STAT_ACTIONS = [
  "video_ai_use",
  "paywall_shown",
  "paywall_cta_click",
  "paywall_dismiss",
] as const satisfies UsageAction[];

export async function getAdminStats(testerEmails: string[]): Promise<TesterStats[]> {
  const actions = TESTER_STAT_ACTIONS;

  const rows = await prisma.usageEvent.groupBy({
    by: ["userEmail", "action"],
    where: { userEmail: { in: testerEmails } },
    _count: { id: true },
  });

  return testerEmails.map((email) => {
    const stat: TesterStats = {
      email,
      video_ai_use: 0,
      paywall_shown: 0,
      paywall_cta_click: 0,
      paywall_dismiss: 0,
    };
    for (const action of actions) {
      const row = rows.find((r: { userEmail: string; action: string; _count: { id: number } }) => r.userEmail === email && r.action === action);
      if (row) stat[action] = row._count.id;
    }
    return stat;
  });
}

export async function getAdminUserDetails(emails: string[]): Promise<AdminUserDetail[]> {
  if (emails.length === 0) return [];

  const rows = await prisma.usageEvent.groupBy({
    by: ["userEmail", "action"],
    where: { userEmail: { in: emails }, action: { in: [...TESTER_STAT_ACTIONS] } },
    _count: { id: true },
  });
  const usageWindows = await prisma.usageEvent.groupBy({
    by: ["userEmail"],
    where: { userEmail: { in: emails } },
    _max: { createdAt: true },
  });
  const creditRows = await prismaAccounts.authUser.findMany({
    where: { email: { in: emails } },
    select: { email: true, creditsLimit: true, createdAt: true, lastLoginAt: true },
  });
  const creditsByEmail = new Map(creditRows.map((row) => [row.email.toLowerCase(), row.creditsLimit]));
  const joinedByEmail = new Map(creditRows.map((row) => [row.email.toLowerCase(), row.createdAt]));
  const lastLoginByEmail = new Map(creditRows.map((row) => [row.email.toLowerCase(), row.lastLoginAt]));
  const lastUsedByEmail = new Map(
    usageWindows.map((row) => [row.userEmail.toLowerCase(), row._max.createdAt ?? null]),
  );
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(`${row.userEmail.toLowerCase()}:${row.action}`, row._count.id);
  }

  return emails.map((email) => {
    const key = email.toLowerCase();
    const stat: TesterStats = {
      email,
      video_ai_use: counts.get(`${key}:video_ai_use`) ?? 0,
      paywall_shown: counts.get(`${key}:paywall_shown`) ?? 0,
      paywall_cta_click: counts.get(`${key}:paywall_cta_click`) ?? 0,
      paywall_dismiss: counts.get(`${key}:paywall_dismiss`) ?? 0,
    };
    const creditsUsed = stat.video_ai_use;
    const creditsLimit = resolveCreditsLimit(creditsByEmail.get(key));
    return {
      ...stat,
      firstSeenAt: joinedByEmail.get(key) ?? null,
      lastSeenAt: lastUsedByEmail.get(key) ?? null,
      lastLoginAt: lastLoginByEmail.get(key) ?? null,
      creditsUsed,
      creditsLimit,
      creditsRemaining: Math.max(0, creditsLimit - creditsUsed),
    };
  });
}
