// Design Ref: §3.1 + §4.2 — Zod schema mirrors src/types/extraction.ts.
// This schema is the *server-side* gate on Claude output. If parsing fails,
// route.ts emits CLAUDE_PARSE_FAILED.

import { z } from "zod";

import type { ExtractionResult } from "@/types/extraction";

// Design Ref: §3.3 platform-pivot — SituationCard required in extraction output.
export const situationCardSchema = z.object({
  summary: z.string().min(1),
  documents: z.array(z.string()).default([]),
  whereTo: z.array(z.string()).default([]),
  checklist: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive().optional(),
});

function asObj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStr(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asPositiveInt(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}

const TIP_CATS = new Set(["Time", "Price", "Etiquette", "Transport", "Other"]);
const TIP_CAT_ALIASES: Record<string, string> = {
  time: "Time",
  시간: "Time",
  timing: "Time",
  price: "Price",
  가격: "Price",
  비용: "Price",
  cost: "Price",
  etiquette: "Etiquette",
  예절: "Etiquette",
  매너: "Etiquette",
  manners: "Etiquette",
  transport: "Transport",
  교통: "Transport",
  transit: "Transport",
  other: "Other",
  기타: "Other",
};

function tipCat(value: unknown): "Time" | "Price" | "Etiquette" | "Transport" | "Other" {
  if (typeof value !== "string") return "Other";
  const trimmed = value.trim();
  if (TIP_CATS.has(trimmed)) return trimmed as "Time" | "Price" | "Etiquette" | "Transport" | "Other";
  return (TIP_CAT_ALIASES[trimmed.toLowerCase()] ?? "Other") as
    | "Time"
    | "Price"
    | "Etiquette"
    | "Transport"
    | "Other";
}

function placeStatus(value: unknown): "open" | "closed" | undefined {
  if (value === "open" || value === "closed") return value;
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  if (["open", "열림", "영업", "영업중"].includes(v)) return "open";
  if (["closed", "닫힘", "휴무", "영업종료"].includes(v)) return "closed";
  return undefined;
}

/** Luna/Claude JSON이 스키마와 살짝 달라도 안내가 나가도록 보정합니다. */
export function coerceExtractionPayload(raw: unknown): unknown {
  const root = asObj(raw);
  const video = asObj(root.video);
  const situation = asObj(root.situation);
  const estimatedMinutes = asPositiveInt(situation.estimatedMinutes);

  return {
    video: {
      title: asStr(video.title, "NUAMI"),
      channel: asStr(video.channel, "NUAMI"),
      language: asStr(video.language, "und"),
      destinationCountry: asStr(video.destinationCountry) || undefined,
      destinationLanguage: asStr(video.destinationLanguage) || undefined,
    },
    situation: {
      summary: asStr(situation.summary, "안내를 준비했습니다."),
      documents: asArr(situation.documents).map((item) => asStr(item)).filter(Boolean),
      whereTo: asArr(situation.whereTo).map((item) => asStr(item)).filter(Boolean),
      checklist: asArr(situation.checklist).map((item) => asStr(item)).filter(Boolean),
      ...(estimatedMinutes ? { estimatedMinutes } : {}),
    },
    actions: asArr(root.actions).flatMap((item, idx) => {
      const row = asObj(item);
      const action = asStr(row.action);
      if (!action) return [];
      const step = asPositiveInt(row.step) ?? idx + 1;
      const stage = row.stage;
      return [{
        step,
        action,
        detail: asStr(row.detail) || undefined,
        source: asStr(row.source) || undefined,
        stage:
          stage === "prepare" || stage === "move" || stage === "apply" || stage === "confirm"
            ? stage
            : undefined,
      }];
    }),
    places: asArr(root.places).flatMap((item) => {
      const row = asObj(item);
      const name = asStr(row.name);
      const desc = asStr(row.desc, asStr(row.description));
      if (!name || !desc) return [];
      return [{
        name,
        nameKo: asStr(row.nameKo) || undefined,
        desc,
        quote: asStr(row.quote, name),
        tags: asArr(row.tags).map((tag) => asStr(tag)).filter(Boolean).slice(0, 5),
        branchType: asStr(row.branchType) || undefined,
        status: placeStatus(row.status),
      }];
    }),
    phrases: asArr(root.phrases).flatMap((item) => {
      const row = asObj(item);
      const meaning = asStr(row.meaning);
      const pronunciation = asStr(row.pronunciation, asStr(row.phrase, meaning));
      if (!meaning || !pronunciation) return [];
      return [{
        meaning,
        pronunciation,
        context: asStr(row.context) || undefined,
        source: asStr(row.source) || undefined,
      }];
    }),
    tips: asArr(root.tips).flatMap((item) => {
      const row = asObj(item);
      const title = asStr(row.title);
      const desc = asStr(row.desc, asStr(row.description));
      if (!title || !desc) return [];
      return [{
        title,
        desc,
        cat: tipCat(row.cat),
        source: asStr(row.source) || undefined,
      }];
    }),
    contexts: asArr(root.contexts).flatMap((item) => {
      const row = asObj(item);
      const theme = asStr(row.theme);
      const explanation = asStr(row.explanation);
      if (!theme || !explanation) return [];
      return [{
        theme,
        explanation,
        example: asStr(row.example) || undefined,
      }];
    }),
    products: asArr(root.products).flatMap((item) => {
      const row = asObj(item);
      const name = asStr(row.name);
      if (!name) return [];
      return [{
        name,
        brand: asStr(row.brand) || undefined,
        reason: asStr(row.reason) || undefined,
        category: asStr(row.category) || undefined,
        searchQuery: asStr(row.searchQuery) || undefined,
        memo: asStr(row.memo) || undefined,
      }];
    }),
  };
}

export const videoMetaSchema = z.object({
  title: z.string().min(1),
  channel: z.string().min(1),
  language: z.string().min(1),
  destinationCountry: z.string().optional(),
  destinationLanguage: z.string().optional(),
});

export const placeSchema = z.object({
  name: z.string().min(1),
  nameKo: z.string().optional(),
  desc: z.string().min(1),
  quote: z.string().min(1),
  tags: z.array(z.string()).max(5).default([]),
  branchType: z.string().optional(),
  status: z.enum(["open", "closed"]).optional(),
});

export const phraseSchema = z.object({
  meaning: z.string().min(1),        // user language translation
  pronunciation: z.string().min(1),  // destination local language phrase
  context: z.string().optional(),
  source: z.string().optional(),     // XAI: verbatim transcript quote
});

export const tipCategorySchema = z.enum([
  "Time",
  "Price",
  "Etiquette",
  "Transport",
  "Other",
]);

export const tipSchema = z.object({
  title: z.string().min(1),
  desc: z.string().min(1),
  cat: tipCategorySchema,
  source: z.string().optional(), // XAI: verbatim transcript quote
});

export const actionStepSchema = z.object({
  step: z.number().int().positive(),
  action: z.string().min(1),
  detail: z.string().optional(),
  source: z.string().optional(), // XAI: verbatim transcript quote
  stage: z.enum(["prepare", "move", "apply", "confirm"]).optional(),
});

export const contextCardSchema = z.object({
  theme: z.string().min(1),
  explanation: z.string().min(1),
  example: z.string().optional(),
});

export const productItemSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  reason: z.string().optional(),
  category: z.string().optional(),
  searchQuery: z.string().optional(),
  memo: z.string().optional(),
});

export const extractionSchema = z.object({
  video: videoMetaSchema,
  situation: situationCardSchema,
  actions: z.array(actionStepSchema).default([]),
  places: z.array(placeSchema).default([]),
  phrases: z.array(phraseSchema).default([]),
  tips: z.array(tipSchema).default([]),
  contexts: z.array(contextCardSchema).default([]),
  products: z.array(productItemSchema).default([]),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: ExtractionResult = {} as z.infer<typeof extractionSchema>;
