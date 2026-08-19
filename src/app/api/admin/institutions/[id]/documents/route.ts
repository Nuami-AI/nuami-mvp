import { NextResponse } from "next/server";

import { requireOrgAccess } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";
import { prisma } from "@/lib/db";
import { parseJsonArray, type KnowledgeCategory } from "@/lib/institution/catalog";
import { ingestInstitutionDocument } from "@/lib/institution/ingest";
import { extractDocumentText } from "@/lib/institution/pdf";
import { ensureInstitutions } from "@/lib/institution/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = new Set<KnowledgeCategory>(["orientation", "academic", "living-tips", "admin"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const auth = await requireOrgAccess(request, id, "read");
  if (auth.error) return auth.error;
  const documents = await prisma.institutionDocument.findMany({
    where: { institutionId: id },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      title: true,
      category: true,
      fileName: true,
      mimeType: true,
      status: true,
      errorMessage: true,
      uploadedBy: true,
      createdAt: true,
    },
  });
  const knowledge = await prisma.institutionKnowledge.findMany({
    where: { institutionId: id },
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: {
      id: true,
      title: true,
      category: true,
      summary: true,
      factsJson: true,
      documentsJson: true,
      whereToJson: true,
      keywordsJson: true,
      source: true,
      verified: true,
      publicDataNote: true,
      documentId: true,
      createdAt: true,
      updatedAt: true,
      document: {
        select: {
          id: true,
          title: true,
          fileName: true,
          mimeType: true,
        },
      },
    },
  });

  return NextResponse.json({
    documents: documents.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      fileName: row.fileName,
      mimeType: row.mimeType,
      status: row.status,
      errorMessage: row.errorMessage,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt,
    })),
    knowledge: knowledge.map((row) => ({
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
      documentId: row.documentId,
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
    })),
  });
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
  await ensureInstitutions();
  const institution = await prisma.institution.findUnique({ where: { id } });
  if (!institution) {
    return NextResponse.json({ error: "INSTITUTION_NOT_FOUND" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const title = typeof form.get("title") === "string" ? form.get("title") as string : "";
  const categoryRaw = typeof form.get("category") === "string" ? form.get("category") as string : "orientation";
  const category: KnowledgeCategory = CATEGORIES.has(categoryRaw as KnowledgeCategory)
    ? (categoryRaw as KnowledgeCategory)
    : "orientation";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText = "";
  try {
    extractedText = await extractDocumentText({ name: file.name, type: file.type, buffer });
  } catch (err) {
    return NextResponse.json({
      error: "PARSE_FAILED",
      message: err instanceof Error ? err.message : "파일을 읽지 못했습니다.",
    }, { status: 400 });
  }

  if (extractedText.length < 40) {
    return NextResponse.json({ error: "TEXT_TOO_SHORT" }, { status: 400 });
  }

  const document = await prisma.institutionDocument.create({
    data: {
      institutionId: id,
      title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
      category,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      extractedText,
      status: "processing",
      uploadedBy: auth.session.email,
    },
  });

  try {
    const count = await ingestInstitutionDocument({
      documentId: document.id,
      institutionId: id,
      institutionName: institution.nameKo,
      category,
      fileName: file.name,
      text: extractedText,
    });
    await writeAudit({
      actorEmail: auth.session.email,
      actorType: auth.membershipRole === "NUAMI_SUPER_ADMIN" ? "INTERNAL" : "ORG_STAFF",
      organizationId: id,
      action: "content.upload",
      resourceType: "institution_document",
      resourceId: document.id,
    }).catch(() => {});
    return NextResponse.json({ ok: true, documentId: document.id, knowledgeCount: count });
  } catch (err) {
    await prisma.institutionDocument.update({
      where: { id: document.id },
      data: {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "AI 판독에 실패했습니다.",
      },
    });
    return NextResponse.json({
      error: "INGEST_FAILED",
      message: err instanceof Error ? err.message : "AI 판독에 실패했습니다.",
    }, { status: 500 });
  }
}
