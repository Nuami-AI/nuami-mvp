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

export function isInternalAccount(role: SessionRole | string | null | undefined): boolean {
  return role === "admin";
}

export function staffCan(membershipRole: string | null | undefined, permission: OrgPermission): boolean {
  return hasOrgPermission(membershipRole, permission);
}

export function hasOrgPermission(membershipRole: string | null | undefined, permission: OrgPermission): boolean {
  const role = membershipRole ?? "";
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
