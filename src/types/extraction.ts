// Design Ref: §3.1 — single source of truth for extraction types, shared by
// the Zod schema (server) and the React props (client).

export type Platform = "youtube" | "tiktok" | "unknown";

export interface VideoMeta {
  title: string;
  channel: string;
  language: string;             // video's original language (ISO 639-1)
  destinationCountry?: string;  // detected from places: "KR" | "JP" | "TH" | etc.
  destinationLanguage?: string; // local language of destination: "ko" | "ja" | "th" | etc.
  userLanguage?: string;        // user's UI language (from Accept-Language)
  videoId?: string;
}

export interface Place {
  name: string; // English / Romanized
  nameKo?: string; // Original-language name (optional)
  desc: string; // 1–2 sentence English description
  quote: string; // verbatim transcript substring, original language
  tags: string[]; // 1–3 short labels
}

export interface Phrase {
  meaning: string;        // translation in user's language
  pronunciation: string;  // phrase in destination local language
  context?: string;
}

export type TipCategory = "Time" | "Price" | "Etiquette" | "Transport" | "Other";

export interface Tip {
  title: string;
  desc: string;
  cat: TipCategory;
}

export interface ExtractionResult {
  video: VideoMeta;
  places: Place[];
  phrases: Phrase[];
  tips: Tip[];
}

export type ExtractErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PLATFORM"
  | "TRANSCRIPT_UNAVAILABLE"
  | "TRANSCRIPT_TOO_SHORT"
  | "CLAUDE_PARSE_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL";

export interface ExtractError {
  code: ExtractErrorCode;
  message: string;
  hint?: string;
  requestId: string;
}

export type ExtractResponse =
  | { data: ExtractionResult }
  | { error: ExtractError };
