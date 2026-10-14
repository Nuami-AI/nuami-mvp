import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-6-luna";

export function openaiModel(): string {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}

export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey });
}

export function getOpenAIOrNull(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return getOpenAI();
}

export async function createStoredJsonResponse(input: {
  client: OpenAI;
  task?: string;
  instructions: string;
  input: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
  const response = await input.client.responses.create({
    model: openaiModel(),
    instructions: input.instructions,
    input: input.input,
    store: false,
    prompt_cache_key: input.task ? `nuami-${input.task}` : undefined,
    max_output_tokens: input.maxOutputTokens,
    text: { format: { type: "json_object" } },
  });
  return {
    text: response.output_text ?? "",
    tokensIn: response.usage?.input_tokens ?? 0,
    tokensOut: response.usage?.output_tokens ?? 0,
  };
}
