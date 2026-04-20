# cultural-action-service Design Document

> **Summary**: Node-runtime Route Handler pipeline (URL parse → transcript fetch → Claude structured extraction → Zod validate → hallucination guard) with client fetch state wiring.
>
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: CTO Lead (PDCA Team — Dynamic)
> **Date**: 2026-04-19
> **Status**: Draft
> **Planning Doc**: [cultural-action-service.plan.md](../../01-plan/features/cultural-action-service.plan.md)

---

## Context Anchor

> Copied from Plan document.

| Key | Value |
|-----|-------|
| **WHY** | Mock data on `ResultsScreen.tsx` is the MVP's single largest credibility gap — every demo is theater. |
| **WHO** | SEA outbound travelers (VN/TH/ID) 22–38 watching Korea travel content. Beachhead: Linh (27, Hanoi → Seoul). |
| **RISK** | (1) Inconsistent YouTube captions. (2) Claude cost >$0.02/call. (3) Hallucinated places. |
| **SUCCESS** | ≥85% YouTube success, P50 ≤10s / P95 ≤18s, Zod parse ≥98%, cost P50 ≤$0.015. Zero `INIT_*` grep hits. |
| **SCOPE** | IN: `/api/extract` + `lib/extract/*` + client wiring in `page.tsx`/`ResultsScreen`/`InputScreen`. OUT: auth, persistence, TTS, OCR, TikTok support (returns error), map deep-links (UI inert). |

---

## 1. Overview

### 1.1 Design Goals

- **Grounded output**: Every place card traces to a verbatim transcript substring (hallucination guard is a hard requirement, not a nice-to-have).
- **Swappable transcript source**: YouTube fetcher lives behind a `TranscriptFetcher` interface so we can swap `youtube-transcript` → Data API v3 → yt-dlp without touching the route.
- **Typed errors end-to-end**: Error codes defined once, flow from server → response → client UI with no string-matching.
- **Single-source types**: `ExtractionResult` defined once in `src/types/extraction.ts`, consumed by both the Zod schema and the React props.
- **Minimal dependencies**: Only `@anthropic-ai/sdk`, `youtube-transcript`, and `zod`.

### 1.2 Design Principles

- **Single Responsibility**: URL parser parses; transcript fetcher fetches; Claude client prompts; route orchestrates. No module does two jobs.
- **Fail typed, not silent**: Every error path produces an enumerated `code`; UI knows what to show per code.
- **Dependency inversion on transcripts**: route depends on `TranscriptFetcher` interface, not `youtube-transcript` directly.
- **Presentation is dumb**: `ResultsScreen` receives `data`, renders. It does not know `fetch` exists.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | Everything in `route.ts` | Full Clean Arch layers with DI container | Module-per-concern under `lib/extract/` |
| **New Files** | 3 (route, types, schema) | 12+ (ports, adapters, use-cases, DI) | 8 (route, parse-url, transcript/youtube, claude/client, claude/prompt, schema, rate-limit, logger) + 1 type file |
| **Modified Files** | 3 (page, ResultsScreen, InputScreen) | 3 | 3 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low (500-line route.ts) | High | High |
| **Effort** | Low (~4h) | High (~12h) | Medium (~6h) |
| **Testability** | Low (integration only) | High (unit-test each port) | Medium-High (unit-test each module independently) |
| **Risk** | Med (hard to swap transcript source later) | Low (but over-engineered for MVP) | Low |
| **Recommendation** | Throwaway prototypes | Post-PMF rewrite | **Selected for MVP** |

