import { NextResponse } from "next/server";

import { resetAuthUserPassword } from "@/lib/auth/accounts";
import { TEMP_ORG_PASSWORD } from "@/lib/auth/issue-org-staff";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const auth = await requireSuperAdmin(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { action?: unknown; email?: unknown } | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const email = typeof body?.email === "string" ? body.email : "";

  if (action !== "reset") {
    return NextResponse.json({ error: "INVALID_ACTION", message: "지원하지 않는 작업입니다." }, { status: 400 });
  }

  try {
    const result = await resetAuthUserPassword(email, auth.session.email);
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "auth.user.password.reset",
      resourceType: "auth_user",
      resourceId: result.email,
    }).catch(() => {});
    return NextResponse.json({ ok: true, email: result.email, tempPassword: TEMP_ORG_PASSWORD });
  } catch (err) {
    const message = err instanceof Error ? err.message : "초기화하지 못했습니다.";
    return NextResponse.json({ error: "RESET_FAILED", message }, { status: 400 });
  }
}
