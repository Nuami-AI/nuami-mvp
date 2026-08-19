import type { Place } from "@/types/extraction";

export type ResultVenue = "store" | "bank" | "hospital" | "immigration" | "default";

interface BuildQueriesInput {
  situation: string;
  venue: ResultVenue;
  places?: Place[];
  whereTo?: string[];
}

/** Generic landmarks — only used when the user did not express a specific place intent. */
const GENERIC_LANDMARK_QUERIES = new Set([
  "서울역",
  "명동",
  "강남역",
  "홍대입구",
  "이태원",
]);

const PLACE_INTENT_RULES: { pattern: RegExp; query: string }[] = [
  {
    pattern:
      /카페|커피|coffee|cafe|ラーテ|ラテ|コーヒー|カフェ|라떼|아메리카노|에스프레소|스타벅스|이디야|투썸/i,
    query: "카페",
  },
  {
    pattern:
      /맛집|음식|식당|밥|restaurant|food|먹|レストラン|飲食店|メニュー|注文|居酒屋|定食|料理|レストラン/i,
    query: "맛집",
  },
  { pattern: /편의점|convenience|cu\b|gs25|コンビニ|コンビニエンス/i, query: "편의점" },
  { pattern: /마트|슈퍼|supermarket|grocery|スーパー|スーパーマーケット/i, query: "마트" },
  { pattern: /약국|pharmacy|薬局|ドラッグストア/i, query: "약국" },
  { pattern: /병원|의원|clinic|hospital|病院|クリニック/i, query: "병원" },
  { pattern: /은행|bank|account|계좌|銀行/i, query: "은행" },
  { pattern: /체류지|전입|출입국|immigration|주소\s*변경|하이코리아/i, query: "출입국외국인청" },
  { pattern: /올리브영|올영|olive\s*young|oliveyoung|드럭스토어|화장품|뷰티/i, query: "올리브영" },
  { pattern: /다이소|daiso/i, query: "다이소" },
  { pattern: /지하철|subway|metro|地下鉄|駅/i, query: "지하철역" },
  { pattern: /버스|택시|bus|taxi/i, query: "버스정류장" },
  { pattern: /공항|airport/i, query: "인천국제공항" },
  {
    pattern:
      /기숙사|원룸|전세|월세|부동산|주거|dorm|rent|방|집|하우스|housing|apartment|숙소|임대|구하|lease|flat|room|셰어|쉐어|하숙|자취|거주/i,
    query: "부동산",
  },
  { pattern: /학교|대학|교수|수강|campus|university|school/i, query: "대학교" },
  { pattern: /유학|study\s*abroad|international\s*student/i, query: "유학생 기숙사" },
];

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

function normalizeSituation(situation: string): string {
  return situation.replace(/[?？!！.。~…]/g, " ").replace(/\s+/g, " ").trim();
}

function isNaturalLanguageSentence(text: string): boolean {
  const n = normalizeSituation(text);
  return (
    n.length > 14 ||
    /(싶어|하고|인데|어디|알려|추천|방법|왔는데|싶다|どう|すれば|なのに|です|ます|？|\?)/.test(n)
  );
}

/** Local-language search terms for Google Maps (non-Korea destinations). */
const GOOGLE_LOCAL_QUERIES: { pattern: RegExp; byCountry: Record<string, string> }[] = [
  {
    pattern: /レストラン|飲食店|メニュー|注文|居酒屋|定食|料理|restaurant|food|맛집|식당/i,
    byCountry: { JP: "レストラン", KR: "맛집", default: "restaurant" },
  },
  {
    pattern: /カフェ|コーヒー|coffee|cafe|카페|커피/i,
    byCountry: { JP: "カフェ", KR: "카페", default: "cafe" },
  },
  {
    pattern: /コンビニ|편의점|convenience/i,
    byCountry: { JP: "コンビニ", KR: "편의점", default: "convenience store" },
  },
  {
    pattern: /薬局|ドラッグストア|약국|pharmacy/i,
    byCountry: { JP: "薬局", KR: "약국", default: "pharmacy" },
  },
  {
    pattern: /病院|クリニック|병원|hospital/i,
    byCountry: { JP: "病院", KR: "병원", default: "hospital" },
  },
  {
    pattern: /銀行|은행|bank/i,
    byCountry: { JP: "銀行", KR: "은행", default: "bank" },
  },
  {
    pattern: /地下鉄|駅|지하철|subway/i,
    byCountry: { JP: "地下鉄駅", KR: "지하철역", default: "subway station" },
  },
];