**Selected**: **Option C: Pragmatic Balance** — **Rationale**: Plan §7.2 picks Dynamic level, PRD §5.4 architecture sketch already draws the module boundaries (parse → transcript → claude → respond), and the hallucination guard + adapter pattern are both Plan-mandated. Option A leaves us with an unmaintainable route; Option B builds scaffolding for features we may never need (DI container, use-case classes). Option C ships the boundaries the PRD already drew.

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
│  ┌─────────────────┐        ┌──────────────────────────────┐     │
│  │  InputScreen    │─click─▶│  page.tsx (state machine)    │     │
│  │  (loading,      │        │  idle|loading|success|error  │     │
│  │   error props)  │        └────────────┬─────────────────┘     │
│  └─────────────────┘                     │                       │
│  ┌─────────────────┐                     │ fetch('/api/extract') │
│  │  ResultsScreen  │◀─data──  page.tsx   │                       │
│  │  (data prop)    │                     │                       │
│  └─────────────────┘                     │                       │
└──────────────────────────────────────────┼───────────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────┐
│           Next.js 16 App Router — Node runtime                   │
│                                                                  │
│  src/app/api/extract/route.ts   (POST handler — orchestrator)    │
│       │                                                          │
│       ├── 1. rate-limit.ts   ──▶ (429 if over quota)             │
│       ├── 2. parse-url.ts    ──▶ { platform, videoId }           │
│       ├── 3. transcript/youtube.ts                               │
│       │      (TranscriptFetcher impl, uses `youtube-transcript`) │
│       │       ──▶ { title, channel, text, language }             │
│       ├── 4. claude/client.ts  (Anthropic SDK)                   │
│       │      uses claude/prompt.ts                               │
│       │       ──▶ raw JSON string                                │
│       ├── 5. schema.ts (Zod)  ──▶ typed ExtractionResult         │
│       ├── 6. Hallucination guard  ──▶ drop non-substring quotes  │
│       └── 7. logger.ts   ──▶ structured console.info             │
│                                                                  │
│  Secrets: ANTHROPIC_API_KEY (env, server-only)                   │
└──────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  Anthropic API   │
                                  │  (Claude Haiku)  │
                                  └──────────────────┘
```

### 2.2 Data Flow

```
1. User pastes URL, taps Extract
2. page.tsx → setIsLoading(true), fetch('/api/extract', {body:{url}})
3. Route: rate-limit check → parse URL → fetch transcript → build prompt →
          call Claude (JSON mode) → Zod-validate → substring-guard quotes →
          log → respond({data}) or respond({error})
4. page.tsx: on success → setData + render ResultsScreen
             on error  → setError + surface in InputScreen
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `app/api/extract/route.ts` | all `lib/extract/*` modules | Orchestration |
| `lib/extract/transcript/youtube.ts` | `youtube-transcript` (npm) | YouTube caption fetch |
| `lib/extract/claude/client.ts` | `@anthropic-ai/sdk` | Claude API call |
| `lib/extract/schema.ts` | `zod` | Response validation + client type derivation |
| `lib/extract/rate-limit.ts` | none (in-memory `Map`) | Per-IP throttle |
| `app/page.tsx` | `src/types/extraction.ts` | Type the fetched `data` |
| `components/ResultsScreen.tsx` | `src/types/extraction.ts` | Prop typing |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// src/types/extraction.ts

export type Platform = "youtube" | "tiktok" | "unknown";

export interface VideoMeta {
  title: string;
  channel: string;
  language: string; // e.g. "ko", "vi", "en"
}

export interface Place {
  name: string;        // English/Romanized
  nameKo?: string;     // Original-language name (optional)
  desc: string;        // 1–2 sentence English description
  quote: string;       // verbatim transcript substring, original language
  tags: string[];      // 1–3 short labels
}

export interface Phrase {
  en: string;          // English translation
  ko: string;          // Original-language phrase (field stays `ko` for UI compat)
  context?: string;    // optional situational note
}

export interface Tip {
  title: string;
  desc: string;
  cat: "Time" | "Price" | "Etiquette" | "Transport" | "Other";
}

export interface ExtractionResult {
  video: VideoMeta;
  places: Place[];
  phrases: Phrase[];
  tips: Tip[];
}

export type ExtractErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PLATFORM"
  | "TRANSCRIPT_UNAVAILABLE"
  | "TRANSCRIPT_TOO_SHORT"
  | "CLAUDE_PARSE_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL";

export interface ExtractError {
  code: ExtractErrorCode;
  message: string;
  hint?: string;
  requestId: string;
}

export type ExtractResponse =
  | { data: ExtractionResult }
  | { error: ExtractError };
```

### 3.2 No Persistent Storage

This feature is stateless. No DB tables, no collections. Rate-limit state lives in an in-memory `Map<ip, { hourly: number[]; minute: number[] }>` per serverless instance.

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/extract` | Extract places/phrases/tips from a video URL | None (MVP) |

### 4.2 Detailed Specification

