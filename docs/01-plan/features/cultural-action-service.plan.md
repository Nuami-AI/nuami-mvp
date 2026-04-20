# cultural-action-service Planning Document

> **Summary**: Build the real backend extraction pipeline (`POST /api/extract`) that replaces the mock data in `ResultsScreen.tsx` — URL → transcript → Claude structured extraction → typed JSON cards.
>
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: CTO Lead (PDCA Team — Dynamic)
> **Date**: 2026-04-19
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | `ResultsScreen.tsx` currently ships hardcoded `INIT_PLACES`/`INIT_PHRASES`/`INIT_TIPS` constants. Every demo is theater, no user test can actually validate extraction quality, and the "Extract" button is inert. |
| **Solution** | A Next.js 16 App Router Route Handler at `app/api/extract/route.ts` that parses the URL, fetches the YouTube transcript (library-based, TikTok returns `UNSUPPORTED_PLATFORM`), calls Claude with a Zod-validated JSON contract, and returns `{ data: ExtractionResult }` or `{ error }`. The client page owns fetch state (idle/loading/error/success) and passes `data` to `ResultsScreen` as a prop. |
| **Function/UX Effect** | Extract button becomes live: paste → <15s P50 → 3 cards stacks rendered from real transcript quotes. No-caption videos get a typed error with a retry hint. Rate-limit hits show a cooldown toast. |
| **Core Value** | Replaces 15 minutes of manual note-taking with a single URL paste. Grounded-in-transcript output (every place has a verbatim `quote`) is the defensible wedge vs Eightify-style summary tools. |

---

## Context Anchor

> Auto-generated from Executive Summary + PRD. Propagated to Design/Do/Analysis.

| Key | Value |
|-----|-------|
| **WHY** | Mock data on `ResultsScreen.tsx` is the single largest credibility gap in the MVP. Without a real extractor, every demo is a lie. |
| **WHO** | SEA outbound travelers (VN/TH/ID) aged 22–38 watching Korea travel content on YouTube / Shorts. Beachhead persona: Linh (27, Hanoi → Seoul). |
| **RISK** | (1) Inconsistent YouTube caption availability. (2) Claude cost must stay <$0.02/call. (3) Hallucinated places (placeholder data leaking into output). |
| **SUCCESS** | ≥85% YouTube URL success rate, P50 ≤10s / P95 ≤18s, Zod parse ≥98%, cost P50 ≤$0.015. `grep INIT_PLACES src/` returns zero hits post-merge. |
| **SCOPE** | IN: `/api/extract`, URL parser, YouTube transcript adapter, Claude client, Zod schema, in-memory rate limit, client wiring in `page.tsx` + `ResultsScreen.tsx` + `InputScreen.tsx`. OUT: auth, persistence, TTS, OCR, payment, TikTok support (returns `UNSUPPORTED_PLATFORM`). |

---

## 1. Overview

### 1.1 Purpose

Replace the mock extraction in `ResultsScreen.tsx` with a real backend service that converts a pasted YouTube URL into a typed `{ video, places[], phrases[], tips[] }` payload grounded in the actual video transcript.

### 1.2 Background

- The MVP's entire value proposition — "paste a travel video, get saveable cards" — is faked today. The UI is complete, the backend is absent.
- PRD `docs/00-pm/cultural-action-service.prd.md` establishes the beachhead (VN → Korea travelers) and demands transcript-grounded extraction (every place card traces to a verbatim `quote`) as the wedge vs summary competitors.
- AGENTS.md warns: this is Next.js 16.2.4 — training-data assumptions about API Routes / middleware are unsafe. Use App Router Route Handlers (`route.ts`).

### 1.3 Related Documents

