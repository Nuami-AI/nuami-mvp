// Design Ref: §3.2 — 기준 딕셔너리. en.ts/ja.ts는 이 타입을 따른다.

export const ko = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  "nav.home":      "홈",
  "nav.content":   "콘텐츠",
  "nav.videoai":   "Video AI",
  "nav.bookmarks": "북마크",
  "nav.mypage":    "마이페이지",
  "nav.saved":     "저장됨",
  "nav.history":   "히스토리",

  // ── InputScreen ─────────────────────────────────────────────────────────────
  "input.welcome":         "안녕하세요!",
  "input.hero.title":      "영상에서 여행 정보를\n추출해드려요",
  "input.hero.desc":       "YouTube · Shorts · TikTok 링크를 입력하면 저장 가능한 카드로 정리해드려요. 지도 링크 · 현지 표현 · 맛집 · 장소 등",
  "input.url.label":       "Video URL",
  "input.url.placeholder": "https://www.youtube.com/watch?v=...",
  "input.cta.extract":     "추출하기",
  "input.cta.extracting":  "추출 중…",

  // ── Error Messages ───────────────────────────────────────────────────────────
  "error.invalidUrl":            "유효하지 않은 영상 URL입니다.",
  "error.unsupportedPlatform":   "TikTok 지원은 곧 추가됩니다.",
  "error.transcriptUnavailable": "이 영상의 자막을 읽을 수 없습니다.",
  "error.transcriptTooShort":    "영상이 너무 짧아 추출할 수 없습니다.",
  "error.claudeParseFailed":     "추출 결과를 파싱할 수 없습니다.",
  "error.rateLimited":           "요청 한도를 초과했습니다.",
  "error.internal":              "오류가 발생했습니다.",
  "error.tryAgain":              "잠시 후 다시 시도해주세요.",
  "error.tryYouTube":            "지금은 YouTube URL을 사용해주세요.",

  // ── ResultsScreen ────────────────────────────────────────────────────────────
  "results.reExtract":       "다시 추출",
  "results.places.title":    "장소",
  "results.places.empty":    "감지된 장소가 없습니다. 장소 설명이 더 많은 영상을 시도해보세요.",
  "results.phrases.title":   "현지 표현",
  "results.phrases.empty":   "감지된 표현이 없습니다.",
  "results.phrases.listen":  "듣기",
  "results.tips.title":      "인사이더 팁",
  "results.tips.empty":      "감지된 팁이 없습니다.",
  "results.mapKakao":        "카카오맵",
  "results.mapGoogle":       "구글맵",
  "results.culture":         "주변 문화행사",
  "results.banner.detected": "개 장소 감지됨",
  "results.banner.resultsIn":"로 결과 표시",

  // ── Content Page ─────────────────────────────────────────────────────────────
  "content.title":        "여행 가이드",
  "content.subtitle":     "현지에서 꼭 알아야 할 정보",
  "content.empty":        "콘텐츠가 없습니다.",
  "content.back":         "뒤로",
  "content.cat.all":      "전체",
  "content.cat.culture":  "문화",
  "content.cat.action":   "행동",
  "content.cat.food":     "음식",
  "content.cat.transport":"이동",
  "content.country.kr":   "한국",
  "content.country.jp":   "일본",

  // ── My Page ──────────────────────────────────────────────────────────────────
  "mypage.title":     "마이페이지",
  "mypage.lang.title":"언어 설정",
  "mypage.lang.desc": "앱 표시 언어를 선택하세요",

  // ── Common ───────────────────────────────────────────────────────────────────
  "common.back":    "뒤로",
  "common.loading": "로딩 중…",
  "common.retry":   "다시 시도",
} as const;

export type TranslationKey  = keyof typeof ko;
export type TranslationDict = Record<TranslationKey, string>;
