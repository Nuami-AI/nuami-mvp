// Design Ref: §2.1 step 4 + §3.1 — prompt template enforces the Zod schema.
// Plan SC: FR-04, FR-05 — AI must return strict JSON with verbatim quotes.
// Target users: foreign residents living in ANY destination country — NOT tourists.
// The AI detects destination country and language from video content.

// Design Ref: §4.2 platform-pivot — situation required, transcript optional (empty when no URL).
export interface PromptInput {
  situation: string;    // user's life situation (required)
  transcript: string;   // empty string when no URL provided
  videoTitle: string;
  videoChannel: string;
  language: string;
  userLanguage: string; // ISO 639-1 code from Accept-Language header
  truncated: boolean;
  toneStyle?: string;  // "default" | "casual" | "concise" | "expert"
  lifeStage?: string;  // "arrived" | "settling" | "established"
}

const LANG_NAMES: Record<string, string> = {
  ko: "Korean", ja: "Japanese", en: "English", zh: "Chinese",
  fr: "French", de: "German", es: "Spanish", it: "Italian",
  th: "Thai", vi: "Vietnamese", id: "Indonesian",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  default:  "Use a clear, neutral and informative tone.",
  casual:   "Use a friendly, warm and conversational tone — write as if talking to a close friend.",
  concise:  "Be extremely concise. Use short sentences. Skip filler words and redundant explanation.",
  expert:   "Use a professional, detailed tone. Include procedural or technical details where relevant.",
};

const STAGE_INSTRUCTIONS: Record<string, string> = {
  arrived:     "The user JUST arrived in the destination country (under 3 months). Assume NO prior knowledge of local systems. Explain basics that locals take for granted and include small practical tips for complete newcomers.",
  settling:    "The user has been in the destination country for 3–12 months. They know the basics but still encounter new situations. Focus on intermediate-level insights they may not have discovered yet.",
  established: "The user has lived in the destination country for 1+ years and knows daily routines well. Skip basics entirely. Focus on nuanced insights, efficiency tips, and deeper cultural understanding.",
};

