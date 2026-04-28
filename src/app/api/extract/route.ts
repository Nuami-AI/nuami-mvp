// Design Ref: §2.1 component diagram + §4.2 API spec — orchestrator for the
// full extraction pipeline.
// Plan SC: FR-01 through FR-11.
//
// Next.js 16 App Router Route Handler. Node runtime is REQUIRED for the
// Anthropic SDK (uses Node streams). Verified against
// node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md.

import { NextResponse } from "next/server";

import { claudeExtract, ClaudeParseError, truncateTranscript } from "@/lib/extract/claude/client";
import { logEvent } from "@/lib/extract/logger";
import { parseUrl } from "@/lib/extract/parse-url";
import { checkRateLimit } from "@/lib/extract/rate-limit";
import { extractionSchema } from "@/lib/extract/schema";
import {
  TranscriptTooShortError,
  TranscriptUnavailableError,
} from "@/lib/extract/transcript/types";
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

export const runtime = "nodejs"; // Anthropic SDK requires Node
export const dynamic = "force-dynamic"; // never cache — every call hits Claude

const MIN_TRANSCRIPT_CHARS = 200;

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const ip = getClientIp(request);

  // --- 1. Parse body ---------------------------------------------------------
  let url = "";
  let bodyUserLang: string | undefined;
  let bodyToneStyle: string | undefined;
  let bodyLifeStage: string | undefined;
  try {
    const body = (await request.json()) as { url?: unknown; userLang?: unknown; toneStyle?: unknown; lifeStage?: unknown };
    if (typeof body.url !== "string" || body.url.trim().length === 0) {
      return emitError(requestId, url, "unparsed", startedAt, {
        code: "INVALID_URL",
        message: "Request body must include a non-empty string `url`.",
        hint: "Paste a full YouTube URL like https://www.youtube.com/watch?v=...",
      });
    }
    url = body.url.trim();
    if (typeof body.userLang === "string") bodyUserLang = body.userLang;
    if (typeof body.toneStyle === "string") bodyToneStyle = body.toneStyle;
    if (typeof body.lifeStage === "string") bodyLifeStage = body.lifeStage;
  } catch {
    return emitError(requestId, "", "unparsed", startedAt, {
      code: "INVALID_URL",
      message: "Request body must be valid JSON with a `url` field.",
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

  // --- 3. Parse URL ----------------------------------------------------------
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

  // --- 4. Fetch transcript ---------------------------------------------------
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
      message: "This video is too short to extract from.",
      hint: "Try a video that's at least 1 minute long.",
    });
  }

  // --- 5. Truncate + call Claude --------------------------------------------
  const { text: truncatedText, truncated } = truncateTranscript(transcriptData.text);

  const acceptLang = request.headers.get("accept-language") ?? "ko";
  const browserLang = acceptLang.split(",")[0]?.split(";")[0]?.split("-")[0]?.trim() ?? "ko";
  const userLanguage = bodyUserLang ?? browserLang;

  let claudeResult;
  try {
    claudeResult = await claudeExtract({
      transcript: truncatedText,
      videoTitle: transcriptData.title,
      videoChannel: transcriptData.channel,
      language: transcriptData.language,
      userLanguage,
      truncated,
      toneStyle: bodyToneStyle,
      lifeStage: bodyLifeStage,
    });
  } catch (err) {
    const code: ExtractErrorCode = err instanceof ClaudeParseError ? "CLAUDE_PARSE_FAILED" : "INTERNAL";
    return emitError(requestId, url, "youtube", startedAt, {
      code,
      message: "Extraction service is temporarily unavailable.",
      hint: "Please try again in a moment.",
    });
  }

  // --- 6. Parse JSON + Zod validate -----------------------------------------
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

  // --- 7. Hallucination guard: drop places whose quote isn't in transcript ---
  // Plan FR-05 — substring match is case-insensitive to survive the whitespace
  // normalization we did during fetch.
  const normalizedTranscript = transcriptData.text.toLowerCase();
  const kept: Place[] = zodResult.data.places.filter((p) =>
    normalizedTranscript.includes(p.quote.toLowerCase())
  );

  const result: ExtractionResult = {
    video: {
      // Prefer Claude's detected language; fall back to library value.
      title: zodResult.data.video.title || transcriptData.title,
      channel: zodResult.data.video.channel || transcriptData.channel,
      language: zodResult.data.video.language || transcriptData.language,
      destinationCountry: zodResult.data.video.destinationCountry,
      destinationLanguage: zodResult.data.video.destinationLanguage,
      userLanguage,
      videoId: parsed.videoId,
    },
    actions: zodResult.data.actions,
    places: kept,
    phrases: zodResult.data.phrases,
    tips: zodResult.data.tips,
    contexts: zodResult.data.contexts,
  };

  // --- 8. Log usage event for tester ----------------------------------------
  if (session.role === "tester") {
    await logUsageEvent(session.email, "video_ai_use", { url });
  }

  // --- 9. Log + respond ------------------------------------------------------
  logEvent({
    requestId,
    url,
    platform: "youtube",
    durationMs: Date.now() - startedAt,
    tokensIn: claudeResult.tokensIn,
    tokensOut: claudeResult.tokensOut,
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
