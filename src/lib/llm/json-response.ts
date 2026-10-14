import { createClaudeJsonResponse, hasAnthropicKey } from "@/lib/anthropic/client";
import { recordLlmUsage } from "@/lib/llm/usage";
import { createStoredJsonResponse, getOpenAI } from "@/lib/openai/client";

export type LlmProvider = "openai" | "anthropic";
/** guide: 실시간 안내 JSON / ingest: 한국어 공식문서 추출 / translate: 카드 번역 */
export type LlmTask = "guide" | "ingest" | "translate";

export function hasOpenAIKey(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  return key.startsWith("sk-");
}

function availableProviders(): LlmProvider[] {
  const out: LlmProvider[] = [];
  if (hasOpenAIKey()) out.push("openai");
  if (hasAnthropicKey()) out.push("anthropic");
  return out;
}

function forcedProvider(): LlmProvider | null {
  const raw = (process.env.LLM_PROVIDER || "auto").trim().toLowerCase();
  if (raw === "anthropic" || raw === "claude") return "anthropic";
  if (raw === "openai") return "openai";
  return null;
}

/** 작업에 맞는 1차 모델. 2차는 JSON/호출 실패 시에만. */
export function providersForTask(task: LlmTask): LlmProvider[] {
  const available = availableProviders();
  const forced = forcedProvider();
  if (forced) return available.filter((p) => p === forced);

  const preferred: LlmProvider[] =
    task === "ingest" ? ["anthropic", "openai"] : ["openai", "anthropic"];
  return preferred.filter((p) => available.includes(p));
}

export function stripToJson(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/m.exec(trimmed);
  if (fenced?.[1]) return fenced[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function isValidJson(text: string): boolean {
  if (!text.trim()) return false;
  try {
    JSON.parse(stripToJson(text));
    return true;
  } catch {
    return false;
  }
}

async function callProvider(
  provider: LlmProvider,
  input: {
    task: LlmTask;
    instructions: string;
    input: string;
    temperature?: number;
    maxOutputTokens?: number;
  },
): Promise<{ text: string; tokensIn: number; tokensOut: number; provider: LlmProvider }> {
  const result =
    provider === "openai"
      ? await createStoredJsonResponse({
          client: getOpenAI(),
          task: input.task,
          instructions: input.instructions,
          input: input.input,
          temperature: input.temperature,
          maxOutputTokens: input.maxOutputTokens,
        })
      : await createClaudeJsonResponse({
          task: input.task,
          instructions: input.instructions,
          input: input.input,
          temperature: input.temperature,
          maxOutputTokens: input.maxOutputTokens,
        });
  return { ...result, provider };
}

export async function createJsonResponse(input: {
  task: LlmTask;
  instructions: string;
  input: string;
  temperature?: number;
  maxOutputTokens?: number;
  accept?: (text: string) => boolean;
}): Promise<{ text: string; tokensIn: number; tokensOut: number; provider: LlmProvider }> {
  const order = providersForTask(input.task);
  if (order.length === 0) {
    throw new Error("OPENAI_API_KEY or ANTHROPIC_API_KEY is not configured");
  }

  const usable = (text: string) =>
    isValidJson(text) && (input.accept ? input.accept(text) : true);

  let lastError: unknown;
  for (let i = 0; i < order.length; i += 1) {
    const provider = order[i];
    const hasFallback = i < order.length - 1;
    try {
      const result = await callProvider(provider, input);
      const accepted = usable(result.text);
      await recordLlmUsage({
        provider,
        task: input.task,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        ok: accepted,
        error: accepted ? undefined : "invalid JSON",
      });
      if (accepted) {
        if (i > 0) {
          console.info(`[llm] ${input.task} recovered with ${provider}`);
        }
        return result;
      }
      lastError = new Error(`${provider} returned invalid JSON`);
      if (hasFallback) {
        console.warn(`[llm] ${input.task} ${provider} JSON invalid, trying next`);
        continue;
      }
    } catch (err) {
      lastError = err;
      await recordLlmUsage({
        provider,
        task: input.task,
        tokensIn: 0,
        tokensOut: 0,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
      if (hasFallback) {
        console.warn(
          `[llm] ${input.task} ${provider} failed, trying next:`,
          err instanceof Error ? err.message : err,
        );
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("LLM request failed");
}
