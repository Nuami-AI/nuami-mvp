# content-hub Design Document

> **Feature**: content-hub
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: Jay
> **Date**: 2026-04-20
> **Architecture**: Option C — Pragmatic Balance
> **Status**: Draft

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Video AI만으로는 영상 없는 상황에서 앱 가치가 0. 콘텐츠 탭이 앱의 두 번째 핵심 가치 축. |
| **WHO** | SEA 아웃바운드 여행자 22–38세. 한국/일본 여행 전 현지 문화·예절·음식·교통 정보 탐색. |
| **RISK** | TiDB Cloud SSL 연결, Claude 에이전트 품질 편차, 초기 콘텐츠 부족 |
| **SUCCESS** | KR·JP 각 카테고리당 카드 3개+, 에이전트 생성 API 동작, 필터 즉시 반응 |
| **SCOPE** | IN: ContentPost DB, 에이전트 생성, 브라우징 UI, seed. OUT: 사용자 제출, 북마크, 댓글 |

---

## 1. Overview

### 1.1 Architecture Summary

**Option C — Pragmatic Balance** 선택:
- Prisma Client singleton (`src/lib/db.ts`)
- API routes가 Prisma를 직접 호출 (Repository 레이어 없음)
- `src/lib/content/` — agent, queries, types 모듈
- 필터: URL query params (`?country=KR&category=culture`)
- List 페이지: Server Component (SSR) + `CountryTabs`/`CategoryFilter` Client Component
- nuami-Lifestyle 동일 패턴, MySQL 마이그레이션 무비용

### 1.2 Component Diagram

```
BottomNav (Content 탭)
  └── /content (page.tsx — Server Component)
        ├── CountryTabs (Client Component)   → URL ?country=
        ├── CategoryFilter (Client Component) → URL ?category=
        └── ContentCard[] (Server Component render)
              └── Link → /content/[id]
                          └── ContentDetailPage (Server Component)

API Routes:
  GET  /api/content?country&category&page&limit
  POST /api/content/generate { country, category, topic }

DB Layer:
  prisma/schema.prisma → TiDB Cloud (MySQL)
  src/lib/db.ts        → PrismaClient singleton
  src/lib/content/queries.ts → getContentPosts(), getContentById()
  src/lib/content/agent.ts   → generateContent() via Claude
```

---

## 2. Data Model

### 2.1 Prisma Schema — ContentPost

```prisma
model ContentPost {
  id         String   @id @default(cuid())
  title      String
  summary    String   @db.Text
  body       String   @db.LongText
  country    String   // "KR" | "JP"
  category   String   // "culture" | "action" | "food" | "transport"
  tags       String   @db.Text // JSON array stored as string
  language   String   @default("ko") // "ko" | "en" | "ja"
  visibility String   @default("PUBLIC") // "PUBLIC" | "DRAFT"
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([country, category, visibility])
  @@index([createdAt])
}
```

> **Note**: `tags`를 `String @db.Text`로 저장 (JSON.stringify). MySQL의 JSON 타입 대신 Text 사용 — TiDB Cloud 호환성.

### 2.2 TypeScript Types

```typescript
// src/lib/content/types.ts

export type ContentCountry = "KR" | "JP";
export type ContentCategory = "culture" | "action" | "food" | "transport";
export type ContentVisibility = "PUBLIC" | "DRAFT";
export type ContentLanguage = "ko" | "en" | "ja";

export interface ContentPost {
  id: string;
  title: string;
  summary: string;
  body: string;
  country: ContentCountry;
  category: ContentCategory;
  tags: string[];
  language: ContentLanguage;
  visibility: ContentVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentListParams {
  country?: ContentCountry;
  category?: ContentCategory;
  page?: number;
  limit?: number;
}

export interface ContentGenerateInput {
  country: ContentCountry;
  category: ContentCategory;
  topic: string;
  language?: ContentLanguage;
}
```

---

## 3. API Design

### 3.1 GET /api/content

**Query params**: `country`, `category`, `page` (default: 1), `limit` (default: 12)

**Response**:
```json
{
  "data": [
    {
      "id": "clx...",
      "title": "한국 식당 예절 완전 가이드",
      "summary": "한국 식당에서 알아야 할 필수 예절 10가지",
      "country": "KR",
      "category": "culture",
      "tags": ["예절", "식당", "한국"],
      "language": "ko",
      "createdAt": "2026-04-20T..."
    }
  ],
  "meta": {
    "total": 48,
    "page": 1,
    "limit": 12,
    "totalPages": 4
  }
}
```

### 3.2 POST /api/content/generate

**Headers**: `x-internal-key: {INTERNAL_API_KEY}` (optional in dev)

**Request**:
```json
{
  "country": "KR",
  "category": "culture",
  "topic": "지하철 에티켓"
}
```

