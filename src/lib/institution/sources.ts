import { prisma } from "@/lib/db";
import type { KnowledgeCategory } from "./catalog";
import { crawlOfficialSite, parsePublicHttpUrl, UnsafeUrlError } from "./fetch-page";
import { ingestInstitutionDocument, persistExtractedKnowledge, extractKnowledgeFromText } from "./ingest";

const MAX_SOURCES = 8;
const OFFICIAL_SOURCES = ["upload", "website"] as const;
const CRAWL_UPLOAD_PREFIX = "crawl:";

export interface InstitutionSourceRow {
  id: string;
  label: string;
  url: string;
  status: string;
  errorMessage?: string | null;
  lastFetchedAt?: string | null;
  createdAt: string;
  pageCount?: number;
}

function crawlUploadedBy(sourceId: string): string {
  return `${CRAWL_UPLOAD_PREFIX}${sourceId}`;
}

function toRow(row: {
  id: string;
  label: string;
  url: string;
  status: string;
  errorMessage: string | null;
  lastFetchedAt: Date | null;
  createdAt: Date;
}, pageCount?: number): InstitutionSourceRow {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    status: row.status,
    errorMessage: row.errorMessage,
    lastFetchedAt: row.lastFetchedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    pageCount,
  };
}

export async function listInstitutionSources(institutionId: string): Promise<InstitutionSourceRow[]> {
  const rows = await prisma.institutionSource.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
    take: MAX_SOURCES,
  });
  const crawlCounts = await prisma.institutionDocument.groupBy({
    by: ["uploadedBy"],
    where: {
      institutionId,
      uploadedBy: { in: rows.map((row) => crawlUploadedBy(row.id)) },
    },
    _count: { _all: true },
  });
  const countByUploader = new Map(crawlCounts.map((row) => [row.uploadedBy, row._count._all]));
  return rows.map((row) => {
    const extra = countByUploader.get(crawlUploadedBy(row.id)) ?? 0;
    const seed = row.documentId ? 1 : 0;
    return toRow(row, seed + extra);
  });
}

export function normalizeOfficialUrl(raw: string): string {
  const parsed = parsePublicHttpUrl(raw);
  parsed.hash = "";
  return parsed.href;
}

export async function createInstitutionSource(input: {
  institutionId: string;
  institutionName: string;
  label: string;
  url: string;
  uploadedBy: string;
}): Promise<InstitutionSourceRow> {
  const label = input.label.trim().slice(0, 80);
  if (label.length < 2) {
    throw new Error("사이트 이름을 입력하세요.");
  }
  const url = normalizeOfficialUrl(input.url);
  const count = await prisma.institutionSource.count({ where: { institutionId: input.institutionId } });
  if (count >= MAX_SOURCES) {
    throw new Error(`공식 사이트는 기관당 최대 ${MAX_SOURCES}개까지 저장할 수 있습니다.`);
  }
  const existing = await prisma.institutionSource.findFirst({
    where: { institutionId: input.institutionId, url },
  });
  if (existing) {
    throw new Error("이미 등록된 주소입니다.");
  }

  const source = await prisma.institutionSource.create({
    data: {
      institutionId: input.institutionId,
      label,
      url,
      status: "learning",
    },
  });
  return toRow(source);
}

export async function relearnInstitutionSource(input: {
  sourceId: string;
  institutionId: string;
  institutionName: string;
  uploadedBy: string;
}): Promise<InstitutionSourceRow> {
  const source = await prisma.institutionSource.findFirst({
    where: { id: input.sourceId, institutionId: input.institutionId },
  });
  if (!source) throw new Error("등록된 사이트를 찾을 수 없습니다.");
  if (source.status === "learning") {
    throw new Error("이미 백그라운드에서 학습 중입니다.");
  }

  const updated = await prisma.institutionSource.update({
    where: { id: source.id },
    data: { status: "learning", errorMessage: null },
  });
  return toRow(updated);
}

const learnJobs = new Map<string, Promise<void>>();

export function queueInstitutionLearn(input: {
  sourceId: string;
  institutionId: string;
  institutionName: string;
  label: string;
  url: string;
  uploadedBy: string;
  continueFromExisting?: boolean;
}): Promise<void> {
  const existing = learnJobs.get(input.sourceId);
  if (existing) return existing;
  const job = ingestOfficialSource(input)
    .catch(async (err) => {
      await prisma.institutionSource.update({
        where: { id: input.sourceId },
        data: {
          status: "failed",
          errorMessage: err instanceof Error ? err.message : "학습에 실패했습니다.",
        },
      }).catch(() => {});
    })
    .then(() => undefined)
    .finally(() => {
      learnJobs.delete(input.sourceId);
    });
  learnJobs.set(input.sourceId, job);
  return job;
}

