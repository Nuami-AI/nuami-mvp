// Design Ref: §2.1 component diagram + §4.2 API spec — orchestrator for the
// full extraction pipeline.
// Plan SC: FR-01 through FR-11.
//
// Next.js 16 App Router Route Handler. Node runtime is REQUIRED for the
// Anthropic SDK (uses Node streams). Verified against
// node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md.

import { NextResponse } from "next/server";

import { ClaudeParseError, truncateTranscript } from "@/lib/extract/claude/client";
import { logEvent } from "@/lib/extract/logger";
import { parseUrl } from "@/lib/extract/parse-url";
import { checkRateLimit } from "@/lib/extract/rate-limit";
import { extractionSchema } from "@/lib/extract/schema";
import {
  TranscriptTooShortError,
  TranscriptUnavailableError,
} from "@/lib/extract/transcript/types";
import {
  MIN_TRANSCRIPT_CHARS,
  SHORT_FORM_TRANSCRIPT_CHARS,
} from "@/lib/extract/transcript/constants";
import { youtubeTranscriptFetcher } from "@/lib/extract/transcript/youtube";
import type {
  ExtractError,
  ExtractErrorCode,
  ExtractResponse,
  ExtractionResult,
  Place,
} from "@/types/extraction";
import { getSessionFromRequest } from "@/lib/auth/session";
import { checkGate, logEvent as logUsageEvent } from "@/lib/usage/tracker";
import { runGuidePipeline } from "@/lib/guide/pipeline";
import type { StayType } from "@/lib/guide/types";

