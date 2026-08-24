import { prisma } from "@/lib/db";
import {
  AI_USABLE_ASSET_STATUS,
  type AssetDomain,
  type AssetSourceType,
  type AssetStatus,
  type ProviderStatus,
  type ProviderType,
} from "./types";

function snapshotOf(asset: {
  title: string;
  domain: string;
  region: string;
  institutionId: string | null;
  sourceType: string;
  contentText: string;
  sourceUrl: string | null;
  fileName: string | null;
  status: string;
  version: number;
  reviewMemo: string | null;
}): string {
  return JSON.stringify(asset);
}

export async function listProviders(opts?: { status?: ProviderStatus }) {
  return prisma.knowledgeProvider.findMany({
    where: opts?.status ? { status: opts.status } : undefined,
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function createProvider(input: {
  name: string;
  type: ProviderType;
  domain?: string;
  region?: string;
  description?: string;
  status?: ProviderStatus;
}) {
  return prisma.knowledgeProvider.create({
    data: {
      name: input.name.trim(),
      type: input.type,
      domain: (input.domain ?? "").trim(),
      region: (input.region ?? "").trim(),
      description: input.description?.trim() || null,
      status: input.status ?? "ACTIVE",
    },
  });
}

export async function updateProvider(
  id: string,
  input: Partial<{
    name: string;
    type: ProviderType;
    domain: string;
    region: string;
    description: string | null;
    status: ProviderStatus;
  }>,
) {
  return prisma.knowledgeProvider.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.domain !== undefined ? { domain: input.domain.trim() } : {}),
      ...(input.region !== undefined ? { region: input.region.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
}

export async function deleteProvider(id: string) {
  const linked = await prisma.knowledgeAsset.count({ where: { providerId: id } });
  if (linked > 0) {
    throw new Error("이 제공처에 연결된 지식자료가 있어 삭제할 수 없습니다. 먼저 자료를 옮기거나 비활성화하세요.");
  }
  await prisma.knowledgeProvider.delete({ where: { id } });
}

export async function listAssets(opts?: {
  status?: AssetStatus;
  domain?: AssetDomain;
  providerId?: string;
  q?: string;
}) {
  const q = opts?.q?.trim();
  return prisma.knowledgeAsset.findMany({
    where: {
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.domain ? { domain: opts.domain } : {}),
      ...(opts?.providerId ? { providerId: opts.providerId } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { contentText: { contains: q } },
              { region: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      provider: { select: { id: true, name: true, type: true } },
      _count: { select: { opinions: true, versions: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

export async function getAsset(id: string) {
  return prisma.knowledgeAsset.findUnique({
    where: { id },
    include: {
      provider: true,
      versions: { orderBy: { version: "desc" }, take: 20 },
      opinions: { orderBy: { receivedAt: "desc" } },
    },
  });
}

export async function createAsset(input: {
  title: string;
  providerId: string;
  domain: AssetDomain;
  region?: string;
  institutionId?: string | null;
  sourceType: AssetSourceType;
  contentText: string;
  sourceUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  originalPublishedAt?: Date | null;
  originalUpdatedAt?: Date | null;
  createdBy: string;
}) {
  const content = input.contentText.trim();
  if (!content) throw new Error("자료 본문이 비어 있습니다.");

  const asset = await prisma.knowledgeAsset.create({
    data: {
      title: input.title.trim(),
      providerId: input.providerId,
      domain: input.domain,
      region: (input.region ?? "").trim(),
      institutionId: input.institutionId || null,
      sourceType: input.sourceType,
      contentText: content,
      sourceUrl: input.sourceUrl?.trim() || null,
      fileName: input.fileName || null,
      mimeType: input.mimeType || null,
      originalPublishedAt: input.originalPublishedAt ?? null,
      originalUpdatedAt: input.originalUpdatedAt ?? null,
      status: "PENDING_REVIEW",
      version: 1,
      createdBy: input.createdBy,
    },
  });

  await prisma.knowledgeAssetVersion.create({
    data: {
      assetId: asset.id,
      version: 1,
      snapshot: snapshotOf(asset),
      changedBy: input.createdBy,
      changeNote: "최초 등록",
    },
  });

  return asset;
}

export async function updateAsset(
  id: string,
  input: Partial<{
    title: string;
    providerId: string;
    domain: AssetDomain;
    region: string;
    institutionId: string | null;
    sourceType: AssetSourceType;
    contentText: string;
    sourceUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
    originalPublishedAt: Date | null;
    originalUpdatedAt: Date | null;
    reviewMemo: string | null;
  }>,
  actorEmail: string,
) {
  const existing = await prisma.knowledgeAsset.findUnique({ where: { id } });
  if (!existing) throw new Error("자료를 찾을 수 없습니다.");

  const contentChanged =
    (input.contentText !== undefined && input.contentText.trim() !== existing.contentText) ||
    (input.title !== undefined && input.title.trim() !== existing.title);

  const nextVersion = contentChanged ? existing.version + 1 : existing.version;
  // Published content edits require re-review before AI use.
  const nextStatus =
    contentChanged && existing.status === "PUBLISHED"
      ? "PENDING_REVIEW"
      : existing.status;

  const updated = await prisma.knowledgeAsset.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.providerId !== undefined ? { providerId: input.providerId } : {}),
      ...(input.domain !== undefined ? { domain: input.domain } : {}),
      ...(input.region !== undefined ? { region: input.region.trim() } : {}),
      ...(input.institutionId !== undefined ? { institutionId: input.institutionId || null } : {}),
      ...(input.sourceType !== undefined ? { sourceType: input.sourceType } : {}),
      ...(input.contentText !== undefined ? { contentText: input.contentText.trim() } : {}),
      ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl?.trim() || null } : {}),
      ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
      ...(input.mimeType !== undefined ? { mimeType: input.mimeType } : {}),
      ...(input.originalPublishedAt !== undefined
        ? { originalPublishedAt: input.originalPublishedAt }
        : {}),
      ...(input.originalUpdatedAt !== undefined
        ? { originalUpdatedAt: input.originalUpdatedAt }
        : {}),
      ...(input.reviewMemo !== undefined
        ? { reviewMemo: input.reviewMemo?.trim() || null }
        : {}),
      version: nextVersion,
      status: nextStatus,
      ...(nextStatus === "PENDING_REVIEW" && existing.status === "PUBLISHED"
        ? { publishedAt: null }
        : {}),
    },
  });

  if (contentChanged) {
    await prisma.knowledgeAssetVersion.create({
      data: {
        assetId: id,
        version: nextVersion,
        snapshot: snapshotOf(updated),
        changedBy: actorEmail,
        changeNote:
          existing.status === "PUBLISHED"
            ? "반영본 수정 → 재검토 대기"
            : "내용 수정",
      },
    });
  }

  return updated;
}

const ALLOWED_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  PENDING_REVIEW: ["APPROVED", "ON_HOLD", "INACTIVE"],
  APPROVED: ["PUBLISHED", "ON_HOLD", "PENDING_REVIEW", "INACTIVE"],
  PUBLISHED: ["ON_HOLD", "INACTIVE", "PENDING_REVIEW"],
  ON_HOLD: ["PENDING_REVIEW", "APPROVED", "INACTIVE"],
  INACTIVE: ["PENDING_REVIEW"],
};

export async function transitionAssetStatus(input: {
  id: string;
  status: AssetStatus;
  actorEmail: string;
  reviewMemo?: string;
}) {
  const existing = await prisma.knowledgeAsset.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("자료를 찾을 수 없습니다.");

  const from = existing.status as AssetStatus;
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(input.status)) {
    throw new Error(`${from} → ${input.status} 전이는 허용되지 않습니다.`);
  }

  return prisma.knowledgeAsset.update({
    where: { id: input.id },
    data: {
      status: input.status,
      reviewerEmail: input.actorEmail,
      ...(input.reviewMemo !== undefined
        ? { reviewMemo: input.reviewMemo.trim() || null }
        : {}),
      ...(input.status === "PUBLISHED"
        ? { publishedAt: new Date() }
        : input.status === "INACTIVE" ||
            input.status === "ON_HOLD" ||
            input.status === "PENDING_REVIEW"
          ? { publishedAt: null }
          : {}),
    },
  });
}

export async function deleteAsset(id: string) {
  await prisma.knowledgeAsset.delete({ where: { id } });
}

export async function listOpinions(opts?: { applied?: boolean; assetId?: string }) {
  return prisma.expertOpinion.findMany({
    where: {
      ...(opts?.applied !== undefined ? { applied: opts.applied } : {}),
      ...(opts?.assetId ? { assetId: opts.assetId } : {}),
    },
    include: {
      asset: { select: { id: true, title: true, status: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 200,
  });
}

export async function createOpinion(input: {
  expertName: string;
  affiliation?: string;
  domain?: string;
  assetId?: string | null;
  opinion: string;
  receivedAt?: Date;
  applied?: boolean;
  internalMemo?: string | null;
  createdBy: string;
}) {
  const text = input.opinion.trim();
  if (!text) throw new Error("검토 의견이 비어 있습니다.");
  return prisma.expertOpinion.create({
    data: {
      expertName: input.expertName.trim(),
      affiliation: (input.affiliation ?? "").trim(),
      domain: (input.domain ?? "").trim(),
      assetId: input.assetId || null,
      opinion: text,
      receivedAt: input.receivedAt ?? new Date(),
      applied: input.applied ?? false,
      internalMemo: input.internalMemo?.trim() || null,
      createdBy: input.createdBy,
    },
  });
}

export async function updateOpinion(
  id: string,
  input: Partial<{
    expertName: string;
    affiliation: string;
    domain: string;
    assetId: string | null;
    opinion: string;
    receivedAt: Date;
    applied: boolean;
    internalMemo: string | null;
  }>,
) {
  return prisma.expertOpinion.update({
    where: { id },
    data: {
      ...(input.expertName !== undefined ? { expertName: input.expertName.trim() } : {}),
      ...(input.affiliation !== undefined ? { affiliation: input.affiliation.trim() } : {}),
      ...(input.domain !== undefined ? { domain: input.domain.trim() } : {}),
      ...(input.assetId !== undefined ? { assetId: input.assetId || null } : {}),
      ...(input.opinion !== undefined ? { opinion: input.opinion.trim() } : {}),
      ...(input.receivedAt !== undefined ? { receivedAt: input.receivedAt } : {}),
      ...(input.applied !== undefined ? { applied: input.applied } : {}),
      ...(input.internalMemo !== undefined
        ? { internalMemo: input.internalMemo?.trim() || null }
        : {}),
    },
  });
}

export async function deleteOpinion(id: string) {
  await prisma.expertOpinion.delete({ where: { id } });
}

export interface PublishedKnowledgeHit {
  id: string;
  title: string;
  domain: string;
  region: string;
  institutionId: string | null;
  providerName: string;
  providerType: string;
  excerpt: string;
  version: number;
  sourceUrl: string | null;
  score: number;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[?!.，。、]/g, " ").replace(/\s+/g, " ").trim();
}

/** AI/검색용: PUBLISHED 상태만. */
export async function searchPublishedKnowledge(input: {
  situation: string;
  institutionId?: string;
  limit?: number;
}): Promise<PublishedKnowledgeHit[]> {
  const tokens = normalize(input.situation)
    .split(/[\s,/·\-()]+/)
    .filter((part) => part.length >= 2);
  if (tokens.length === 0) return [];

  const rows = await prisma.knowledgeAsset.findMany({
    where: {
      status: AI_USABLE_ASSET_STATUS,
      ...(input.institutionId
        ? {
            OR: [{ institutionId: input.institutionId }, { institutionId: null }],
          }
        : {}),
    },
    include: { provider: { select: { name: true, type: true, status: true } } },
    orderBy: { publishedAt: "desc" },
    take: 120,
  });

  const hits: PublishedKnowledgeHit[] = [];
  for (const row of rows) {
    if (row.provider.status !== "ACTIVE") continue;
    const haystack = normalize(
      `${row.title} ${row.domain} ${row.region} ${row.contentText.slice(0, 4000)}`,
    );
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += token.length >= 4 ? 2 : 1;
    }
    if (score <= 0) continue;
    hits.push({
      id: row.id,
      title: row.title,
      domain: row.domain,
      region: row.region,
      institutionId: row.institutionId,
      providerName: row.provider.name,
      providerType: row.provider.type,
      excerpt: row.contentText.slice(0, 600),
      version: row.version,
      sourceUrl: row.sourceUrl,
      score,
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, input.limit ?? 4);
}

export function formatPublishedKnowledgeFacts(hits: PublishedKnowledgeHit[]): string {
  if (hits.length === 0) return "";
  return [
    "[NUAMI VERIFIED KNOWLEDGE BASE — cite these source IDs; do not contradict]",
    ...hits.map(
      (hit) =>
        `- knowledgeSourceId=${hit.id} v${hit.version} | ${hit.providerName} | ${hit.title}\n  ${hit.excerpt}`,
    ),
  ].join("\n");
}
