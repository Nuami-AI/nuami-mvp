import OpenAI from "openai";

import { fetchOpenDataForScenario } from "@/lib/opendata/search";
import { prisma } from "@/lib/db";
import type { KnowledgeCategory } from "./catalog";
import { koreaAcademicContext, isInboundStudentKnowledge } from "./relevance";

export interface ExtractedKnowledgeItem {
  title: string;
  category: KnowledgeCategory;
  summary: string;
  facts: string[];
  documents: string[];
  whereTo: string[];
  keywords: string[];
  publicDataHint?: "residence-change" | "bank-account" | "hospital" | null;
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey });
}

function stripToJson(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/m.exec(trimmed);
  if (fenced?.[1]) return fenced[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function parseExtractedJson(raw: string): { items?: ExtractedKnowledgeItem[] } {
  const candidates = [raw, repairTruncatedJson(raw)];
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as { items?: ExtractedKnowledgeItem[] };
    } catch {
      continue;
    }
  }
  throw new Error("안내 항목 JSON을 읽지 못했습니다.");
}

function repairTruncatedJson(raw: string): string {
  const text = raw.trim().replace(/,(\s*[}\]])/g, "$1");
  const arrayAt = text.indexOf("[");
  if (!text.startsWith("{") || arrayAt === -1) return '{"items":[]}';

  let depth = 0;
  let inString = false;
  let escape = false;
  let lastObjectEnd = -1;
  for (let i = arrayAt + 1; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) lastObjectEnd = i;
    } else if (ch === "]" && depth === 0) {
      return `${text.slice(0, i + 1)}}`;
    }
  }
  if (lastObjectEnd === -1) return '{"items":[]}';
  return `{"items":${text.slice(arrayAt, lastObjectEnd + 1)}]}`;
}

export async function extractKnowledgeFromText(input: {
  institutionName: string;
  category: KnowledgeCategory;
  fileName: string;
  text: string;
  focusQuery?: string;
  maxItems?: number;
}): Promise<ExtractedKnowledgeItem[]> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const maxItems = input.maxItems ?? (input.focusQuery ? 6 : 8);
  const focus = input.focusQuery?.trim();
  const term = koreaAcademicContext();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.1,
    max_tokens: 2500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You extract official guidance for inbound international students at a Korean institution.
${term.promptLine}
Return STRICT JSON only:
{"items":[{"title":"","category":"orientation|academic|living-tips|admin","summary":"","facts":[""],"documents":[""],"whereTo":[""],"keywords":[""],"publicDataHint":"residence-change|bank-account|hospital|null"}]}
Rules:
- Extract ONLY what a NEW inbound international student (신입 유학생) needs before/just after arrival this term: visa/D-2, ARC, insurance, dorm move-in, first tuition payment (incl. overseas payment), orientation, international office contact, newcomer scholarships, buddy for incoming students.
- Do NOT extract: continuing-student (재학생) news, department RA/TA jobs, meal-plan menus, library catalogs, building renovation, contests/hackathons, faculty hiring, outbound exchange for Koreans, generic campus PR.
- Never invent offices, deadlines, documents, or phone numbers.
- whereTo must be physical offices or campus buildings, never HiKorea/전자민원.
- Write title, summary, and facts in Korean (Hangul) even if the source document is English. Keep official English names in parentheses when useful.
- keywords: 4-10 Korean/English search terms a student would type.
- If the document is about alien registration / ARC / Proof of RC, always include: 외국인등록, 외국인등록증, 증빙, ARC.
- publicDataHint is set only if the item is about address/residence change, bank account, or hospital.
${focus ? "- The student asked a specific question. Extract ONLY facts that help answer it. If the source has no relevant official facts, return {\"items\":[]}." : "- Prefer a small set of core facts over exhaustive copying."}`,
      },
      {
        role: "user",
        content: `Institution: ${input.institutionName}