export async function deleteInstitutionSource(institutionId: string, sourceId: string): Promise<void> {
  const source = await prisma.institutionSource.findFirst({
    where: { id: sourceId, institutionId },
  });
  if (!source) return;
  await prisma.institutionSource.update({
    where: { id: source.id },
    data: { documentId: null },
  });
  await deleteCrawledDocuments(institutionId, source.id, source.documentId);
  await prisma.institutionSource.delete({ where: { id: source.id } });
}

async function deleteCrawledDocuments(
  institutionId: string,
  sourceId: string,
  seedDocumentId?: string | null,
): Promise<void> {
  const docs = await prisma.institutionDocument.findMany({
    where: {
      institutionId,
      OR: [
        ...(seedDocumentId ? [{ id: seedDocumentId }] : []),
        { uploadedBy: crawlUploadedBy(sourceId) },
      ],
    },
    select: { id: true },
  });
  const ids = docs.map((row) => row.id);
  if (ids.length === 0) return;
  await prisma.institutionKnowledge.deleteMany({ where: { documentId: { in: ids } } });
  await prisma.institutionDocument.deleteMany({ where: { id: { in: ids } } });
}

function pageTitle(label: string, url: string, isSeed: boolean): string {
  if (isSeed) return label;
  try {
    const path = new URL(url).pathname.replace(/\/$/, "") || "/";
    return `${label} · ${path}`;
  } catch {
    return `${label} · 하위 페이지`;
  }
}

async function listSourcePageUrls(institutionId: string, sourceId: string, seedDocumentId?: string | null): Promise<string[]> {
  const docs = await prisma.institutionDocument.findMany({
    where: {
      institutionId,
      OR: [
        ...(seedDocumentId ? [{ id: seedDocumentId }] : []),
        { uploadedBy: crawlUploadedBy(sourceId) },
      ],
    },
    select: { fileName: true },
    take: 200,
  });
  return docs.map((row) => row.fileName).filter(Boolean);
}

async function ingestOfficialSource(input: {
  sourceId: string;
  institutionId: string;
  institutionName: string;
  label: string;
  url: string;
  uploadedBy: string;
  continueFromExisting?: boolean;
}): Promise<number> {
  const existingUrls = input.continueFromExisting
    ? await listSourcePageUrls(input.institutionId, input.sourceId, (
      await prisma.institutionSource.findUnique({
        where: { id: input.sourceId },
        select: { documentId: true },
      })
    )?.documentId)
    : [];
  const continuing = existingUrls.length > 0;
  const pages = await crawlOfficialSite(input.url, { skipUrls: continuing ? existingUrls : [] });
  if (pages.length === 0) {
    if (continuing) {
      await prisma.institutionSource.update({
        where: { id: input.sourceId },
        data: { status: "ready", errorMessage: null, lastFetchedAt: new Date() },
      });
      return 0;
    }
    throw new Error("등록한 주소에서 학습할 본문을 찾지 못했습니다. 바로가기만 있는 사이트면 실제 안내 페이지 주소를 넣어 주세요.");
  }

  const category: KnowledgeCategory = "admin";
  const current = await prisma.institutionSource.findUnique({
    where: { id: input.sourceId },
    select: { documentId: true },
  });
  let seedDocumentId = current?.documentId ?? null;
  let created = 0;

  for (const [index, page] of pages.entries()) {
    const isSeed = !continuing && index === 0;
    const document = await prisma.institutionDocument.create({
      data: {
        institutionId: input.institutionId,
        title: pageTitle(input.label, page.url, isSeed),
        category,
        fileName: page.url,
        mimeType: "text/html",
        extractedText: page.text,
        status: "processing",
        uploadedBy: isSeed ? input.uploadedBy : crawlUploadedBy(input.sourceId),
      },
    });
    if (isSeed) seedDocumentId = document.id;
    try {
      created += await ingestInstitutionDocument({
        documentId: document.id,
        institutionId: input.institutionId,
        institutionName: input.institutionName,
        category,
        fileName: page.url,
        text: page.text,
        source: "website",
        maxItems: isSeed ? 8 : 5,
      });
    } catch {
      await prisma.institutionDocument.update({
        where: { id: document.id },
        data: {
          status: "verified",
          errorMessage: "이 페이지 핵심 추출은 건너뛰고 원문만 저장했습니다.",
        },
      }).catch(() => {});
    }
  }

  await prisma.institutionSource.update({
    where: { id: input.sourceId },
    data: {
      status: "ready",
      errorMessage: null,
      documentId: seedDocumentId,
      lastFetchedAt: new Date(),
      ...(continuing
        ? {}
        : { url: pages[0].url.length <= 500 ? pages[0].url : input.url }),
    },
  });
  return created;
}

