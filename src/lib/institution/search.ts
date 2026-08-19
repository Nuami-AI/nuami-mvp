import { prisma } from "@/lib/db";
import { parseJsonArray } from "./catalog";
import { KOREA_UNIVERSITY_SAMPLE } from "./samples";
import { isInboundStudentKnowledge } from "./relevance";

export interface InstitutionKnowledgeHit {
  id: string;
  institutionId: string;
  institutionName: string;
  title: string;
  summary: string;
  facts: string[];
  documents: string[];
  whereTo: string[];
  category: string;
  source: string;
  verified: boolean;
  publicDataNote?: string | null;
  score: number;
}

export interface InstitutionGuideItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  verified: boolean;
  source: string;
  facts: string[];
  documents: string[];
  whereTo: string[];
  keywords: string[];
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[?!.，。、]/g, " ").replace(/\s+/g, " ").trim();
}

const SYNONYM_GROUPS = [
  ["외국인등록", "외국인등록증", "외국인 등록", "arc", "alien registration", "residence card", "proof of rc", "rc guideline", "증빙"],
  ["입학", "신입생", "오리엔테이션", "orientation"],
  ["학사", "수강신청", "등록금"],
];

function withSynonyms(text: string): string {
  let extra = "";
  for (const group of SYNONYM_GROUPS) {
    if (group.some((term) => text.includes(term))) {
      extra += ` ${group.join(" ")}`;
    }
  }
  return `${text}${extra}`;
}

function queryTokens(situation: string): string[] {
  const normalized = withSynonyms(normalize(situation));
  const tokens = normalized.split(/[\s,/·\-()]+/).filter((part) => part.length >= 2);
  return [...new Set(tokens)];
}

function isCampusQuery(situation: string): boolean {
  return /외국인등록|등록증|입학|학사|오리엔테이션|기숙사|arc|고려대|대학|캠퍼스|국제처/i.test(situation);
}

function toHit(
  row: {
    id: string;
    title: string;
    summary: string;
    factsJson: string;
    documentsJson: string;
    whereToJson: string;
    category: string;
    source: string;
    verified: boolean;
    publicDataNote: string | null;
  },
  institutionId: string,
  institutionName: string,
  score: number,
): InstitutionKnowledgeHit {
  return {
    id: row.id,
    institutionId,
    institutionName,
    title: row.title,
    summary: row.summary,
    facts: parseJsonArray(row.factsJson),
    documents: parseJsonArray(row.documentsJson),
    whereTo: parseJsonArray(row.whereToJson),
    category: row.category,
    source: row.source,
    verified: row.verified,
    publicDataNote: row.publicDataNote,
    score,
  };
}

function sampleHits(institutionId: string, situation: string): InstitutionKnowledgeHit[] {
  if (institutionId !== KOREA_UNIVERSITY_SAMPLE.institutionId) return [];
  const tokens = queryTokens(situation);
  const haystack = normalize(
    `${KOREA_UNIVERSITY_SAMPLE.title} ${KOREA_UNIVERSITY_SAMPLE.summary} ${KOREA_UNIVERSITY_SAMPLE.keywords.join(" ")}`,
  );
  const score = tokens.filter((token) => haystack.includes(token)).length;
  if (score <= 0 && !isCampusQuery(situation)) return [];
  return [{
    id: "sample-korea-university-residence",
    institutionId,
    institutionName: KOREA_UNIVERSITY_SAMPLE.institutionName,
    title: KOREA_UNIVERSITY_SAMPLE.title,
    summary: KOREA_UNIVERSITY_SAMPLE.summary,
    facts: KOREA_UNIVERSITY_SAMPLE.facts,
    documents: KOREA_UNIVERSITY_SAMPLE.documents,
    whereTo: KOREA_UNIVERSITY_SAMPLE.whereTo,
    category: "admin",
    source: "upload",
    verified: true,
    publicDataNote: KOREA_UNIVERSITY_SAMPLE.publicDataNote,
    score: Math.max(score, 1),
  }];
}

function isOfficialKnowledge(row: {
  source: string;
  category: string;
  title?: string;
  summary?: string;
  factsJson?: string | null;
  keywordsJson?: string | null;
}): boolean {
  if (!((row.source === "upload" || row.source === "website") && row.category !== "learned")) return false;
  if (!row.title) return true;
  return isInboundStudentKnowledge({
    title: row.title,
    summary: row.summary,
    facts: parseJsonArray(row.factsJson),
    keywords: parseJsonArray(row.keywordsJson),
  });
}

function sampleGuideItem(): InstitutionGuideItem {
  return {
    id: "sample-korea-university-residence",
    title: KOREA_UNIVERSITY_SAMPLE.title,
    summary: KOREA_UNIVERSITY_SAMPLE.summary,
    category: "admin",
    verified: true,
    source: "upload",
    facts: KOREA_UNIVERSITY_SAMPLE.facts,
    documents: KOREA_UNIVERSITY_SAMPLE.documents,
    whereTo: KOREA_UNIVERSITY_SAMPLE.whereTo,
    keywords: KOREA_UNIVERSITY_SAMPLE.keywords,
  };
}