Suggested category: ${input.category}
File: ${input.fileName}
${focus ? `Student question: ${focus}\n` : ""}
--- DOCUMENT ---
${input.text}`,
      },
    ],
  });

  const raw = stripToJson(response.choices[0]?.message?.content ?? "");
  let parsed: { items?: ExtractedKnowledgeItem[] };
  try {
    parsed = parseExtractedJson(raw);
  } catch {
    return [];
  }
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  return items
    .filter((item) => item.title?.trim() && item.summary?.trim() && (item.facts?.length ?? 0) > 0)
    .filter((item) =>
      isInboundStudentKnowledge({
        title: item.title,
        summary: item.summary,
        facts: item.facts,
        keywords: item.keywords,
      }),
    )
    .slice(0, maxItems)
    .map((item) => ({
      title: item.title.trim(),
      category: item.category || input.category,
      summary: item.summary.trim(),
      facts: (item.facts ?? []).filter(Boolean).slice(0, 8),
      documents: (item.documents ?? []).filter(Boolean).slice(0, 8),
      whereTo: (item.whereTo ?? []).filter(Boolean).slice(0, 6),
      keywords: (item.keywords ?? []).filter(Boolean).slice(0, 12),
      publicDataHint: item.publicDataHint ?? null,
    }));
}

export async function verifyWithPublicData(item: ExtractedKnowledgeItem): Promise<{
  verified: boolean;
  note: string;
  extraWhereTo: string[];
}> {
  if (!item.publicDataHint) {
    return { verified: true, note: "기관 공식자료 기준", extraWhereTo: [] };
  }
  const openData = await fetchOpenDataForScenario(item.publicDataHint);
  const extraWhereTo = openData.facilities
    .filter((row) => !/하이코리아|전자민원|온라인/i.test(row.name))
    .map((row) => row.name)
    .slice(0, 4);
  return {
    verified: true,
    note: extraWhereTo.length
      ? `공공데이터 대조: ${extraWhereTo.join(", ")}`
      : "공공데이터 조회 후 기관 공식자료를 유지",
    extraWhereTo,
  };
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function persistExtractedKnowledge(input: {
  institutionId: string;
  documentId: string;
  items: ExtractedKnowledgeItem[];
  source: "upload" | "website";
}): Promise<number> {
  const existing = await prisma.institutionKnowledge.findMany({
    where: { institutionId: input.institutionId, source: { in: ["upload", "website"] } },
    select: { title: true },
  });
  const seen = new Set(existing.map((row) => normalizeTitle(row.title)));
  let created = 0;

  for (const item of input.items) {
    const key = normalizeTitle(item.title);
    if (seen.has(key)) continue;
    seen.add(key);
    const verified = await verifyWithPublicData(item);
    await prisma.institutionKnowledge.create({
      data: {
        institutionId: input.institutionId,
        documentId: input.documentId,
        category: item.category,
        title: item.title,
        summary: item.summary,
        factsJson: JSON.stringify(item.facts),
        documentsJson: JSON.stringify(item.documents),
        whereToJson: JSON.stringify([...item.whereTo, ...verified.extraWhereTo].slice(0, 6)),
        keywordsJson: JSON.stringify(item.keywords),
        source: input.source,
        verified: verified.verified,
        publicDataNote: verified.note,
      },
    });
    created += 1;
  }

  return created;
}

export async function ingestInstitutionDocument(input: {
  documentId: string;
  institutionId: string;
  institutionName: string;
  category: KnowledgeCategory;
  fileName: string;
  text: string;
  source?: "upload" | "website";
  focusQuery?: string;
  maxItems?: number;
}): Promise<number> {
  const source = input.source ?? "upload";
  const items = await extractKnowledgeFromText(input);
  if (items.length === 0) {
    if (source === "website") {
      await prisma.institutionDocument.update({
        where: { id: input.documentId },
        data: {
          status: "verified",
          errorMessage: "핵심 안내 항목이 없어 원문만 저장했습니다. 이후 질의 때 추가 학습합니다.",
        },
      });
      return 0;
    }
    await prisma.institutionDocument.update({
      where: { id: input.documentId },
      data: { status: "failed", errorMessage: "문서에서 안내 항목을 추출하지 못했습니다." },
    });
    return 0;
  }

  const created = await persistExtractedKnowledge({
    institutionId: input.institutionId,
    documentId: input.documentId,
    items,
    source,
  });

  await prisma.institutionDocument.update({
    where: { id: input.documentId },
    data: {
      status: created > 0 || source === "website" ? "verified" : "failed",
      errorMessage: created > 0 ? null : "이미 저장된 항목과 중복되어 추가하지 않았습니다.",
    },
  });

  return created;
}
