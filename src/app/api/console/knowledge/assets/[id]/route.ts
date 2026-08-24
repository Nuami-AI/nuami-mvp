import { NextResponse } from "next/server";

import { requireNuamiOperator } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import {
  deleteAsset,
  getAsset,
  transitionAssetStatus,
  updateAsset,
} from "@/lib/console-knowledge/service";
import {
  isAssetDomain,
  isAssetSourceType,
  isAssetStatus,
} from "@/lib/console-knowledge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: Request, ctx: Ctx): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const row = await getAsset(id);
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, asset: row });
}

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  // Status transition
  if (typeof body?.status === "string" && isAssetStatus(body.status) && body?.action === "status") {
    try {
      const row = await transitionAssetStatus({
        id,
        status: body.status,
        actorEmail: auth.session.email,
        reviewMemo: typeof body.reviewMemo === "string" ? body.reviewMemo : undefined,
      });
      await writeAudit({
        actorEmail: auth.session.email,
        actorType: "INTERNAL",
        action: "knowledge.asset.status",
        resourceType: "knowledge_asset",
        resourceId: id,
        metadata: { status: row.status },
      }).catch(() => {});
      return NextResponse.json({ ok: true, asset: row });
    } catch (err) {
      const message = err instanceof Error ? err.message : "상태 변경에 실패했습니다.";
      return NextResponse.json({ error: "STATUS_FAILED", message }, { status: 400 });
    }
  }

  try {
    const row = await updateAsset(
      id,
      {
        ...(typeof body?.title === "string" ? { title: body.title } : {}),
        ...(typeof body?.providerId === "string" ? { providerId: body.providerId } : {}),
        ...(typeof body?.domain === "string" && isAssetDomain(body.domain)
          ? { domain: body.domain }
          : {}),
        ...(typeof body?.region === "string" ? { region: body.region } : {}),
        ...(body?.institutionId === null || typeof body?.institutionId === "string"
          ? { institutionId: body.institutionId as string | null }
          : {}),
        ...(typeof body?.sourceType === "string" && isAssetSourceType(body.sourceType)
          ? { sourceType: body.sourceType }
          : {}),
        ...(typeof body?.contentText === "string" ? { contentText: body.contentText } : {}),
        ...(body?.sourceUrl === null || typeof body?.sourceUrl === "string"
          ? { sourceUrl: body.sourceUrl as string | null }
          : {}),
        ...(body?.reviewMemo === null || typeof body?.reviewMemo === "string"
          ? { reviewMemo: body.reviewMemo as string | null }
          : {}),
        ...(parseDate(body?.originalPublishedAt) !== undefined
          ? { originalPublishedAt: parseDate(body?.originalPublishedAt)! }
          : {}),
        ...(parseDate(body?.originalUpdatedAt) !== undefined
          ? { originalUpdatedAt: parseDate(body?.originalUpdatedAt)! }
          : {}),
      },
      auth.session.email,
    );
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "knowledge.asset.update",
      resourceType: "knowledge_asset",
      resourceId: id,
      metadata: { version: row.version, status: row.status },
    }).catch(() => {});
    return NextResponse.json({ ok: true, asset: row });
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
    await deleteAsset(id);
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "knowledge.asset.delete",
      resourceType: "knowledge_asset",
      resourceId: id,
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "삭제에 실패했습니다.";
    return NextResponse.json({ error: "DELETE_FAILED", message }, { status: 400 });
  }
}
