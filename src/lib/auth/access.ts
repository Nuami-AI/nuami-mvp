import type { SessionRole } from "./roles";

export type AccountType = "END_USER" | "ORG_STAFF" | "INTERNAL";
export type LoginAudience = "app" | "admin" | "console";
export type OrgPermission =
  | "dashboard"
  | "content.read"
  | "content.write"
  | "users.read"
  | "users.write"
  | "settings.write"
  | "analytics";

export function accountTypeOf(role: SessionRole | string): AccountType {
  return role === "admin" ? "INTERNAL" : "END_USER";
}

export const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL ?? "admin@nuami.kr").trim().toLowerCase();

export function isSuperAdmin(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function isInternalAccount(role: SessionRole | string | null | undefined): boolean {
  return role === "admin";
}

/** console.nuami.kr — INTERNAL (슈퍼어드민 + 추가한 콘솔 접근자). */
export function canAccessConsole(role: SessionRole | string | null | undefined): boolean {
  return isInternalAccount(role);
}

/** admin.nuami.kr — 기관 담당자 + admin@nuami.kr. 일반 콘솔 접근자·엔드유저 불가. */
export function canAccessInstitutionAdmin(input: {
  email: string;
  role: SessionRole | string | null | undefined;
  hasOrgMembership: boolean;
}): boolean {
  if (isSuperAdmin(input.email)) return true;
  if (isInternalAccount(input.role)) return false;
  return input.hasOrgMembership;
}

export function staffCan(membershipRole: string | null | undefined, permission: OrgPermission): boolean {
  return hasOrgPermission(membershipRole, permission);
}

export function hasOrgPermission(membershipRole: string | null | undefined, permission: OrgPermission): boolean {
  const role = membershipRole ?? "";
  if (role === "NUAMI_SUPER_ADMIN") return true;
  switch (permission) {
    case "dashboard":
    case "analytics":
    case "content.read":
      return ["ORG_OWNER", "ORG_ADMIN", "ORG_EDITOR", "ORG_VIEWER"].includes(role);
    case "content.write":
      return ["ORG_OWNER", "ORG_ADMIN", "ORG_EDITOR"].includes(role);
    case "users.read":
      return ["ORG_OWNER", "ORG_ADMIN", "ORG_VIEWER"].includes(role);
    case "users.write":
    case "settings.write":
      return ["ORG_OWNER", "ORG_ADMIN"].includes(role);
    default:
      return false;
  }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

export function sameOrganization(a: string, b: string): boolean {
  return a === b;
}