- PRD: [docs/00-pm/cultural-action-service.prd.md](../../00-pm/cultural-action-service.prd.md)
- AGENTS.md: `/AGENTS.md` (Next.js 16 breaking-change warning)
- Next.js Route Handlers: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- Next.js Backend-for-Frontend: `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] `POST /api/extract` App Router Route Handler (Node runtime — required for Anthropic SDK)
- [ ] URL parser supporting `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, and TikTok detection
- [ ] YouTube transcript fetcher (community library `youtube-transcript`) with adapter interface for future swap
- [ ] Claude extraction with Zod-validated structured output (Haiku-class model, JSON mode)
- [ ] Error contract: typed `{ code, message, hint? }` responses with codes `INVALID_URL`, `UNSUPPORTED_PLATFORM`, `TRANSCRIPT_UNAVAILABLE`, `TRANSCRIPT_TOO_SHORT`, `CLAUDE_PARSE_FAILED`, `RATE_LIMITED`, `INTERNAL`
- [ ] In-memory rate limiter (per-IP: 10/hour, 3/minute) with `429` + `Retry-After`
- [ ] Request-scoped logging (`{ requestId, url, platform, tokensIn, tokensOut, latencyMs, errorCode? }`)
- [ ] Transcript substring check: reject extractions whose `quote` field is not in the source transcript (hallucination guard)
- [ ] Client integration: `src/app/page.tsx` owns fetch state (`idle | loading | success | error`), passes `data` to `ResultsScreen`, passes `isLoading` and `onExtract` to `InputScreen`
- [ ] `ResultsScreen.tsx` refactor: accept `data` prop, delete `INIT_*` mock constants, derive bookmark state from id keyed by index since backend returns no ids (place/phrase/tip indices are stable within a response)
- [ ] Loading state UI in InputScreen button (disable + spinner) — no separate skeleton screen for MVP
- [ ] Error state UI in `page.tsx` (inline error card above Extract button)

### 2.2 Out of Scope

- User authentication / accounts
- Persistent storage of extractions (no DB in MVP)
- TTS audio playback (the Listen button stays inert)
- Video-frame OCR / visual analysis
- Payment / subscription
- Multi-language UI
- TikTok transcript support (returns `UNSUPPORTED_PLATFORM` error; UI shows hint)
- Shareable permalink URLs (deferred to v1.1)
- Kakao/Google Map deep-link wiring to extracted place names (buttons exist in UI but stay inert — handled by a future feature)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `POST /api/extract` accepts `{ url: string }` JSON body; validates URL shape; returns typed success or error envelope | High | Pending |
| FR-02 | YouTube transcript fetcher returns `{ title, channel, text, language }`; handles no-caption videos with `TRANSCRIPT_UNAVAILABLE` | High | Pending |
| FR-03 | TikTok URLs detected at parse time; return `UNSUPPORTED_PLATFORM` (not a silent failure) | High | Pending |
| FR-04 | Claude call uses structured-output prompt; Zod schema validates response shape; mismatches return `CLAUDE_PARSE_FAILED` | High | Pending |
| FR-05 | Hallucination guard: each `places[].quote` MUST be a case-insensitive substring of the transcript; non-matching entries are dropped (not rejected wholesale) | High | Pending |
| FR-06 | In-memory rate limit per IP: 10/hour, 3/minute; 11th hourly / 4th per-minute request returns 429 with `Retry-After` seconds | High | Pending |
| FR-07 | Every request logs `{ requestId, url, platform, tokensIn, tokensOut, latencyMs, errorCode? }` to `console.info` (stdout-friendly for Vercel) | Medium | Pending |
| FR-08 | `src/app/page.tsx` replaces `showResults` boolean with fetch state machine and passes real `data` to `ResultsScreen` | High | Pending |
| FR-09 | `ResultsScreen.tsx` accepts `data: ExtractionResult` prop; all `INIT_*` constants removed | High | Pending |
| FR-10 | `InputScreen.tsx` accepts `isLoading: boolean` and disables Extract button + shows spinner when true; accepts `error: string \| null` for inline error display | Medium | Pending |
| FR-11 | Transcript truncation: if transcript exceeds 8000 tokens (~32k chars), truncate and include a `truncated: true` flag in the Claude prompt context | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance (P50) | Time-to-first-card ≤ 10s on YouTube | Server log histogram of `latencyMs` |
| Performance (P95) | Time-to-first-card ≤ 18s on YouTube | Server log histogram |
| Parse success | Zod validation pass rate ≥ 98% | 1 - (`CLAUDE_PARSE_FAILED` / total) |
| Cost | Claude P50 cost ≤ $0.015/call | Anthropic usage dashboard |
| Availability | 99% (Vercel serverless default acceptable) | Uptime monitor |
| Secret handling | `ANTHROPIC_API_KEY` never in client bundle | Build-time grep of `.next/static/` |
| Security | No arbitrary URL → SSRF (only whitelisted domains for transcript fetch) | Code review + test |
| Observability | Every call logs structured line; `requestId` surfaced in error responses | Manual QA |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `POST /api/extract` deployed and returns 200 for valid YouTube URLs in <15s
- [ ] `ResultsScreen.tsx` renders real data; `grep -r "INIT_PLACES\|INIT_PHRASES\|INIT_TIPS" src/` returns zero matches
- [ ] `page.tsx` has working fetch flow (loading / error / success states)
- [ ] All 7 error codes (`INVALID_URL`, `UNSUPPORTED_PLATFORM`, `TRANSCRIPT_UNAVAILABLE`, `TRANSCRIPT_TOO_SHORT`, `CLAUDE_PARSE_FAILED`, `RATE_LIMITED`, `INTERNAL`) have at least one code path that emits them
- [ ] Rate limiter blocks the 11th request in a rolling hour with 429
- [ ] Build succeeds: `npm run build` exits 0
- [ ] Lint passes: `npm run lint` exits 0
- [ ] Zero TypeScript errors

