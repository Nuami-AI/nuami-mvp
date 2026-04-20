# PRD: Cultural Action Service (Backend Service Layer)

> **Feature ID**: `cultural-action-service`
> **Product**: nuami-mvp (YouTube Script Analyzer)
> **Author**: PM Agent Team (pm-lead orchestrated)
> **Date**: 2026-04-19
> **Status**: Draft v1.0
> **Next Step**: `/pdca plan cultural-action-service`

---

## Executive Summary

| Perspective | Statement |
|-------------|-----------|
| **Problem** | Travelers discover culturally rich places, phrases, and tips inside travel videos, but the information is trapped in spoken monologue — unsearchable, unsaveable, and lost the moment the video ends. Today the `ResultsScreen` mocks this value; the product cannot actually deliver it without a real extraction backend. |
| **Solution** | A stateless Next.js API route (`POST /api/extract`) that accepts a video URL, fetches its transcript (YouTube/Shorts/TikTok), prompts Claude with a structured-output contract, and returns a typed JSON payload of `{ video, places[], phrases[], tips[] }` ready for the existing UI. |
| **Function UX Effect** | The "Extract" button becomes real: one tap converts any travel video into three bookmarkable card stacks with map deep-links and original-language quotes. Time-to-first-card target: ≤ 12s on YouTube, ≤ 20s on TikTok. |
| **Core Value** | Turns passive video-watching into actionable trip intelligence. Replaces 15+ minutes of manual note-taking, screenshot-stitching, and translation with a single URL paste — so the traveler keeps the content, not just the memory. |

---

## Context Anchor

| Dimension | Value |
|-----------|-------|
| **WHY** | Mock data on `ResultsScreen.tsx` is the single largest credibility gap in the MVP. Without a real extractor, every demo is a lie and every user test is theater. |
| **WHO** | Primary: outbound travelers aged 22–38 actively saving travel content on short-form platforms (Vietnamese, Thai, Indonesian viewers of Korea-focused videos). Secondary: domestic cultural-tourism content consumers. |
| **RISK** | (1) YouTube transcript availability is inconsistent (auto-caption quality, no-caption videos, TikTok API access). (2) Claude API cost per extraction must stay under $0.02 to sustain free-tier UX. (3) Structured output drift (hallucinated places). |
| **SUCCESS** | ≥ 85% of submitted YouTube URLs return ≥ 3 places + ≥ 5 phrases + ≥ 3 tips within 15s. Claude JSON parse success ≥ 98%. Per-call cost ≤ $0.015 P50. |
| **SCOPE** | IN: `/api/extract` route, transcript fetcher, Claude client, Zod schema, in-memory rate limit, client wiring. OUT: user accounts, persistent storage of results, audio TTS, advanced video-frame analysis, payment. |

---

## 1. Discovery (Opportunity Solution Tree)

*Framework: Teresa Torres' Continuous Discovery Habits — 5-Step Chain*

### 1.1 Step 1 — Brainstorm (Desired Outcome)

**Outcome**: "Traveler paste-to-plan: turn any travel video URL into a saveable, actionable mini-guide in under 15 seconds."

### 1.2 Step 2 — Assumptions Surfaced

| # | Assumption | Type | Risk |
|---|------------|------|------|
| A1 | YouTube videos the target persona watches have usable captions (auto or manual) ≥ 80% of the time | Desirability/Feasibility | High |
| A2 | Claude can reliably extract {places, phrases, tips} from noisy transcripts with one prompt | Feasibility | High |
| A3 | Users will tolerate a 10–15s loading state if the output quality is high | Desirability | Medium |
| A4 | Map deep-links (Kakao/Google) from extracted place names resolve correctly ≥ 90% of the time | Viability | Medium |
| A5 | Transcript + prompt cost stays under $0.02/call on Claude Haiku-class models | Viability | High |
| A6 | TikTok transcript access is feasible without breaking ToS | Feasibility | High |

### 1.3 Step 3 — Prioritization (Impact × Risk)

**Top 3 to test first** (in order):
1. **A2** — Claude extraction accuracy — test with 10 real travel videos before any UI work
2. **A5** — Cost per call — measure with actual transcripts, not toy inputs
3. **A1** — Caption availability — sample the persona's Watch Later lists

### 1.4 Step 4 — Experiments

| Assumption | Experiment | Falsifiable Metric |
|------------|------------|-------------------|
| A2 | Run 10 transcripts through a prompt harness, human-rate extractions | ≥ 8/10 receive "useful" rating |
| A5 | Measure avg input+output tokens × 3 model tiers | Haiku P50 ≤ $0.015 |
| A1 | Scrape 50 candidate video IDs from target creators, check transcript API | ≥ 80% return non-empty |

