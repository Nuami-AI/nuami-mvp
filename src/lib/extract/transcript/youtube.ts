// Design Ref: §9.1 Infrastructure — YouTube-specific impl of TranscriptFetcher.
// Plan SC: FR-02 — returns TRANSCRIPT_UNAVAILABLE on missing captions.
//
// Uses the community `youtube-transcript` library (no API key, no quota).
// The library returns an array of { text, duration, offset } lines for the
// default caption track. We also fetch the oEmbed endpoint for title/channel
// metadata because the transcript library doesn't provide it.

import { YoutubeTranscript } from "youtube-transcript";

import {
  TranscriptUnavailableError,
  type TranscriptData,
  type TranscriptFetcher,
} from "./types";

interface OEmbedResponse {
  title?: string;
  author_name?: string;
}

async function fetchOEmbed(videoId: string): Promise<{ title: string; channel: string }> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { title: "Untitled video", channel: "Unknown channel" };
    }
    const data = (await res.json()) as OEmbedResponse;
    return {
      title: data.title ?? "Untitled video",
      channel: data.author_name ?? "Unknown channel",
    };
  } catch {
    return { title: "Untitled video", channel: "Unknown channel" };
  }
}

export const youtubeTranscriptFetcher: TranscriptFetcher = {
  async fetch(videoId: string): Promise<TranscriptData> {
    if (!videoId) {
      throw new TranscriptUnavailableError("Missing videoId");
    }

    // Fetch transcript and metadata in parallel.
    const [transcriptResult, meta] = await Promise.all([
      safeFetchTranscript(videoId),
      fetchOEmbed(videoId),
    ]);

    if (!transcriptResult || transcriptResult.lines.length === 0) {
      throw new TranscriptUnavailableError("No captions available for this video");
    }

    const text = transcriptResult.lines
      .map((l) => l.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      title: meta.title,
      channel: meta.channel,
      text,
      language: transcriptResult.language,
    };
  },
};

// Known "auto-translated" or unreliable track codes that should not be
// trusted as the video's original language.
const UNRELIABLE_LANG_CODES = new Set(["und", "zxx", "mis", "mul"]);

async function safeFetchTranscript(
  videoId: string
): Promise<{ lines: { text: string }[]; language: string } | null> {
  try {
    const lines = await YoutubeTranscript.fetchTranscript(videoId);
    const first = lines[0] as unknown as { lang?: string } | undefined;
    const rawLang = first?.lang?.toLowerCase().split("-")[0] ?? "und";
    // Use "und" as sentinel for unreliable/unknown codes so the LLM auto-detects.
    const language = UNRELIABLE_LANG_CODES.has(rawLang) ? "und" : rawLang;
    return { lines, language };
  } catch {
    return null;
  }
}
