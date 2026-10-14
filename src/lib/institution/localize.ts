import { createJsonResponse } from "@/lib/llm/json-response";
import { prisma } from "@/lib/db";
import type { GuideSection } from "@/lib/guide/adapt-cards";
import type { InstitutionGuideItem } from "@/lib/institution/search";

const LANG_NAMES: Record<string, string> = {
  ko: "Korean",
  en: "English",
  ja: "Japanese",
  zh: "Simplified Chinese",
  vi: "Vietnamese",
};

const memory = new Map<string, unknown>();

function stripToJson(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/m.exec(trimmed);
  if (fenced?.[1]) return fenced[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

export function normalizeUiLang(lang: string): keyof typeof LANG_NAMES {
  const code = lang.trim().toLowerCase().slice(0, 2);
  if (code in LANG_NAMES) return code as keyof typeof LANG_NAMES;
  return "en";
}

function letterCount(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length;
}

export function looksLikeLang(text: string, lang: string): boolean {
  const sample = text.replace(/\s+/g, "");
  if (sample.length < 8) return true;
  const hangul = letterCount(sample, /[가-힣]/g);
  const kana = letterCount(sample, /[\u3040-\u30ff]/g);
  const han = letterCount(sample, /[\u4e00-\u9fff]/g);
  const latin = letterCount(sample, /[A-Za-z]/g);
  const total = hangul + kana + han + latin || 1;
  if (lang === "ko") return hangul / total >= 0.45;
  if (lang === "ja") return (kana + han) / total >= 0.35 && hangul / total < 0.2;
  if (lang === "zh") return han / total >= 0.4 && kana / total < 0.05 && hangul / total < 0.05;
  if (lang === "en") return latin / total >= 0.7 && hangul / total < 0.08 && kana / total < 0.08;
  if (lang === "vi") return latin / total >= 0.7 && /[ăâêôơưđáàảãạ]/i.test(text);
  return false;
}

function blobOfGuide(item: InstitutionGuideItem): string {
  return [item.title, item.summary, ...(item.facts ?? [])].join("\n");
}

async function translateJson<T>(lang: string, payload: T, instruction: string): Promise<T> {
  const langName = LANG_NAMES[lang] ?? "English";
  let response;
  try {
    response = await createJsonResponse({
      task: "translate",
      temperature: 0,
      maxOutputTokens: 2500,
      instructions: `You translate campus guide cards for international students.
Return STRICT JSON with the same keys as the input.
Write title and summary in ${langName}. Keep each "id" exactly unchanged.
Keep Korean university/building names and add a short ${langName} gloss in parentheses.
No markdown, no commentary.`,
      input: `${instruction}\n\n${JSON.stringify(payload)}`,
    });
  } catch {
    return payload;
  }
  const raw = stripToJson(response.text);
  try {
    return JSON.parse(raw) as T;
  } catch {
    return payload;
  }
}

type CardCopy = { id: string; title: string; summary: string };

function readCardCopies(parsed: unknown): CardCopy[] {
  if (!parsed || typeof parsed !== "object") return [];
  const root = parsed as { items?: unknown };
  const rows = Array.isArray(root.items) ? root.items : Array.isArray(parsed) ? parsed : [];
  return rows.filter((row): row is CardCopy => {
    if (!row || typeof row !== "object") return false;
    const item = row as CardCopy;
    return typeof item.id === "string" && typeof item.title === "string";
  });
}

export async function localizeGuideItems(
  items: InstitutionGuideItem[],
  lang: string,
): Promise<InstitutionGuideItem[]> {
  const target = normalizeUiLang(lang);
  if (items.length === 0 || target === "ko") return items;
  const cacheKey = `guides:${target}:${items.map((item) => item.id).join(",")}`;
  const cached = memory.get(cacheKey) as InstitutionGuideItem[] | undefined;
  if (cached) return cached;

  const listBlob = items.map((item) => `${item.title}\n${item.summary}`).join("\n");
  if (looksLikeLang(listBlob, target)) {
    memory.set(cacheKey, items);
    return items;
  }

  const CHUNK = 6;
  const merged = items.map((item) => ({ ...item }));
  let changed = false;
  for (let i = 0; i < items.length; i += CHUNK) {
    const slice = items.slice(i, i + CHUNK);
    const translated = await translateJson(
      target,
      { items: slice.map(({ id, title, summary }) => ({ id, title, summary })) },
      "Translate title and summary only.",
    );
    const byId = new Map(readCardCopies(translated).map((row) => [row.id, row]));
    for (let j = 0; j < slice.length; j += 1) {
      const hit = byId.get(slice[j].id);
      if (!hit?.title) continue;
      merged[i + j] = {
        ...slice[j],
        title: hit.title,
        summary: hit.summary || slice[j].summary,
      };
      changed = true;
    }
  }
  if (changed) memory.set(cacheKey, merged);
  return merged;
}

export async function localizeAndPersistGuides(
  institutionId: string,
  items: InstitutionGuideItem[],
  lang: string,
): Promise<InstitutionGuideItem[]> {
  const target = normalizeUiLang(lang);
  const localized = await localizeGuideItems(items, target);
  if (target !== "ko") return localized;

  await Promise.all(
    localized.map(async (item, index) => {
      const original = items[index];
      if (!original || item.id.startsWith("sample-")) return;
      if (item.id !== original.id) return;
      const unchanged =
        item.title === original.title &&
        item.summary === original.summary &&
        JSON.stringify(item.facts) === JSON.stringify(original.facts);
      if (unchanged) return;
      if (!looksLikeLang(blobOfGuide(item), "ko")) return;
      try {
        await prisma.institutionKnowledge.updateMany({
          where: { id: item.id, institutionId },
          data: {
            title: item.title,
            summary: item.summary,
            factsJson: JSON.stringify(item.facts ?? []),
            documentsJson: JSON.stringify(item.documents ?? []),
            whereToJson: JSON.stringify(item.whereTo ?? []),
            keywordsJson: JSON.stringify(item.keywords ?? []),
          },
        });
      } catch {
        /* keep localized response even if persist fails */
      }
    }),
  );

  return localized;
}

export async function localizeAdaptSections(sections: GuideSection[], lang: string): Promise<GuideSection[]> {
  const target = normalizeUiLang(lang);
  if (target === "ko") return sections;
  const cacheKey = `adapt:${target}`;
  const cached = memory.get(cacheKey) as GuideSection[] | undefined;
  if (cached) return cached;
  try {
    const next: GuideSection[] = [];
    for (const section of sections) {
      const translated = await translateJson(
        target,
        { section },
        "Localize this everyday international-student life section. Keep card ids stable.",
      );
      next.push(translated.section ?? section);
    }
    memory.set(cacheKey, next);
    return next;
  } catch {
    return sections;
  }
}