### 4.2 Quality Criteria

- [ ] Hallucination guard drops non-substring quotes (verified with a test transcript where we inject a fake place)
- [ ] Zero `any` types in the new code (strict typing on route + client integration)
- [ ] No secrets in client bundle (verified via `grep` on build output)
- [ ] Server logs contain `requestId` on every call (success and error paths)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| YouTube caption endpoint breakage (library rot, quota, shape change) | High | Medium | Wrap in adapter interface `TranscriptFetcher`; swap implementation without touching the route; return typed `TRANSCRIPT_UNAVAILABLE` on failure so the UI degrades cleanly |
| Claude hallucinates places not in transcript | High | Medium | Prompt enforces verbatim `quote` field; server drops entries whose quote is not a substring of the transcript (FR-05); quotes are shown in the UI so users spot issues |
| Cost per call exceeds $0.05 on long videos | Medium | Medium | Cap transcript at 8k tokens (FR-11); include truncation marker in prompt; Haiku-class model (cheap) |
| Anthropic SDK requires Node runtime but route defaults to Edge | High | Low | Explicitly set `export const runtime = 'nodejs'` on the route handler |
| In-memory rate limit resets on cold start (Vercel serverless) | Low | High | Accept as MVP limitation (rate limit is best-effort; per-IP-per-instance); document that production hardening needs Redis/Upstash |
| Zod schema drift between server and client | Medium | Low | Define the `ExtractionResult` type once in `src/types/extraction.ts` and import from both route and `ResultsScreen` |
| Stale mock URL (empty state) crashes `ResultsScreen` when API returns 0 places | Low | Medium | Component defensively renders "No places found" empty state per section |
| Next.js 16 App Router API differences from training data | High | Medium | Follow Next.js docs in `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` exactly (AGENTS.md directive) |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/app/page.tsx` | Client component | Replace `showResults: boolean` with fetch state machine; add `data`, `error`, `isLoading` state; call `/api/extract` on Extract |
| `src/components/ResultsScreen.tsx` | Client component | Remove `INIT_PLACES/PHRASES/TIPS` constants and `VIDEO` constant; accept `data: ExtractionResult` prop; keep bookmark toggle state but key it by index |
| `src/components/InputScreen.tsx` | Client component | Accept `isLoading: boolean` and `error: string \| null` props; disable Extract + show spinner while loading; render inline error card |
| `src/app/api/extract/route.ts` | New file | Route handler (POST) |
| `src/lib/extract/*` | New files | URL parser, transcript fetcher, Claude client, Zod schema, rate limiter |
| `src/types/extraction.ts` | New file | Shared types (`ExtractionResult`, `Place`, `Phrase`, `Tip`, `ExtractError`) |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `ResultsScreen` | Import | `src/app/page.tsx` line 3 | **Breaking prop signature** — must add `data` prop; updated simultaneously in same PR |
| `InputScreen` | Import | `src/app/page.tsx` line 2 | **Additive props** — `isLoading`, `error` default to safe values; updated simultaneously |
| `BottomNav` | Import | Both `ResultsScreen.tsx` and `InputScreen.tsx` | No change |
| `INIT_PLACES/PHRASES/TIPS` | Usage | `ResultsScreen.tsx` only | Deleted — no external consumers |
| `VIDEO` (mock const) | Usage | `ResultsScreen.tsx` only | Deleted |

### 6.3 Verification

- [ ] `ResultsScreen` prop contract updated; caller in `page.tsx` updated in same commit
- [ ] `InputScreen` backward-compatible (new props optional or default-valued); current button click flow preserved
- [ ] No hidden consumers of `INIT_*` constants (`grep` confirms)
- [ ] BottomNav unchanged (sanity check)

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| Starter | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based, API routes, light service layer | Web apps with backend, SaaS MVPs | ☑ |
| Enterprise | Strict layer separation, microservices | High-traffic, complex systems | ☐ |

Rationale: Single Next.js app, single API route, no microservices, no DB. Dynamic fits MVP perfectly.

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js 16 / custom server | **Next.js 16 App Router** | Already in use; route handler is the idiomatic path |
| Route runtime | Edge / Node | **Node (`runtime = 'nodejs'`)** | Anthropic SDK requires Node APIs; confirmed in PRD open question 4 |
| State management | Context / Zustand / local `useState` | **Local `useState` in `page.tsx`** | Single-page flow, no shared state; adding a store is overkill |
| API client | `fetch` / axios / tanstack-query | **Native `fetch`** | No caching/retry requirements; 1 call per user action |
| Validation | Zod / yup / manual | **Zod** | PRD mandates Zod; also used for Claude structured-output validation |
| Transcript source | Data API v3 (official, quota) / `youtube-transcript` npm (community) | **`youtube-transcript`** | Zero quota management for MVP; adapter interface makes future swap trivial |
| Claude model | Haiku / Sonnet | **Haiku (`claude-haiku-4-5` or latest Haiku)** | Cost-bound per PRD NFR; Haiku hits quality target on structured extraction |
| Styling | Tailwind 4 (already installed) | **Tailwind** | No change |
| Testing | Jest / Vitest / Playwright | **Manual curl + browser for MVP** | PRD Test Scenarios table is accepted as manual QA checklist; automated test harness deferred to Check phase if gap detector flags it |
| Rate limit store | In-memory Map / Redis / Upstash | **In-memory Map** (MVP) | Acceptable per PRD; document the cold-start caveat |

### 7.3 Clean Architecture Approach

```
Selected Level: Dynamic

Folder Structure:
src/
├── app/
│   ├── page.tsx                         [Presentation — fetch state + composition]
│   ├── layout.tsx                        [unchanged]
│   └── api/
│       └── extract/
│           └── route.ts                  [Application — orchestrates the pipeline]
├── components/
│   ├── InputScreen.tsx                   [Presentation — loading/error props]
│   ├── ResultsScreen.tsx                 [Presentation — data prop]
│   └── BottomNav.tsx                     [unchanged]
├── lib/
│   └── extract/
│       ├── parse-url.ts                  [Domain — URL parsing logic]
│       ├── transcript/
│       │   └── youtube.ts                [Infrastructure — youtube-transcript adapter]
│       ├── claude/
│       │   ├── client.ts                 [Infrastructure — Anthropic SDK wrapper]
│       │   └── prompt.ts                 [Domain — extraction prompt template]
│       ├── schema.ts                     [Domain — Zod schema for ExtractionResult]
│       ├── rate-limit.ts                 [Infrastructure — in-memory limiter]
│       └── logger.ts                     [Infrastructure — structured logging]
└── types/
    └── extraction.ts                     [Domain — shared types]
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] `CLAUDE.md` exists (imports `AGENTS.md` which mandates reading Next.js docs before writing route code)
- [ ] `docs/01-plan/conventions.md` does NOT exist (no Phase 2 pipeline yet)
- [ ] `CONVENTIONS.md` does NOT exist
- [x] ESLint configured (`eslint-config-next`)
- [ ] Prettier not configured (use ESLint defaults)
- [x] TypeScript `tsconfig.json` present

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | Inferred from existing code | PascalCase components, camelCase utilities, kebab-case folders | Medium |
| **Folder structure** | `src/app/`, `src/components/` exist | Add `src/lib/extract/`, `src/types/` | High |
| **Import order** | No explicit rule | External → absolute `@/` → relative → types | Low |
| **Environment variables** | None currently | `ANTHROPIC_API_KEY` (server-only) | High |
| **Error handling** | None in existing code | Typed error codes + envelope pattern from PRD §5.3 | High |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `ANTHROPIC_API_KEY` | Claude API auth | Server (no `NEXT_PUBLIC_` prefix) | ☑ |
| `CLAUDE_MODEL` | Override default Haiku model | Server | ☐ (optional, default in code) |
| `RATE_LIMIT_HOURLY` | Override hourly limit for testing | Server | ☐ (optional) |

`YOUTUBE_API_KEY` from PRD is NOT needed — we use `youtube-transcript` library which does not require an API key.

### 8.4 Pipeline Integration

Not using 9-phase pipeline. Direct PDCA flow.

---

## 9. Next Steps

1. [ ] `/pdca design cultural-action-service` — generate Design doc with 3 architecture options
2. [ ] `/pdca do cultural-action-service` — implement the service + client integration
3. [ ] `/pdca analyze cultural-action-service` — run Gap analysis against this Plan

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-19 | Initial draft from PRD | CTO Lead |
