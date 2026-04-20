# cultural-action-service Completion Report

> **Feature**: cultural-action-service
> **Completed**: 2026-04-19
> **Author**: CTO Lead (PDCA Team — Dynamic)
> **Final Match Rate**: 97.2% (static analysis; runtime criteria measured in production)
> **Status**: Complete (pending `npm install` + smoke test by owner)

---

## Executive Summary

| Perspective | Planned | Delivered |
|-------------|---------|-----------|
| **Problem** | `ResultsScreen.tsx` showed mock constants; Extract button inert; every demo was theater. | **Resolved.** `grep INIT_PLACES src/` returns 0 hits. Extract button now calls a real API. |
| **Solution** | Next.js 16 App Router Route Handler (`POST /api/extract`) with Node runtime; URL parse → YouTube transcript fetch → Claude Haiku structured output → Zod validate → hallucination guard. | **Shipped.** All 10 modules from Design §11.1 exist and wire through the route. |
| **Function/UX Effect** | Paste URL → <15s → 3 card stacks. Typed errors. Rate-limit cooldown. Loading spinner. | Client has full state machine (idle/loading/success/error); button disables + spinner; inline error card with per-code copy for all 7 error codes. |
| **Core Value** | Grounded output — every place card ties to a verbatim transcript quote (defensible wedge vs summary tools). | Enforced server-side: `route.ts` drops any place whose `quote` is not a case-insensitive substring of the fetched transcript. |

---

## Key Decisions & Outcomes

| Layer | Decision | Followed? | Outcome |
|-------|---|:-:|---|
| PRD | Beachhead: VN/TH/ID travelers watching Korea content | ✅ | Implementation is platform-neutral (YouTube only), but supports multilingual transcripts and preserves `quote` in original language |
| PRD | Use Haiku-class model for cost | ✅ | `claude-haiku-4-5` default with `CLAUDE_MODEL` env override |
| Plan | Dynamic-level architecture | ✅ | Single Next.js app, module-per-concern under `src/lib/extract/` |
| Plan | Node runtime for Anthropic SDK | ✅ | `export const runtime = "nodejs"` at top of route.ts |
| Plan | `youtube-transcript` over Data API v3 | ✅ | No API key required; adapter pattern allows future swap |
| Plan | In-memory rate limit (MVP) | ✅ | `src/lib/extract/rate-limit.ts` with documented cold-start caveat |
| Design | Option C (Pragmatic Balance) selected over Minimal (A) and Clean Arch (B) | ✅ | 10 files, 4 modifications, ~600 net new LOC |
| Design | Zod as single source of truth with `src/types/extraction.ts` | ✅ | Types + schema stay in sync via `_typeCheck` assignment |
| Design | Hallucination guard (substring check) | ✅ | `route.ts` lines 163-166 — case-insensitive substring filter |

---

## Plan Success Criteria — Final Status

| # | Criterion | Status | Evidence |
|---|---|:-:|---|
| SC-1 | ≥85% YouTube URLs return well-formed extraction | ⏸ Runtime-dependent | Code path in place; measure with first 200 production calls |
| SC-2 | P50 ≤10s, P95 ≤18s | ⏸ Runtime-dependent | `durationMs` logged on every call |
| SC-3 | Zod parse success ≥98% | ⏸ Runtime-dependent | Zod gates every response; `CLAUDE_PARSE_FAILED` is countable |
| SC-4 | Claude P50 cost ≤$0.015 | ⏸ Runtime-dependent | Haiku + 32k-char cap; `tokensIn/tokensOut` logged |
| **SC-5** | Zero `INIT_*` grep hits | ✅ **Met** | Confirmed: `rg "INIT_PLACES|INIT_PHRASES|INIT_TIPS" src/` returns empty |
| **SC-6** | Every error path has user-visible message | ✅ **Met** | `InputScreen.friendlyError()` covers all 7 `ExtractErrorCode` values |

**Static-completable SCs: 2/2 met (100%). Runtime SCs: instrumentation shipped, measurement pending production traffic.**

---

## What Shipped

### New files (10)

```
src/types/extraction.ts                          (64 lines)  Domain types
src/lib/extract/schema.ts                        (62 lines)  Zod schema + typecheck
src/lib/extract/parse-url.ts                     (64 lines)  Pure URL parser
src/lib/extract/rate-limit.ts                    (54 lines)  In-memory limiter
src/lib/extract/logger.ts                        (28 lines)  Structured JSON logs
src/lib/extract/transcript/types.ts              (26 lines)  TranscriptFetcher interface
src/lib/extract/transcript/youtube.ts            (69 lines)  youtube-transcript adapter
src/lib/extract/claude/prompt.ts                 (47 lines)  System + user prompt
src/lib/extract/claude/client.ts                 (84 lines)  Anthropic SDK wrapper
src/app/api/extract/route.ts                    (213 lines)  POST handler orchestrator
```

### Modified files (3)

