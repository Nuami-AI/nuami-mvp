// Design Ref: §8 lib/usage/tracker.ts — UsageEvent DB helpers
// Plan SC: FR-04, FR-05, FR-06, FR-09, FR-10
import { prisma, prismaAccounts } from "@/lib/db";
import { kstDayStart, kstNextMidnight } from "@/lib/datetime";
import { FREE_CREDITS, resolveAppPlan, type AppPlanId } from "@/lib/usage/limits";

export type UsageAction =
  | "video_ai_use"
  | "paywall_shown"
  | "paywall_cta_click"
  | "paywall_dismiss"
  | "guide_bonus_claimed"
  | "guide_completed"
  | "guide_rated"
  | "guide_researched";

export { DAILY_USAGE_LIMIT } from "@/lib/usage/limits";

export function defaultCreditsLimit(): number {
  return FREE_CREDITS;
}

export function resolveCreditsLimit(stored: number | null | undefined): number {
  return resolveAppPlan(stored).storedLimit;
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
  resetsAt: Date | null;
  daily: boolean;
  plan: AppPlanId;
}

export async function getTodayCount(userEmail: string, action: UsageAction): Promise<number> {
  return prisma.usageEvent.count({
    where: { userEmail, action, createdAt: { gte: kstDayStart(0) } },
  });
}

export async function loadAppPlan(userEmail: string) {
  const user = await prismaAccounts.authUser.findUnique({
    where: { email: userEmail.trim().toLowerCase() },
    select: { creditsLimit: true },
  });
  return resolveAppPlan(user?.creditsLimit);
}

export async function checkGate(userEmail: string): Promise<GateResult> {
  const plan = await loadAppPlan(userEmail);
  const used = plan.daily
    ? await getTodayCount(userEmail, "video_ai_use")
    : await getCount(userEmail, "video_ai_use");
  return {
    allowed: used < plan.limit,
    used,
    limit: plan.limit,
    remaining: Math.max(0, plan.limit - used),
    resetsAt: plan.daily ? kstNextMidnight() : null,
    daily: plan.daily,
    plan: plan.id,
  };
}

export async function resetCreditsUsed(userEmail: string): Promise<void> {
  const plan = await loadAppPlan(userEmail);
  await prisma.usageEvent.deleteMany({
    where: {
      userEmail,
      action: "video_ai_use",
      ...(plan.daily ? { createdAt: { gte: kstDayStart(0) } } : {}),
    },
  });
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

  const todayStart = kstDayStart(0);
  const rows = await prisma.usageEvent.groupBy({
    by: ["userEmail", "action"],
    where: { userEmail: { in: emails }, action: { in: [...TESTER_STAT_ACTIONS] } },
    _count: { id: true },
  });
  const todayUse = await prisma.usageEvent.groupBy({
    by: ["userEmail"],
    where: { userEmail: { in: emails }, action: "video_ai_use", createdAt: { gte: todayStart } },
    _count: { id: true },
  });
  const usageWindows = await prisma.usageEvent.groupBy({
    by: ["userEmail"],
    where: { userEmail: { in: emails } },
    _max: { createdAt: true },
  });
  const creditRows = await prismaAccounts.authUser.findMany({
    where: { email: { in: emails } },
    select: { email: true, createdAt: true, lastLoginAt: true, creditsLimit: true },
  });
  const joinedByEmail = new Map(creditRows.map((row) => [row.email.toLowerCase(), row.createdAt]));
  const lastLoginByEmail = new Map(creditRows.map((row) => [row.email.toLowerCase(), row.lastLoginAt]));
  const lastUsedByEmail = new Map(
    usageWindows.map((row) => [row.userEmail.toLowerCase(), row._max.createdAt ?? null]),
  );
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(`${row.userEmail.toLowerCase()}:${row.action}`, row._count.id);
  }
  const todayByEmail = new Map(todayUse.map((row) => [row.userEmail.toLowerCase(), row._count.id]));

  return emails.map((email) => {
    const key = email.toLowerCase();
    const stat: TesterStats = {
      email,
      video_ai_use: counts.get(`${key}:video_ai_use`) ?? 0,
      paywall_shown: counts.get(`${key}:paywall_shown`) ?? 0,
      paywall_cta_click: counts.get(`${key}:paywall_cta_click`) ?? 0,
      paywall_dismiss: counts.get(`${key}:paywall_dismiss`) ?? 0,
    };
    const plan = resolveAppPlan(creditRows.find((row) => row.email.toLowerCase() === key)?.creditsLimit);
    const creditsUsed = plan.daily ? (todayByEmail.get(key) ?? 0) : (counts.get(`${key}:video_ai_use`) ?? 0);
    const creditsLimit = plan.limit;
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