export const runtime = "nodejs"; // Anthropic SDK requires Node
export const dynamic = "force-dynamic"; // never cache — every call hits Claude
export const maxDuration = 90;

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const ip = getClientIp(request);

  // --- 1. Parse body ---------------------------------------------------------
  // Design Ref: §4.1 platform-pivot — situation required, url optional.
  let situation = "";
  let url = "";
  let bodyUserLang: string | undefined;
  let bodyToneStyle: string | undefined;
  let bodyLifeStage: string | undefined;
  let bodyStayType: StayType | undefined;
  let bodyLat: number | undefined;
  let bodyLng: number | undefined;
  let bodyUniversityId: string | undefined;
  let bodyKnowledgeId: string | undefined;
  try {
    const body = (await request.json()) as {
      situation?: unknown;
      url?: unknown;
      userLang?: unknown;
      toneStyle?: unknown;
      lifeStage?: unknown;
      stayType?: unknown;
      lat?: unknown;
      lng?: unknown;
      universityId?: unknown;
      knowledgeId?: unknown;
    };
    if (typeof body.situation !== "string" || body.situation.trim().length === 0) {
      return emitError(requestId, "", "unparsed", startedAt, {
        code: "INVALID_SITUATION",
        message: "Request body must include a non-empty string `situation`.",
        hint: "Describe what you need help with, e.g. 'I want to open a bank account'.",
      });
    }
    situation = body.situation.trim();
    if (typeof body.url === "string" && body.url.trim().length > 0) url = body.url.trim();
    if (typeof body.userLang === "string") bodyUserLang = body.userLang;
    if (typeof body.toneStyle === "string") bodyToneStyle = body.toneStyle;
    if (typeof body.lifeStage === "string") bodyLifeStage = body.lifeStage;
    if (body.stayType === "D-2" || body.stayType === "D-4" || body.stayType === "other") {
      bodyStayType = body.stayType;
    }
    if (typeof body.lat === "number" && Number.isFinite(body.lat)) bodyLat = body.lat;
    if (typeof body.lng === "number" && Number.isFinite(body.lng)) bodyLng = body.lng;
    if (typeof body.universityId === "string" && body.universityId.trim()) {
      bodyUniversityId = body.universityId.trim();
    }
    if (typeof body.knowledgeId === "string" && body.knowledgeId.trim()) {
      bodyKnowledgeId = body.knowledgeId.trim();
    }
  } catch {
    return emitError(requestId, "", "unparsed", startedAt, {
      code: "INVALID_SITUATION",
      message: "Request body must be valid JSON with a `situation` field.",
    });
  }

  // --- 2. Usage gate (market-validation) ------------------------------------
  // Plan SC: FR-05 — admin passes freely; tester blocked at limit
  const session = await getSessionFromRequest(request);
  if (!session) {
    return emitError(requestId, url, "unparsed", startedAt, {
      code: "UNAUTHORIZED",
      message: "로그인이 필요합니다.",
    });
  }
  if (session.role === "tester") {
    const gate = await checkGate(session.email);
    if (!gate.allowed) {
      await logUsageEvent(session.email, "paywall_shown", { url });
      const body: ExtractResponse = {
        error: {
          code: "LIMIT_EXCEEDED",
          message: "무료 체험 횟수를 모두 사용했습니다.",
          requestId,
          used: gate.used,
          limit: gate.limit,
        },
      };
      return NextResponse.json(body, { status: 402 });
    }
  }

  // --- 3. Rate limit ---------------------------------------------------------
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    const errResp = emitError(requestId, url, "unparsed", startedAt, {
      code: "RATE_LIMITED",
      message: "Too many requests.",
      hint: `Try again in ${limit.retryAfterSeconds}s.`,
    });
    errResp.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return errResp;
  }

  const acceptLang = request.headers.get("accept-language") ?? "ko";
  const browserLang = acceptLang.split(",")[0]?.split(";")[0]?.split("-")[0]?.trim() ?? "ko";
  const userLanguage = bodyUserLang ?? browserLang;

  // Design Ref: §2.1 platform-pivot — two paths: text-only vs text+URL.
  let transcriptText = "";
  let videoTitle = situation;
  let videoChannel = "NUAMI";
  let videoLanguage = "und";
  let truncated = false;
  let parsedVideoId: string | undefined;

  if (url) {
    // --- 3. Parse URL --------------------------------------------------------
    let parsed;
    try {
      parsed = parseUrl(url);
    } catch {
      return emitError(requestId, url, "unparsed", startedAt, {
        code: "INVALID_URL",
        message: "Could not parse the provided URL.",
        hint: "Paste a full YouTube URL like https://www.youtube.com/watch?v=...",
      });
    }

    if (parsed.platform === "tiktok") {
      return emitError(requestId, url, "tiktok", startedAt, {
        code: "UNSUPPORTED_PLATFORM",
        message: "TikTok support is coming soon.",
        hint: "Try a YouTube URL for now.",
      });
    }
    if (parsed.platform !== "youtube") {
      return emitError(requestId, url, "unknown", startedAt, {
        code: "UNSUPPORTED_PLATFORM",
        message: "Only YouTube URLs are supported right now.",
        hint: "Paste a YouTube watch, Shorts, or youtu.be link.",
      });
    }

    // --- 4. Fetch transcript -------------------------------------------------
    let transcriptData;
    try {
      transcriptData = await youtubeTranscriptFetcher.fetch(parsed.videoId);
    } catch (err) {
      if (err instanceof TranscriptUnavailableError) {
        return emitError(requestId, url, "youtube", startedAt, {
          code: "TRANSCRIPT_UNAVAILABLE",
          message: "This video has no captions we can read.",
          hint: "Try another video with auto-captions or manual subtitles.",
        });
      }
      return emitError(requestId, url, "youtube", startedAt, {
        code: "INTERNAL",
        message: "Failed to fetch transcript.",
      });
    }

    if (transcriptData.text.length < MIN_TRANSCRIPT_CHARS) {
      return emitError(requestId, url, "youtube", startedAt, {
        code: "TRANSCRIPT_TOO_SHORT",
        message: "Not enough captions to summarize this video.",
        hint: "Try a video with spoken narration or auto-captions (Shorts are OK if subtitles exist).",
      });
    }

    const truncateResult = truncateTranscript(transcriptData.text);
    transcriptText = truncateResult.text;
    truncated = truncateResult.truncated;
    videoTitle = transcriptData.title;
    videoChannel = transcriptData.channel;
    videoLanguage = transcriptData.language;
    parsedVideoId = parsed.videoId;
  }

  // --- 5. Search → Reason → Generate ----------------------------------------
  let claudeResult: { rawJson: string; tokensIn: number; tokensOut: number } | null = null;
  let templateResult: ExtractionResult | null = null;
  let pipelineMeta;
  try {
    const pipeline = await runGuidePipeline({
      situation,
      transcript: transcriptText,
      videoTitle,
      videoChannel,
      language: videoLanguage,
      userLanguage,
      truncated,
      shortForm: transcriptText.length <= SHORT_FORM_TRANSCRIPT_CHARS,
      toneStyle: bodyToneStyle,
      lifeStage: bodyLifeStage,
      stayType: bodyStayType,
      lat: bodyLat,
      lng: bodyLng,
      universityId: bodyUniversityId,
      knowledgeId: bodyKnowledgeId,
    });
    claudeResult = pipeline.claude;
    templateResult = pipeline.template;
    pipelineMeta = pipeline.meta;
  } catch (err) {
    const code: ExtractErrorCode = err instanceof ClaudeParseError ? "CLAUDE_PARSE_FAILED" : "INTERNAL";
    return emitError(requestId, url || situation, url ? "youtube" : "unknown", startedAt, {
      code,
      message: "Extraction service is temporarily unavailable.",
      hint: "Please try again in a moment.",
    });
  }

  // --- 6. Parse JSON + Zod validate (or use verified template) --------------
  let result: ExtractionResult;

  if (templateResult) {
    result = { ...templateResult, pipeline: pipelineMeta };
  } else if (claudeResult) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(claudeResult.rawJson);
    } catch {
      return emitError(
        requestId,
        url,
        "youtube",
        startedAt,
        {
          code: "CLAUDE_PARSE_FAILED",
          message: "We couldn't parse the extraction result.",
          hint: "This is on us. Please try again in a moment.",
        },
        claudeResult.tokensIn,
        claudeResult.tokensOut
      );
    }

    const zodResult = extractionSchema.safeParse(parsedJson);
    if (!zodResult.success) {
      return emitError(
        requestId,
        url,
        "youtube",
        startedAt,
        {
          code: "CLAUDE_PARSE_FAILED",
          message: "Extraction result did not match the expected shape.",
          hint: "Please try again in a moment.",
        },
        claudeResult.tokensIn,
        claudeResult.tokensOut
      );
    }

    let kept: Place[];
    if (transcriptText) {
      const normalizedTranscript = transcriptText.toLowerCase();
      kept = zodResult.data.places.filter((p) =>
        normalizedTranscript.includes(p.quote.toLowerCase())
      );
    } else {
      kept = [];
    }

    result = {
      video: {
        title: zodResult.data.video.title || videoTitle,
        channel: zodResult.data.video.channel || videoChannel,
        language: zodResult.data.video.language || videoLanguage,
        destinationCountry: zodResult.data.video.destinationCountry,
        destinationLanguage: zodResult.data.video.destinationLanguage,
        userLanguage,
        videoId: parsedVideoId,
      },
      situation: zodResult.data.situation,
      actions: assignActionStages(zodResult.data.actions),
      places: kept,
      phrases: zodResult.data.phrases,
      tips: zodResult.data.tips,
      contexts: zodResult.data.contexts,
      products: zodResult.data.products,
      pipeline: pipelineMeta,
    };
  } else {
    return emitError(requestId, url || situation, url ? "youtube" : "unknown", startedAt, {
      code: "INTERNAL",
      message: "Extraction service is temporarily unavailable.",
      hint: "Please try again in a moment.",
    });
  }

  // --- 8. Log usage event for tester ----------------------------------------
  if (session.role === "tester") {
    await logUsageEvent(session.email, "video_ai_use", { situation, url: url || undefined });
  }

  // --- 9. Log + respond ------------------------------------------------------
  logEvent({
    requestId,
    url: url || situation,
    platform: url ? "youtube" : "unknown",
    durationMs: Date.now() - startedAt,
    tokensIn: claudeResult?.tokensIn,
    tokensOut: claudeResult?.tokensOut,
    extractedCounts: {
      places: result.places.length,
      phrases: result.phrases.length,
      tips: result.tips.length,
    },
  });

  const body: ExtractResponse = { data: result };
  return NextResponse.json(body, { status: 200 });
}

