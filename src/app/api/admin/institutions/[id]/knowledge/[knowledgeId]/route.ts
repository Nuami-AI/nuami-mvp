import { NextResponse } from "next/server";

import { requireOrgAccess } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/institution/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; knowledgeId: string }> },
): Promise<Response> {
  const { id, knowledgeId } = await context.params;
  const auth = await requireOrgAccess(request, id, "read");
  if (auth.error) return auth.error;

  const row = await prisma.institutionKnowledge.findFirst({
    where: { id: knowledgeId, institutionId: id },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          fileName: true,
          mimeType: true,
          extractedText: true,
          createdAt: true,
        },
      },
    },
  });
  if (!row) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const sourceText = row.document?.extractedText ?? "";
  return NextResponse.json({
    knowledge: {
      id: row.id,
      title: row.title,
      category: row.category,
      summary: row.summary,
      facts: parseJsonArray(row.factsJson),
      documents: parseJsonArray(row.documentsJson),
      whereTo: parseJsonArray(row.whereToJson),
      keywords: parseJsonArray(row.keywordsJson),
      source: row.source,
      verified: row.verified,
      publicDataNote: row.publicDataNote,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      origin: row.document
        ? {
            id: row.document.id,
            title: row.document.title,
            fileName: row.document.fileName,
            mimeType: row.document.mimeType,
          }
        : null,
      sourceExcerpt: sourceText.slice(0, 8000),
      sourceTruncated: sourceText.length > 8000,
    },
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; knowledgeId: string }> },
): Promise<Response> {
  const { id, knowledgeId } = await context.params;
  const auth = await requireOrgAccess(request, id, "write");
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const row = await prisma.institutionKnowledge.findFirst({
    where: { id: knowledgeId, institutionId: id },
    select: { id: true },
  });
  if (!row) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.institutionKnowledge.delete({ where: { id: row.id } });
  await writeAudit({
    actorEmail: auth.session.email,
    actorType: auth.membershipRole === "NUAMI_SUPER_ADMIN" ? "INTERNAL" : "ORG_STAFF",
    organizationId: id,
    action: "content.knowledge.delete",
    resourceType: "institution_knowledge",
    resourceId: row.id,
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
