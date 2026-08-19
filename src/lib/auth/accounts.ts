import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

export interface Account {
  email: string;
  role: "admin" | "tester";
}

function getAccounts(): Array<Account & { password: string }> {
  return [
    {
      email: process.env.ADMIN_EMAIL ?? "",
      password: process.env.ADMIN_PASSWORD ?? "",
      role: "admin",
    },
    {
      email: process.env.TESTER1_EMAIL ?? "",
      password: process.env.TESTER1_PASSWORD ?? "",
      role: "tester",
    },
    {
      email: process.env.TESTER2_EMAIL ?? "",
      password: process.env.TESTER2_PASSWORD ?? "",
      role: "tester",
    },
    {
      email: process.env.TESTER3_EMAIL ?? "",
      password: process.env.TESTER3_PASSWORD ?? "",
      role: "tester",
    },
    {
      email: process.env.TESTER4_EMAIL ?? "",
      password: process.env.TESTER4_PASSWORD ?? "",
      role: "tester",
    },
    {
      email: process.env.TESTER5_EMAIL ?? "",
      password: process.env.TESTER5_PASSWORD ?? "",
      role: "tester",
    },
  ];
}

export function envAccountEmail(email: string): Account | null {
  const normalized = email.trim().toLowerCase();
  const found = getAccounts().find((a) => a.email && a.email.toLowerCase() === normalized);
  return found ? { email: found.email, role: found.role } : null;
}

export function findAccount(email: string, password: string): Account | null {
  const normalized = email.trim().toLowerCase();
  const accounts = getAccounts().filter((a) => a.email);
  const found = accounts.find((a) => a.email.toLowerCase() === normalized);
  if (!found || found.password !== password) return null;
  return { email: found.email, role: found.role };
}

export type LoginLookup =
  | { ok: true; account: Account; mustChangePassword: boolean }
  | { ok: false; reason: "unknown_email" | "wrong_password" | "social_only" };

export async function loginAccount(email: string, password: string): Promise<LoginLookup> {
  const normalized = email.trim().toLowerCase();
  const accounts = getAccounts().filter((a) => a.email);
  const found = accounts.find((a) => a.email.toLowerCase() === normalized);
  if (found) {
    if (found.password !== password) return { ok: false, reason: "wrong_password" };
    return { ok: true, account: { email: found.email, role: found.role }, mustChangePassword: false };
  }

  const user = await prisma.authUser.findUnique({ where: { email: normalized } });
  if (!user || user.status !== "ACTIVE") return { ok: false, reason: "unknown_email" };
  if (!user.passwordHash) return { ok: false, reason: "social_only" };
  if (!verifyPassword(password, user.passwordHash)) return { ok: false, reason: "wrong_password" };
  return {
    ok: true,
    account: { email: user.email, role: "tester" },
    mustChangePassword: user.passwordMustChange,
  };
}

export function getTesterEmails(): string[] {
  return [
    process.env.TESTER1_EMAIL ?? "",
    process.env.TESTER2_EMAIL ?? "",
    process.env.TESTER3_EMAIL ?? "",
    process.env.TESTER4_EMAIL ?? "",
    process.env.TESTER5_EMAIL ?? "",
  ].filter(Boolean);
}
