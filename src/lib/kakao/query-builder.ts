import type { Place } from "@/types/extraction";

export type ResultVenue = "store" | "bank" | "hospital" | "default";

interface BuildQueriesInput {
  situation: string;
  venue: ResultVenue;
  places?: Place[];
  whereTo?: string[];
}

const BRAND_PATTERNS: { pattern: RegExp; query: string }[] = [
  { pattern: /올리브영|올영|olive\s*young|oliveyoung/i, query: "올리브영" },
  { pattern: /다이소|daiso/i, query: "다이소" },
  { pattern: /무신사|musinsa/i, query: "무신사" },
  { pattern: /cu\b|씨유/i, query: "CU 편의점" },
  { pattern: /gs25|gs 25/i, query: "GS25" },
  { pattern: /이마트|emart|emart24/i, query: "이마트" },
  { pattern: /홈플러스|homeplus/i, query: "홈플러스" },
  { pattern: /카카오|kakao/i, query: "카카오" },
  { pattern: /신한|국민|우리|하나|kb|nh/i, query: "은행" },
  { pattern: /서울역|강남역|홍대|명동|이태원|신촌|성수|여의도/i, query: "" },
];

function extractAreaHints(situation: string): string[] {
  const hints: string[] = [];
  for (const { pattern, query } of BRAND_PATTERNS) {
    if (!query && pattern.test(situation)) {
      const match = situation.match(pattern);
      if (match?.[0]) hints.push(match[0]);
    }
  }
  const areaMatch = situation.match(
    /(서울|부산|대구|인천|광주|대전|울산|세종|강남|홍대|명동|이태원|신촌|성수|여의도|홍대입구|강남역|서울역)[^\s,]*/g,
  );
  if (areaMatch) hints.push(...areaMatch);
  return hints;
}

function venueDefaults(venue: ResultVenue, situation: string): string[] {
  const s = situation.toLowerCase();

  if (/음식|배달|주문|식당|맛집|food|delivery|mart|마트|편의점/i.test(s) &&
      !/쇼핑|올리브|할인|핫플|뷰티|화장품|드럭스토어/i.test(s)) {
    return ["맛집", "편의점", "마트"];
  }
  if (venue === "store" || /쇼핑|할인|핫플|핫템|매장|뷰티|화장품|드럭스토어|shopping|cosmetic/i.test(s)) {
    return ["올리브영", "드럭스토어", "명동"];
  }
  if (venue === "bank" || /은행|계좌|bank|account/i.test(s)) {
    return ["외국인 친화 은행", "KEB하나은행"];
  }
  if (venue === "hospital" || /병원|약국|hospital|clinic|pharmacy/i.test(s)) {
    return ["병원", "약국"];
  }
  if (/지하철|subway|metro/i.test(s)) return ["지하철역", "서울역"];
  if (/버스|택시|bus|taxi/i.test(s)) return ["버스정류장", "서울역"];
  if (/공항|airport/i.test(s)) return ["인천국제공항", "김포공항"];
  if (/고속버스|터미널/i.test(s)) return ["고속버스터미널", "경부고속터미널"];
  if (/기숙사|원룸|전세|월세|부동산|주거|dorm|rent/i.test(s)) {
    return ["부동산", "대학교 기숙사"];
  }
  if (/학교|교수|수강|campus|university|school/i.test(s)) {
    return ["대학교", "학교 행정실"];
  }

  return ["서울역", "명동"];
}

export function buildKakaoSearchQueries({
  situation,
  venue,
  places = [],
  whereTo = [],
}: BuildQueriesInput): string[] {
  const queries: string[] = [];
  const trimmed = situation.trim();

  for (const place of places) {
    if (place.nameKo?.trim()) queries.push(place.nameKo.trim());
    if (place.name?.trim()) queries.push(place.name.trim());
    for (const tag of place.tags ?? []) {
      if (tag.trim()) queries.push(tag.trim());
    }
  }

  for (const item of whereTo) {
    if (item.trim()) queries.push(item.trim());
  }

  for (const { pattern, query } of BRAND_PATTERNS) {
    if (query && pattern.test(trimmed)) queries.push(query);
  }

  queries.push(...extractAreaHints(trimmed));

  const defaults = venueDefaults(venue, trimmed);
  queries.push(...defaults);

  if (trimmed.length <= 20 && !/[?？]/.test(trimmed)) {
    queries.unshift(trimmed);
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const q of queries) {
    const key = q.trim();
    if (!key || key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    normalized.push(key);
  }

  return normalized.slice(0, 8);
}

export function pickPrimaryKakaoQuery(queries: string[]): string {
  return queries.find((q) => q.length >= 2) ?? "서울역";
}
