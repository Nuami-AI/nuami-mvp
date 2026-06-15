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
});

export const contextCardSchema = z.object({
  theme: z.string().min(1),
  explanation: z.string().min(1),
  example: z.string().optional(),
});

export const extractionSchema = z.object({
  video: videoMetaSchema,
  situation: situationCardSchema,
  actions: z.array(actionStepSchema).default([]),
  places: z.array(placeSchema),
  phrases: z.array(phraseSchema),
  tips: z.array(tipSchema),
  contexts: z.array(contextCardSchema).default([]),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: ExtractionResult = {} as z.infer<typeof extractionSchema>;
