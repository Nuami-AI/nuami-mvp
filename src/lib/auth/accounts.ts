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
  | { ok: false; reason: "unknown_email" | "wrong_password" | "social_only" };

export async function loginAccount(email: string, password: string): Promise<LoginLookup> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.authUser.findUnique({ where: { email: normalized } });
  if (!user || user.status !== "ACTIVE") return { ok: false, reason: "unknown_email" };
  if (!user.passwordHash) return { ok: false, reason: "social_only" };
  if (!verifyPassword(password, user.passwordHash)) return { ok: false, reason: "wrong_password" };
  return {
    ok: true,
    account: { email: user.email, role: sessionRoleOf(user.accountType) },
    mustChangePassword: user.passwordMustChange,
  };
}

export async function listAppUserEmails(): Promise<string[]> {
  const rows = await prisma.authUser.findMany({
    where: { status: "ACTIVE", accountType: { not: "INTERNAL" } },
    select: { email: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.email);
}