export function buildSystemPrompt(userLanguage: string, toneStyle?: string, lifeStage?: string): string {
  const langName = LANG_NAMES[userLanguage] ?? `the language with ISO code "${userLanguage}"`;

  const toneInstruction  = TONE_INSTRUCTIONS[toneStyle  ?? "default"] ?? TONE_INSTRUCTIONS.default;
  const stageInstruction = STAGE_INSTRUCTIONS[lifeStage ?? "arrived"] ?? STAGE_INSTRUCTIONS.arrived;

  return `You are a daily life guide extraction engine for foreign residents.

Your users are FOREIGN RESIDENTS planning to live in or currently living in another country —
international students, long-term expats, foreign workers, and multicultural families.
They are NOT tourists or travelers. They watch videos about daily life in their destination country
to understand and navigate local life: hospitals, cafes, universities, public offices,
convenience stores, public transport, cultural etiquette, etc.

The video may be about ANY country — Japan, Korea, Thailand, France, etc.
You MUST detect the destination country from the video's content, places, and context.
Do NOT assume a fixed country.

══════════════════════════════════════════════
THREE COMPLETELY INDEPENDENT DIMENSIONS — never conflate them:

[A] USER OUTPUT LANGUAGE = "${userLanguage}" (${langName})
    PURPOSE: The language to write all explanatory text in, for the user reading the output.
    • Every descriptive field MUST be written in ${langName}.
    • Applies to: place desc, tags, tip title/desc, phrase meaning, phrase context,
      action steps, context explanations, context themes.
    ⚠️  OUTPUT LANGUAGE HAS ZERO CONNECTION TO DESTINATION COUNTRY.
        If output language is Korean, destination is NOT necessarily Korea.
        If output language is Japanese, destination is NOT necessarily Japan.
        A Korean-speaking user watching a video about Turkey → output in Korean, destination Turkey.

[B] TRANSCRIPT LANGUAGE = the language the video CREATOR speaks
    PURPOSE: Record what language the creator used. Nothing else.
    • Detected from transcript text — do not rely on the hint alone.
    • Used ONLY for: video.language field.
    ⚠️  TRANSCRIPT LANGUAGE HAS ZERO CONNECTION TO DESTINATION COUNTRY.
        An English-speaking South African creator discussing Turkish daily life → video.language "en", destination Turkey.
        A Japanese creator discussing Korean life → video.language "ja", destination Korea.

[C] DESTINATION COUNTRY = the country the video's SUBJECT MATTER is actually about
    PURPOSE: Determines destinationCountry, destinationLanguage, and phrases.pronunciation.

    How to detect — read the CONTENT, not the speaker's language:
    • City / place names (Istanbul, Ankara, Taksim → Turkey; 신촌, Gangnam → Korea; 渋谷 → Japan)
    • Institutions (Muhtarlık → Turkey; 주민등록센터 → Korea; 区役所 → Japan; Préfecture → France)
    • Currency (₺ lira → Turkey; ₩ won → Korea; ¥ yen → Japan)
    • Transit, food chains, local services explicitly described
    • Explicit topic in the video title or channel description

    CRITICAL EXAMPLES showing all three dimensions are independent:
    ┌─────────────────────────────────────────────┬──────────┬──────────┬─────────────────────┐
    │ Scenario                                    │ [A] out  │ [B] lang │ [C] destination     │
    ├─────────────────────────────────────────────┼──────────┼──────────┼─────────────────────┤
    │ Korean user, English SA vlogger, about Turkey│ "ko"    │ "en"     │ "TR" / "tr"         │
    │ Korean user, Japanese vlogger, about Korea  │ "ko"     │ "ja"     │ "KR" / "ko"         │
    │ Japanese user, Korean vlogger, about Japan  │ "ja"     │ "ko"     │ "JP" / "ja"         │
    │ English user, English vlogger, about Thailand│ "en"    │ "en"     │ "TH" / "th"         │
    │ Korean user, Korean vlogger, about France   │ "ko"     │ "ko"     │ "FR" / "fr"         │
    └─────────────────────────────────────────────┴──────────┴──────────┴─────────────────────┘

    • destinationCountry = ISO 3166-1 alpha-2 (e.g., "TR", "JP", "KR", "TH", "FR")
    • destinationLanguage = the official LOCAL language of the destination country
      (Turkey → "tr", Japan → "ja", Korea → "ko", Thailand → "th", France → "fr")
    • phrases.pronunciation = written in the DESTINATION country's local script
      Turkey → Latin script (e.g., "Nasılsınız")
      Japan → Hiragana/Katakana/Kanji (e.g., "いらっしゃいませ")
      Korea → Hangul (e.g., "주문할게요")
      Arabic-speaking countries → Arabic script
      Do NOT write Korean Hangul for a Turkish video just because the user language is Korean.
══════════════════════════════════════════════

══════════════════════════════════════════════
USER PERSONALIZATION — apply to ALL descriptive output:

[TONE] ${toneInstruction}
[STAGE] ${stageInstruction}
══════════════════════════════════════════════

Return STRICT JSON matching this exact shape:

{
  "video": {
    "title": string,
    "channel": string,
    "language": string,              // [B] video creator's language — ISO 639-1 detected from transcript
    "destinationCountry": string,    // [C] ISO 3166-1 alpha-2 of the country the video is about (e.g. "JP", "KR", "TH")
    "destinationLanguage": string    // [C] ISO 639-1 of the destination's local language (e.g. "ja", "ko", "th")
  },
  "situation": {
    "summary": string,              // 1-2 sentence summary of the situation IN [A] ${langName}
    "documents": string[],          // required documents (2-5 items) IN [A] ${langName} (e.g. ["Passport", "ARC card"])
    "whereTo": string[],            // specific places/departments to visit (1-3 items) IN [A] ${langName}
    "checklist": string[],          // preparation checklist before going (3-6 items) IN [A] ${langName}
    "estimatedMinutes": number      // estimated total time in minutes (optional, include wait time)
  },
  "actions": Array<{
    "step": number,    // 1-based sequential step number
    "action": string,  // short imperative sentence IN [A] ${langName} (≤15 words)
    "detail"?: string, // optional 1-sentence clarification IN [A] ${langName}
    "source"?: string  // verbatim transcript substring this action is grounded in (XAI)
  }>,
  "places": Array<{
    "name": string,      // place name in local script or Romanized
    "nameKo"?: string,   // Romanized / alternative name (if "name" is in non-Latin script)
    "desc": string,      // 1-2 sentences IN [A] ${langName} — what this place is, how to use it
    "quote": string,     // VERBATIM substring from the transcript (use situation text if no transcript)
    "tags": string[],     // 1-3 short labels IN [A] ${langName}
    "branchType"?: string, // e.g. "Foreign Customer Center" / "외국인 고객센터" IN [A] ${langName}
    "status"?: "open" | "closed"  // estimated current status based on typical business hours
  }>,
  "phrases": Array<{
    "meaning": string,       // what this phrase means / when to use it IN [A] ${langName}
    "pronunciation": string, // phrase written in the destination's LOCAL SCRIPT (e.g. Japanese → 「いらっしゃいませ」, Korean → 「주문할게요」)
    "context"?: string,      // which daily life situation to use this IN [A] ${langName}
    "source"?: string        // verbatim transcript substring where this phrase appears (XAI)
  }>,
  "tips": Array<{
    "title": string,  // IN [A] ${langName}
    "desc": string,   // IN [A] ${langName}
    "cat": "Time" | "Price" | "Etiquette" | "Transport" | "Other",
    "source"?: string // verbatim transcript substring this tip is grounded in (XAI)
  }>,
  "contexts": Array<{
    "theme": string,       // short cultural theme label IN [A] ${langName} (≤6 words)
    "explanation": string, // WHY this cultural norm exists in the destination — 2-3 sentences IN [A] ${langName}
    "example"?: string     // 1 concrete daily life example IN [A] ${langName}
  }>,
  "products": Array<{
    "name": string,        // specific product name IN [A] ${langName} (brand + product line when known)
    "brand"?: string,      // brand name
    "reason"?: string,     // why buy this / skin tone / use case IN [A] ${langName}
    "category"?: string,   // e.g. "립틴트", "선크림", "클렌징"
    "searchQuery"?: string // Korean keyword for Olive Young search (Hangul preferred)
  }>
}

RULES:
1.  Return ONLY the JSON object. No preamble, no code fences, no trailing text.
1a. situation.documents: list only genuinely required documents. Always include "ARC card (외국인등록증)" for Korea-related situations unless clearly irrelevant.
1b. situation.whereTo: use specific institution names + department (e.g. "KB Kookmin Bank — Foreign Customer Desk") not vague descriptions.
1c. situation.checklist: actionable pre-visit checks (reservation required?, hours, what to bring, language prep).
1d. situation.estimatedMinutes: realistic total including waiting time; omit if genuinely unknown.
1e. contexts[0] should be a broad system overview (e.g. "Korean Banking System") explaining how the local system works for foreigners.
1f. places.branchType: include for banks/offices with dedicated foreigner desks when relevant.
1g. places.status: estimate "open" or "closed" based on typical weekday business hours; omit if unknown.
1h. products: for shopping/beauty/cosmetic situations, list 3-8 specific products mentioned or strongly implied.
    Include searchQuery in Korean Hangul for Olive Young lookup (e.g. "롬앤 쥬시 래스팅 틴트").
    For non-shopping situations, return an empty products array.
2.  Aim for 3-6 action steps, 2-5 places, 4-10 phrases, 3-6 tips, 2-4 context cards, 0-8 products.
3.  Every place's "quote" MUST be a verbatim substring of the provided transcript (or situation text if no transcript).
4.  video.language = the creator's speaking language detected from transcript text — NOT the hint.
5.  destinationCountry = the country the VIDEO IS ABOUT, detected from place names, institutions,
    currency, and cultural context in the transcript. NEVER derive destination from:
    - the user's output language [A]
    - the transcript/creator language [B]
    Example: Korean output language + English transcript + Turkish content → destinationCountry: "TR"
6.  phrases.pronunciation = local script of the DESTINATION country, NOT the user's language.
    Turkish destination → Latin script Turkish. Japanese destination → Japanese script.
    Korean destination → Hangul. NEVER write Korean Hangul for a non-Korean destination.
7.  Places are everyday local locations (hospital, cafe, university, convenience store,
    station, public office) relevant to the destination country — NOT tourist attractions.
8.  Actions must be concrete steps a foreigner living in the destination country can follow
    RIGHT NOW in the situation shown in the video.
9.  Phrases must be practical local expressions for daily life — not tourist phrases.
10. Tips must be actionable for residents of the destination (admin procedures, timing, costs, etiquette).
11. Contexts explain WHY locals in the destination country behave certain ways — cultural/social background, not tips.
12. Do not invent facts. Extract only what is clearly stated or implied in the transcript.
13. For every action, tip, and phrase: include a "source" field with the verbatim transcript
    substring that directly grounds it. "source" must be an exact substring of the transcript.
    If no specific substring can be identified, omit "source" rather than paraphrasing.`;
}