#### `POST /api/extract`

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "video": {
      "title": "Follow Me | Gangneung Trip",
      "channel": "K-Heritage Channel",
      "language": "vi"
    },
    "places": [
      {
        "name": "Ojukheon",
        "nameKo": "오죽헌",
        "desc": "Historic house, birthplace of Shin Saimdang.",
        "quote": "Ojukheon là nơi lưu giữ lịch sử...",
        "tags": ["Historical Site"]
      }
    ],
    "phrases": [
      { "en": "Follow me", "ko": "믿고 따라와요", "context": "guide" }
    ],
    "tips": [
      { "title": "Visit early", "desc": "Go at 9am to avoid crowds", "cat": "Time" }
    ]
  }
}
```

**Error Responses:**

| Status | Code | When | Response |
|--------|------|------|----------|
| 400 | `INVALID_URL` | URL missing, malformed, or not a URL | `{"error":{"code":"INVALID_URL","message":"...","requestId":"..."}}` |
| 400 | `UNSUPPORTED_PLATFORM` | TikTok / other platform detected | `{"error":{"code":"UNSUPPORTED_PLATFORM","message":"TikTok is coming soon","hint":"Try a YouTube URL","requestId":"..."}}` |
| 404 | `TRANSCRIPT_UNAVAILABLE` | `youtube-transcript` throws / empty captions | `{"error":{"code":"TRANSCRIPT_UNAVAILABLE","message":"This video has no captions","hint":"Try another video with auto-captions enabled","requestId":"..."}}` |
| 422 | `TRANSCRIPT_TOO_SHORT` | Transcript < 200 chars (not enough context to extract 3 places) | `{"error":{"code":"TRANSCRIPT_TOO_SHORT",...}}` |
| 429 | `RATE_LIMITED` | IP exceeds 10/hour or 3/minute | Headers include `Retry-After: 60` |
| 502 | `CLAUDE_PARSE_FAILED` | Claude returns non-JSON or Zod validation fails | `{"error":{"code":"CLAUDE_PARSE_FAILED",...}}` |
| 500 | `INTERNAL` | Unexpected exception (SDK error, network) | Generic |

---

## 5. UI/UX Design

> **v2 Renewal**: Option C (Fluid Center) selected — responsive layout + NUAMI design tokens.
> Selected: 2026-04-20. Previous: mobile-only `max-w-[390px]` with raw Tailwind classes.

### 5.1 Screen States (page.tsx state machine)

```
          ┌────────────┐
          │   idle     │   (InputScreen visible, button enabled)
          └─────┬──────┘
                │ click Extract
                ▼
          ┌────────────┐
          │  loading   │   (InputScreen visible, button disabled + spinner)
          └─────┬──────┘
          ┌─────┴───────────┐
          ▼                 ▼
   ┌────────────┐     ┌────────────┐
   │  success   │     │   error    │
   │ (Results)  │     │ (Input +   │
   └─────┬──────┘     │ error card)│
         │            └─────┬──────┘
         │ back              │ retry
         └─────┬─────────────┘
               ▼
            idle
```

### 5.2 User Flow

```
Input (paste URL) → tap Extract → loading (button disabled) →
  ↓
  ├── success → ResultsScreen (Places / Local Phrases / Insider Tips cards)
  ├── rate-limited → Input + "Try again in Xm" error card
  ├── no-caption → Input + "This video has no captions. Try another URL." hint
  └── unsupported-platform → Input + "TikTok coming soon — try YouTube" hint
