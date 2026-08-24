import { NextResponse } from "next/server";

import { requireNuamiOperator } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import { createAsset, listAssets } from "@/lib/console-knowledge/service";
import {
  ASSET_DOMAINS,
  ASSET_SOURCE_TYPES,
  ASSET_STATUSES,
  isAssetDomain,
  isAssetSourceType,
  isAssetStatus,
} from "@/lib/console-knowledge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "";
  const domain = url.searchParams.get("domain") ?? "";
  const providerId = url.searchParams.get("providerId") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const rows = await listAssets({
    status: isAssetStatus(status) ? status : undefined,
    domain: isAssetDomain(domain) ? domain : undefined,
    providerId,
    q,
  });
  return NextResponse.json({
    ok: true,
    assets: rows,
    meta: { domains: ASSET_DOMAINS, sourceTypes: ASSET_SOURCE_TYPES, statuses: ASSET_STATUSES },
  });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title : "";
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  const domain = typeof body?.domain === "string" ? body.domain : "";
  const sourceType = typeof body?.sourceType === "string" ? body.sourceType : "TEXT";
  const contentText = typeof body?.contentText === "string" ? body.contentText : "";
  if (!title.trim() || !providerId || !isAssetDomain(domain) || !isAssetSourceType(sourceType)) {
    return NextResponse.json(
      { error: "INVALID", message: "제목·제공처·분야·자료유형을 확인해 주세요." },
      { status: 400 },
    );
  }
  try {
    const row = await createAsset({
      title,
      providerId,
      domain,
      region: typeof body?.region === "string" ? body.region : "",
      institutionId: typeof body?.institutionId === "string" ? body.institutionId : null,
      sourceType,
      contentText,
      sourceUrl: typeof body?.sourceUrl === "string" ? body.sourceUrl : null,
      fileName: typeof body?.fileName === "string" ? body.fileName : null,
      mimeType: typeof body?.mimeType === "string" ? body.mimeType : null,
      originalPublishedAt: parseDate(body?.originalPublishedAt) ?? null,
      originalUpdatedAt: parseDate(body?.originalUpdatedAt) ?? null,
      createdBy: auth.session.email,
    });
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "knowledge.asset.create",
      resourceType: "knowledge_asset",
      resourceId: row.id,
      metadata: { status: row.status },
    }).catch(() => {});
    return NextResponse.json({ ok: true, asset: row }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "등록에 실패했습니다.";
    return NextResponse.json({ error: "CREATE_FAILED", message }, { status: 400 });
  }
}
