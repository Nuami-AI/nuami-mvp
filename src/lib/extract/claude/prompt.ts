// Design Ref: §2.1 step 4 + §3.1 — prompt template enforces the Zod schema.
// Plan SC: FR-04, FR-05 — Claude must return strict JSON with verbatim quotes.

export interface PromptInput {
  transcript: string;
  videoTitle: string;
  videoChannel: string;
  language: string;
  userLanguage: string; // ISO 639-1 code from Accept-Language header
  truncated: boolean;
}

// Country code → local language code mapping
const COUNTRY_LANG: Record<string, string> = {
  KR: "ko", JP: "ja", TH: "th", VN: "vi", CN: "zh",
  TW: "zh", FR: "fr", DE: "de", ES: "es", IT: "it",
  US: "en", GB: "en", AU: "en",
};

const LANG_NAMES: Record<string, string> = {
  ko: "Korean", ja: "Japanese", en: "English", zh: "Chinese",
  fr: "French", de: "German", es: "Spanish", it: "Italian",
  th: "Thai", vi: "Vietnamese", id: "Indonesian",
};

export function buildSystemPrompt(userLanguage: string): string {
  const langName = LANG_NAMES[userLanguage] ?? `the language with ISO code "${userLanguage}"`;

  return `You are a travel-content extraction engine.

══════════════════════════════════════════════
THREE LANGUAGES — understand each clearly:

[A] OUTPUT LANGUAGE = "${userLanguage}" (${langName})
    • Every descriptive field MUST be in ${langName}.
    • This applies to: place desc, tags, tip title/desc, phrase meaning, phrase context.
    • Do NOT use Arabic, Chinese, Thai, or any other language for these fields
      unless ${langName} IS that language.

[B] TRANSCRIPT LANGUAGE = the language the video creator actually speaks
    • Detect this yourself from the transcript text — do NOT rely solely on the hint.
    • A hint is provided but may be inaccurate (e.g., wrong auto-caption track).
    • Used only for: video.language field.

[C] DESTINATION LANGUAGE = the local language spoken at the travel destination
    • Detect the destination from PLACE NAMES in the transcript, NOT from [B].
    • Example: Korean YouTuber (transcript = "ko") visits Vietnam → destination = "VN", destinationLanguage = "vi".
    • Used only for: phrase.pronunciation (write the local phrase in destination script).
══════════════════════════════════════════════

Return STRICT JSON matching this exact shape:

{
  "video": {
    "title": string,
    "channel": string,
    "language": string,           // [B] video creator's language — ISO 639-1 detected from transcript text
    "destinationCountry": string, // [C] WHERE the video is about: "KR", "JP", "TH", "VN", "FR", etc.
    "destinationLanguage": string // [C] local language ISO 639-1: "ko", "ja", "th", "vi", "fr", etc.
  },
  "places": Array<{
    "name": string,      // place name in [C] local script or romanized
    "nameKo"?: string,   // romanized/English name if "name" is non-latin
    "desc": string,      // 1-2 sentences IN [A] ${langName}
    "quote": string,     // VERBATIM substring from the transcript
    "tags": string[]     // 1-3 short labels IN [A] ${langName}
  }>,
  "phrases": Array<{
    "meaning": string,       // translation/meaning IN [A] ${langName}
    "pronunciation": string, // phrase written in [C] destination local script
    "context"?: string       // situational context IN [A] ${langName}
  }>,
  "tips": Array<{
    "title": string, // IN [A] ${langName}
    "desc": string,  // IN [A] ${langName}
    "cat": "Time" | "Price" | "Etiquette" | "Transport" | "Other"
  }>
}

RULES:
1. Return ONLY the JSON object. No preamble, no code fences, no trailing text.
2. Every place's "quote" MUST be a verbatim substring of the provided transcript.
3. Aim for 3-8 places, 5-12 phrases, 3-6 tips.
4. "language" in video = detected transcript language from the text, NOT the hint.
5. "destinationCountry" = country code of WHERE the video was filmed/about.
6. Do not invent facts.
7. Phrases should be useful for travelers visiting the destination.
8. Tips should be actionable (timing, price, etiquette, transport).`;
}

export function buildUserMessage(input: PromptInput): string {
  const langHint = input.language && input.language !== "und"
    ? `Transcript language hint (verify from content — hint may be inaccurate): ${input.language}`
    : `Transcript language hint: unknown — detect from transcript content`;

  const header = [
    `Video title: ${input.videoTitle}`,
    `Channel: ${input.videoChannel}`,
    langHint,
    `User output language [A]: ${input.userLanguage}`,
    input.truncated
      ? "Note: the transcript below has been truncated to fit context. Extract from what you can see."
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `${header}\n\nTranscript:\n"""\n${input.transcript}\n"""\n\nReturn the JSON now.`;
}

export { COUNTRY_LANG, LANG_NAMES };