export function resolveGoogleMapQuery(
  situation: string,
  country: string,
): { primary: string; queries: string[] } {
  const text = normalizeSituation(situation);
  const queries: string[] = [];

  for (const { pattern, byCountry } of GOOGLE_LOCAL_QUERIES) {
    if (pattern.test(text)) {
      const q = byCountry[country] ?? byCountry.default;
      if (!queries.includes(q)) queries.push(q);
    }
  }

  const primary = queries[0] ?? (country === "JP" ? "レストラン" : "restaurant");
  return { primary, queries: queries.length > 0 ? queries : [primary] };
}

function housingSupplementQueries(situation: string): string[] {
  const text = normalizeSituation(situation);
  const housing =
    /기숙사|원룸|전세|월세|부동산|주거|dorm|rent|방|집|하우스|housing|apartment|숙소|임대|구하|lease|flat|room|셰어|쉐어|하숙|자취|거주/i;
  if (!housing.test(text)) return [];

  const extras = ["부동산중개"];
  if (/원룸|방|자취|room/i.test(text)) extras.push("원룸");
  if (/유학|study\s*abroad|international\s*student/i.test(text)) extras.push("유학생 원룸");
  return extras;
}

export function extractPlaceIntentQueries(situation: string): string[] {
  const text = normalizeSituation(situation);
  const seen = new Set<string>();
  const queries: string[] = [];

  for (const { pattern, query } of PLACE_INTENT_RULES) {
    if (pattern.test(text) && !seen.has(query)) {
      seen.add(query);
      queries.push(query);
    }
  }

  return queries;
}

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

export function isMappableQuery(query: string): boolean {
  return !/하이코리아|전자민원|온라인 신청|hikorea/i.test(query);
}

function venueDefaults(venue: ResultVenue, situation: string): string[] {
  const intents = extractPlaceIntentQueries(situation);
  if (intents.length > 0) return intents;

  if (venue === "store") return ["올리브영", "드럭스토어"];
  if (venue === "bank") return ["은행"];
  if (venue === "hospital") return ["병원", "약국"];
  if (venue === "immigration") return ["출입국외국인청"];

  return [];
}

export function buildKakaoSearchQueries({
  situation,
  venue,
  places = [],
  whereTo = [],
}: BuildQueriesInput): string[] {
  const queries: string[] = [];
  const trimmed = situation.trim();
  const normalized = normalizeSituation(trimmed);

  for (const place of places) {
    if (place.nameKo?.trim()) queries.push(place.nameKo.trim());
    if (place.name?.trim()) queries.push(place.name.trim());
    for (const tag of place.tags ?? []) {
      if (tag.trim()) queries.push(tag.trim());
    }
  }

  for (const item of whereTo) {
    if (item.trim() && isMappableQuery(item)) queries.push(item.trim());
  }

  if (venue === "immigration") {
    queries.push("출입국외국인청");
  }

  queries.push(...extractPlaceIntentQueries(trimmed));
  queries.push(...housingSupplementQueries(trimmed));

  const areaHints = extractAreaHints(trimmed);
  const intents = extractPlaceIntentQueries(trimmed);
  if (areaHints[0] && intents[0]) {
    queries.push(`${areaHints[0]} ${intents[0]}`);
  }

  for (const { pattern, query } of BRAND_PATTERNS) {
    if (query && pattern.test(trimmed)) queries.push(query);
  }

  queries.push(...areaHints);

  if (intents.length === 0 && normalized.length >= 2 && normalized.length <= 14 && !isNaturalLanguageSentence(normalized)) {
    queries.push(normalized);
  }

  const hasSpecificIntent =
    places.length > 0 ||
    whereTo.length > 0 ||
    intents.length > 0 ||
    areaHints.length > 0;

  if (!hasSpecificIntent) {
    queries.push(...venueDefaults(venue, trimmed));
  }

  const seen = new Set<string>();
  const normalizedQueries: string[] = [];
  for (const q of queries) {
    const key = q.trim();
    if (!key || key.length < 2 || seen.has(key) || !isMappableQuery(key)) continue;
    seen.add(key);
    normalizedQueries.push(key);
  }

  return normalizedQueries.slice(0, 8);
}