// --- Helpers ---------------------------------------------------------------

function assignActionStages(actions: ExtractionResult["actions"]): ExtractionResult["actions"] {
  const stages = ["prepare", "move", "apply", "confirm"] as const;
  if (actions.length === 0) return actions;
  if (actions.every((a) => a.stage)) return actions;
  return actions.map((action, idx) => {
    if (action.stage) return action;
    const bucket = Math.min(stages.length - 1, Math.floor((idx / actions.length) * stages.length));
    return { ...action, stage: stages[bucket] };
  });
}

function getClientIp(request: Request): string {
  // Vercel sets x-forwarded-for. Fall back to a literal to avoid leaking
  // "undefined" as a rate-limit key.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function emitError(
  requestId: string,
  url: string,
  platform: "youtube" | "tiktok" | "unknown" | "unparsed",
  startedAt: number,
  partial: Omit<ExtractError, "requestId">,
  tokensIn?: number,
  tokensOut?: number
): NextResponse {
  const error: ExtractError = { ...partial, requestId };
  logEvent({
    requestId,
    url,
    platform,
    durationMs: Date.now() - startedAt,
    tokensIn,
    tokensOut,
    errorCode: error.code,
  });
  const body: ExtractResponse = { error };
  return NextResponse.json(body, { status: statusForCode(error.code) });
}

function statusForCode(code: ExtractErrorCode): number {
  switch (code) {
    case "INVALID_SITUATION":
    case "INVALID_URL":
    case "UNSUPPORTED_PLATFORM":
      return 400;
    case "TRANSCRIPT_UNAVAILABLE":
      return 404;
    case "TRANSCRIPT_TOO_SHORT":
      return 422;
    case "RATE_LIMITED":
      return 429;
    case "UNAUTHORIZED":
      return 401;
    case "LIMIT_EXCEEDED":
      return 402;
    case "CLAUDE_PARSE_FAILED":
      return 502;
    case "INTERNAL":
    default:
      return 500;
  }
}
