import OpenAI from "openai";

import { buildSystemPrompt, buildUserMessage, type PromptInput } from "./prompt";

const MAX_TRANSCRIPT_CHARS = 12_000;
const DEFAULT_MODEL = "gpt-4o-mini";
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

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
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
  const client = getClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const systemPrompt = buildSystemPrompt(input.userLanguage, input.toneStyle, input.lifeStage);

  let response;
  try {
    response = await client.chat.completions.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
      seed: 42,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserMessage(input) },
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[claudeExtract] OpenAI API error:", msg);
    throw err;
  }

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new ClaudeParseError("OpenAI returned no text content");
  }

  const raw = stripToJson(text);

  return {
    rawJson: raw,
    tokensIn: response.usage?.prompt_tokens ?? 0,
    tokensOut: response.usage?.completion_tokens ?? 0,
  };
}

function stripToJson(text: string): string {
  const trimmed = text.trim();

  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/m.exec(trimmed);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  return trimmed;
}
