import { prisma } from "@/lib/db";
import { SUPER_ADMIN_EMAIL } from "@/lib/auth/access";
import { STAFF_ROLES, TEMP_ORG_PASSWORD } from "@/lib/auth/issue-org-staff";
import { setEndUserAffiliation } from "@/lib/auth/tenant";
import { getInstitution, isNuamiOrganization } from "@/lib/institution/catalog";
import { ensureOrganization } from "@/lib/institution/seed";
import { hashPassword, isValidAccountKey, isValidEmail, verifyPassword } from "@/lib/auth/password";
import { defaultCreditsLimit, resetCreditsUsed, resolveCreditsLimit } from "@/lib/usage/tracker";

export type AccountType = "END_USER" | "ORG_STAFF" | "INTERNAL";
export type AccountKind = "end" | "org" | "console";

const ACCOUNT_TYPES = new Set<AccountType>(["END_USER", "ORG_STAFF", "INTERNAL"]);
const ACCOUNT_KINDS = new Set<AccountKind>(["end", "org", "console"]);

function parseAccountType(value: string | null | undefined): AccountType | null {
  return ACCOUNT_TYPES.has(value as AccountType) ? (value as AccountType) : null;
}

export function kindsOfAccount(accountType: string, hasOrgStaff: boolean): AccountKind[] {
  const kinds: AccountKind[] = [];
  if (accountType === "INTERNAL") kinds.push("console");
  if (accountType === "ORG_STAFF" || hasOrgStaff) kinds.push("org");
  kinds.push("end");
  return kinds;
}

function primaryAccountType(kinds: Set<AccountKind>): AccountType {
  if (kinds.has("console")) return "INTERNAL";
  if (kinds.has("org")) return "ORG_STAFF";
  return "END_USER";
}

function parseKinds(input: { kinds?: unknown; accountType?: string }): Set<AccountKind> {
  const kinds = new Set<AccountKind>();
  if (Array.isArray(input.kinds)) {
    for (const value of input.kinds) {
      if (typeof value === "string" && ACCOUNT_KINDS.has(value as AccountKind)) {
        kinds.add(value as AccountKind);
      }
    }
  }
  if (kinds.size === 0) {
    const accountType = parseAccountType(input.accountType);
    if (accountType === "INTERNAL") kinds.add("console");
    else if (accountType === "ORG_STAFF") kinds.add("org");
    else if (accountType === "END_USER") kinds.add("end");
  }
  if (kinds.has("console")) {
    kinds.add("org");
    kinds.add("end");
  }
  if (kinds.size === 0) kinds.add("end");
  return kinds;
}

function assertCanGrantConsole(actorEmail: string, wantsConsole: boolean, alreadyConsole: boolean): void {
  if (wantsConsole && !alreadyConsole && actorEmail.trim().toLowerCase() !== SUPER_ADMIN_EMAIL) {
    throw new Error("콘솔 권한은 슈퍼 어드민만 부여할 수 있습니다.");
  }
}

async function syncTestAffiliation(email: string, affiliationId: string): Promise<void> {
  if (!affiliationId) {
    await setEndUserAffiliation(email, null);
    return;
  }
  if (!getInstitution(affiliationId) || isNuamiOrganization(affiliationId)) {
    throw new Error("등록되지 않은 대학입니다.");
  }
  await ensureOrganization(affiliationId);
  await setEndUserAffiliation(email, affiliationId);
}

async function syncOrgMembership(email: string, organizationId: string, orgRole?: string): Promise<void> {
  if (!getInstitution(organizationId)) throw new Error("등록되지 않은 기관입니다.");
  await ensureOrganization(organizationId);
  const role = orgRole && STAFF_ROLES.has(orgRole) ? orgRole : "ORG_ADMIN";
  await prisma.organizationMember.deleteMany({
    where: { email, organizationId: { not: organizationId } },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_email: { organizationId, email } },
    create: { organizationId, email, role, status: "ACTIVE" },
    update: { status: "ACTIVE", ...(orgRole && STAFF_ROLES.has(orgRole) ? { role } : {}) },
  });
}

function parseFlag(value: unknown): boolean {
  return value === true || value === "true";
}

function parseCreditsLimit(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1 || n > 10000) {
    throw new Error("크레딧은 1~10000 사이여야 합니다.");
  }
  return Math.floor(n);
}

function assertNotProtected(email: string, actorEmail: string, verb: string): void {
  const normalized = email.trim().toLowerCase();
  const actor = actorEmail.trim().toLowerCase();
  if (normalized === actor) throw new Error(`자기 계정은 ${verb}할 수 없습니다.`);
  if (normalized === SUPER_ADMIN_EMAIL) throw new Error(`슈퍼 어드민 계정은 ${verb}할 수 없습니다.`);
}