```

### 5.3 Responsive Breakpoints (Option C)

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| **Mobile** | `< 768px` | Single column, BottomNav 하단 고정, CTA `fixed bottom` |
| **Tablet** | `md: ≥ 768px` | max-w-3xl 중앙 정렬, TopNav 상단, CTA inline, 카드 2열 |
| **Desktop** | `lg: ≥ 1024px` | max-w-5xl, Hero + Input 사이드바, 카드 2-3열 |

#### Mobile (< 768px)
```
┌──────────────────────────┐
│  Header: logo + search   │  ← bg-background, border-b border-line-neutral
│  Illustration (center)   │
│  Heading + Subtitle      │  ← text-text-primary / text-text-secondary
│  URL Input               │  ← border-line-normal, rounded-2xl
│  Error Card (if any)     │  ← bg-danger-50, border-danger-200
│                          │
│  [Extract CTA] (fixed)   │  ← bg-button-primary, hover:bg-button-hover
│  BottomNav (fixed)       │  ← md:hidden
└──────────────────────────┘
```

#### Tablet (md: 768px–1023px)
```
┌──────────────────────────────────────┐
│  TopNav: logo  ·  VideoAI  ·  ...    │  ← hidden on mobile, md:flex
│  bg-background, border-b             │
├──────────────────────────────────────┤
│  Illustration (center, lg size)      │
│  Heading (text-2xl font-bold)        │
│  URL Input (wider, max-w-xl center)  │
│  [Extract CTA] (inline, max-w-xl)    │
│                                      │
│  ── Results ──                       │
│  Video card (full width)             │
│  Analysis banner                     │
│  Places  [card][card]  2-col grid    │
│  Phrases [card][card]  2-col grid    │
│  Tips    [card][card]  2-col grid    │
└──────────────────────────────────────┘
```

#### Desktop (lg: 1024px+)
```
┌────────────────────────────────────────────────────────────┐
│  TopNav: logo     VideoAI  Saved  History      [avatar]    │
│  bg-background, border-b border-line-neutral               │
├────────────────────────────────────────────────────────────┤
│  max-w-5xl mx-auto px-8                                    │
│  ┌─────────────────────┬────────────────────────────────┐  │
│  │  Hero (left, 40%)   │  URL Input Section (right,60%) │  │
│  │  Illustration lg    │  "We'll extract content..."    │  │
│  │  Subtitle text      │  URL input field               │  │
│  │                     │  [Extract CTA] (full width)    │  │
│  │                     │  Error card (if any)           │  │
│  └─────────────────────┴────────────────────────────────┘  │
│                                                            │
│  ── Results (after extraction) ──                         │
│  Video card + Analysis banner (full width)                 │
│  Places  [card][card][card]  3-col grid (lg:grid-cols-3)   │
│  Phrases [card][card][card]  3-col grid                    │
│  Tips    [card][card][card]  3-col grid                    │
└────────────────────────────────────────────────────────────┘
```

### 5.4 NUAMI Design Token Migration

기존 raw 클래스 → NUAMI 시맨틱 토큰 전환 매핑:

| 기존 클래스 | NUAMI 토큰 | 용도 |
|------------|-----------|------|
| `bg-white` | `bg-background` | 페이지 배경 |
| `bg-gray-50` | `bg-background` | 섹션 배경 |
| `bg-gray-100` | `bg-muted` | 뮤트 배경 |
| `text-gray-900` | `text-text-primary` | 기본 텍스트 |
| `text-gray-700` | `text-text-secondary` | 서브 텍스트 |
| `text-gray-500` | `text-text-tertiary` | 힌트/플레이스홀더 |
| `text-gray-400` | `text-text-disabled` | 비활성 텍스트 |
| `border-gray-200` | `border-line-normal` | 기본 보더 |
| `border-gray-100` | `border-line-neutral` | 서브틀 구분선 |
| `bg-violet-600` | `bg-button-primary` | 기본 버튼 |
| `hover:bg-violet-700` | `hover:bg-button-hover` | 버튼 호버 |
| `disabled:bg-violet-400` | `disabled:bg-button-disabled` | 비활성 버튼 |
| `bg-violet-50` | `bg-accent-50` | 배너 배경 |
| `text-violet-800` | `text-accent-900` | 배너 텍스트 |
| `fill="#6D28D9"` (SVG) | `text-accent-700` + currentColor | 아이콘 색상 |
| `bg-red-50 border-red-200` | `bg-danger-50 border-danger-200` | 에러 카드 |
| `text-red-800` | `text-danger-800` | 에러 제목 |
| `text-red-700` | `text-danger-700` | 에러 힌트 |
| `stroke="#DC2626"` | `text-danger` + currentColor | 에러 아이콘 |
| `bg-yellow-50 border-yellow-200` | 유지 (외부 브랜드 색상) | Kakao Map |
| `bg-blue-50 border-blue-200` | 유지 (외부 브랜드 색상) | Google Maps |

### 5.5 Component List (v2)

| Component | Location | 변경 내용 |
|-----------|----------|----------|
| `page.tsx` | `src/app/` | 반응형 컨테이너 래퍼 추가 |
| `TopNav` | `src/components/` | **NEW** — `hidden md:flex` 상단 네브 |
| `InputScreen` | `src/components/` | NUAMI 토큰 전환 + 반응형 레이아웃 |
| `ResultsScreen` | `src/components/` | NUAMI 토큰 전환 + 카드 그리드 반응형 |
| `BottomNav` | `src/components/` | `md:hidden` 추가 (PC에서 숨김) |

### 5.6 Page UI Checklist (v2)

#### InputScreen — 공통
- [ ] 최상위 컨테이너: `min-h-screen bg-background text-text-primary font-sans`
- [ ] 모바일: `max-w-[390px] mx-auto`, 태블릿+: `max-w-3xl lg:max-w-5xl mx-auto`
- [ ] BottomNav: `md:hidden` 클래스 추가

#### InputScreen — Mobile (`< md`)
- [ ] Header: `bg-background border-b border-line-neutral` + "👋 Welcome, Jay!" + 검색 아이콘
- [ ] CTA 버튼: `fixed bottom-[56px]` — `bg-button-primary hover:bg-button-hover disabled:bg-button-disabled`
- [ ] URL 입력창: `border-line-normal` rounded-2xl
- [ ] 에러 카드: `bg-danger-50 border-danger-200 text-danger-800`

#### InputScreen — Tablet+ (`md:`)
- [ ] TopNav: `hidden md:flex` — logo + 링크, `bg-background border-b border-line-neutral`
- [ ] CTA 버튼: `fixed` 제거 → form 섹션 내 인라인, `max-w-xl mx-auto`
- [ ] BottomNav: `md:hidden`

#### InputScreen — Desktop (`lg:`)
- [ ] Hero + Input 2열 레이아웃: `lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center`
- [ ] Illustration: `lg:w-64 lg:h-64` (확대)
- [ ] URL Input + CTA: 오른쪽 열에 배치

#### ResultsScreen — 공통
- [ ] 카드 섹션: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`
- [ ] NUAMI 토큰 전면 적용 (§5.4 매핑 참조)
- [ ] 빈 상태: `bg-infoBox rounded-md text-text-tertiary`

