import { NextResponse, after } from "next/server";

import { requireOrgAccess } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import { prisma } from "@/lib/db";
import { UnsafeUrlError } from "@/lib/institution/fetch-page";
import {
  createInstitutionSource,
  listInstitutionSources,
  queueInstitutionLearn,
} from "@/lib/institution/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const auth = await requireOrgAccess(request, id, "read");
  if (auth.error) return auth.error;
  const sources = await listInstitutionSources(id);
  return NextResponse.json({ sources });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const auth = await requireOrgAccess(request, id, "write");
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const institution = await prisma.institution.findUnique({ where: { id } });
  if (!institution) {
    return NextResponse.json({ error: "INSTITUTION_NOT_FOUND" }, { status: 404 });
  }

  let label = "";
  let url = "";
  try {
    const body = (await request.json()) as { label?: unknown; url?: unknown };
    if (typeof body.label === "string") label = body.label;
    if (typeof body.url === "string") url = body.url;
  } catch {
    return NextResponse.json({ error: "INVALID_BODY", message: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  try {
    const source = await createInstitutionSource({
      institutionId: id,
      institutionName: institution.nameKo,
      label,
      url,
      uploadedBy: auth.session.email,
    });
    const job = queueInstitutionLearn({
      sourceId: source.id,
      institutionId: id,
      institutionName: institution.nameKo,
      label: source.label,
      url: source.url,
      uploadedBy: auth.session.email,
    });
    after(() => job);
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: auth.membershipRole === "NUAMI_SUPER_ADMIN" ? "INTERNAL" : "ORG_STAFF",
      organizationId: id,
      action: "content.source.create",
      resourceType: "institution_source",
      resourceId: source.id,
    }).catch(() => {});
    return NextResponse.json({ ok: true, source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "사이트를 저장하지 못했습니다.";
    const status = err instanceof UnsafeUrlError || /이미 등록|최대|이름을 입력|올바른 URL/.test(message)
      ? 400
      : 500;
    return NextResponse.json({ error: "SOURCE_FAILED", message }, { status });
  }
}
