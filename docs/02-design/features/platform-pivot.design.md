# platform-pivot Design Document

> **Summary**: Option C (Pragmatic) — 기존 /api/extract 확장. situation 필수+url 선택. SituationCard required 추가. InputScreen 전면 재설계. ResultsScreen 카드 재정렬.
>
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: Jay
> **Date**: 2026-05-23
> **Status**: Draft
> **Planning Doc**: [platform-pivot.plan.md](../../01-plan/features/platform-pivot.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 서비스 정체성이 "영상 요약"에 갇혀 있음. 타겟 사용자(한국 거주 외국인)는 URL이 없어도 즉각 도움이 필요한 상황이 대부분. 피벗으로 실제 가치와 UI를 정렬. |
| **WHO** | 한국 거주 외국인: 유학생, 교환학생, 장기 체류자 (여행자 X) |
| **RISK** | SituationCard required 추가 → 기존 Zod schema breaking change / 텍스트 전용 경로에서 places hallucination guard 동작 불가 |
| **SUCCESS** | URL 없이 상황 텍스트만으로 가이드 생성 / Situation·Action·Context 3카드 정상 렌더 / 기존 인증·페이월 유지 |
| **SCOPE** | IN: 9개 파일 수정. OUT: 저장 목록, 음성 지원, 실결제, TikTok |

---

## 1. Overview

### 1.1 Design Goals

- 단일 `/api/extract` 엔드포인트에서 텍스트 전용 경로와 텍스트+URL 경로 모두 처리
- `SituationCard`를 `ExtractionResult`의 required 필드로 추가하여 타입 안전성 보장
- 기존 market-validation(인증·사용량·페이월) 로직 무변경
- `places` hallucination guard는 URL 경로에서만 적용

### 1.2 Design Principles

- **단일 진입점**: 새 엔드포인트 없이 기존 `/api/extract` 확장
- **필수 출력**: SituationCard는 텍스트만 있어도 반드시 생성
- **점진적 풍부함**: URL 추가 시 phrases + places 보강, 없을 때는 SituationCard+Action+Context만
- **UI 액션 우선**: 카드 순서가 Situation → Action → Context (정보 → 행동 → 문화)

---

## 2. Architecture

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | **Option C: Pragmatic** |
|----------|:-:|:-:|:-:|
| **변경 파일** | 7 | 13 | 9 |
| **복잡도** | Low | High | Medium |
| **유지보수** | Medium | High | **High** |
| **위험** | SituationCard optional 불안정 | 중복 코드 | schema breaking (관리됨) |
| **Selected** | | | ✅ |

**Selected**: Option C — Pragmatic Balance
**Rationale**: 단일 /api/extract 진입점 유지로 인증·사용량 미들웨어가 자동 적용됨. SituationCard required로 타입 안전성 확보. 중복 없이 두 경로(텍스트/텍스트+URL) 처리.

### 2.1 Data Flow

```
[Client] InputScreen
  situation: string (필수)
  url?: string (선택)
        │
        ▼
[POST /api/extract]
  ├── Auth gate (기존 유지)
  ├── Usage gate (기존 유지)
  ├── Rate limit (기존 유지)
  │
  ├── url 있을 때:
  │   ├── parseUrl(url)
  │   ├── youtubeTranscriptFetcher.fetch(videoId)
  │   └── claudeExtract({ situation, transcript, videoTitle, ... })
  │
  └── url 없을 때:
      └── claudeExtract({ situation, transcript: "" })
            │
            ▼
      [Claude API] → JSON
            │
            ▼
      [Zod validate] extractionSchema
            │
            ▼
      [Hallucination guard]
        url 있을 때: places.quote 검증
        url 없을 때: places = [] (스킵)
            │
            ▼
[Client] ResultsScreen
  situation: SituationCard (항상 존재)
  actions: ActionStep[]
  contexts: ContextCard[]
  phrases: Phrase[]    (url 있을 때 풍부)
  places: Place[]      (url 있을 때만)
  tips: Tip[]
```

### 2.2 Component Diagram

```
page.tsx
  ├── InputScreen          [MODIFIED — 전면 재설계]
  │   ├── QuickChips       [NEW — 6개 상황 버튼]
  │   ├── SituationInput   [NEW — 텍스트 영역]
  │   └── UrlInput         [MODIFIED — 보조 접기 섹션]
  │
  └── ResultsScreen        [MODIFIED — 카드 재정렬]
      ├── SituationSection [NEW — Situation Card]
      ├── ActionSection    [EXISTING — 재사용]
      ├── ContextSection   [EXISTING — 재사용]
      ├── PhrasesSection   [EXISTING — 재사용]
      └── TipsSection      [EXISTING — 재사용]
      (VideoEmbed 제거)
```

---

## 3. Type & Schema Design

### 3.1 New Type: SituationCard

**파일**: `src/types/extraction.ts`

```typescript
export interface SituationCard {
  summary: string;           // 1-2문장 상황 요약 (사용자 언어)
  documents: string[];       // 필요 서류 목록 ["여권", "외국인등록증", ...]
  whereTo: string[];         // 방문 장소/부서 ["KB국민은행 외국인전담창구", ...]
  checklist: string[];       // 준비 체크리스트 ["예약 여부 확인", ...]
  estimatedMinutes?: number; // 예상 소요 시간 (분)
}
```

### 3.2 Updated ExtractionResult

```typescript
export interface ExtractionResult {
  video: VideoMeta;          // 기존 — url 없을 때 title/channel은 situation에서 파생
  situation: SituationCard;  // NEW — required
  actions: ActionStep[];
  places: Place[];
  phrases: Phrase[];
  tips: Tip[];
  contexts: ContextCard[];
}
```

### 3.3 Updated Zod Schema

**파일**: `src/lib/extract/schema.ts`

```typescript
export const situationCardSchema = z.object({
  summary: z.string().min(1),
  documents: z.array(z.string()).default([]),
  whereTo: z.array(z.string()).default([]),
  checklist: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive().optional(),
});

export const extractionSchema = z.object({
  video: videoMetaSchema,
  situation: situationCardSchema,   // NEW — required
  actions: z.array(actionStepSchema).default([]),
  places: z.array(placeSchema),
  phrases: z.array(phraseSchema),
  tips: z.array(tipSchema),
  contexts: z.array(contextCardSchema).default([]),
});
```

---

## 4. API Design

### 4.1 POST /api/extract — 업데이트된 스펙

**Request Body**:
```typescript
{
  situation: string;    // 필수 — 상황 텍스트 (e.g. "은행 계좌 개설")
  url?: string;         // 선택 — YouTube/Shorts URL
  userLang?: string;    // 기존 유지
  toneStyle?: string;   // 기존 유지
  lifeStage?: string;   // 기존 유지
}
```

**Validation**:
- `situation` 없거나 빈 문자열 → `400 INVALID_SITUATION`
- `url` 있을 때만 URL 파싱 → 기존 에러 코드 유지
- 인증/사용량/rate limit → 기존 로직 그대로

**두 경로**:
```
경로 A (텍스트 전용):
  situation 있음, url 없음
  → transcript = "", videoTitle = situation, videoChannel = "NUAMI"
  → claudeExtract({ situation, transcript: "" })
  → hallucination guard 스킵, places = []

경로 B (텍스트 + URL):
  situation 있음, url 있음
  → 기존 transcript fetch
  → claudeExtract({ situation, transcript, videoTitle, ... })
  → hallucination guard 적용 (기존 방식)
```

**Error Code 추가**:
```
INVALID_SITUATION: situation 필드 누락 또는 빈 문자열
```

### 4.2 PromptInput Interface 업데이트

**파일**: `src/lib/extract/claude/client.ts`

```typescript
export interface PromptInput {
  situation: string;     // NEW — 필수
  transcript: string;    // 기존 — url 없을 때 빈 문자열
  videoTitle: string;
  videoChannel: string;
  language: string;
  userLanguage: string;
  truncated: boolean;
  toneStyle?: string;
  lifeStage?: string;
}
```

---

## 5. Claude Prompt Design

### 5.1 System Prompt 변경사항

**파일**: `src/lib/extract/claude/prompt.ts`

SituationCard 출력 지시를 기존 JSON 스키마에 추가:

```
"situation": {
  "summary": string,        // 1-2문장 상황 요약 IN [A] (사용자 언어)
  "documents": string[],    // 필요 서류 목록 IN [A] (2-5개)
  "whereTo": string[],      // 방문 장소/부서 IN [A] (1-3개)
  "checklist": string[],    // 준비 체크리스트 IN [A] (3-6개)
  "estimatedMinutes": number // 예상 소요 시간 (분, 선택)
},
```

**규칙 추가**:
- `situation.documents`: 실제 필요한 서류만. 불확실하면 "외국인등록증(ARC)" 포함.
- `situation.whereTo`: 구체적인 장소명 또는 부서명 (e.g. "KB국민은행 — 외국인전담창구")
- `situation.checklist`: 방문 전 확인 체크리스트 (예약, 운영시간, 지참물 등)
- `situation.estimatedMinutes`: 실제 처리 예상 시간 (대기 포함)
- 텍스트 전용 경로(transcript=""): places는 빈 배열 반환, phrases는 상황 관련 표현만

### 5.2 User Message 변경사항

situation 텍스트를 트랜스크립트 앞에 명시:

```
[USER SITUATION]
The user needs help with: "{situation}"

[TRANSCRIPT]  (비어 있을 수 있음)
"""
{transcript}
"""
```

---

## 6. UI Design

### 6.1 InputScreen 재설계

**레이아웃 (모바일 기준)**:

```
┌─────────────────────────────────┐
│ NUAMI                  [J] 로그아웃│  ← TopNav (변경 없음)
├─────────────────────────────────┤
│                                 │
│      [일러스트 — 생활 어시스턴트]    │
│                                 │
│  오늘 어떤 상황인가요?             │
│  What do you need help with?    │
│                                 │
│ ┌──┐ ┌──────┐ ┌────┐ ┌──────┐  │
│ │🏦│ │교수 연락│ │병원│ │대중교통│  │  ← QuickChips
│ └──┘ └──────┘ └────┘ └──────┘  │
│ ┌──────────┐ ┌────────┐        │
│ │기숙사 찾기│ │음식 주문│        │
│ └──────────┘ └────────┘        │
│                                 │
│ 상황을 설명해주세요               │
│ ┌─────────────────────────────┐ │
│ │                             │ │  ← SituationTextarea
│ │  e.g. "은행 계좌를 개설하고   │ │
│ │  싶어요"                     │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ▶ YouTube/TikTok URL 추가 (선택) │  ← UrlToggle (접기)
│ ┌─────────────────────────────┐ │
│ │ https://youtube.com/...     │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
       [액션 가이드 생성하기] ← Fixed CTA (모바일)
```

**QuickChips 데이터**:
```typescript
const QUICK_CHIPS = [
  { id: "bank",     labelKey: "input.chip.bank",      icon: "🏦" },
  { id: "prof",     labelKey: "input.chip.professor",  icon: "📧" },
  { id: "hospital", labelKey: "input.chip.hospital",   icon: "🏥" },
  { id: "transit",  labelKey: "input.chip.transit",    icon: "🚇" },
  { id: "dorm",     labelKey: "input.chip.dorm",       icon: "🏠" },
  { id: "food",     labelKey: "input.chip.food",       icon: "🍜" },
];
```

**UX 규칙**:
- 퀵칩 클릭 → `situation` 상태에 칩 레이블 텍스트 입력 (기존 내용 대체)
- `situation.trim().length > 0` 이어야 CTA 활성화
- URL 입력 섹션은 기본 접힘, `▶ URL 추가` 클릭 시 펼쳐짐
- `isLoading` 상태에서 퀵칩·텍스트·URL 모두 disabled

### 6.2 ResultsScreen 재설계

**카드 순서 및 제거**:
```
[제거] VideoEmbed + 비디오 메타 섹션
[제거] 분석 배너 (국가 감지 배너)
[신규] SituationSection (맨 위)
[기존] ActionSection
[기존] ContextSection
[기존] PhrasesSection (url 있을 때 더 풍부)
[기존] TipsSection
[기존] PlacesSection (url 있을 때만 표시)
```

**SituationSection UI**:
```
┌─────────────────────────────────────┐
│ [📋] Situation Card                  │
│ ─────────────────────────────────── │
│ summary: "은행 계좌 개설을 위해..."    │
│                                     │
│ 필요 서류                            │
│ [여권] [외국인등록증] [재학증명서]      │  ← Badge pills
│                                     │
│ 가야 할 곳                           │
│ • KB국민은행 — 외국인전담창구          │
│ • 시청 외국인민원실                   │
│                                     │
│ 준비 체크리스트                       │
│ ☐ 은행 앱 사전 다운로드               │
│ ☐ 영업시간 확인 (평일 09:00-16:00)   │
│ ☐ 번호표 미리 뽑기                   │
│                                     │
│ ⏱ 예상 소요시간: 약 45분              │
└─────────────────────────────────────┘
```

**상단 배너 변경**:
- 기존: "{국가} 현지 생활 정보를 정리했습니다"
- 신규: 제거 (Situation Card 자체가 요약 역할)

---

## 7. i18n Design

### 7.1 추가/변경 키 목록

**ko.ts / en.ts 변경사항**:

```typescript
// InputScreen
"input.hero.title": "오늘 어떤 상황인가요?" / "What do you need help with today?"
"input.hero.desc": "상황을 설명하면 AI가 필요한 서류·행동 가이드·문화 팁을 정리해드려요." / ...
"input.situation.label": "상황을 설명해주세요" / "Describe your situation"
"input.situation.placeholder": "예: 은행 계좌를 개설하고 싶어요" / "e.g. I want to open a bank account"
"input.url.toggle": "YouTube/TikTok URL 추가 (선택)" / "Add a video URL (optional)"
"input.cta.extract": "액션 가이드 생성하기" / "Generate Action Guide"
"input.cta.extracting": "생성 중…" / "Generating…"

// QuickChips
"input.chip.bank": "은행 계좌 개설" / "Open Bank Account"
"input.chip.professor": "교수 연락" / "Contact Professor"
"input.chip.hospital": "병원 방문" / "Visit Hospital"
"input.chip.transit": "대중교통" / "Public Transit"
"input.chip.dorm": "기숙사 찾기" / "Find Dormitory"
"input.chip.food": "음식 주문" / "Order Food"

// SituationCard
"results.situation.title": "Situation Card" / "Situation Card"
"results.situation.documents": "필요 서류" / "Required Documents"
"results.situation.whereTo": "가야 할 곳" / "Where to Go"
"results.situation.checklist": "준비 체크리스트" / "Preparation Checklist"
"results.situation.estimatedTime": "예상 소요시간" / "Estimated Time"
"results.situation.minutes": "약 {n}분" / "About {n} min"

// Updated
"results.reExtract": "새 상황 입력" / "New Situation"
"nav.videoai" → "nav.guide": "가이드" / "Guide"

// Errors
"error.invalidSituation": "상황을 입력해주세요." / "Please describe your situation."
```

### 7.2 TranslationKey 타입 업데이트

`ko.ts`의 `as const` 객체에 위 키들 추가 → `TranslationKey`/`TranslationDict` 자동 갱신.

---

## 8. page.tsx State Design

### 8.1 상태 분리

```typescript
// 변경 전
const [url, setUrl] = useState("");

// 변경 후
const [situation, setSituation] = useState("");
const [url, setUrl] = useState("");           // 선택적 URL

// CTA 활성화 조건
const canGenerate = situation.trim().length > 0 && !isLoading;
```

### 8.2 API 요청 Body

```typescript
body: JSON.stringify({
  situation: situation.trim(),    // 필수
  url: url.trim() || undefined,   // 선택 (빈 문자열이면 undefined)
  userLang: lang,
  toneStyle: prefs.toneStyle,
  lifeStage: prefs.lifeStage,
})
```

---

## 9. Test Plan

### 9.1 L1 — API Endpoint Tests

| # | Scenario | Method | Input | Expected |
|---|----------|--------|-------|----------|
| 1 | 텍스트 전용 성공 | POST /api/extract | `{ situation: "은행 계좌 개설" }` | 200, `data.situation` 존재 |
| 2 | situation 누락 | POST /api/extract | `{ url: "..." }` | 400, INVALID_SITUATION |
| 3 | 텍스트+URL 성공 | POST /api/extract | `{ situation: "...", url: "youtube..." }` | 200, `data.situation` + `data.places` |
| 4 | 비인증 요청 | POST /api/extract | no cookie | 401 |
| 5 | tester 초과 | POST /api/extract | tester, 4th req | 402 |

### 9.2 L2 — UI Action Tests

| # | Action | Expected |
|---|--------|----------|
| 1 | 퀵칩 "은행 계좌 개설" 클릭 | situation 텍스트 채워짐, CTA 활성화 |
| 2 | situation 비어 있을 때 CTA 클릭 | 비활성, 요청 없음 |
| 3 | URL 토글 클릭 | URL 입력 섹션 펼쳐짐 |
| 4 | 가이드 생성 후 결과 화면 | Situation Card 최상단 표시 |
| 5 | 결과 화면에 영상 임베드 없음 | VideoEmbed 미렌더 확인 |

### 9.3 L3 — E2E Scenario: 은행 계좌 개설

1. `/login` → tester1 로그인
2. 홈 화면 → "은행 계좌 개설" 퀵칩 클릭
3. "액션 가이드 생성하기" 클릭
4. 로딩 중 스피너 표시 확인
5. 결과 화면 → Situation Card (documents, whereTo, checklist) 확인
6. Action Card → 단계별 행동 확인
7. Context Card → Do/Don't 확인
8. "새 상황 입력" 클릭 → 홈 복귀

---

## 10. File Change Summary

| 파일 | 변경 유형 | 주요 변경 |
|------|---------|---------|
| `src/types/extraction.ts` | MODIFIED | `SituationCard` 인터페이스 추가, `ExtractionResult.situation` required 추가 |
| `src/lib/extract/schema.ts` | MODIFIED | `situationCardSchema` + `extractionSchema` 업데이트 |
| `src/lib/extract/claude/prompt.ts` | MODIFIED | `PromptInput.situation?` + SituationCard JSON 스키마 지시 + user message 템플릿 |
| `src/lib/extract/claude/client.ts` | MODIFIED | `PromptInput`에 `situation` 필드 추가 |
| `src/app/api/extract/route.ts` | MODIFIED | `situation` 파싱 필수화, 텍스트 전용 경로 분기, INVALID_SITUATION 에러 |
| `src/app/page.tsx` | MODIFIED | `situation` + `url` 상태 분리, API body 업데이트 |
| `src/components/InputScreen.tsx` | MODIFIED | QuickChips + SituationTextarea + UrlToggle + 새 히어로 |
| `src/components/ResultsScreen.tsx` | MODIFIED | SituationSection 추가, VideoEmbed 제거, 카드 순서 재정렬 |
| `src/lib/i18n/ko.ts` | MODIFIED | 새 i18n 키 추가, 기존 카피 업데이트 |
| `src/lib/i18n/en.ts` | MODIFIED | 새 i18n 키 추가, 기존 카피 업데이트 |
| `src/components/TopNav.tsx` | MODIFIED | `videoai` → `guide` (id + labelKey) |

---

## 11. Implementation Guide

### 11.1 Implementation Order (의존성 순서)

```
Phase 1 — 타입·스키마 (다른 모든 것의 기반)
  1. src/types/extraction.ts         → SituationCard 타입 추가
  2. src/lib/extract/schema.ts       → Zod 스키마 업데이트

Phase 2 — AI 레이어 (타입 기반)
  3. src/lib/extract/claude/prompt.ts → SituationCard 프롬프트
  4. src/lib/extract/claude/client.ts → PromptInput 업데이트

Phase 3 — API (AI 레이어 기반)
  5. src/app/api/extract/route.ts    → 양방향 경로 분기

Phase 4 — i18n (UI 전에 필요)
  6. src/lib/i18n/ko.ts              → 새 키 추가
  7. src/lib/i18n/en.ts              → 새 키 추가

Phase 5 — UI (타입+i18n 기반)
  8. src/app/page.tsx                → 상태 분리
  9. src/components/InputScreen.tsx  → 전면 재설계
  10. src/components/ResultsScreen.tsx → SituationSection + 재정렬
  11. src/components/TopNav.tsx      → videoai → guide
```

### 11.2 Critical Constraints

- **TypeScript strict**: `SituationCard` required 필드 추가 시 `ExtractionResult`를 사용하는 모든 곳 업데이트 필요 (`ResultsScreen.tsx`, `page.tsx`)
- **Zod type check**: `schema.ts` 하단 `_typeCheck` 라인이 `ExtractionResult`와 `z.infer<typeof extractionSchema>` 일치 강제 — 컴파일 에러로 누락 감지
- **places 빈 배열**: 텍스트 전용 경로에서 `route.ts`의 hallucination guard를 `url` 있을 때만 실행. `result.places = kept` 대신 `result.places = parsed.videoId ? kept : []`
- **i18n TranslationKey**: `ko.ts`에 키 추가하면 `TranslationKey` 타입 자동 갱신 — `en.ts`도 동일 키 추가 필수 (타입 오류 발생)

### 11.3 Session Guide

| Module | 파일 수 | 예상 시간 | 설명 |
|--------|---------|---------|------|
| module-types | 2 | 15분 | extraction.ts + schema.ts |
| module-api | 3 | 30분 | prompt.ts + client.ts + route.ts |
| module-i18n | 2 | 20분 | ko.ts + en.ts |
| module-ui | 4 | 60분 | page.tsx + InputScreen + ResultsScreen + TopNav |

**추천 세션 분할**:
- Session 1: `--scope module-types,module-api` (타입+AI 레이어 완성)
- Session 2: `--scope module-i18n,module-ui` (i18n+UI 완성)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-23 | Initial design — Option C Pragmatic, SituationCard required | Jay |
