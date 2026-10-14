import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasOrgPermission, isInternalAccount, isSuperAdmin } from "@/lib/auth/access";
import { getSessionFromRequest, type SessionPayload } from "@/lib/auth/session";
import { getActiveStaffMembership, hasNuamiOrgAccess, listActiveStaffOrganizations } from "@/lib/auth/tenant";
import {
  findInstitutionByOrgSlug,
  isNuamiOrganization,
  schoolInstitutions,
  type InstitutionSeed,
} from "@/lib/institution/catalog";

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("nuami-session");
  if (!sessionCookie?.value) return null;
  const mockRequest = new Request("http://localhost", {
    headers: { cookie: `nuami-session=${sessionCookie.value}` },
  });
  return getSessionFromRequest(mockRequest);
}

export async function requireConsoleSession(): Promise<SessionPayload> {
  const session = await getSessionFromCookies();
  if (!session) redirect("/console/login?redirect=/console");
  if (!isInternalAccount(session.role)) redirect("/console/login?error=NOT_INTERNAL");
  return session;
}

export async function requireSuperAdminSession(): Promise<SessionPayload> {
  const session = await requireConsoleSession();
  if (!isSuperAdmin(session.email)) redirect("/console");
  return session;
}

export async function resolveOrgAccess(orgSlug: string): Promise<{
  session: SessionPayload;
  institution: InstitutionSeed;
  membershipRole: string;
}> {
  const session = await getSessionFromCookies();
  if (!session) redirect(`/admin/login?redirect=/admin/${encodeURIComponent(orgSlug)}`);
  if (session.mustChangePassword) redirect("/admin/password");

  if (isSuperAdmin(session.email) || (await hasNuamiOrgAccess(session.email))) {
    const institution = findInstitutionByOrgSlug(orgSlug);
    if (!institution || isNuamiOrganization(institution.id)) redirect("/admin");
    return {
      session,
      institution,
      membershipRole: isSuperAdmin(session.email) ? "NUAMI_SUPER_ADMIN" : "ORG_ADMIN",
    };
  }

  const institution = findInstitutionByOrgSlug(orgSlug);
  if (!institution || isNuamiOrganization(institution.id)) redirect("/admin/denied");

  const member = await getActiveStaffMembership(session.email, institution.id);
  if (!member || !hasOrgPermission(member.role, "dashboard")) redirect("/admin/denied");

  return { session, institution, membershipRole: member.role };
}

export async function listSessionOrganizations(session: SessionPayload): Promise<InstitutionSeed[]> {
  if (isSuperAdmin(session.email) || (await hasNuamiOrgAccess(session.email))) {
    return schoolInstitutions();
  }
  const rows = await listActiveStaffOrganizations(session.email);
  const ids = new Set(rows.map((row) => row.organizationId));
  return schoolInstitutions().filter((row) => ids.has(row.id));
}
