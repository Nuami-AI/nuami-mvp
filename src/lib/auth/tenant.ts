import { prisma } from "@/lib/db";
import { hasOrgPermission, type OrgPermission } from "@/lib/auth/access";
import { getInstitution, organizationSlugOf } from "@/lib/institution/catalog";

export async function getActiveStaffMembership(email: string, organizationId: string) {
  return prisma.organizationMember.findFirst({
    where: {
      organizationId,
      email: email.toLowerCase(),
      status: "ACTIVE",
    },
  });
}

export async function listActiveStaffOrganizations(email: string) {
  return prisma.organizationMember.findMany({
    where: { email: email.toLowerCase(), status: "ACTIVE" },
    select: { organizationId: true, role: true },
  });
}

export async function adminLandingPath(email: string): Promise<string> {
  const memberships = await listActiveStaffOrganizations(email);
  if (memberships.length === 1) {
    const org = getInstitution(memberships[0].organizationId);
    return org ? `/admin/${organizationSlugOf(org)}` : "/admin";
  }
  return "/admin";
}

export async function listActiveEndUsersByOrganization(organizationId: string) {
  return prisma.endUserOrganization.findMany({
    where: { organizationId, status: "ACTIVE" },
    orderBy: { joinedAt: "desc" },
  });
}

export async function getActiveEndUserInOrganization(membershipId: string, organizationId: string) {
  return prisma.endUserOrganization.findFirst({
    where: {
      id: membershipId,
      organizationId,
      status: "ACTIVE",
    },
  });
}

export async function setEndUserAffiliation(email: string, organizationId: string | null) {
  const normalized = email.toLowerCase();
  await prisma.endUserOrganization.updateMany({
    where: { email: normalized, status: "ACTIVE" },
    data: { status: "INACTIVE", leftAt: new Date() },
  });
  if (!organizationId) return;
  await prisma.endUserOrganization.upsert({
    where: { email_organizationId: { email: normalized, organizationId } },
    create: {
      email: normalized,
      organizationId,
      status: "ACTIVE",
      joinedAt: new Date(),
      leftAt: null,
    },
    update: { status: "ACTIVE", joinedAt: new Date(), leftAt: null },
  });
}

export function staffCan(role: string | null | undefined, permission: OrgPermission): boolean {
  return hasOrgPermission(role, permission);
}

export async function orgStaffMayAccess(
  email: string,
  organizationId: string,
  permission: OrgPermission,
): Promise<boolean> {
  const member = await getActiveStaffMembership(email, organizationId);
  return Boolean(member && hasOrgPermission(member.role, permission));
}

export async function writeAudit(input: {
  actorEmail: string;
  actorType: string;
  organizationId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: object;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorEmail: input.actorEmail.toLowerCase(),
      actorType: input.actorType,
      organizationId: input.organizationId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
