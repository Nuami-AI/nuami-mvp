import { NextResponse } from "next/server";

import { requireNuamiOperator } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import { createOpinion, listOpinions } from "@/lib/console-knowledge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(request.url);
  const appliedParam = url.searchParams.get("applied");
  const assetId = url.searchParams.get("assetId") ?? undefined;
  const rows = await listOpinions({
    applied: appliedParam === "true" ? true : appliedParam === "false" ? false : undefined,
    assetId,
  });
  return NextResponse.json({ ok: true, opinions: rows });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const expertName = typeof body?.expertName === "string" ? body.expertName : "";
  const opinion = typeof body?.opinion === "string" ? body.opinion : "";
  if (!expertName.trim() || !opinion.trim()) {
    return NextResponse.json(
      { error: "INVALID", message: "전문가명과 검토 의견이 필요합니다." },
      { status: 400 },
    );
  }
  try {
    const receivedAt =
      typeof body?.receivedAt === "string" && body.receivedAt
        ? new Date(body.receivedAt)
        : undefined;
    const row = await createOpinion({
      expertName,
      affiliation: typeof body?.affiliation === "string" ? body.affiliation : "",
      domain: typeof body?.domain === "string" ? body.domain : "",
      assetId: typeof body?.assetId === "string" ? body.assetId : null,
      opinion,
      receivedAt: receivedAt && !Number.isNaN(receivedAt.getTime()) ? receivedAt : undefined,
      applied: body?.applied === true,
      internalMemo: typeof body?.internalMemo === "string" ? body.internalMemo : null,
      createdBy: auth.session.email,
    });
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "knowledge.opinion.create",
      resourceType: "expert_opinion",
      resourceId: row.id,
    }).catch(() => {});
    return NextResponse.json({ ok: true, opinion: row }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "등록에 실패했습니다.";
    return NextResponse.json({ error: "CREATE_FAILED", message }, { status: 400 });
  }
}