#### ResultsScreen — Mobile
- [ ] 스티키 헤더: `bg-background border-b border-line-neutral`
- [ ] 분석 배너: `bg-accent-50 text-accent-900`
- [ ] BottomNav: `md:hidden`

#### ResultsScreen — Tablet+ (`md:`)
- [ ] TopNav: `hidden md:flex` (InputScreen과 동일)
- [ ] 스티키 헤더 (Back + Re-extract): 유지, `bg-background`
- [ ] 비디오 카드: `max-w-2xl mx-auto` (태블릿 중앙 정렬)
- [ ] 카드 그리드: `md:grid-cols-2`

#### ResultsScreen — Desktop (`lg:`)
- [ ] 카드 그리드: `lg:grid-cols-3`
- [ ] 비디오 카드: `max-w-3xl mx-auto`

---

## 6. Error Handling

### 6.1 Error Code Definition (server → client)

| Code | HTTP | User Message (UI) | Hint |
|------|------|-------------------|------|
| `INVALID_URL` | 400 | "That doesn't look like a valid video URL." | "Paste a full YouTube URL like https://www.youtube.com/watch?v=..." |
| `UNSUPPORTED_PLATFORM` | 400 | "TikTok support is coming soon." | "Try a YouTube URL for now." |
| `TRANSCRIPT_UNAVAILABLE` | 404 | "This video has no captions we can read." | "Try another video with auto-captions or manual subtitles." |
| `TRANSCRIPT_TOO_SHORT` | 422 | "This video is too short to extract from." | "Try a video that's at least 1 minute long." |
| `CLAUDE_PARSE_FAILED` | 502 | "We couldn't parse the extraction result." | "This is on us. Please try again in a moment." |
| `RATE_LIMITED` | 429 | "You've hit the rate limit." | "Try again in {Retry-After}s." |
| `INTERNAL` | 500 | "Something went wrong." | "Please try again." |

### 6.2 Error Response Format

```typescript
type ErrorEnvelope = {
  error: {
    code: ExtractErrorCode;
    message: string;   // server-side neutral
    hint?: string;     // actionable advice
    requestId: string; // for support
  };
};
```

Client maps `code` → UI copy (table above). Client never displays the raw server `message` — it is only for debugging. The UI copy is the source of truth for user-facing text.

### 6.3 Server Logging

Every call logs one line:

```typescript
console.info(JSON.stringify({
  requestId,
  url,
  platform,         // "youtube" | "tiktok" | "unknown"
  durationMs,
  tokensIn,         // 0 if request didn't reach Claude
  tokensOut,
  errorCode,        // present only on failure
  extractedCounts,  // { places, phrases, tips } — only on success
}));
```

---

## 7. Security Considerations

