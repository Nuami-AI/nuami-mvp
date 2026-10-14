import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-5-5";
const PLACEHOLDER_KEY = "sk-ant-...";

export function anthropicModel(): string {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
}

export function hasAnthropicKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  return key.startsWith("sk-ant-") && key !== PLACEHOLDER_KEY;
}

function workspaceHeaders(): Record<string, string> {
  const id = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  return id ? { "anthropic-workspace-id": id } : {};
}

export function getAnthropic(): Anthropic {
  if (!hasAnthropicKey()) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: workspaceHeaders(),
  });
}

export async function createClaudeJsonResponse(input: {
  task?: string;
  instructions: string;
  input: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
  const systemText = `${input.instructions}\nReturn valid JSON only. No markdown, no commentary.`;
  const message = await getAnthropic().messages.create({
    model: anthropicModel(),
    max_tokens: input.maxOutputTokens ?? 1800,
    temperature: input.temperature,
    system: [
      {
        type: "text",
        text: systemText,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: input.input }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    text,
    tokensIn: message.usage.input_tokens,
    tokensOut: message.usage.output_tokens,
  };
}
