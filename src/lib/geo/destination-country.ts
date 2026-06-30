/** Detect destination country from extraction metadata or situation text (ISO 3166-1 alpha-2). */
export function detectDestinationCountry(
  situation: string,
  explicit?: string | null,
): string {
  const code = explicit?.trim().toUpperCase();
  if (code && /^[A-Z]{2}$/.test(code)) return code;

  const text = situation;

  const rules: { code: string; pattern: RegExp }[] = [
    { code: "KR", pattern: /韓国|한국|korea|서울|부산|대구|인천|광주|대전|울산|세종|korean/i },
    { code: "JP", pattern: /日本|일본|japan|東京|大阪|京都|横浜|japanese|日本人/i },
    { code: "CN", pattern: /中国|중국|china|beijing|shanghai/i },
    { code: "TH", pattern: /タイ|태국|thailand|bangkok/i },
    { code: "US", pattern: /アメリカ|미국|usa|united states|new york|los angeles/i },
  ];

  for (const { code: c, pattern } of rules) {
    if (pattern.test(text)) return c;
  }

  return "KR";
}

export function usesKakaoMap(country: string): boolean {
  return country === "KR";
}

export function googleRegionLabel(country: string, uiLang: string): string {
  const labels: Record<string, Record<string, string>> = {
    KR: { ko: "한국", en: "Korea", ja: "韓国" },
    JP: { ko: "일본", en: "Japan", ja: "日本" },
    CN: { ko: "중국", en: "China", ja: "中国" },
    TH: { ko: "태국", en: "Thailand", ja: "タイ" },
    US: { ko: "미국", en: "USA", ja: "アメリカ" },
  };
  return labels[country]?.[uiLang] ?? labels[country]?.en ?? "";
}
