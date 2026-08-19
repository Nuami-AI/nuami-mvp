import { NextResponse } from "next/server";

import { isInternalAccount, isSuperAdmin, staffCan, type OrgPermission } from "@/lib/auth/access";
import { getActiveStaffMembership, listActiveStaffOrganizations, writeAudit } from "@/lib/auth/tenant";
import { getSessionFromRequest, type SessionPayload } from "@/lib/auth/session";

const FORBIDDEN = NextResponse.json({ error: "FORBIDDEN", message: "접근 권한이 없습니다." }, { status: 403 });
const UNAUTHORIZED = NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

export async function requireNuamiOperator(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return { session: null, error: UNAUTHORIZED };
  if (!isInternalAccount(session.role)) return { session: null, error: FORBIDDEN };
  return { session, error: null };
}

/** @deprecated use requireNuamiOperator */
export const requireAdmin = requireNuamiOperator;

export async function requireSuperAdmin(request: Request) {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) return auth;
  if (!isSuperAdmin(auth.session.email)) return { session: null, error: FORBIDDEN };
  return auth;
}

export async function requireOrgAccess(
  request: Request,
  organizationId: string,
  permission: OrgPermission | "read" | "write" = "read",
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return { session: null, membershipRole: null as string | null, error: UNAUTHORIZED };
  }

  const mapped: OrgPermission =
    permission === "write" ? "content.write" : permission === "read" ? "content.read" : permission;

  if (isSuperAdmin(session.email)) {
    await writeAudit({
      actorEmail: session.email,
      actorType: "INTERNAL",
      organizationId,
      action: "org.access",
      resourceType: "organization",
      resourceId: organizationId,
      metadata: { permission: mapped, via: "super-admin" },
    }).catch(() => {});
    return { session, membershipRole: "NUAMI_SUPER_ADMIN", error: null };
  }

  const member = await getActiveStaffMembership(session.email, organizationId);
  if (!member || !staffCan(member.role, mapped)) {
    return { session: null, membershipRole: member?.role ?? null, error: FORBIDDEN };
  }
  return { session, membershipRole: member.role, error: null };
}

export async function listAccessibleOrganizationIds(session: SessionPayload): Promise<string[] | "all"> {
  if (isSuperAdmin(session.email)) return "all";
  const rows = await listActiveStaffOrganizations(session.email);
  return rows.map((row) => row.organizationId);
}