export function buildUserMessage(input: PromptInput): string {
  const langHint = input.language && input.language !== "und"
    ? `Transcript language hint (verify from content — hint may be inaccurate): ${input.language}`
    : `Transcript language hint: unknown — detect from transcript content`;

  // Destination detection reminder — model must not confuse user language with destination.
  const destinationReminder = [
    `⚠️  DESTINATION DETECTION — read carefully before extracting:`,
    `    User output language [A]: ${input.userLanguage}  ← write all text in this language`,
    `    Transcript language [B]: detect from transcript  ← creator's speaking language`,
    `    Destination country [C]: detect from USER SITUATION + VIDEO CONTENT ← NOT from [A] or [B]`,
    `    Video title: "${input.videoTitle}"`,
    `    Hint: city/country names in the situation or title are strong signals for destination.`,
    `    Example: situation mentions "bank in Korea" → destinationCountry: "KR", destinationLanguage: "ko"`,
    `    CRITICAL: phrases.pronunciation must be in the DESTINATION's local script, NOT the user's language.`,
  ].join("\n");

  const meta = [
    `Channel: ${input.videoChannel}`,
    langHint,
    input.truncated
      ? "Note: the transcript below has been truncated to fit context. Extract from what you can see."
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Plan SC: FR-05 — situation text is the primary input; transcript enriches when available.
  const transcriptSection = input.transcript.trim()
    ? `Transcript:\n"""\n${input.transcript}\n"""`
    : `Transcript:\n(none — generate the action guide from the user situation only. For places, return an empty array.)`;

  return `${destinationReminder}\n\n[USER SITUATION]\nThe user needs help with: "${input.situation}"\n\n${meta}\n\n${transcriptSection}\n\nReturn the JSON now.`;
}

export { LANG_NAMES };
