// Design Ref: §3.1 + §4.2 — Zod schema mirrors src/types/extraction.ts.
// This schema is the *server-side* gate on Claude output. If parsing fails,
// route.ts emits CLAUDE_PARSE_FAILED.

import { z } from "zod";

import type { ExtractionResult } from "@/types/extraction";

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
});

export const phraseSchema = z.object({
  meaning: z.string().min(1),        // user language translation
  pronunciation: z.string().min(1),  // destination local language phrase
  context: z.string().optional(),
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
});

export const extractionSchema = z.object({
  video: videoMetaSchema,
  places: z.array(placeSchema),
  phrases: z.array(phraseSchema),
  tips: z.array(tipSchema),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: ExtractionResult = {} as z.infer<typeof extractionSchema>;