### 1.5 Step 5 — Opportunity Solution Tree

```
OUTCOME: Paste-to-plan in <15s
│
├── OPPORTUNITY 1: "I can't search inside a video"
│   ├── Solution A: Transcript-grounded extraction (CHOSEN)
│   ├── Solution B: User manually timestamps places
│   └── Solution C: Visual OCR of on-screen text
│
├── OPPORTUNITY 2: "I lose places the moment the video ends"
│   ├── Solution A: Bookmark-per-card (already in UI)
│   └── Solution B: Export to Notion/Maps — deferred
│
└── OPPORTUNITY 3: "I can't speak the language"
    ├── Solution A: Extract key phrases with translation (CHOSEN)
    ├── Solution B: Full subtitle dump — too noisy
    └── Solution C: TTS audio of phrases — deferred to v2
```

---

## 2. Strategy (Value Proposition + Lean Canvas)

### 2.1 Value Proposition (JTBD 6-Part)

| Part | Statement |
|------|-----------|
| **For** | Outbound travelers aged 22–38 who save travel videos on YouTube / Shorts / TikTok |
| **Who** | Need to remember and act on the places, phrases, and tips shown in those videos |
| **The** | nuami Cultural Action Service |
| **Is a** | One-tap video-to-trip-guide extractor |
| **That** | Converts a pasted URL into saveable, map-linked, phrase-audio-ready cards in under 15 seconds |
| **Unlike** | Taking manual screenshots, copy-pasting comments into Notes, or rewatching the same 90-second Short five times |
| **Our product** | Grounds its output in the actual video transcript via Claude's structured-output contract, so nothing is invented and every card traces back to a real timestamp |

### 2.2 Lean Canvas

| Box | Content |
|-----|---------|
| **Problem** | (1) Info inside videos is unsearchable. (2) Manual note-taking is slow and lossy. (3) Language barriers block recall of native phrases. |
| **Customer Segments** | Early adopters: SEA travelers (VN/TH/ID) watching Korea content. Mass: any outbound traveler saving short-form travel videos. |
| **Unique Value Prop** | "Paste a video URL, get a usable mini-guide in 15 seconds — grounded in the actual subtitles, not AI-hallucinated." |
| **Solution** | `/api/extract`: URL → transcript → Claude structured extraction → typed JSON → UI cards. |
| **Channels** | Reddit r/travel + r/koreatravel, TikTok creator partnerships, organic share-the-result flow. |
| **Revenue Streams** | (v2) Freemium: 5 extractions/day free, unlimited + saved history for $3.99/mo. |
| **Cost Structure** | Claude API (dominant variable cost), Vercel hosting, transcript fetcher (free-tier YouTube Data API v3). |
| **Key Metrics** | Extraction success rate, time-to-first-card, retention D7, cost per extraction. |
| **Unfair Advantage** | Transcript-grounded output with original-language quotes preserves creator voice — competitors either scrape metadata or hallucinate. |

### 2.3 SWOT

| Dimension | Items |
|-----------|-------|
| **Strengths** | Grounded extraction (low hallucination), mobile-first UI already built, simple scope |
| **Weaknesses** | Transcript dependency, no user accounts yet, no persistence |
| **Opportunities** | Short-form travel content is growing; SEA→Korea tourism is a rising wedge |
| **Threats** | YouTube API quota changes; Claude pricing shifts; TikTok ToS enforcement |

**SO Strategy**: Double down on YouTube (strongest transcript access) for beachhead; save TikTok for v2 once caption API matures.
**WT Strategy**: Add in-memory rate limiting now, defer user accounts until post-PMF, so threats don't compound into cost blowups.

---

## 3. Research (Personas + Competitors + Market)

### 3.1 Personas

**Persona 1 — Linh, 27, Hanoi → Seoul (Primary)**
- **JTBD**: "When I'm scrolling short-form Korea travel content before my October trip, I want to keep the specific cafes and places I see, so I can actually find them when I arrive."
- **Pain**: Watches 30+ videos, remembers 3. Screenshots lose context. Kakao Map search in Vietnamese fails.
- **Gain**: One URL paste per video → a running list of places with working map links.
- **Tech**: iPhone 13, Chrome mobile, CapCut power user.

**Persona 2 — Arief, 31, Jakarta → Busan (Secondary)**
- **JTBD**: "When I'm planning a food trip, I want to grab the exact Korean phrases the creator uses to order, so I don't get the wrong dish."
- **Pain**: Google Translate output is generic; creators use casual/slang versions not in phrasebooks.
- **Gain**: Bookmarked phrase deck tied to the exact context.

