import { NextResponse } from "next/server";

import { requireNuamiOperator } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import { deleteOpinion, updateOpinion } from "@/lib/console-knowledge/service";

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
    const receivedAt =
      typeof body?.receivedAt === "string" && body.receivedAt
        ? new Date(body.receivedAt)
        : undefined;
    const row = await updateOpinion(id, {
      ...(typeof body?.expertName === "string" ? { expertName: body.expertName } : {}),
      ...(typeof body?.affiliation === "string" ? { affiliation: body.affiliation } : {}),
      ...(typeof body?.domain === "string" ? { domain: body.domain } : {}),
      ...(body?.assetId === null || typeof body?.assetId === "string"
        ? { assetId: body.assetId as string | null }
        : {}),
      ...(typeof body?.opinion === "string" ? { opinion: body.opinion } : {}),
      ...(receivedAt && !Number.isNaN(receivedAt.getTime()) ? { receivedAt } : {}),
      ...(typeof body?.applied === "boolean" ? { applied: body.applied } : {}),
      ...(body?.internalMemo === null || typeof body?.internalMemo === "string"
        ? { internalMemo: body.internalMemo as string | null }
        : {}),
    });
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "knowledge.opinion.update",
      resourceType: "expert_opinion",
      resourceId: id,
    }).catch(() => {});
    return NextResponse.json({ ok: true, opinion: row });
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
    await deleteOpinion(id);
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "knowledge.opinion.delete",
      resourceType: "expert_opinion",
      resourceId: id,
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "삭제에 실패했습니다.";
    return NextResponse.json({ error: "DELETE_FAILED", message }, { status: 400 });
  }
}
