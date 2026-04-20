// Design Ref: §2.1 step 2 — URL parsing is a pure domain function with no I/O.
// Plan SC: FR-01, FR-03 — supports youtube.com/watch, youtu.be, shorts; detects TikTok.

import type { Platform } from "@/types/extraction";

export interface ParsedUrl {
  platform: Platform;
  videoId: string; // empty string for unknown / TikTok
}

/**
 * Parse a user-submitted URL into a normalized (platform, videoId) tuple.
 *
 * Supported YouTube shapes:
 *   - https://www.youtube.com/watch?v=<id>
 *   - https://youtu.be/<id>
 *   - https://www.youtube.com/shorts/<id>
 *   - https://m.youtube.com/watch?v=<id>
 *
 * TikTok is detected but returns videoId="" because we don't support extraction yet.
 *
 * Throws if the input is not a parseable URL.
 */
export function parseUrl(input: string): ParsedUrl {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new Error("Empty URL");
  }

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Malformed URL");
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  // YouTube long form: youtube.com/watch?v=<id>
  if (host === "youtube.com" && url.pathname === "/watch") {
    const id = url.searchParams.get("v");
    if (id && isValidYoutubeId(id)) {
      return { platform: "youtube", videoId: id };
    }
  }

  // YouTube short form: youtu.be/<id>
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
    if (isValidYoutubeId(id)) {
      return { platform: "youtube", videoId: id };
    }
  }

  // YouTube Shorts: youtube.com/shorts/<id>
  if (host === "youtube.com" && url.pathname.startsWith("/shorts/")) {
    const id = url.pathname.replace("/shorts/", "").split("/")[0] ?? "";
    if (isValidYoutubeId(id)) {
      return { platform: "youtube", videoId: id };
    }
  }

  // TikTok (detected, but unsupported for MVP)
  if (host === "tiktok.com" || host === "vm.tiktok.com") {
    return { platform: "tiktok", videoId: "" };
  }

  return { platform: "unknown", videoId: "" };
}

function isValidYoutubeId(id: string): boolean {
  // YouTube video IDs are 11 chars, base64-url alphabet.
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}
