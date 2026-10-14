import { NextResponse } from "next/server";

import {
  createManagedAccount,
  deleteManagedAccount,
  resetAuthUserPassword,
  setManagedAccountCredits,
  setManagedAccountStatus,
  updateManagedAccount,
} from "@/lib/auth/accounts";
import { TEMP_ORG_PASSWORD } from "@/lib/auth/issue-org-staff";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function audit(actorEmail: string, action: string, resourceId: string) {
  await writeAudit({
    actorEmail,
    actorType: "INTERNAL",
    action,
    resourceType: "auth_user",
    resourceId,
  }).catch(() => {});
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireSuperAdmin(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const email = typeof body?.email === "string" ? body.email : "";
  const actorEmail = auth.session.email;

  try {
    if (action === "create") {
      const result = await createManagedAccount({
        actorEmail,
        email,
        accountType: typeof body?.accountType === "string" ? body.accountType : "",
        kinds: body?.kinds,
        organizationId: typeof body?.organizationId === "string" ? body.organizationId : "",
        orgRole: typeof body?.orgRole === "string" ? body.orgRole : "",
        creditsLimit: body?.creditsLimit,
        isTest: typeof body?.isTest === "boolean" ? body.isTest : undefined,
      });
      await audit(actorEmail, "auth.user.create", result.email);
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "update") {
      const result = await updateManagedAccount({
        actorEmail,
        email,
        accountType: typeof body?.accountType === "string" ? body.accountType : undefined,
        kinds: body?.kinds,
        organizationId: typeof body?.organizationId === "string" ? body.organizationId : undefined,
        orgRole: typeof body?.orgRole === "string" ? body.orgRole : undefined,
        creditsLimit: body?.creditsLimit,
        isTest: typeof body?.isTest === "boolean" ? body.isTest : undefined,
      });
      await audit(actorEmail, "auth.user.update", result.email);
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "reset") {
      const result = await resetAuthUserPassword(email, actorEmail);
      await audit(actorEmail, "auth.user.password.reset", result.email);
      return NextResponse.json({ ok: true, email: result.email, tempPassword: TEMP_ORG_PASSWORD });
    }
    if (action === "deactivate") {
      const result = await setManagedAccountStatus({ actorEmail, email, status: "INACTIVE" });
      await audit(actorEmail, "auth.user.deactivate", result.email);
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "activate") {
      const result = await setManagedAccountStatus({ actorEmail, email, status: "ACTIVE" });
      await audit(actorEmail, "auth.user.activate", result.email);
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "delete") {
      const result = await deleteManagedAccount({ actorEmail, email });
      await audit(actorEmail, "auth.user.delete", result.email);
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "credits") {
      const result = await setManagedAccountCredits({
        actorEmail,
        email,
        creditsLimit: body?.creditsLimit,
        resetUsed: body?.resetUsed === true,
      });
      await audit(actorEmail, "auth.user.credits.update", result.email);
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json({ error: "INVALID_ACTION", message: "지원하지 않는 작업입니다." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "처리하지 못했습니다.";
    return NextResponse.json({ error: "ACCOUNT_ACTION_FAILED", message }, { status: 400 });
  }
}
