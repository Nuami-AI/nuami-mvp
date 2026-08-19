import { VERIFIED_SCENARIOS } from "./verified-data";
import type { SearchHit, SearchResult } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[?!.，。、]/g, " ").replace(/\s+/g, " ").trim();
}

export function extractKeywords(situation: string): string[] {
  const normalized = normalize(situation);
  const found = new Set<string>();
  for (const scenario of VERIFIED_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (normalized.includes(keyword.toLowerCase())) found.add(keyword);
    }
  }
  return [...found];
}

export function searchVerifiedData(situation: string): SearchResult {
  const normalized = normalize(situation);
  const keywords = extractKeywords(situation);

  const hits: SearchHit[] = VERIFIED_SCENARIOS.map((scenario) => {
    const matched = scenario.keywords.filter((keyword) =>
      normalized.includes(keyword.toLowerCase()),
    );
    return { scenario, score: matched.length };
  })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    keywords,
    hits,
    primary: hits[0]?.scenario ?? null,
  };
}
