// ISO 3166-1 alpha-2 → localized country name per UI language.
// Add more entries as needed; unmapped codes fall back to the raw code.

const COUNTRY_NAMES: Record<string, Record<string, string>> = {
  ko: {
    KR: "한국", JP: "일본", CN: "중국", TW: "대만",
    TH: "태국", VN: "베트남", ID: "인도네시아", PH: "필리핀",
    MY: "말레이시아", SG: "싱가포르", IN: "인도",
    TR: "튀르키예", DE: "독일", FR: "프랑스", GB: "영국",
    ES: "스페인", IT: "이탈리아", PT: "포르투갈",
    US: "미국", CA: "캐나다", AU: "호주", NZ: "뉴질랜드",
    MX: "멕시코", BR: "브라질", AR: "아르헨티나",
    EG: "이집트", ZA: "남아프리카",
  },
  en: {
    KR: "Korea", JP: "Japan", CN: "China", TW: "Taiwan",
    TH: "Thailand", VN: "Vietnam", ID: "Indonesia", PH: "Philippines",
    MY: "Malaysia", SG: "Singapore", IN: "India",
    TR: "Turkey", DE: "Germany", FR: "France", GB: "UK",
    ES: "Spain", IT: "Italy", PT: "Portugal",
    US: "USA", CA: "Canada", AU: "Australia", NZ: "New Zealand",
    MX: "Mexico", BR: "Brazil", AR: "Argentina",
    EG: "Egypt", ZA: "South Africa",
  },
  ja: {
    KR: "韓国", JP: "日本", CN: "中国", TW: "台湾",
    TH: "タイ", VN: "ベトナム", ID: "インドネシア", PH: "フィリピン",
    MY: "マレーシア", SG: "シンガポール", IN: "インド",
    TR: "トルコ", DE: "ドイツ", FR: "フランス", GB: "イギリス",
    ES: "スペイン", IT: "イタリア", PT: "ポルトガル",
    US: "アメリカ", CA: "カナダ", AU: "オーストラリア", NZ: "ニュージーランド",
    MX: "メキシコ", BR: "ブラジル", AR: "アルゼンチン",
    EG: "エジプト", ZA: "南アフリカ",
  },
};

export function getCountryName(code: string | undefined, uiLang: string): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return COUNTRY_NAMES[uiLang]?.[upper] ?? COUNTRY_NAMES.en?.[upper] ?? null;
}