**Persona 3 — Mei, 34, Taipei → Gangneung (Tertiary)**
- **JTBD**: "When I'm deciding if a destination is worth the detour, I want the unfiltered 'insider tips' locals mention offhand, so I can skip the tourist-trap version."
- **Pain**: Tips are buried at minute 7 of a 12-minute video. Rewatching is tedious.
- **Gain**: Extracted tip list ranked by the creator's emphasis.

### 3.2 Competitive Landscape

| # | Competitor | What They Do | Weakness We Exploit |
|---|------------|--------------|---------------------|
| 1 | **Eightify** | AI video summaries (YouTube) | Summary only — no structured places/phrases/tips, no map links |
| 2 | **Notta** | Transcript + summary | Generic knowledge work focus, not travel-tuned |
| 3 | **Kakao Map / Google Maps "Lists"** | Manual place saving | No video ingestion; user does all the work |
| 4 | **Wanderlog** | Travel itinerary builder | Accepts no video input; manual entry |
| 5 | **TikTok "Save" + Notes** | Native bookmarking | No extraction, no search inside saved videos |

**Wedge**: None of the above does *video → structured, travel-typed extraction* with creator-grounded quotes. That's the defensible niche.

### 3.3 Market Sizing (TAM/SAM/SOM — Dual Method)

**Top-Down**
- TAM: Global outbound travelers saving short-form video ≈ 180M users × $20 ARPU = **$3.6B**
- SAM: SEA → Korea travel watchers ≈ 8M × $20 = **$160M**
- SOM (Y1): Beachhead of 50K Vietnamese Korea-trip planners × $8 effective ARPU = **$400K**

**Bottom-Up**
- If 0.5% of VN Korea-travel YouTube viewers (~1.6M monthly) convert to 5+ extractions → 8K WAU
- At $3.99/mo freemium conversion of 6% → 480 paying users × $48/yr = **$23K ARR** (seed-stage plausible)

Both methods agree: a 4–5 figure ARR validation range is achievable within 12 months; $1M+ ARR requires expansion beyond the beachhead.

### 3.4 Customer Journey Map (Linh, Primary)

| Stage | Action | Emotion | Opportunity |
|-------|--------|---------|-------------|
| Discover | Scrolls YouTube Shorts, finds a Seoul cafe video | Curious | Creator shares nuami link in description |
| Consider | Wonders "can I remember this?" | Hopeful + skeptical | Clear before/after screenshot in our landing |
| Convert | Pastes URL, taps Extract | Anticipation | Sub-15s load; skeleton UI for trust |
| Use | Bookmarks 3 places, tries phrase on trip | Validated | Map deep-link opens in Kakao directly |
| Retain | Returns for next video | Habit | Result permalink they can re-open |
| Refer | Sends result link to travel group chat | Proud | Share-the-result as acquisition channel |

---

## 4. ICP & Beachhead (Go-To-Market)

### 4.1 Ideal Customer Profile

Vietnamese women aged 24–32 planning a first or second Korea trip within 6 months, actively saving YouTube Shorts from bilingual travel creators, using iPhone, KakaoTalk installed.

### 4.2 Beachhead Selection (Geoffrey Moore's 4 Criteria)

| Criterion | Score (1–5) | Rationale |
|-----------|:-----------:|-----------|
| Identifiable target customer | 5 | Tight demographic, clear platform footprint |
| Compelling reason to buy | 4 | Pre-trip planning urgency |
| Whole product deliverable | 4 | MVP covers core JTBD; map/phrase gaps are minor |
| Entrenched competition | 5 | No direct competitor for this wedge |
| **Total** | **18/20** | Strong beachhead |

### 4.3 GTM Strategy

| Channel | Play | KPI |
|---------|------|-----|
| Creator partnerships (3 VN Korea-travel YouTubers) | Each creator adds nuami link in description, gets early-access branding | 500 extractions/creator/month |
| Reddit r/koreatravel | "I built a tool that extracts places from Korea vlogs" post | 10k views, 200 sign-ups |
| Share-the-result viral loop | Every extraction produces a permalink users share in group chats | Viral coefficient ≥ 0.3 |

### 4.4 Battlecards (vs Eightify)

| Dimension | nuami | Eightify |
|-----------|-------|----------|
| Output type | Typed cards (place/phrase/tip) | Free-text summary |
| Travel affordances | Map deep-links, original-language quotes | None |
| Price | Free (MVP) | $5.99/mo |
| Best for | Acting on a video | Understanding a video |

