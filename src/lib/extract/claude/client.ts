import { coerceExtractionPayload, extractionSchema } from "@/lib/extract/schema";
import { createJsonResponse, stripToJson } from "@/lib/llm/json-response";

import { buildSystemPrompt, buildUserMessage, type PromptInput } from "./prompt";

const MAX_TRANSCRIPT_CHARS = 12_000;
const MAX_OUTPUT_TOKENS = 1800;

// Design Ref: §4.2 platform-pivot — situation added to PromptInput (required).
export interface ClaudeExtractResult {
  rawJson: string;
  tokensIn: number;
  tokensOut: number;
}

export class ClaudeParseError extends Error {
  readonly code = "CLAUDE_PARSE_FAILED" as const;
  constructor(message: string) {
    super(message);
    this.name = "ClaudeParseError";
  }
}

export function truncateTranscript(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_TRANSCRIPT_CHARS) {
    return { text, truncated: false };
  }
  return {
    text: text.slice(0, MAX_TRANSCRIPT_CHARS),
    truncated: true,
  };
}

export async function claudeExtract(input: PromptInput): Promise<ClaudeExtractResult> {
  const systemPrompt = buildSystemPrompt(input.userLanguage, input.toneStyle, input.lifeStage);

  let text: string;
  let tokensIn = 0;
  let tokensOut = 0;
  try {
    const response = await createJsonResponse({
      task: "guide",
      instructions: systemPrompt,
      input: buildUserMessage(input),
      temperature: 0.2,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      accept: acceptsExtractionSchema,
    });
    text = response.text;
    tokensIn = response.tokensIn;
    tokensOut = response.tokensOut;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[claudeExtract] LLM API error:", msg);
    throw err;
  }

  if (!text) {
    throw new ClaudeParseError("LLM returned no text content");
  }

  return {
    rawJson: stripToJson(text),
    tokensIn,
    tokensOut,
  };
}

function acceptsExtractionSchema(text: string): boolean {
  try {
    const parsed = JSON.parse(stripToJson(text)) as unknown;
    return extractionSchema.safeParse(coerceExtractionPayload(parsed)).success;
  } catch {
    return false;
  }
}