function knowledgeToGuideItem(row: {
  id: string;
  title: string;
  summary: string;
  category: string;
  verified: boolean;
  source: string;
  factsJson?: string | null;
  documentsJson?: string | null;
  whereToJson?: string | null;
  keywordsJson?: string | null;
}): InstitutionGuideItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    verified: row.verified,
    source: row.source,
    facts: parseJsonArray(row.factsJson),
    documents: parseJsonArray(row.documentsJson),
    whereTo: parseJsonArray(row.whereToJson),
    keywords: parseJsonArray(row.keywordsJson),
  };
}

export async function listInstitutionGuides(institutionId: string): Promise<{
  nameKo: string;
  nameEn: string;
  items: InstitutionGuideItem[];
} | null> {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      select: {
        nameKo: true,
        nameEn: true,
        knowledge: {
          select: {
            id: true,
            title: true,
            summary: true,
            category: true,
            verified: true,
            source: true,
            factsJson: true,
            documentsJson: true,
            whereToJson: true,
            keywordsJson: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 120,
        },
      },
    });
    if (!institution) return null;
    const items = institution.knowledge
      .filter(isOfficialKnowledge)
      .map(knowledgeToGuideItem)
      .slice(0, 18);
    if (items.length === 0 && institutionId === KOREA_UNIVERSITY_SAMPLE.institutionId) {
      items.push(sampleGuideItem());
    }
    return {
      nameKo: institution.nameKo,
      nameEn: institution.nameEn,
      items,
    };
  } catch {
    if (institutionId !== KOREA_UNIVERSITY_SAMPLE.institutionId) return null;
    return {
      nameKo: KOREA_UNIVERSITY_SAMPLE.institutionName,
      nameEn: "Korea University",
      items: [sampleGuideItem()],
    };
  }
}

export async function getInstitutionKnowledgeById(
  institutionId: string,
  knowledgeId: string,
): Promise<InstitutionKnowledgeHit | null> {
  if (knowledgeId.startsWith("sample-")) {
    return sampleHits(institutionId, "외국인등록 입학 체류지")[0] ?? null;
  }
  try {
    const row = await prisma.institutionKnowledge.findFirst({
      where: { id: knowledgeId, institutionId },
      include: { institution: true },
    });
    if (!row || !isOfficialKnowledge(row)) return null;
    return toHit(row, row.institutionId, row.institution.nameKo, 10);
  } catch {
    return null;
  }
}

export async function searchInstitutionKnowledge(
  institutionId: string,
  situation: string,
  knowledgeId?: string,
): Promise<InstitutionKnowledgeHit[]> {
  if (knowledgeId) {
    const exact = await getInstitutionKnowledgeById(institutionId, knowledgeId);
    if (exact) return [exact];
  }

  try {
    const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) return sampleHits(institutionId, situation);

    const rows = (await prisma.institutionKnowledge.findMany({
      where: { institutionId, source: { in: ["upload", "website"] }, NOT: { category: "learned" } },
      orderBy: { updatedAt: "desc" },
      take: 150,
    })).filter(isOfficialKnowledge);
    if (rows.length === 0) return sampleHits(institutionId, situation);

    const tokens = queryTokens(situation);
    const hits: InstitutionKnowledgeHit[] = [];

    for (const row of rows) {
      const keywords = parseJsonArray(row.keywordsJson);
      const haystack = withSynonyms(
        normalize(`${row.title} ${row.summary} ${row.factsJson} ${keywords.join(" ")}`),
      );
      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) score += token.length >= 4 ? 2 : 1;
      }
      if (score <= 0) continue;
      hits.push(toHit(row, institutionId, institution.nameKo, score));
    }

    if (hits.length > 0) return hits.sort((a, b) => b.score - a.score).slice(0, 4);

    if (isCampusQuery(situation)) {
      const preferred = rows.filter((row) =>
        ["admin", "orientation", "academic"].includes(row.category),
      );
      return (preferred.length > 0 ? preferred : rows)
        .slice(0, 4)
        .map((row) => toHit(row, institutionId, institution.nameKo, 1));
    }
    return [];
  } catch {
    return sampleHits(institutionId, situation);
  }
}

export function formatInstitutionFacts(hits: InstitutionKnowledgeHit[]): string {
  if (hits.length === 0) return "";
  const name = hits[0]?.institutionName ?? "소속 기관";
  const lines = hits.flatMap((hit) => [
    `- ${hit.title}: ${hit.summary}`,
    ...hit.facts.slice(0, 4).map((fact) => `  · ${fact}`),
    hit.documents.length ? `  서류: ${hit.documents.join(" | ")}` : "",
    hit.whereTo.length ? `  장소: ${hit.whereTo.join(" | ")}` : "",
    hit.publicDataNote ? `  검증: ${hit.publicDataNote}` : "",
  ]);
  return [
    `[INSTITUTION OFFICIAL DATA — ${name}]`,
    "Prefer these campus/institution facts over generic answers. Do not contradict them.",
    "This data is already verified; do not re-invent offices or deadlines.",
    ...lines.filter(Boolean),
  ].join("\n");
}