---

## 5. Execution (PRD Core)

### 5.1 Functional Requirements

**FR-1 — URL Ingestion**
The service MUST accept `POST /api/extract` with JSON `{ url: string }` and support URL shapes: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `tiktok.com/@user/video/`, `vm.tiktok.com/`.

**FR-2 — Transcript Fetching**
The service MUST fetch the video transcript in the original language. For YouTube, use the official Data API v3 caption track or `youtube-transcript`-style endpoint. For TikTok v1, return a typed `UNSUPPORTED_PLATFORM` error and surface it in the UI — do not silently fail.

**FR-3 — Claude Extraction**
The service MUST call Claude with a prompt that enforces the following JSON contract (validated server-side with Zod):

```ts
{
  video: { title: string; channel: string; language: string },
  places: Array<{
    name: string;          // English/Romanized
    nameKo?: string;        // Original-language name if non-English video
    desc: string;           // 1–2 sentence EN description
    quote: string;          // verbatim transcript quote, original language
    tags: string[];         // 1–3 short labels
  }>,
  phrases: Array<{
    en: string;             // English translation
    ko: string;             // Original-language phrase (field stays `ko` for UI compat)
    context?: string;       // optional situational note
  }>,
  tips: Array<{
    title: string;
    desc: string;
    cat: "Time" | "Price" | "Etiquette" | "Transport" | "Other";
  }>
}
```

**FR-4 — Validation & Error Contract**
All responses MUST conform to `{ data: ExtractionResult } | { error: { code, message, hint? } }` with error codes: `INVALID_URL`, `UNSUPPORTED_PLATFORM`, `TRANSCRIPT_UNAVAILABLE`, `TRANSCRIPT_TOO_SHORT`, `CLAUDE_PARSE_FAILED`, `RATE_LIMITED`, `INTERNAL`.

**FR-5 — Rate Limiting**
In-memory per-IP limit: 10 req/hour, 3 req/min. Return `429` with `Retry-After`.

**FR-6 — Client Wiring**
`src/app/page.tsx` MUST replace the boolean `showResults` flow with a real fetch; `ResultsScreen.tsx` MUST accept `data` as a prop and drop its `INIT_*` mock constants.

### 5.2 Non-Functional Requirements

| NFR | Target |
|-----|--------|
| Time-to-first-card (YouTube, P50) | ≤ 10s |
| Time-to-first-card (YouTube, P95) | ≤ 18s |
| JSON parse success rate | ≥ 98% |
| Claude cost per call (P50) | ≤ $0.015 |
| Availability | 99% (Vercel default acceptable for MVP) |
| Secret handling | `ANTHROPIC_API_KEY` and `YOUTUBE_API_KEY` in server-only env — never in client bundle |
| Observability | Every call logs `{ requestId, url, platform, tokensIn, tokensOut, latencyMs, errorCode? }` |

### 5.3 API Contract Summary

```
POST /api/extract
Content-Type: application/json

Request:  { "url": "https://www.youtube.com/watch?v=..." }
Response 200: { "data": ExtractionResult }
Response 400: { "error": { "code": "INVALID_URL", "message": "..." } }
Response 404: { "error": { "code": "TRANSCRIPT_UNAVAILABLE", ... } }
Response 429: { "error": { "code": "RATE_LIMITED", ... } }
Response 502: { "error": { "code": "CLAUDE_PARSE_FAILED", ... } }
```

### 5.4 Architecture Sketch

```
InputScreen (client)
  └── POST /api/extract
        └── route.ts (Next.js App Router, Node runtime)
              ├── parseUrl(url) → { platform, videoId }
              ├── transcript/youtube.ts | transcript/tiktok.ts
              │     └── returns { title, channel, text, language }
              ├── claude/extract.ts
              │     ├── Zod schema for response
              │     ├── Anthropic SDK call (Haiku-class, JSON mode)
              │     └── parse + validate or throw CLAUDE_PARSE_FAILED
              └── respond({ data }) | respond({ error })
```

### 5.5 Pre-Mortem (Top 3 Risks)

| # | Failure Mode | Probability | Impact | Mitigation |
|---|--------------|:-----------:|:------:|------------|
| 1 | Claude hallucinates places not in transcript | Medium | High | Require verbatim `quote` field per place; reject extractions where quote isn't a substring of transcript |
| 2 | YouTube caption endpoint rate-limits or changes shape | Medium | High | Wrap in adapter interface so fetcher is swappable; cache successful transcripts by videoId in memory for 24h |
| 3 | Cost per call exceeds $0.05 on long videos | Medium | Medium | Cap transcript to first 8k tokens; truncate with warning in response |

