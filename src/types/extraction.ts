// Design Ref: §3.1 — single source of truth for extraction types, shared by
// the Zod schema (server) and the React props (client).
// Design Ref: §3.1 platform-pivot — SituationCard added as required field.

export type Platform = "youtube" | "tiktok" | "unknown";

export interface SituationCard {
  summary: string;
  documents: string[];
  whereTo: string[];
  checklist: string[];
  estimatedMinutes?: number;
}

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
  branchType?: string; // e.g. "외국인 고객센터"
  status?: "open" | "closed";
}

export interface Phrase {
  meaning: string;        // translation in user's language
  pronunciation: string;  // phrase in destination local language
  context?: string;
  source?: string;        // XAI: verbatim transcript quote grounding this phrase
}

export type TipCategory = "Time" | "Price" | "Etiquette" | "Transport" | "Other";

export interface Tip {
  title: string;
  desc: string;
  cat: TipCategory;
  source?: string; // XAI: verbatim transcript quote grounding this tip
}

export type BehaviorStage = "prepare" | "move" | "apply" | "confirm";

export interface ActionStep {
  step: number;
  action: string;
  detail?: string;
  source?: string; // XAI: verbatim transcript quote grounding this action
  stage?: BehaviorStage; // 준비 → 이동 → 신청 → 확인
}

export interface GuidePipelineMeta {
  search: { matched: boolean; scenarioId?: string; keywords: string[] };
  reason: { stayType: string; region: string; agencies: string[] };
  generate: { mode: "llm" | "verified-template" | "institution-cache"; grounded: boolean };
  sources: Array<{ name: string; url?: string }>;
  asOf?: string;
  institution?: {
    id: string;
    name: string;
    reused: boolean;
    titles: string[];
  };
  openData?: {
    live: boolean;
    queriedAt: string;
    facilities: Array<{
      name: string;
      address?: string;
      phone?: string;
      category?: string;
      provider: string;
      dataset: string;
      datasetUrl?: string;
      live: boolean;
    }>;
  };
}

export interface ContextCard {
  theme: string;       // short cultural theme label
  explanation: string; // why this behavior/norm exists culturally
  example?: string;    // concrete real-world example
}

/** Products the user may want to buy — extracted from video/situation for shopping memos */
export interface ProductItem {
  name: string;           // product name IN user language
  brand?: string;
  reason?: string;        // why recommended / when to use
  category?: string;      // e.g. "립틴트", "선크림"
  searchQuery?: string;   // Korean keyword for Olive Young search
  memo?: string;
}

export interface ExtractionResult {
  video: VideoMeta;
  situation: SituationCard;
  actions: ActionStep[];
  places: Place[];
  phrases: Phrase[];
  tips: Tip[];
  contexts: ContextCard[];
  products: ProductItem[];
  pipeline?: GuidePipelineMeta;
}

export type ExtractErrorCode =
  | "INVALID_SITUATION"
  | "INVALID_URL"
  | "UNSUPPORTED_PLATFORM"
  | "TRANSCRIPT_UNAVAILABLE"
  | "TRANSCRIPT_TOO_SHORT"
  | "CLAUDE_PARSE_FAILED"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "LIMIT_EXCEEDED"
  | "INTERNAL";

export interface ExtractError {
  code: ExtractErrorCode;
  message: string;
  hint?: string;
  requestId: string;
  used?: number;
  limit?: number;
}

export type ExtractResponse =
  | { data: ExtractionResult }
  | { error: ExtractError };