**Response**: 생성된 `ContentPost` 객체

**Claude Prompt Schema** (agent.ts):
```
System: "여행자를 위한 {country} {category} 가이드 콘텐츠 작가입니다."
User: "{topic}에 대한 가이드를 작성해주세요."
Output format: { title, summary, body (markdown), tags[] }
```

---

## 4. Page Design

> **Reference**: `/Users/jay/Downloads/390 .2.png` — 2026-04-21 디자인 업데이트

### 4.1 /content — List Page (모바일 390px 기준)

```
┌──────────────────────────────────────────┐
│  PageHeader: "콘텐츠"         [🔍]        │  ← sticky, md:hidden
├──────────────────────────────────────────┤
│  한국에 방문했나요?       지금 장소 변경 > │  ← CountryTabs (location bar)
├──────────────────────────────────────────┤
│  [🌏전체] [🏛️문화] [🗺️행동] [🍜음식] [🚆교통] │  ← 아이콘 탭 수평 스크롤
├──────────────────────────────────────────┤
│  한국의 행동 가이드          모두 보기    │  ← section header
│  ┌──────────┐ ┌──────────┐              │
│  │ [image]  │ │ [image]  │  →  scroll   │  ← landscape card w-[200px]
│  │          │ │          │              │
│  │ 제목 2줄 │ │ 제목 2줄 │              │
│  │ 날짜 · [카테고리] [KR]│              │
│  └──────────┘ └──────────┘              │
├──────────────────────────────────────────┤
│  한국의 리얼팁               모두 보기    │  ← transport section
│  ┌────┬─────────────────────────────┐   │
│  │img │ 제목 2줄                    │   │  ← compact list (thumbnail left)
│  │    │ 요약 1줄                    │   │
│  │    │ 날짜 · [카테고리] [KR]      │   │
│  └────┴─────────────────────────────┘   │
│  ─────────────────────────────────────  │
│  ┌────┬─────────────────────────────┐   │
│  │img │ ...                         │   │
│  └────┴─────────────────────────────┘   │
├──────────────────────────────────────────┤
│  BottomNav                               │
└──────────────────────────────────────────┘
```

**NUAMI 토큰 적용**:
- PageHeader trailing: Search icon (lucide-react)
- Location bar: `text-accent-700 font-semibold` / `text-text-tertiary text-[12px]`
- Category tab active: `bg-accent-700 text-white` (circle 44px) / `text-accent-700 font-semibold`
- Category tab inactive: `bg-infoBox` (circle 44px) / `text-text-secondary opacity-50`
- Section title: `text-[16px] font-bold text-text-primary`
- "모두 보기": `text-[13px] text-accent-700 font-medium`

### 4.2 ContentCardCompact — Landscape (기본 카드)

카드 너비 `w-[200px]`, 가로 스크롤 행에 배치:

```
┌──────────────────────┐
│  [gradient image]    │  h-[120px] rounded-2xl
│  큰 이모지 (희미)    │
└──────────────────────┘
  제목 (13px bold, 2줄)
  날짜 · [카테고리] [KR]   ← badges h-4 text-[10px]
```

### 4.3 ContentCardCompact — Compact (리얼팁 리스트)

transport 섹션에만 적용, `compact={true}` prop:

```
┌────────┬──────────────────────────────┐
│ 64×64  │ 제목 (13px bold, 2줄)        │
│ thumb  │ 요약 (12px, 1줄)             │
│        │ 날짜 · [카테고리] [KR]        │
└────────┴──────────────────────────────┘
```
`divide-y divide-line-neutral` 로 구분선, padding `py-3`

### 4.4 /content/[id] — Detail Page

- Server Component (SSR), `getContentById(id)`
- `body` → markdown render (`react-markdown` 또는 단순 `<p>` split)
- 뒤로가기 버튼 → `/content?country=...&category=...` 유지

---

## 5. File Structure

```
prisma/
└── schema.prisma                         [NEW — ContentPost 모델 추가]

src/
├── lib/
│   ├── db.ts                             [NEW — PrismaClient singleton]
│   └── content/
│       ├── types.ts                      [NEW — ContentPost, Category, Country]
│       ├── queries.ts                    [NEW — getContentPosts, getContentById]
│       └── agent.ts                      [NEW — generateContent via Claude]
├── app/
│   ├── content/
│   │   ├── page.tsx                      [NEW — Server Component list page]
│   │   └── [id]/
│   │       └── page.tsx                  [NEW — Server Component detail page]
│   └── api/
│       └── content/
│           ├── route.ts                  [NEW — GET /api/content]
│           └── generate/
│               └── route.ts             [NEW — POST /api/content/generate]
└── components/
    ├── ContentCard.tsx                   [NEW]
    ├── CountryTabs.tsx                   [NEW — "use client", URL sync]
    └── CategoryFilter.tsx               [NEW — "use client", URL sync]

scripts/
└── seed-content.ts                       [NEW — 32개 초기 콘텐츠 seed]

Modified:
├── src/components/BottomNav.tsx          [content 탭 Link 추가]
├── src/components/TopNav.tsx             [Content nav link 추가]
├── .env.example                          [DATABASE_URL 추가]
└── package.json                          [prisma, @prisma/client 추가]
```