export interface Account {
  email: string;
  role: "admin" | "tester";
}

export function sessionRoleOf(accountType: string | null | undefined): Account["role"] {
  return accountType === "INTERNAL" ? "admin" : "tester";
}

/** Super-admin console: set temp password 1234 and require change on next login. */
export async function resetAuthUserPassword(email: string, actorEmail: string): Promise<{ email: string; tempPassword: string }> {
  const normalized = email.trim().toLowerCase();
  const actor = actorEmail.trim().toLowerCase();
  if (!isValidAccountKey(normalized)) throw new Error("올바른 계정을 입력하세요.");
  if (normalized === actor) throw new Error("자기 계정은 초기화할 수 없습니다.");

  const user = await prisma.authUser.findUnique({ where: { email: normalized } });
  if (!user) throw new Error("계정을 찾을 수 없습니다.");
  if (user.status !== "ACTIVE") throw new Error("비활성화된 계정은 초기화할 수 없습니다.");

  const tempPassword = user.isTest ? normalized : TEMP_ORG_PASSWORD;
  await prisma.authUser.update({
    where: { email: normalized },
    data: {
      passwordHash: hashPassword(tempPassword),
      passwordMustChange: !user.isTest,
    },
  });
  return { email: user.email, tempPassword };
}

export async function createManagedAccount(input: {
  actorEmail: string;
  email: string;
  accountType?: string;
  kinds?: unknown;
  organizationId?: string;
  orgRole?: string;
  creditsLimit?: unknown;
  isTest?: unknown;
  affiliationId?: string;
}): Promise<{ email: string; tempPassword: string; accountType: AccountType }> {
  const email = input.email.trim().toLowerCase();
  const isTest = parseFlag(input.isTest);
  if (isTest) {
    if (!isValidAccountKey(email)) throw new Error("아이디를 입력하세요. 공백은 쓸 수 없습니다.");
  } else if (!isValidEmail(email)) {
    throw new Error("올바른 이메일을 입력하세요. 이메일이 아니면 테스트용으로 추가하세요.");
  }
  const kinds = parseKinds({ kinds: input.kinds, accountType: input.accountType });
  assertCanGrantConsole(input.actorEmail, kinds.has("console"), false);
  const accountType = primaryAccountType(kinds);
  const creditsLimit = parseCreditsLimit(input.creditsLimit) ?? defaultCreditsLimit();
  const passwordMustChange = !isTest;
  const organizationId = input.organizationId?.trim() ?? "";
  if (kinds.has("org") && !organizationId) throw new Error("기관을 선택하세요.");

  const existing = await prisma.authUser.findUnique({ where: { email } });
  if (existing) throw new Error("이미 등록된 계정입니다.");

  const tempPassword = isTest ? email : TEMP_ORG_PASSWORD;
  await prisma.authUser.create({
    data: {
      email,
      passwordHash: hashPassword(tempPassword),
      status: "ACTIVE",
      accountType,
      passwordMustChange,
      isTest,
      creditsLimit,
    },
  });
  if (kinds.has("org")) await syncOrgMembership(email, organizationId, input.orgRole);
  if (isTest) await syncTestAffiliation(email, input.affiliationId?.trim() ?? "");
  return { email, tempPassword, accountType };
}

export async function updateManagedAccount(input: {
  actorEmail: string;
  email: string;
  accountType?: string;
  kinds?: unknown;
  organizationId?: string;
  orgRole?: string;
  creditsLimit?: unknown;
  isTest?: unknown;
  affiliationId?: string;
}): Promise<{ email: string }> {
  const email = input.email.trim().toLowerCase();
  if (!isValidAccountKey(email)) throw new Error("올바른 계정을 입력하세요.");
  const user = await prisma.authUser.findUnique({ where: { email } });
  if (!user) throw new Error("계정을 찾을 수 없습니다.");
  const kinds = parseKinds({
    kinds: input.kinds,
    accountType: input.accountType ?? user.accountType,
  });
  if (email === SUPER_ADMIN_EMAIL && !kinds.has("console")) {
    throw new Error("슈퍼 어드민 계정 구분은 바꿀 수 없습니다.");
  }
  assertCanGrantConsole(input.actorEmail, kinds.has("console"), user.accountType === "INTERNAL");
  const accountType = primaryAccountType(kinds);
  const creditsLimit =
    input.creditsLimit === undefined ? undefined : parseCreditsLimit(input.creditsLimit) ?? defaultCreditsLimit();
  const isTest = input.isTest === undefined ? user.isTest : parseFlag(input.isTest);
  const passwordHash = user.passwordHash;
  const usingTempPassword = passwordHash ? verifyPassword(TEMP_ORG_PASSWORD, passwordHash) : false;
  const organizationId = input.organizationId?.trim() ?? "";
  if (kinds.has("org") && !organizationId) throw new Error("기관을 선택하세요.");

  if (kinds.has("org")) await syncOrgMembership(email, organizationId, input.orgRole);
  else await prisma.organizationMember.deleteMany({ where: { email } });
  if (isTest && input.affiliationId !== undefined) {
    await syncTestAffiliation(email, input.affiliationId.trim());
  }

  await prisma.authUser.update({
    where: { email },
    data: {
      accountType,
      status: "ACTIVE",
      isTest,
      passwordMustChange: isTest ? false : user.passwordMustChange && usingTempPassword,
      ...(isTest && !user.isTest ? { passwordHash: hashPassword(email) } : {}),
      ...(creditsLimit != null ? { creditsLimit } : {}),
    },
  });
  return { email };
}

