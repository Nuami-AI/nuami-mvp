import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/access";
import {
  changeOrgStaffRole,
  deactivateOrgStaffMember,
  deleteOrgStaffMember,
  reactivateOrgStaffMember,
  resetOrgStaffPassword,
  STAFF_ROLES,
  TEMP_ORG_PASSWORD,
} from "@/lib/auth/issue-org-staff";
import { requireNuamiOperator } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string; memberId: string }> },
): Promise<Response> {
  const { orgId, memberId } = await context.params;
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { action?: unknown; role?: unknown } | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const actorIsSuperAdmin = isSuperAdmin(auth.session.email);

  try {
    if (action === "reset") {
      const result = await resetOrgStaffPassword(orgId, memberId);
      await writeAudit({
        actorEmail: auth.session.email,
        actorType: "INTERNAL",
        organizationId: orgId,
        action: "org.staff.password.reset",
        resourceType: "organization_member",
        resourceId: result.email,
      }).catch(() => {});
      return NextResponse.json({ ok: true, email: result.email, tempPassword: TEMP_ORG_PASSWORD });
    }
    if (action === "deactivate") {
      const result = await deactivateOrgStaffMember({
        organizationId: orgId,
        memberId,
        actorEmail: auth.session.email,
        actorIsSuperAdmin,
      });
      await writeAudit({
        actorEmail: auth.session.email,
        actorType: "INTERNAL",
        organizationId: orgId,
        action: "org.staff.deactivate",
        resourceType: "organization_member",
        resourceId: result.email,
      }).catch(() => {});
      return NextResponse.json({ ok: true, email: result.email });
    }
    if (action === "activate") {
      const result = await reactivateOrgStaffMember({
        organizationId: orgId,
        memberId,
      });
      await writeAudit({
        actorEmail: auth.session.email,
        actorType: "INTERNAL",
        organizationId: orgId,
        action: "org.staff.activate",
        resourceType: "organization_member",
        resourceId: result.email,
      }).catch(() => {});
      return NextResponse.json({ ok: true, email: result.email });
    }
    if (action === "delete") {
      const result = await deleteOrgStaffMember({
        organizationId: orgId,
        memberId,
        actorEmail: auth.session.email,
        actorIsSuperAdmin: true,
      });
      await writeAudit({
        actorEmail: auth.session.email,
        actorType: "INTERNAL",
        organizationId: orgId,
        action: "org.staff.delete",
        resourceType: "organization_member",
        resourceId: result.email,
      }).catch(() => {});
      return NextResponse.json({ ok: true, email: result.email });
    }
    if (action === "role") {
      const role = typeof body?.role === "string" ? body.role : "";
      const result = await changeOrgStaffRole({
        organizationId: orgId,
        memberId,
        role,
        actorEmail: auth.session.email,
        allowedRoles: STAFF_ROLES,
      });
      await writeAudit({
        actorEmail: auth.session.email,
        actorType: "INTERNAL",
        organizationId: orgId,
        action: "org.staff.role.change",
        resourceType: "organization_member",
        resourceId: result.email,
        metadata: { role: result.role },
      }).catch(() => {});
      return NextResponse.json({ ok: true, email: result.email, role: result.role });
    }
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "처리하지 못했습니다.";
    return NextResponse.json({ error: "STAFF_ACTION_FAILED", message }, { status: 400 });
  }
}
