import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/content/agent";
import { ContentGenerateError } from "@/lib/content/types";
import type { ContentCountry, ContentCategory, ContentGenerateInput } from "@/lib/content/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (internalKey) {
    const provided = req.headers.get("x-internal-key");
    if (provided !== internalKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { country, category, topic, language } = body as Record<string, unknown>;

  const validCountries = ["KR", "JP"];
  const validCategories = ["culture", "action", "food", "transport"];
  const validLanguages = ["ko", "en", "ja"];

  if (!country || !validCountries.includes(country as string)) {
    return NextResponse.json({ error: "country must be KR or JP" }, { status: 400 });
  }
  if (!category || !validCategories.includes(category as string)) {
    return NextResponse.json({ error: "category must be culture|action|food|transport" }, { status: 400 });
  }
  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const input: ContentGenerateInput = {
    country: country as ContentCountry,
    category: category as ContentCategory,
    topic: (topic as string).trim(),
    language: language && validLanguages.includes(language as string) ? (language as ContentGenerateInput["language"]) : "ko",
  };

  try {
    const post = await generateContent(input);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof ContentGenerateError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[POST /api/content/generate]", error);
    return NextResponse.json({ error: "Content generation failed" }, { status: 500 });
  }
}
