import { isInternalAccount } from "@/lib/auth/access";

export type SessionRole = "admin" | "tester";

export type NuamiRole =
  | "NUAMI_SUPER_ADMIN"
  | "NUAMI_OPERATOR"
  | "ORG_OWNER"
  | "ORG_ADMIN"
  | "ORG_EDITOR"
  | "ORG_VIEWER"
  | "USER";

export function isNuamiOperator(role: SessionRole | string | null | undefined): boolean {
  return isInternalAccount(role);
}

export const ORG_WRITE_ROLES = new Set<string>(["ORG_OWNER", "ORG_ADMIN", "ORG_EDITOR"]);
export const ORG_READ_ROLES = new Set<string>(["ORG_OWNER", "ORG_ADMIN", "ORG_EDITOR", "ORG_VIEWER"]);
