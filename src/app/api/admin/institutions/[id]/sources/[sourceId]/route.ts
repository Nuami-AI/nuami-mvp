import { NextResponse, after } from "next/server";

import { requireOrgAccess } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import { prisma } from "@/lib/db";
import { UnsafeUrlError } from "@/lib/institution/fetch-page";
import {
  deleteInstitutionSource,
  queueInstitutionLearn,
  relearnInstitutionSource,
} from "@/lib/institution/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; sourceId: string }> },
): Promise<Response> {
  const { id, sourceId } = await context.params;
  const auth = await requireOrgAccess(request, id, "write");
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const institution = await prisma.institution.findUnique({ where: { id } });
  if (!institution) {
    return NextResponse.json({ error: "INSTITUTION_NOT_FOUND" }, { status: 404 });
  }

  try {
    const source = await relearnInstitutionSource({
      sourceId,
      institutionId: id,
      institutionName: institution.nameKo,
      uploadedBy: auth.session.email,
    });
    const job = queueInstitutionLearn({
      sourceId: source.id,
      institutionId: id,
      institutionName: institution.nameKo,
      label: source.label,
      url: source.url,
      uploadedBy: auth.session.email,
      continueFromExisting: true,
    });
    after(() => job);
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: auth.membershipRole === "NUAMI_SUPER_ADMIN" ? "INTERNAL" : "ORG_STAFF",
      organizationId: id,
      action: "content.source.learn",
      resourceType: "institution_source",
      resourceId: source.id,
    }).catch(() => {});
    return NextResponse.json({ ok: true, source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "다시 학습하지 못했습니다.";
    const status = err instanceof UnsafeUrlError || /찾을 수 없습니다/.test(message) ? 400 : 500;
    return NextResponse.json({ error: "LEARN_FAILED", message }, { status });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; sourceId: string }> },
): Promise<Response> {
  const { id, sourceId } = await context.params;
  const auth = await requireOrgAccess(request, id, "write");
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  await deleteInstitutionSource(id, sourceId);
  await writeAudit({
    actorEmail: auth.session.email,
    actorType: auth.membershipRole === "NUAMI_SUPER_ADMIN" ? "INTERNAL" : "ORG_STAFF",
    organizationId: id,
    action: "content.source.delete",
    resourceType: "institution_source",
    resourceId: sourceId,
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