- [x] **Input validation**: Zod on request body (`{ url: string }`), URL parsed with `new URL()` inside try/catch
- [x] **SSRF prevention**: URL parser extracts `videoId` — we never `fetch()` the user's URL directly. `youtube-transcript` library is called with the videoId only
- [x] **Secret handling**: `ANTHROPIC_API_KEY` read via `process.env`; no `NEXT_PUBLIC_` prefix; server-only by Next.js default
- [x] **HTTPS**: Enforced by Vercel in production
- [x] **Rate limiting**: Per-IP (10/hr, 3/min) — MVP acceptable; cold-start caveat documented
- [x] **XSS**: React auto-escapes all rendered strings; no `dangerouslySetInnerHTML`
- [x] **Error responses don't leak internals**: `INTERNAL` error message is generic; stack traces stay server-side

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1: API Tests | `/api/extract` endpoint contract | `curl` (manual MVP) | Do + Check |
| L2: UI Action Tests | InputScreen states, ResultsScreen rendering | Browser (manual MVP) | Do + Check |
| L3: E2E Scenario Tests | Paste-to-cards happy path | Browser (manual MVP) | Check |

> **MVP note**: Automated Playwright tests are OUT OF SCOPE per Plan §7.2 (Testing decision). The scenarios below are executed manually during Do + Check. If the Check phase gap-detector flags this as a blocker, we add a minimal test harness in the Act iteration.

### 8.2 L1: API Test Scenarios

| # | Input | Expected Status | Expected Response |
|---|-------|----------------:|-------------------|
| 1 | `{"url":"https://www.youtube.com/watch?v=<real-ko-video>"}` | 200 | `.data.video.title` string; `.data.places` array with ≥ 1 item having `quote` substring match |
| 2 | `{"url":"not a url"}` | 400 | `.error.code === "INVALID_URL"` |
| 3 | `{}` (missing url) | 400 | `.error.code === "INVALID_URL"` |
| 4 | `{"url":"https://www.tiktok.com/@u/video/123"}` | 400 | `.error.code === "UNSUPPORTED_PLATFORM"` |
| 5 | `{"url":"https://youtu.be/<no-caption-video>"}` | 404 | `.error.code === "TRANSCRIPT_UNAVAILABLE"` |
| 6 | 11th POST from same IP within 1 hour | 429 | `.error.code === "RATE_LIMITED"`; `Retry-After` header set |
| 7 | 4th POST from same IP within 1 minute | 429 | `.error.code === "RATE_LIMITED"` |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result |
|---|------|--------|-----------------|
| 1 | InputScreen | Paste valid URL, tap Extract | Button disables, spinner shows; on response, Results renders |
| 2 | InputScreen | Tap Extract with empty url | Button noop or inline validation (no fetch) |
| 3 | InputScreen | Server returns error | Red error card appears above button; button re-enables |
| 4 | ResultsScreen | Render with `data.places.length === 0` | "No places detected" empty state; counter shows (0) |
| 5 | ResultsScreen | Tap back | Returns to InputScreen at idle; URL state preserved |
| 6 | ResultsScreen | Toggle bookmark on a place | Star fills; state persists for session (lost on back→forward) |

### 8.4 L3: E2E Scenarios

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|------------------|
| 1 | Happy path | Open app → paste real Korea travel URL → Extract → see cards → back → re-extract different URL → see new cards | No console errors; cards show different data per video |
| 2 | Error recovery | Paste invalid URL → see error → dismiss → paste valid URL → Extract → success | Error clears correctly; next request succeeds |
| 3 | Rate limit | Fire 11 rapid extractions → 11th shows cooldown error | 429 rendered as dismissible toast/card with `Retry-After` seconds |

### 8.5 Seed Data Requirements

No DB seed needed. Tests require:
- 1 known-good YouTube URL with Korean/Vietnamese captions (pick from K-Heritage Channel — existing mock video is a real video)
- 1 known-good YouTube URL with NO captions (pick a silent drone flyover or a music-only clip)
- 1 TikTok URL (any)

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | UI components, route pages | `src/components/`, `src/app/page.tsx` |
| **Application** | Orchestrate extraction pipeline | `src/app/api/extract/route.ts` |
| **Domain** | Types, Zod schema, prompt template, URL parsing rules | `src/types/extraction.ts`, `src/lib/extract/schema.ts`, `src/lib/extract/claude/prompt.ts`, `src/lib/extract/parse-url.ts` |
| **Infrastructure** | youtube-transcript adapter, Anthropic SDK, rate-limit, logger | `src/lib/extract/transcript/youtube.ts`, `src/lib/extract/claude/client.ts`, `src/lib/extract/rate-limit.ts`, `src/lib/extract/logger.ts` |