const missInFlight = new Map<string, Promise<number>>();

export async function learnFromOfficialSourcesOnMiss(input: {
  institutionId: string;
  situation: string;
}): Promise<number> {
  const key = `${input.institutionId}:${input.situation.trim().slice(0, 80).toLowerCase()}`;
  const pending = missInFlight.get(key);
  if (pending) return pending;
  const task = learnFromOfficialSourcesOnMissOnce(input).finally(() => missInFlight.delete(key));
  missInFlight.set(key, task);
  return task;
}

async function learnFromOfficialSourcesOnMissOnce(input: {
  institutionId: string;
  situation: string;
}): Promise<number> {
  const institution = await prisma.institution.findUnique({
    where: { id: input.institutionId },
    select: { id: true, nameKo: true },
  });
  if (!institution) return 0;

  const sources = await prisma.institutionSource.findMany({
    where: { institutionId: input.institutionId },
    orderBy: { updatedAt: "desc" },
    take: MAX_SOURCES,
  });
  if (sources.length === 0) return 0;

  let created = 0;
  for (const source of sources) {
    try {
      const stale =
        !source.lastFetchedAt ||
        Date.now() - source.lastFetchedAt.getTime() > 7 * 24 * 60 * 60 * 1000;

      if (stale) {
        await prisma.institutionSource.update({
          where: { id: source.id },
          data: { documentId: null, status: "learning", errorMessage: null },
        });
        await deleteCrawledDocuments(input.institutionId, source.id, source.documentId);
        await ingestOfficialSource({
          sourceId: source.id,
          institutionId: input.institutionId,
          institutionName: institution.nameKo,
          label: source.label,
          url: source.url,
          uploadedBy: "system:query-learn",
        });
      }

      const fresh = await prisma.institutionSource.findUnique({
        where: { id: source.id },
        select: { documentId: true },
      });
      const seedDocumentId = fresh?.documentId ?? source.documentId;
      const docs = await prisma.institutionDocument.findMany({
        where: {
          institutionId: input.institutionId,
          OR: [
            ...(seedDocumentId ? [{ id: seedDocumentId }] : []),
            { uploadedBy: crawlUploadedBy(source.id) },
          ],
        },
        select: { id: true, extractedText: true, fileName: true },
        take: 12,
      });
      const tokens = input.situation.toLowerCase().split(/[\s,/·\-()]+/).filter((part) => part.length >= 2);
      const ranked = docs
        .map((doc) => {
          const hay = `${doc.fileName} ${doc.extractedText}`.toLowerCase();
          const score = tokens.filter((token) => hay.includes(token)).length;
          return { ...doc, score };
        })
        .sort((a, b) => b.score - a.score);
      const picks = (ranked.some((row) => row.score > 0) ? ranked.filter((row) => row.score > 0) : ranked).slice(0, 3);

      for (const doc of picks) {
        if (doc.extractedText.length < 80) continue;
        const items = await extractKnowledgeFromText({
          institutionName: institution.nameKo,
          category: "admin",
          fileName: doc.fileName,
          text: doc.extractedText,
          focusQuery: input.situation,
          maxItems: 4,
        });
        created += await persistExtractedKnowledge({
          institutionId: input.institutionId,
          documentId: doc.id,
          items,
          source: "website",
        });
      }
    } catch (err) {
      await prisma.institutionSource.update({
        where: { id: source.id },
        data: {
          status: source.status === "ready" ? "ready" : "failed",
          errorMessage: err instanceof UnsafeUrlError || err instanceof Error ? err.message : "추가 학습에 실패했습니다.",
        },
      }).catch(() => {});
    }
  }
  return created;
}

export { OFFICIAL_SOURCES, MAX_SOURCES, CRAWL_UPLOAD_PREFIX };
