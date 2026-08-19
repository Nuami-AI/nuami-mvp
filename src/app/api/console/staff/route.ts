import { NextResponse } from "next/server";

import { issueOrgStaffAccount } from "@/lib/auth/issue-org-staff";
import { requireNuamiOperator } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    organizationId?: unknown;
    email?: unknown;
    role?: unknown;
  } | null;

  const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";
  const email = typeof body?.email === "string" ? body.email : "";
  const role = typeof body?.role === "string" ? body.role : undefined;

  try {
    const issued = await issueOrgStaffAccount({ organizationId, email, role });
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      organizationId: issued.organizationId,
      action: "org.staff.issue",
      resourceType: "organization_member",
      resourceId: issued.email,
      metadata: { role: issued.role },
    }).catch(() => {});
    return NextResponse.json({
      ok: true,
      email: issued.email,
      organizationId: issued.organizationId,
      role: issued.role,
      tempPassword: issued.tempPassword,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "계정을 발급하지 못했습니다.";
    const status = /이미|올바른|등록되지/.test(message) ? 400 : 500;
    return NextResponse.json({ error: "ISSUE_FAILED", message }, { status });
  }
}