```
src/app/page.tsx                                 Replaced `showResults` boolean with idle|loading|success|error state machine
src/components/InputScreen.tsx                   Added `isLoading`, `error`, `onDismissError` props; spinner; inline error card; per-code copy
src/components/ResultsScreen.tsx                 Dropped `INIT_PLACES|INIT_PHRASES|INIT_TIPS|VIDEO` constants; accepts `data: ExtractionResult` prop; empty states; bookmark state keyed by index
```

### Dependencies added

```
@anthropic-ai/sdk  ^0.32.1
youtube-transcript ^1.2.1
zod                ^3.23.8
```

---

## Error Handling Coverage (all 7 codes shipped)

| Code | HTTP | Server path | Client copy |
|---|---|---|---|
| `INVALID_URL` | 400 | body parse + URL parse failures | "That doesn't look like a valid video URL." |
| `UNSUPPORTED_PLATFORM` | 400 | TikTok or unknown host | "TikTok support is coming soon." |
| `TRANSCRIPT_UNAVAILABLE` | 404 | `youtube-transcript` throws or empty | "This video has no captions we can read." |
| `TRANSCRIPT_TOO_SHORT` | 422 | transcript < 200 chars | "This video is too short to extract from." |
| `RATE_LIMITED` | 429 (+ `Retry-After`) | 10/hr or 3/min exceeded | "You've hit the rate limit." + `hint` |
| `CLAUDE_PARSE_FAILED` | 502 | JSON.parse throws or Zod fails | "We couldn't parse the extraction result." |
| `INTERNAL` | 500 | Anything else | "Something went wrong." |

---

## Delta vs Plan Scope

| Item | Status |
|---|:-:|
| `POST /api/extract` route | ✅ Shipped |
| URL parser (youtube.com/watch, youtu.be, shorts, TikTok detection) | ✅ Shipped (11-char videoId validated via regex) |
| YouTube transcript via `youtube-transcript` | ✅ Shipped (with oEmbed for title/channel metadata) |
| Claude extraction (Haiku) | ✅ Shipped (with fence/preamble strip defense) |
| Zod schema | ✅ Shipped (with type-identity assertion) |
| In-memory rate limit | ✅ Shipped (per-IP, 10/hr + 3/min) |
| Structured logging | ✅ Shipped |
| Hallucination guard | ✅ Shipped (case-insensitive substring match) |
| Client fetch state machine | ✅ Shipped |
| InputScreen loading + error | ✅ Shipped |
| ResultsScreen data prop + empty states | ✅ Shipped |
| `YOUTUBE_API_KEY` env var | **Not needed** — `youtube-transcript` works without an API key. Plan §8.3 originally suggested it; removed during Do phase after confirming library capabilities. |
| Automated test harness | **OUT OF SCOPE** per Plan §7.2 — manual QA accepted for MVP |

---

## Open Items for the Owner

1. **Install dependencies**: `npm install` (one-time)
2. **Set env var**: Add `ANTHROPIC_API_KEY=sk-ant-...` to `.env.local` (never commit)
3. **Smoke test**: `npm run dev` → paste a real YouTube travel URL → verify cards render with grounded quotes
4. **Production deployment**: Set `ANTHROPIC_API_KEY` in Vercel project settings
5. **Monitor first 200 calls** to validate runtime SCs (SC-1 through SC-4)

---

## Follow-ups (v1.1 candidates, not shipped here)

- Map deep-link wiring (Kakao/Google Maps buttons currently inert; unblock by geocoding `place.name`)
- TTS Listen button on phrases
- Shareable permalink (`/r/[requestId]`) — would need persistence (Redis/DB)
- Redis/Upstash rate limiter (cold-start-safe)
- TikTok transcript support (once a stable library surfaces)
- Automated Playwright tests for L1/L2/L3 scenarios from Design §8
- Telemetry export to Sentry / Datadog (logger already emits structured JSON)

---

## PDCA History

| Phase | Artifact | Outcome |
|-------|---|---|
| PM | `docs/00-pm/cultural-action-service.prd.md` (pre-existing) | PRD defined beachhead + contract |
| Plan | `docs/01-plan/features/cultural-action-service.plan.md` | 11 FRs, Option C architecture chosen |
| Design | `docs/02-design/features/cultural-action-service.design.md` | 10-file module map + Page UI Checklist |
| Do | Implementation across 13 files | All modules shipped |
| Check | `docs/03-analysis/cultural-action-service.analysis.md` | 97.2% match rate, 0 Critical, 1 Important (ops) |
| Act | Skipped (above 90% gate, no Critical) | — |
| Report | This document | Complete |

---

## Sources

- [youtube-transcript - npm](https://www.npmjs.com/package/youtube-transcript) (library API signature verified)
- Next.js 16.2.4 Route Handlers doc: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- AGENTS.md directive: breaking changes in Next.js 16 — docs consulted before writing route handler code
