import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/access";
import {
  INSTITUTION_MEMBER_ROLES,
  issueOrgStaffAccount,
  listVisibleOrgStaff,
} from "@/lib/auth/issue-org-staff";
import { requireOrgAccess } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const auth = await requireOrgAccess(request, id, "users.write");
  if (auth.error) return auth.error;

  const members = await listVisibleOrgStaff(id);
  return NextResponse.json({ members });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const auth = await requireOrgAccess(request, id, "users.write");
  if (auth.error || !auth.session) return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { email?: unknown; role?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const role = typeof body?.role === "string" ? body.role : "ORG_VIEWER";

  try {
    const issued = await issueOrgStaffAccount({
      organizationId: id,
      email,
      role,
      allowedRoles: INSTITUTION_MEMBER_ROLES,
      defaultRole: "ORG_VIEWER",
      preserveRoleOnReactivate: true,
    });
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: isSuperAdmin(auth.session.email) ? "INTERNAL" : "ORG_STAFF",
      organizationId: id,
      action: "org.staff.issue",
      resourceType: "organization_member",
      resourceId: issued.email,
      metadata: { role: issued.role },
    }).catch(() => {});
    return NextResponse.json({
      ok: true,
      email: issued.email,
      role: issued.role,
      tempPassword: issued.tempPassword,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "추가하지 못했습니다.";
    return NextResponse.json({ error: "ISSUE_FAILED", message }, { status: 400 });
  }
}
