import { NextResponse } from "next/server";

import { requireNuamiOperator } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import { deleteProvider, updateProvider } from "@/lib/console-knowledge/service";
import { isProviderType } from "@/lib/console-knowledge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    const row = await updateProvider(id, {
      ...(typeof body?.name === "string" ? { name: body.name } : {}),
      ...(typeof body?.type === "string" && isProviderType(body.type) ? { type: body.type } : {}),
      ...(typeof body?.domain === "string" ? { domain: body.domain } : {}),
      ...(typeof body?.region === "string" ? { region: body.region } : {}),
      ...(body?.description === null || typeof body?.description === "string"
        ? { description: body.description as string | null }
        : {}),
      ...(body?.status === "ACTIVE" || body?.status === "INACTIVE" ? { status: body.status } : {}),
    });
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "knowledge.provider.update",
      resourceType: "knowledge_provider",
      resourceId: id,
    }).catch(() => {});
    return NextResponse.json({ ok: true, provider: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "수정에 실패했습니다.";
    return NextResponse.json({ error: "UPDATE_FAILED", message }, { status: 400 });
  }
}

export async function DELETE(request: Request, ctx: Ctx): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await deleteProvider(id);
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "knowledge.provider.delete",
      resourceType: "knowledge_provider",
      resourceId: id,
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "삭제에 실패했습니다.";
    return NextResponse.json({ error: "DELETE_FAILED", message }, { status: 400 });
  }
}
