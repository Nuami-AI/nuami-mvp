import { NextResponse } from "next/server";

import { SUPER_ADMIN_EMAIL } from "@/lib/auth/access";
import {
  issueConsoleOperator,
  listConsoleOperators,
  revokeConsoleOperator,
} from "@/lib/auth/issue-console-operator";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireSuperAdmin(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const rows = await listConsoleOperators();
  return NextResponse.json({
    ok: true,
    superAdmin: SUPER_ADMIN_EMAIL,
    operators: rows,
  });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireSuperAdmin(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  try {
    const issued = await issueConsoleOperator(email);
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "console.operator.issue",
      resourceType: "auth_user",
      resourceId: issued.email,
    }).catch(() => {});
    return NextResponse.json({ ok: true, ...issued });
  } catch (err) {
    const message = err instanceof Error ? err.message : "추가하지 못했습니다.";
    return NextResponse.json({ error: "ISSUE_FAILED", message }, { status: 400 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const auth = await requireSuperAdmin(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  try {
    await revokeConsoleOperator(email);
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "console.operator.revoke",
      resourceType: "auth_user",
      resourceId: email.trim().toLowerCase(),
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "회수하지 못했습니다.";
    return NextResponse.json({ error: "REVOKE_FAILED", message }, { status: 400 });
  }
}