### 5.6 User Stories (INVEST-checked)

| ID | Story | Acceptance |
|----|-------|------------|
| US-1 | As a traveler, I paste a YouTube URL and tap Extract, so I get cards within 15s | 200 response in <15s P50, cards render |
| US-2 | As a traveler with a no-caption video, I see a clear error, so I know to try another URL | Error card with `TRANSCRIPT_UNAVAILABLE` copy + hint |
| US-3 | As a traveler, I see the original-language quote under each place, so I trust the extraction | Every place card shows `quote` field |
| US-4 | As a user, I can re-submit after hitting the rate limit, so I understand the cooldown | 429 response rendered as "try again in Xm" toast |
| US-5 | As a developer, every request has a logged requestId, so I can debug user reports | requestId visible in server logs and in error response |

### 5.7 Test Scenarios (derived from stories)

| Level | Scenario | Covers |
|-------|----------|--------|
| L1 (API) | POST valid YouTube URL → 200 with Zod-valid body | US-1, FR-3 |
| L1 (API) | POST bare string → 400 `INVALID_URL` | FR-4 |
| L1 (API) | POST TikTok URL → 400 `UNSUPPORTED_PLATFORM` (MVP) | FR-2 |
| L1 (API) | 11th request in an hour → 429 `RATE_LIMITED` | FR-5 |
| L2 (UI) | Happy-path paste-and-tap renders cards | US-1 |
| L2 (UI) | Error response renders retry toast, not broken layout | US-2, US-4 |
| L3 (E2E) | Paste real URL, see 3 places + 5 phrases + 3 tips, bookmark one, navigate away and back | US-1, US-3 |

### 5.8 Stakeholder Map

| Stakeholder | Interest | Influence | Engagement |
|-------------|----------|:---------:|------------|
| Jay (founder/owner) | Ship MVP that can be demoed | High | Decision-maker on scope cuts |
| Target users (Linh persona) | Working extraction on real videos | High | Closed alpha via 3 creator partners |
| Anthropic (API provider) | Usage within ToS | Medium | Monitor spend, honor rate limits |
| YouTube (data source) | API ToS compliance | Medium | Use Data API v3 key; no scraping |

---

## 6. Out of Scope (Explicit)

- User authentication and accounts
- Persistent storage of extraction results
- Audio TTS playback of phrases (UI button exists but is inert in MVP)
- Video-frame visual OCR
- Payment / subscription flow
- Multi-language UI (the app stays English for now)
- TikTok transcript support (shipped as `UNSUPPORTED_PLATFORM` error in MVP)

---

## 7. Success Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| SC-1 | ≥ 85% of submitted YouTube URLs return a well-formed extraction | Server log sample over first 200 calls |
| SC-2 | P50 latency ≤ 10s, P95 ≤ 18s | Server log histogram |
| SC-3 | Zod validation success ≥ 98% | `CLAUDE_PARSE_FAILED` rate < 2% |
| SC-4 | Claude cost P50 ≤ $0.015 / call | Anthropic usage dashboard |
| SC-5 | `ResultsScreen` no longer references `INIT_PLACES`, `INIT_PHRASES`, `INIT_TIPS` | grep returns zero hits post-merge |
| SC-6 | Every error path has a user-visible message (no silent failures) | Manual QA checklist |

---

## 8. Open Questions (for Plan phase)

1. YouTube transcript: use official Data API v3 (requires API key + quota) or a community library (`youtube-transcript` npm)? Trade-off: reliability vs speed-to-ship.
2. Claude model: Haiku (cheap, fast, might miss nuance) vs Sonnet (better extraction, ~3–4× cost)? Recommend Haiku for MVP, revisit on quality data.
3. Should the rate limiter be per-IP, per-session cookie, or both? Per-IP is simplest but breaks on shared NAT (common in mobile carriers).
4. Should the `/api/extract` route run on Edge or Node runtime? Node is required for the Anthropic SDK; confirm this against Next.js 16.2.4 guidance (`AGENTS.md` warns against training-data assumptions).
5. Do we preserve the user-pasted URL in the response for share-the-result permalink generation in v1.1, or defer entirely?

---

## Attribution

PM Agent Team integrates frameworks from [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License): Teresa Torres' Continuous Discovery (Discovery), Geoffrey Moore's Crossing the Chasm (Beachhead), JTBD 6-Part Value Proposition, Lean Canvas (Ash Maurya).

---

**Next step**: `/pdca plan cultural-action-service` — the PRD will be auto-referenced to seed the Plan document.
