import { NextResponse } from "next/server";

import { requireNuamiOperator } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import { createProvider, listProviders } from "@/lib/console-knowledge/service";
import {
  isProviderType,
  PROVIDER_STATUSES,
  PROVIDER_TYPES,
} from "@/lib/console-knowledge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const rows = await listProviders({
    status: status === "ACTIVE" || status === "INACTIVE" ? status : undefined,
  });
  return NextResponse.json({
    ok: true,
    providers: rows,
    meta: { types: PROVIDER_TYPES, statuses: PROVIDER_STATUSES },
  });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name : "";
  const type = typeof body?.type === "string" ? body.type : "";
  if (!name.trim()) {
    return NextResponse.json({ error: "INVALID", message: "제공처명이 필요합니다." }, { status: 400 });
  }
  if (!isProviderType(type)) {
    return NextResponse.json({ error: "INVALID", message: "유형이 올바르지 않습니다." }, { status: 400 });
  }
  try {
    const row = await createProvider({
      name,
      type,
      domain: typeof body?.domain === "string" ? body.domain : "",
      region: typeof body?.region === "string" ? body.region : "",
      description: typeof body?.description === "string" ? body.description : undefined,
      status: body?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: "INTERNAL",
      action: "knowledge.provider.create",
      resourceType: "knowledge_provider",
      resourceId: row.id,
    }).catch(() => {});
    return NextResponse.json({ ok: true, provider: row }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "생성에 실패했습니다.";
    return NextResponse.json({ error: "CREATE_FAILED", message }, { status: 400 });
  }
}
