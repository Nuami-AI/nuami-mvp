import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/access";
import {
  applyConsoleIpPolicyToAll,
  CONSOLE_IP_GLOBAL,
  deleteConsoleIpPolicy,
  normalizeIpList,
  upsertConsoleIpPolicy,
  type ConsoleIpMode,
} from "@/lib/auth/console-ip";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMode(value: unknown): ConsoleIpMode {
  return value === "allowlist" ? "allowlist" : "allow_all";
}

function parseIps(value: unknown): string[] {
  if (Array.isArray(value)) return normalizeIpList(value.map((item) => String(item)));
  if (typeof value === "string") return normalizeIpList(value);
  return [];
}

export async function PUT(request: Request): Promise<Response> {
  const auth = await requireSuperAdmin(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "save";
  const rawTarget = typeof body?.targetEmail === "string" ? body.targetEmail.trim().toLowerCase() : CONSOLE_IP_GLOBAL;
  const targetEmail = rawTarget || CONSOLE_IP_GLOBAL;
  const mode = parseMode(body?.mode);
  const allowOverseas = body?.allowOverseas !== false;
  const allowedIps = parseIps(body?.allowedIps);
  const actorEmail = auth.session.email;

  if (targetEmail !== CONSOLE_IP_GLOBAL && isSuperAdmin(targetEmail)) {
    return NextResponse.json({ error: "LOCKED", message: "슈퍼 어드민은 접속 제한을 걸 수 없습니다." }, { status: 400 });
  }

  try {
    if (action === "inherit") {
      if (targetEmail === CONSOLE_IP_GLOBAL) {
        return NextResponse.json({ error: "INVALID", message: "기본 정책은 삭제할 수 없습니다." }, { status: 400 });
      }
      await deleteConsoleIpPolicy(targetEmail);
      await writeAudit({
        actorEmail,
        actorType: "INTERNAL",
        action: "console.ip.policy.inherit",
        resourceType: "console_ip_policy",
        resourceId: targetEmail,
      }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (action === "apply_all") {
      await applyConsoleIpPolicyToAll({
        mode,
        allowOverseas,
        allowedIps,
        updatedBy: actorEmail,
      });
      await writeAudit({
        actorEmail,
        actorType: "INTERNAL",
        action: "console.ip.policy.apply_all",
        resourceType: "console_ip_policy",
        resourceId: CONSOLE_IP_GLOBAL,
        metadata: { mode, allowOverseas, allowedIps },
      }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    await upsertConsoleIpPolicy({
      targetEmail,
      mode,
      allowOverseas,
      allowedIps,
      updatedBy: actorEmail,
    });
    await writeAudit({
      actorEmail,
      actorType: "INTERNAL",
      action: "console.ip.policy.update",
      resourceType: "console_ip_policy",
      resourceId: targetEmail,
      metadata: { mode, allowOverseas, allowedIps },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "저장에 실패했습니다.";
    return NextResponse.json({ error: "SAVE_FAILED", message }, { status: 500 });
  }
}