export async function setManagedAccountStatus(input: {
  actorEmail: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
}): Promise<{ email: string; status: string }> {
  const email = input.email.trim().toLowerCase();
  assertNotProtected(email, input.actorEmail, input.status === "INACTIVE" ? "비활성화" : "변경");
  const user = await prisma.authUser.findUnique({ where: { email } });
  if (!user) throw new Error("계정을 찾을 수 없습니다.");
  await prisma.authUser.update({ where: { email }, data: { status: input.status } });
  await prisma.organizationMember.updateMany({
    where: { email },
    data: { status: input.status },
  });
  return { email, status: input.status };
}

export async function deleteManagedAccount(input: {
  actorEmail: string;
  email: string;
}): Promise<{ email: string }> {
  const email = input.email.trim().toLowerCase();
  assertNotProtected(email, input.actorEmail, "삭제");
  const user = await prisma.authUser.findUnique({ where: { email } });
  if (!user) throw new Error("계정을 찾을 수 없습니다.");
  await prisma.$transaction([
    prisma.organizationMember.deleteMany({ where: { email } }),
    prisma.endUserOrganization.deleteMany({ where: { email } }),
    prisma.usageEvent.deleteMany({ where: { userEmail: email } }),
    prisma.authChallenge.deleteMany({ where: { email } }),
    prisma.authUser.delete({ where: { email } }),
  ]);
  return { email };
}

export async function setManagedAccountCredits(input: {
  actorEmail: string;
  email: string;
  creditsLimit: unknown;
  resetUsed?: boolean;
}): Promise<{ email: string; creditsLimit: number; creditsUsed: number }> {
  const email = input.email.trim().toLowerCase();
  if (!isValidAccountKey(email)) throw new Error("올바른 계정을 입력하세요.");
  const user = await prisma.authUser.findUnique({ where: { email } });
  if (!user) throw new Error("계정을 찾을 수 없습니다.");
  const creditsLimit = parseCreditsLimit(input.creditsLimit) ?? defaultCreditsLimit();
  if (input.resetUsed) {
    await resetCreditsUsed(email);
  }
  await prisma.authUser.update({ where: { email }, data: { creditsLimit } });
  const creditsUsed = await prisma.usageEvent.count({ where: { userEmail: email, action: "video_ai_use" } });
  return { email, creditsLimit: resolveCreditsLimit(creditsLimit), creditsUsed };
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
  const usingTempPassword = verifyPassword(TEMP_ORG_PASSWORD, user.passwordHash);
  const mustChangePassword = user.passwordMustChange && !user.isTest && usingTempPassword;
  await prisma.authUser.update({
    where: { email: normalized },
    data: {
      lastLoginAt: new Date(),
      ...(user.passwordMustChange && !mustChangePassword ? { passwordMustChange: false } : {}),
    },
  });
  return {
    ok: true,
    account: { email: user.email, role: sessionRoleOf(user.accountType) },
    mustChangePassword,
  };
}

export async function listAppUserEmails(): Promise<string[]> {
  const rows = await listUsageAccounts();
  return rows.map((row) => row.email);
}

export type UsageAccountKind = "org" | "end" | "console";

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
    select: { email: true, accountType: true },
    orderBy: { createdAt: "asc" },
  });
  if (users.length === 0) return [];
  const staffEmails = await activeOrgStaffEmails();
  return users.map((row) => ({
    email: row.email,
    kind: accountKindOf(row.accountType, staffEmails.has(row.email.toLowerCase())),
  }));
}