### 9.2 Dependency Rules

```
Presentation (page.tsx, ResultsScreen) ──▶ Domain (types)
                                       ✗─▶ Infrastructure (forbidden)

Application (route.ts) ──▶ Domain (types, schema, prompt, parse-url)
                       ──▶ Infrastructure (transcript, claude, rate-limit, logger)

Domain (types, schema, prompt, parse-url) ──▶ nothing (pure)

Infrastructure ──▶ Domain only
```

### 9.3 File Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `src/app/page.tsx` | `src/types/extraction.ts`, components | `src/lib/extract/*` |
| `src/app/api/extract/route.ts` | everything in `src/lib/extract/*`, `src/types/*` | `src/components/*` |
| `src/lib/extract/schema.ts` | `zod`, `src/types/extraction.ts` | nothing else |
| `src/lib/extract/transcript/youtube.ts` | `youtube-transcript`, `src/types/extraction.ts` | other `src/lib/extract/*` |

### 9.4 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `page.tsx` | Presentation | `src/app/page.tsx` |
| `InputScreen` | Presentation | `src/components/InputScreen.tsx` |
| `ResultsScreen` | Presentation | `src/components/ResultsScreen.tsx` |
| `route.ts` (POST handler) | Application | `src/app/api/extract/route.ts` |
| `parseUrl` | Domain | `src/lib/extract/parse-url.ts` |
| `extractionSchema` (Zod) | Domain | `src/lib/extract/schema.ts` |
| `buildPrompt` | Domain | `src/lib/extract/claude/prompt.ts` |
| `ExtractionResult` types | Domain | `src/types/extraction.ts` |
| `youtubeTranscriptFetcher` | Infrastructure | `src/lib/extract/transcript/youtube.ts` |
| `claudeExtract` | Infrastructure | `src/lib/extract/claude/client.ts` |
| `rateLimit` | Infrastructure | `src/lib/extract/rate-limit.ts` |
| `logEvent` | Infrastructure | `src/lib/extract/logger.ts` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `ResultsScreen`, `InputScreen` |
| Functions | camelCase | `parseUrl`, `buildPrompt`, `extractViaClaude` |
| Constants | UPPER_SNAKE_CASE | `MAX_TRANSCRIPT_TOKENS`, `RATE_LIMIT_HOURLY` |
| Types/Interfaces | PascalCase | `ExtractionResult`, `TranscriptFetcher` |
| Files (component) | PascalCase.tsx | `ResultsScreen.tsx` |
| Files (utility) | kebab-case.ts | `parse-url.ts`, `rate-limit.ts` |
| Folders | kebab-case | `src/lib/extract/transcript/` |

### 10.2 Import Order

```typescript
// 1. External libraries
import { NextRequest } from "next/server";
import { z } from "zod";

// 2. Internal absolute imports
import { extractionSchema } from "@/lib/extract/schema";
import { youtubeTranscriptFetcher } from "@/lib/extract/transcript/youtube";

// 3. Types
import type { ExtractionResult, ExtractError } from "@/types/extraction";
```

### 10.3 Environment Variables

| Name | Purpose | Scope |
|------|---------|-------|
| `ANTHROPIC_API_KEY` | Claude API auth | Server only |
| `CLAUDE_MODEL` | Optional model override (default: `claude-haiku-4-5` or current Haiku alias) | Server only |

### 10.4 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Route runtime | `export const runtime = "nodejs"` at top of route.ts (Anthropic SDK requires Node) |
| Error envelope | Always `{ data }` OR `{ error }`, never bare primitives |
| RequestId | Generated at route entry via `crypto.randomUUID()`; included in every log line AND every error response |
| Zod | One schema for response shape; `schema.parse(json)` inside try/catch → `CLAUDE_PARSE_FAILED` on throw |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/
│   ├── page.tsx                          [MODIFIED — 반응형 컨테이너 래퍼]
│   ├── layout.tsx                        [unchanged]
│   └── api/
│       └── extract/
│           └── route.ts                  [NEW]
├── components/
│   ├── TopNav.tsx                        [NEW — hidden md:flex 상단 네브]
│   ├── InputScreen.tsx                   [MODIFIED — NUAMI 토큰 + 반응형]
│   ├── ResultsScreen.tsx                 [MODIFIED — NUAMI 토큰 + 카드 그리드]
│   └── BottomNav.tsx                     [MODIFIED — md:hidden 추가]
├── lib/
│   └── extract/
│       ├── parse-url.ts                  [NEW]
│       ├── schema.ts                     [NEW]
│       ├── rate-limit.ts                 [NEW]
│       ├── logger.ts                     [NEW]
│       ├── transcript/
│       │   ├── types.ts                  [NEW — TranscriptFetcher interface]
│       │   └── youtube.ts                [NEW]
│       └── claude/
│           ├── client.ts                 [NEW]
│           └── prompt.ts                 [NEW]
└── types/
    └── extraction.ts                     [NEW]
