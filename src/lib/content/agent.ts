import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import type { ContentGenerateInput, ContentPost, ContentCountry, ContentCategory, ContentLanguage, ContentVisibility } from "./types";
import { ContentGenerateError } from "./types";

const client = new Anthropic();

const COUNTRY_LABELS: Record<string, string> = { KR: "한국", JP: "일본" };
const CATEGORY_LABELS: Record<string, string> = {
  culture: "여가활동",
  action: "행동 가이드",
  food: "음식",
  transport: "이동/교통",
};

interface AgentOutput {
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

export async function generateContent(input: ContentGenerateInput): Promise<ContentPost> {
  const countryLabel = COUNTRY_LABELS[input.country] ?? input.country;
  const categoryLabel = CATEGORY_LABELS[input.category] ?? input.category;
  const lang = input.language ?? "ko";

  const systemPrompt = `당신은 ${countryLabel}에 거주하는 외국인(유학생·장기체류자·외국인 근로자)을 위한 ${categoryLabel} 생활 가이드 콘텐츠 작가입니다. 현지에서 실제로 생활하는 데 꼭 필요한 실용적인 정보를 제공합니다. 여행자 정보(관광지, 단기 방문 팁)는 제공하지 않습니다.`;

  const userPrompt = `"${input.topic}"에 대한 거주 외국인용 생활 가이드를 작성해주세요.

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": "제목 (30자 이내)",
  "summary": "한 줄 요약 (60자 이내)",
  "body": "본문 (마크다운, 400-800자)",
  "tags": ["태그1", "태그2", "태그3"]
}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    temperature: 0.2,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  let parsed: AgentOutput;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    parsed = JSON.parse(jsonMatch[0]) as AgentOutput;
  } catch {
    throw new ContentGenerateError(`Failed to parse agent response: ${rawText.slice(0, 200)}`);
  }

  if (!parsed.title || !parsed.summary || !parsed.body) {
    throw new ContentGenerateError("Agent response missing required fields");
  }

  const tags = Array.isArray(parsed.tags) ? parsed.tags.filter((t) => typeof t === "string") : [];

  const row = await prisma.contentPost.create({
    data: {
      title: parsed.title,
      summary: parsed.summary,
      body: parsed.body,
      country: input.country,
      category: input.category,
      tags: JSON.stringify(tags),
      language: lang,
      visibility: "PUBLIC",
    },
  });

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    country: row.country as ContentCountry,
    category: row.category as ContentCategory,
    tags,
    language: row.language as ContentLanguage,
    visibility: row.visibility as ContentVisibility,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
