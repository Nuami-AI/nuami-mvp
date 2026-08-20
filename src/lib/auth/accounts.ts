import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

export type AccountType = "END_USER" | "ORG_STAFF" | "INTERNAL";

export interface Account {
  email: string;
  role: "admin" | "tester";
}

export function sessionRoleOf(accountType: string | null | undefined): Account["role"] {
  return accountType === "INTERNAL" ? "admin" : "tester";
}

export type LoginLookup =
  | { ok: true; account: Account; mustChangePassword: boolean }
  | { ok: false; reason: "unknown_email" | "wrong_password" | "social_only" | "deactivated" };

export async function loginAccount(email: string, password: string): Promise<LoginLookup> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.authUser.findUnique({ where: { email: normalized } });
  if (!user) return { ok: false, reason: "unknown_email" };
  if (user.status !== "ACTIVE") return { ok: false, reason: "deactivated" };
  if (!user.passwordHash) return { ok: false, reason: "social_only" };
  if (!verifyPassword(password, user.passwordHash)) return { ok: false, reason: "wrong_password" };
  return {
    ok: true,
    account: { email: user.email, role: sessionRoleOf(user.accountType) },
    mustChangePassword: user.passwordMustChange,
  };
}

export async function listAppUserEmails(): Promise<string[]> {
  const rows = await listUsageAccounts();
  return rows.map((row) => row.email);
}

export type UsageAccountKind = "org" | "end";

/** AuthUser 타입이 비어 있어도, 기관 멤버십이 있으면 기관 계정으로 봅니다. */
export function accountKindOf(accountType: string, hasOrgStaff: boolean): "console" | "org" | "end" {
  if (accountType === "INTERNAL") return "console";
  if (accountType === "ORG_STAFF" || hasOrgStaff) return "org";
  return "end";
}

async function activeOrgStaffEmails(): Promise<Set<string>> {
  const staff = await prisma.organizationMember.findMany({
    where: { status: "ACTIVE" },
    select: { email: true },
  });
  return new Set(staff.map((row) => row.email.toLowerCase()));
}

/** 앱에서 먼저 가입한 뒤 기관 담당자가 된 계정의 타입을 맞춥니다. */
export async function healOrgStaffAccountTypes(): Promise<void> {
  const emails = [...(await activeOrgStaffEmails())];
  if (emails.length === 0) return;
  await prisma.authUser.updateMany({
    where: { email: { in: emails }, accountType: "END_USER" },
    data: { accountType: "ORG_STAFF" },
  });
}

export async function listUsageAccounts(): Promise<Array<{ email: string; kind: UsageAccountKind }>> {
  await healOrgStaffAccountTypes();
  const users = await prisma.authUser.findMany({
    where: { status: "ACTIVE", accountType: { not: "INTERNAL" } },
    select: { email: true, accountType: true },
    orderBy: { createdAt: "asc" },
  });
  if (users.length === 0) return [];
  const staffEmails = await activeOrgStaffEmails();
  return users.map((row) => ({
    email: row.email,
    kind: accountKindOf(row.accountType, staffEmails.has(row.email.toLowerCase())) === "org" ? "org" : "end",
  }));
}
