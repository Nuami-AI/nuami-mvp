# ui-i18n Design Document

> **Summary**: 경량 TypeScript i18n 딕셔너리 + React Context로 ko/en/ja UI 다국어 지원
>
> **Project**: nuami-mvp
> **Author**: JJUN
> **Date**: 2026-04-20
> **Status**: Approved
> **Planning Doc**: [ui-i18n.plan.md](../01-plan/features/ui-i18n.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | UI가 영어 하드코딩 → 한국어 기본값 불일치 + 다국어 사용자 지원 불가 |
| **WHO** | 한국어/영어/일본어 사용 여행 콘텐츠 소비자 |
| **RISK** | Hydration mismatch (localStorage는 SSR 불가); 번역 키 누락 |
| **SUCCESS** | 전체 UI 한국어 기본 + 마이페이지 언어 전환 즉시 반영 |
| **SCOPE** | Phase 1: i18n 인프라 → Phase 2: 컴포넌트 적용 → Phase 3: 마이페이지 |

---

## Selected Architecture: Option C — Pragmatic Balance

외부 라이브러리 없음. TypeScript 딕셔너리 + React Context. 번들 증가 < 3KB.

---

## 1. Overview

### 1.1 Design Goals

- TypeScript 타입으로 번역 키 누락을 컴파일 타임에 검출
- SSR → CSR hydration mismatch 없음 (초기 렌더링은 항상 `ko`)
- `useLanguage()` 훅 하나로 모든 Client Component에서 번역 접근
- localStorage 저장 → 재방문 시 유지

### 1.2 Design Principles

- **No external dependency**: next-intl, i18next 없음
- **Type-safe keys**: `TranslationKey` 타입으로 오타 방지
- **SSR-safe**: `useEffect`에서만 localStorage 읽기
- **Single source of truth**: `ko.ts`가 기준 딕셔너리, en/ja는 동일 구조

---

## 2. System Architecture

### 2.1 흐름도

```
[앱 시작]
    │
    ▼
[layout.tsx] → LanguageProvider 래핑
    │
    ├─ SSR: lang = 'ko' (초기값 고정)
    │
    └─ CSR (useEffect):
           1. localStorage.getItem('nuami-lang')
           2. navigator.language.split('-')[0]
           3. fallback: 'ko'
           → setLang(detected)

[컴포넌트]
const { t, lang, setLang } = useLanguage();
t('nav.videoai') → 'Video AI' or '비디오 AI' or 'ビデオAI'
```

### 2.2 언어 감지 순서

```
Priority 1: localStorage.getItem('nuami-lang')  → 사용자 명시 설정
Priority 2: navigator.language (en-US → 'en', ja-JP → 'ja', ko-KR → 'ko')
Priority 3: 지원 목록에 없으면 'ko' (기본값)
```

---

## 3. Data Model

### 3.1 Type 정의 (`src/lib/i18n/types.ts`)

```typescript
export type Language = 'ko' | 'en' | 'ja';

export const SUPPORTED_LANGUAGES: Language[] = ['ko', 'en', 'ja'];

export const LANGUAGE_LABELS: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

// ko.ts 딕셔너리 구조를 기준으로 타입 생성
export type TranslationDict = typeof import('./ko').ko;
export type TranslationKey = keyof TranslationDict;  // flat key (단순 string)
```

### 3.2 번역 딕셔너리 구조 (`src/lib/i18n/ko.ts`)

```typescript
export const ko = {
  // ── Navigation ──────────────────────
  'nav.home':       '홈',
  'nav.content':    '콘텐츠',
  'nav.videoai':    'Video AI',
  'nav.bookmarks':  '북마크',
  'nav.mypage':     '마이페이지',
  'nav.saved':      '저장됨',
  'nav.history':    '히스토리',

  // ── InputScreen ─────────────────────
  'input.welcome':          '안녕하세요!',
  'input.hero.title':       '영상에서 여행 정보를\n추출해드려요',
  'input.hero.desc':        'YouTube · Shorts · TikTok 링크를 입력하면 저장 가능한 카드로 정리해드려요. 지도 링크 · 현지 표현 · 맛집 · 장소 등',
  'input.url.label':        'Video URL',
  'input.url.placeholder':  'https://www.youtube.com/watch?v=...',
  'input.cta.extract':      '추출하기',
  'input.cta.extracting':   '추출 중…',

  // ── Error Messages ───────────────────
  'error.invalidUrl':           '유효하지 않은 영상 URL입니다.',
  'error.unsupportedPlatform':  'TikTok 지원은 곧 추가됩니다.',
  'error.transcriptUnavailable':'이 영상의 자막을 읽을 수 없습니다.',
  'error.transcriptTooShort':   '영상이 너무 짧아 추출할 수 없습니다.',
  'error.claudeParseFailed':    '추출 결과를 파싱할 수 없습니다.',
  'error.rateLimited':          '요청 한도를 초과했습니다.',
  'error.internal':             '오류가 발생했습니다.',
  'error.tryAgain':             '잠시 후 다시 시도해주세요.',
  'error.tryYouTube':           '지금은 YouTube URL을 사용해주세요.',

  // ── ResultsScreen ────────────────────
  'results.reExtract':          '다시 추출',
  'results.places.title':       '장소',
  'results.places.empty':       '감지된 장소가 없습니다. 장소 설명이 더 많은 영상을 시도해보세요.',
  'results.phrases.title':      '현지 표현',
  'results.phrases.empty':      '감지된 표현이 없습니다.',
  'results.phrases.listen':     '듣기',
  'results.tips.title':         '인사이더 팁',
  'results.tips.empty':         '감지된 팁이 없습니다.',
  'results.mapKakao':           '카카오맵',
  'results.mapGoogle':          '구글맵',
  'results.culture':            '주변 문화행사',
  'results.banner.detected':    '개 장소 감지됨',  // "{N}개 장소 감지됨"
  'results.banner.resultsIn':   '로 결과 표시',    // "{lang}로 결과 표시"

  // ── Content Page ─────────────────────
  'content.title':              '여행 가이드',
  'content.subtitle':           '현지에서 꼭 알아야 할 정보',
  'content.empty':              '콘텐츠가 없습니다.',
  'content.back':               '뒤로',
  'content.cat.all':            '전체',
  'content.cat.culture':        '문화',
  'content.cat.action':         '행동',
  'content.cat.food':           '음식',
  'content.cat.transport':      '이동',
  'content.country.kr':         '한국',
  'content.country.jp':         '일본',

  // ── My Page ──────────────────────────
  'mypage.title':               '마이페이지',
  'mypage.lang.title':          '언어 설정',
  'mypage.lang.desc':           '앱 표시 언어를 선택하세요',

  // ── Common ───────────────────────────
  'common.back':                '뒤로',
  'common.loading':             '로딩 중…',
  'common.retry':               '다시 시도',
} as const;
```

---

## 4. 컴포넌트 설계

### 4.1 LanguageContext (`src/lib/i18n/index.tsx`)

```typescript
'use client';

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('ko');  // SSR: 항상 'ko'
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // CSR에서만 실행 — hydration 안전
    const saved = localStorage.getItem('nuami-lang') as Language | null;
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      setLangState(saved);
    } else {
      const browser = navigator.language.split('-')[0] as Language;
      if (SUPPORTED_LANGUAGES.includes(browser)) setLangState(browser);
    }
    setMounted(true);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('nuami-lang', l);
  };

  const t = (key: TranslationKey): string => {
    const dict = DICTS[lang];
    return dict[key] ?? DICTS['ko'][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <div suppressHydrationWarning>
        {mounted ? children : <div suppressHydrationWarning>{children}</div>}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
```

**Hydration 전략**:
- SSR: `lang = 'ko'`, `mounted = false`
- CSR (useEffect): localStorage/navigator 감지 후 언어 결정
- `suppressHydrationWarning` 으로 초기 불일치 억제

### 4.2 Server Component 처리 전략

Server Components (`content/page.tsx`, `content/[id]/page.tsx`)는 React Context 불가.

**해결**: 텍스트 부분을 Client Component로 분리

```
content/page.tsx (Server — 데이터 fetch)
└── ContentPageHeader (Client — "여행 가이드" / "Travel Guide" / "旅行ガイド")
└── CountryTabs (Client — 이미 client)
└── CategoryFilter (Client — 이미 client)
```

`ContentPageHeader.tsx`:
```typescript
'use client';
import { useLanguage } from '@/lib/i18n';
export function ContentPageHeader() {
  const { t } = useLanguage();
  return (
    <div className="pt-5 pb-3 px-4">
      <h1>{t('content.title')}</h1>
      <p>{t('content.subtitle')}</p>
    </div>
  );
}
```

### 4.3 My Page (`src/app/mypage/page.tsx`)

Server Component 껍질 + Client 언어 선택 UI

```
mypage/
└── page.tsx              # Server Component (layout, TopNav, BottomNav)
└── LanguageSelector.tsx  # Client Component (언어 선택 버튼 3개)
```

**LanguageSelector UI**:
```
┌─────────────────────────────┐
│  언어 설정                    │
│  앱 표시 언어를 선택하세요       │
│                             │
│  ◉ 한국어          [활성]    │
│  ○ English                  │
│  ○ 日本語                    │
└─────────────────────────────┘
```

---

## 5. API 설계 (해당 없음)

이 기능은 API 변경 없음. 순수 클라이언트 사이드 i18n.

---

## 6. 파일 구조

```
src/
├── lib/
│   └── i18n/
│       ├── types.ts          # Language, SUPPORTED_LANGUAGES, LANGUAGE_LABELS
│       ├── ko.ts             # 한국어 딕셔너리 (기준)
│       ├── en.ts             # 영어 딕셔너리
│       ├── ja.ts             # 일본어 딕셔너리
│       └── index.tsx         # LanguageContext, LanguageProvider, useLanguage
├── app/
│   ├── layout.tsx            # MODIFY: LanguageProvider 래핑 추가
│   ├── mypage/
│   │   ├── page.tsx          # NEW: Server Component 껍질
│   │   └── LanguageSelector.tsx  # NEW: Client Component 언어 선택 UI
│   └── content/
│       └── page.tsx          # MODIFY: ContentPageHeader 교체
├── components/
│   ├── ContentPageHeader.tsx # NEW: Client Component (Server page header)
│   ├── InputScreen.tsx       # MODIFY: useLanguage() 적용
│   ├── ResultsScreen.tsx     # MODIFY: useLanguage() 적용
│   ├── BottomNav.tsx         # MODIFY: 탭 라벨 i18n + /mypage 링크
│   ├── TopNav.tsx            # MODIFY: 탭 라벨 i18n
│   ├── CategoryFilter.tsx    # MODIFY: i18n keys
│   └── CountryTabs.tsx       # MODIFY: i18n keys
```

**신규 파일 6개 / 수정 파일 7개**

---

## 7. 주요 구현 세부사항

### 7.1 `t()` 함수 — 동적 값 처리

딕셔너리 값에 `{N}` 플레이스홀더 없이 JS에서 처리:

```typescript
// 결과 배너 예시
`${data.places.length}${t('results.banner.detected')}`
// ko: "3개 장소 감지됨"
// en: "3 places detected"
// ja: "3つのスポットを検出"
```

en.ts, ja.ts에서 위 키들은 앞뒤 텍스트 형태가 다를 수 있어 별도 키로 처리:
- `results.banner.placesCount` → en: "{N} places detected" 형태는 JS concatenation으로

### 7.2 타입 안전성

```typescript
// ko.ts가 기준 — en.ts/ja.ts는 동일 키 보장
// en.ts
import type { TranslationDict } from './types';
export const en: TranslationDict = { ... };  // 누락 시 TypeScript 에러
```

### 7.3 BottomNav `/mypage` 연결

```typescript
// 현재: href: "/"
// 변경 후:
{ id: "mypage", label: t('nav.mypage'), href: "/mypage" },
```

---

## 8. 테스트 계획

| 테스트 | 확인 내용 |
|--------|-----------|
| 기본 렌더링 | 앱 시작 시 한국어 표시 |
| 언어 전환 | 마이페이지에서 English 선택 → 즉시 영어 전환 |
| localStorage | 언어 선택 후 새로고침 → 선택 언어 유지 |
| 브라우저 감지 | localStorage 없을 때 navigator.language 기반 감지 |
| Hydration | 콘솔에 hydration 경고 없음 |
| 타입 안전 | `en.ts` 키 누락 시 TS 에러 |
| BottomNav | My Page 탭 클릭 → /mypage 이동 |

---

## 9. 구현 순서

1. `src/lib/i18n/types.ts` — Language 타입
2. `src/lib/i18n/ko.ts` — 한국어 딕셔너리 (기준)
3. `src/lib/i18n/en.ts` — 영어 딕셔너리
4. `src/lib/i18n/ja.ts` — 일본어 딕셔너리
5. `src/lib/i18n/index.tsx` — Context + Provider + useLanguage
6. `src/app/layout.tsx` — LanguageProvider 래핑
7. `src/components/BottomNav.tsx` — i18n + /mypage 링크
8. `src/components/TopNav.tsx` — i18n 탭 라벨
9. `src/components/InputScreen.tsx` — 전체 i18n 적용
10. `src/components/ResultsScreen.tsx` — 전체 i18n 적용
11. `src/components/CategoryFilter.tsx` — i18n 카테고리 라벨
12. `src/components/CountryTabs.tsx` — i18n 탭 라벨
13. `src/components/ContentPageHeader.tsx` — NEW Client Component
14. `src/app/content/page.tsx` — ContentPageHeader 교체
15. `src/app/mypage/LanguageSelector.tsx` — NEW
16. `src/app/mypage/page.tsx` — NEW

---

## 11. Implementation Guide

### 11.1 구현 원칙

- `ko.ts` 먼저 완성 후 en/ja 작성 (기준 딕셔너리 우선)
- `LanguageProvider`를 `layout.tsx`에 추가하기 전에 먼저 테스트
- 컴포넌트 적용은 nav → input → results → content 순서

### 11.2 의존성

추가 패키지 없음. 기존 스택으로 구현.

### 11.3 Session Guide

| Module | 내용 | 파일 수 |
|--------|------|---------|
| **module-infra** | i18n types + 딕셔너리 + Context + layout 래핑 | 6개 |
| **module-nav** | BottomNav + TopNav i18n + /mypage 링크 | 2개 |
| **module-screens** | InputScreen + ResultsScreen i18n 전체 적용 | 2개 |
| **module-content** | CategoryFilter + CountryTabs + ContentPageHeader + content pages | 4개 |
| **module-mypage** | LanguageSelector + mypage/page.tsx | 2개 |

**추천 세션 분할**:
- Session 1: `module-infra + module-nav` (기반 + nav)
- Session 2: `module-screens + module-content + module-mypage` (전체 완성)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-20 | Initial — Option C Pragmatic 선택 |
