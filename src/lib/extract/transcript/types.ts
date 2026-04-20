// Design Ref: §9.1 Infrastructure layer contract — route.ts depends on this
// interface, not on `youtube-transcript` directly. Swappable without touching
// the route.

export interface TranscriptData {
  title: string;
  channel: string;
  text: string; // joined transcript lines, original language
  language: string; // "ko", "vi", "en", etc.
}

export interface TranscriptFetcher {
  fetch(videoId: string): Promise<TranscriptData>;
}

export class TranscriptUnavailableError extends Error {
  readonly code = "TRANSCRIPT_UNAVAILABLE" as const;
  constructor(message = "Transcript not available for this video") {
    super(message);
    this.name = "TranscriptUnavailableError";
  }
}

export class TranscriptTooShortError extends Error {
  readonly code = "TRANSCRIPT_TOO_SHORT" as const;
  constructor(message = "Transcript is too short to extract from") {
    super(message);
    this.name = "TranscriptTooShortError";
  }
}