```

### 11.2 Implementation Order

**Phase A — 백엔드 파이프라인** (기존 설계 동일)
1. [ ] Install dependencies: `@anthropic-ai/sdk`, `zod`, `youtube-transcript`
2. [ ] Create `src/types/extraction.ts`
3. [ ] Create `src/lib/extract/schema.ts`
4. [ ] Create `src/lib/extract/parse-url.ts`
5. [ ] Create `src/lib/extract/transcript/types.ts` + `youtube.ts`
6. [ ] Create `src/lib/extract/claude/prompt.ts` + `client.ts`
7. [ ] Create `src/lib/extract/rate-limit.ts` + `logger.ts`
8. [ ] Create `src/app/api/extract/route.ts`

**Phase B — UI 리뉴얼** (v2 추가)
9. [ ] Create `src/components/TopNav.tsx` — `hidden md:flex` 상단 네브 (logo + 링크)
10. [ ] Modify `src/components/BottomNav.tsx` — 최상위 wrapper에 `md:hidden` 추가
11. [ ] Modify `src/app/page.tsx`
    - fetch state machine
    - 반응형 루트 컨테이너: `min-h-screen bg-background font-sans`
    - `max-w-[390px] md:max-w-3xl lg:max-w-5xl mx-auto`
12. [ ] Modify `src/components/InputScreen.tsx`
    - NUAMI 토큰 전환 (§5.4 매핑 참조)
    - Mobile: `fixed bottom` CTA 유지
    - `md:`: CTA를 form 내 인라인으로 전환 (`md:relative md:bottom-auto`)
    - `lg:`: `lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center` Hero + Input 레이아웃
    - TopNav 포함 (`hidden md:block`)
    - BottomNav 숨김: `md:hidden`
13. [ ] Modify `src/components/ResultsScreen.tsx`
    - NUAMI 토큰 전환
    - 카드 섹션: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`
    - 빈 상태: `bg-infoBox rounded-md`
    - TopNav 포함 (`hidden md:block`)
    - BottomNav 숨김: `md:hidden`
14. [ ] Smoke-test: `npm run dev`
    - 모바일 뷰 (375px): BottomNav 표시, CTA fixed bottom
    - 태블릿 뷰 (768px): TopNav 표시, BottomNav 숨김, 카드 2열
    - 데스크탑 뷰 (1280px): Hero+Input 2열, 카드 3열
15. [ ] `npm run build` + `npm run lint` — 0 error

### 11.3 TopNav Component Spec

```tsx
// src/components/TopNav.tsx
// hidden on mobile, shown on md+
// Design: bg-background border-b border-line-neutral

interface Props {
  active?: "videoai" | "saved" | "history";
}

// Layout: px-6 h-14 flex items-center justify-between
// Left: Logo (accent-700 color)
// Center: nav links (text-text-secondary, active: text-text-primary font-semibold)
// Right: avatar placeholder (w-8 h-8 rounded-full bg-muted)
```

### 11.4 Session Guide

#### Module Map (v2)

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| Domain types + schema | `module-1-domain` | `src/types/extraction.ts`, schema, parse-url | 4-6 |
| Transcript + Claude | `module-2-services` | transcript adapter, claude client+prompt | 6-8 |
| Route + infra | `module-3-route` | rate-limit, logger, route.ts | 6-8 |
| UI 리뉴얼 | `module-4-ui` | TopNav, InputScreen, ResultsScreen, BottomNav, page.tsx | 8-10 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | full | done |
| Session 2 | Do | `--scope module-1-domain,module-2-services,module-3-route` | 25-35 |
| Session 3 | Do | `--scope module-4-ui` | 15-20 |
| Session 4 | Check + Report | full | 20-30 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-19 | Initial design — Option C (Pragmatic) selected | CTO Lead |
| 0.2 | 2026-04-20 | UI Renewal — Option C (Fluid Center): responsive breakpoints, NUAMI design tokens, TopNav, card grid | Design Review |