---

## 6. Key Implementation Details

### 6.1 PrismaClient Singleton (db.ts)

```typescript
// src/lib/db.ts — nuami-Lifestyle 동일 패턴
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["query"] : [] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 6.2 TiDB Cloud SSL 설정

`prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

`DATABASE_URL` 형식:
```
mysql://USER:PASSWORD@HOST:4000/DATABASE?sslaccept=strict
```

### 6.3 Content Agent (agent.ts)

Claude Anthropic SDK 사용 (기존 `claudeExtract` 패턴 참조):
- `model`: `claude-haiku-4-5-20251001` (비용 효율)
- `max_tokens`: 2000
- 응답: JSON `{ title, summary, body, tags }`
- 실패 시 `ContentGenerateError` throw

### 6.4 URL State 관리 (CountryTabs, CategoryFilter)

```typescript
// "use client" — useRouter + useSearchParams
const router = useRouter();
const params = useSearchParams();

function handleCountryChange(country: string) {
  const next = new URLSearchParams(params);
  next.set("country", country);
  next.delete("page"); // 필터 변경 시 페이지 초기화
  router.push(`/content?${next.toString()}`);
}
```

---

## 7. Dependencies

```bash
npm install prisma @prisma/client
# react-markdown (detail page body 렌더 — 선택사항)
```

```bash
npx prisma init --datasource-provider mysql
npx prisma migrate dev --name init-content-post
```

---

## 8. Test Plan

| Level | Test | Method |
|-------|------|--------|
| L1 | `GET /api/content` → 200 + data array | curl |
| L1 | `GET /api/content?country=KR&category=culture` → 필터 동작 | curl |
| L1 | `POST /api/content/generate` → 201 + ContentPost | curl |
| L2 | `/content` 페이지 KR/JP 탭 전환 | 브라우저 수동 |
| L2 | 카테고리 필터 클릭 → URL 업데이트 | 브라우저 수동 |
| L2 | 카드 클릭 → `/content/[id]` 이동 | 브라우저 수동 |

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| TiDB Cloud SSL 연결 실패 | `?sslaccept=strict` 파라미터 + 연결 오류 시 fallback 빈 배열 |
| Prisma Client hot reload 이슈 | singleton 패턴 (globalForPrisma) |
| Claude agent JSON 파싱 실패 | try/catch + `ContentGenerateError` |
| 빈 콘텐츠 페이지 | seed 스크립트 실행을 DoD에 포함 |

---

## 10. Session Guide

### Module Map

| Module | Scope Key | 내용 | 예상 시간 |
|--------|-----------|------|-----------|
| DB + Prisma | `module-db` | prisma/schema.prisma, db.ts, migrate | 20분 |
| API Routes | `module-api` | /api/content GET, /api/content/generate POST, agent.ts | 30분 |
| UI | `module-ui` | /content page, ContentCard, CountryTabs, CategoryFilter, detail page | 40분 |
| Seed | `module-seed` | seed-content.ts 32개 실행 | 15분 |
| Nav | `module-nav` | BottomNav, TopNav href 연결 | 10분 |

### Recommended Session Plan

- **Session 1**: `module-db,module-api` — DB 연결 먼저 검증 후 API
- **Session 2**: `module-ui,module-nav` — UI 구성
- **Session 3**: `module-seed` — 콘텐츠 채우기

### Slash Commands

```bash
/pdca do content-hub --scope module-db,module-api
/pdca do content-hub --scope module-ui,module-nav
/pdca do content-hub --scope module-seed
```

---

## 11. Decision Record

| Decision | Selected | Rationale |
|----------|----------|-----------|
| DB | TiDB Cloud (MySQL-compatible) | 사용자 요청. MySQL 마이그레이션 무비용 |
| ORM | Prisma | 타입 안전성, nuami-Lifestyle 검증됨 |
| 에이전트 | Claude Haiku | 기존 SDK 재사용, 비용 효율 |
| 필터 상태 | URL query params | SSR 호환, 공유 가능한 URL |
| tags 저장 | JSON string (@db.Text) | TiDB Cloud JSON 타입 호환성 이슈 회피 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-20 | Initial design — Option C Pragmatic Balance | Jay |