export function pickPrimaryKakaoQuery(queries: string[]): string {
  const housing = queries.find((q) => q === "부동산" || q === "원룸" || q === "부동산중개");
  if (housing) return housing;

  const intent = queries.find((q) =>
    PLACE_INTENT_RULES.some((rule) => rule.query === q),
  );
  if (intent) return intent;

  const nonGeneric = queries.find((q) => q.length >= 2 && !GENERIC_LANDMARK_QUERIES.has(q) && !isNaturalLanguageSentence(q));
  if (nonGeneric) return nonGeneric;

  return queries.find((q) => q.length >= 2 && !isNaturalLanguageSentence(q)) ?? "";
}

export function resolveMapSearchQuery({
  situation,
  venue,
  places = [],
  whereTo = [],
  explicitQuery = "",
}: BuildQueriesInput & { explicitQuery?: string }): { primary: string; queries: string[] } {
  const mappableWhere = whereTo.filter((item) => item.trim() && isMappableQuery(item));
  const built = buildKakaoSearchQueries({ situation, venue, places, whereTo: mappableWhere });
  const intents = extractPlaceIntentQueries(situation);
  const areaHints = extractAreaHints(situation);
  const hasSpecific =
    places.length > 0 || mappableWhere.length > 0 || intents.length > 0 || areaHints.length > 0;

  let primary = "";
  const isImmigrationSearch =
    venue === "immigration" ||
    intents.includes("출입국외국인청") ||
    mappableWhere.some((item) => /출입국|immigration/i.test(item));
  if (isImmigrationSearch) {
    primary = "출입국외국인청";
  } else if (places[0]?.nameKo?.trim() && isMappableQuery(places[0].nameKo)) {
    primary = places[0].nameKo.trim();
  } else if (places[0]?.name?.trim() && isMappableQuery(places[0].name)) {
    primary = places[0].name.trim();
  } else if (mappableWhere[0]?.trim()) {
    primary = mappableWhere[0].trim();
  } else if (areaHints[0] && intents[0]) {
    primary = `${areaHints[0]} ${intents[0]}`;
  } else if (intents[0]) {
    primary = intents[0] === "유학생 기숙사" ? "부동산" : intents[0];
  } else {
    const explicit = normalizeSituation(explicitQuery);
    if (
      explicit.length >= 2 &&
      explicit.length <= 14 &&
      !isNaturalLanguageSentence(explicit) &&
      isMappableQuery(explicit)
    ) {
      primary = explicit;
    } else {
      primary = pickPrimaryKakaoQuery(built);
    }
  }

  const merged = [primary, ...built, ...mappableWhere].filter(Boolean);
  const seen = new Set<string>();
  const queries: string[] = [];

  for (const q of merged) {
    const key = q.trim();
    if (!key || key.length < 2 || seen.has(key) || !isMappableQuery(key)) continue;
    if (hasSpecific && GENERIC_LANDMARK_QUERIES.has(key) && key !== primary) continue;
    seen.add(key);
    queries.push(key);
  }

  return {
    primary: primary || queries[0] || "",
    queries: queries.slice(0, 6),
  };
}
