// Design Ref: §6.3 — structured single-line JSON logging per request.
// Plan SC: FR-07 — requestId + duration + token counts + errorCode on every call.

import type { ExtractErrorCode, Platform } from "@/types/extraction";

export interface LogEvent {
  requestId: string;
  url: string;
  platform: Platform | "unparsed";
  durationMs: number;
  tokensIn?: number;
  tokensOut?: number;
  errorCode?: ExtractErrorCode;
  extractedCounts?: {
    places: number;
    phrases: number;
    tips: number;
  };
}

export function logEvent(event: LogEvent): void {
  // Single-line JSON for easy grep + log-aggregation compatibility (Vercel,
  // Datadog, Loki). We intentionally use console.info because console.log is
  // often filtered as verbose on serverless platforms.
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event });
  // eslint-disable-next-line no-console
  console.info(line);
}
