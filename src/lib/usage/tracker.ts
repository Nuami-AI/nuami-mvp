// Design Ref: §8 lib/usage/tracker.ts — UsageEvent DB helpers
// Plan SC: FR-04, FR-05, FR-06, FR-09, FR-10
import { prisma } from "@/lib/db";

export type UsageAction =
  | "video_ai_use"
  | "paywall_shown"
  | "paywall_cta_click"
  | "paywall_dismiss"
  | "guide_bonus_claimed";

const USAGE_LIMIT = parseInt(process.env.USAGE_LIMIT ?? "3", 10);

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
  const [used, bonusCount] = await Promise.all([
    getCount(userEmail, "video_ai_use"),
    getCount(userEmail, "guide_bonus_claimed"),
  ]);
  const effectiveLimit = USAGE_LIMIT + bonusCount * 2;
  const allowed = used < effectiveLimit;
  return { allowed, used, limit: effectiveLimit, remaining: Math.max(0, effectiveLimit - used) };
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

  const actions = TESTER_STAT_ACTIONS;

  const [rows, firstEvents, lastEvents] = await Promise.all([
    prisma.usageEvent.groupBy({
      by: ["userEmail", "action"],
      where: { userEmail: { in: emails } },
      _count: { id: true },
    }),
    prisma.usageEvent.findMany({
      where: { userEmail: { in: emails } },
      orderBy: { createdAt: "asc" },
      distinct: ["userEmail"],
      select: { userEmail: true, createdAt: true },
    }),
    prisma.usageEvent.findMany({
      where: { userEmail: { in: emails } },
      orderBy: { createdAt: "desc" },
      distinct: ["userEmail"],
      select: { userEmail: true, createdAt: true },
    }),
  ]);

  return emails.map((email) => {
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
    const firstSeenAt = firstEvents.find((e: { userEmail: string; createdAt: Date }) => e.userEmail === email)?.createdAt ?? null;
    const lastSeenAt = lastEvents.find((e: { userEmail: string; createdAt: Date }) => e.userEmail === email)?.createdAt ?? null;
    const creditsUsed = stat.video_ai_use;
    return {
      ...stat,
      firstSeenAt,
      lastSeenAt,
      creditsUsed,
      creditsLimit: USAGE_LIMIT,
      creditsRemaining: Math.max(0, USAGE_LIMIT - creditsUsed),
    };
  });
}
