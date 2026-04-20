# content-hub Planning Document

> **Summary**: 국가별(KR·JP) × 카테고리별(Culture·Action·Food·Transport) 콘텐츠 브라우징 페이지 + Claude 에이전트 자동 생성. Prisma + TiDB Cloud(MySQL-compatible) 기반.
>
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: Jay
> **Date**: 2026-04-20
> **Status**: Draft
> **Reference**: `/Users/jay/Documents/Dev/nuami-Lifestyle/` (ContentPost 모델, ExploreFilters 패턴, agent/run-agent.ts 참조)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Video AI 탭만 있는 nuami-mvp는 영상 없이는 아무 콘텐츠도 제공하지 못함. BottomNav의 "Content" 탭이 사실상 비어 있어 앱 전체 가치가 Video AI 하나에 종속. |
| **Solution** | `/content` 페이지 신설 — 국가(KR·JP) × 카테고리(Culture·Action·Food·Transport) 필터로 큐레이션된 가이드 카드 제공. Claude 에이전트가 콘텐츠 자동 생성·보강, TiDB Cloud에 저장. |
| **Function/UX Effect** | 영상 없이도 목적지 국가의 문화·행동·음식·이동 가이드를 탐색 가능. Video AI 결과와 연결되어 "영상 분석 → 장소 클릭 → 관련 콘텐츠 탐색" 원스톱 플로우 완성. |
| **Core Value** | "링크 없이도 여행 전 필수 정보를 앱 안에서 완결" — Video AI의 파생 가치를 콘텐츠 탭이 흡수해 재방문·체류 시간 증가. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Video AI만으로는 영상 없는 상황에서 앱 가치가 0. 콘텐츠 탭이 앱의 두 번째 핵심 가치 축. |
| **WHO** | SEA 아웃바운드 여행자 22–38세. 한국/일본 여행 전 현지 문화·예절·음식·교통 정보 탐색. |
| **RISK** | (1) TiDB Cloud 연결 설정 복잡도. (2) Claude 에이전트 콘텐츠 품질 편차. (3) 콘텐츠 양이 적으면 빈 페이지 노출. |
| **SUCCESS** | `/content` 페이지 KR·JP 각각 카테고리당 3개 이상 카드 표시. 에이전트 생성 API 동작. 필터 클릭 시 즉시 반응. |
| **SCOPE** | IN: ContentPost DB 모델, 에이전트 생성 API, 브라우징 UI, seed 데이터. OUT: 사용자 제출, 북마크 저장, 댓글, 검색 full-text, VN·TH 국가. |

---

## 1. Overview

### 1.1 Purpose

nuami-mvp에 두 번째 콘텐츠 축 추가:
- BottomNav "Content" 탭 → `/content` 실제 페이지로 연결
- 국가(KR·JP) × 카테고리(culture/action/food/transport) 필터 브라우징
- Claude 에이전트가 콘텐츠 초안 생성 → DB 저장
- 초기 seed: KR·JP × 4카테고리 = 총 32개 이상 카드

### 1.2 Background

nuami-Lifestyle의 `/explore` + `ContentPost` 모델을 nuami-mvp에 이식. nuami-Lifestyle은 Prisma + TiDB Cloud + OpenAI agent 패턴을 이미 검증함. nuami-mvp는 동일한 DB 스택(TiDB Cloud, MySQL-compatible) + Anthropic SDK(기존 코드 재사용)로 구현.

### 1.3 Related Documents

- 참조: `/Users/jay/Documents/Dev/nuami-Lifestyle/prisma/schema.prisma` (ContentPost 모델)
- 참조: `/Users/jay/Documents/Dev/nuami-Lifestyle/src/lib/agent/run-agent.ts`
- 참조: `/Users/jay/Documents/Dev/nuami-Lifestyle/src/app/explore/ExploreFilters.tsx`

---

## 2. Scope

### 2.1 In Scope

- [ ] **FR-01** `ContentPost` Prisma 모델 (TiDB Cloud / MySQL-compatible)
- [ ] **FR-02** `GET /api/content` — country + category 필터, 페이지네이션 (page, limit)
- [ ] **FR-03** `POST /api/content/generate` — Claude 에이전트로 콘텐츠 생성 (국가 + 카테고리 + 토픽 입력)
- [ ] **FR-04** `/content` 페이지 — 국가 탭 (KR·JP) + 카테고리 필터 + 카드 그리드 (NUAMI 디자인 시스템)
- [ ] **FR-05** `/content/[id]` 페이지 — 콘텐츠 상세 (제목, 본문, 태그, 관련 링크)
- [ ] **FR-06** Seed 스크립트 — KR·JP × 4카테고리 × 4개 = 32개 초기 콘텐츠
- [ ] **FR-07** BottomNav "Content" 탭 → `/content` 라우팅 연결
- [ ] **FR-08** `.env.example` 업데이트: `DATABASE_URL` (TiDB Cloud 연결 문자열)

### 2.2 Out of Scope

- 사용자 콘텐츠 제출 (다음 세션)
- 북마크/저장 기능
- 댓글, 평가
- 전문 검색 (full-text search)
- VN, TH 등 추가 국가 (KR·JP 검증 후 확장)
- 관리자 UI (API만 제공)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `ContentPost` 모델: id, title, summary, body, country(KR/JP), category(culture/action/food/transport), tags[], language(ko/en/ja), visibility(PUBLIC/DRAFT), createdAt | High | Pending |
| FR-02 | `GET /api/content?country=KR&category=culture&page=1&limit=12` — PUBLIC 게시물만, 최신순 정렬 | High | Pending |
| FR-03 | `POST /api/content/generate` — `{ country, category, topic }` 입력 → Claude로 title/summary/body/tags 생성 → DB 저장 → 생성된 ContentPost 반환 | High | Pending |
| FR-04 | `/content` 페이지: 국가 탭(KR/JP), 카테고리 필터(all/culture/action/food/transport), 카드 그리드(grid-cols-1 md:grid-cols-2 lg:grid-cols-3), 로딩 스켈레톤 | High | Pending |
| FR-05 | `/content/[id]` 페이지: 제목, 본문(markdown 렌더), 태그, 뒤로가기 버튼 | Medium | Pending |
| FR-06 | Seed 스크립트 (`scripts/seed-content.ts`): 에이전트 생성 또는 하드코딩 32개 콘텐츠 | High | Pending |
| FR-07 | BottomNav `content` 탭 → `router.push('/content')` 또는 `<Link>` 연결 | High | Pending |
| FR-08 | `.env.example` `DATABASE_URL` 항목 추가 (TiDB Cloud 연결 문자열 예시) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| Performance | 카드 목록 LCP < 2s (이미지 없는 텍스트 카드 기준) |
| Graceful Degradation | DB 연결 실패 시 빈 배열 반환, UI 에러 없음 |
| Security | `POST /api/content/generate` — 내부 전용 (INTERNAL_API_KEY 헤더 검증) |
| UX | 카테고리 필터 전환 시 URL query param 업데이트 (`?country=KR&category=action`) |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Prisma migrate 후 `ContentPost` 테이블 TiDB Cloud에 생성됨
- [ ] `GET /api/content?country=KR` → 카드 12개 이상 반환
- [ ] `POST /api/content/generate` → 에이전트 콘텐츠 생성 후 DB 저장
- [ ] `/content` 페이지 국가·카테고리 필터 정상 동작
- [ ] BottomNav "Content" 탭 클릭 → `/content` 이동
- [ ] `npm run build` 0 errors

### 4.2 Quality Criteria

- [ ] 카드 그리드 모바일(375px)/태블릿(768px)/데스크탑(1280px) 정상 렌더
- [ ] 빈 카테고리 — EmptyState 컴포넌트 표시
- [ ] 카드 클릭 → `/content/[id]` 상세 이동

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| TiDB Cloud 연결 설정 (SSL, 연결 문자열) | High | Medium | Prisma `datasource` 에 `sslcert` 옵션 또는 `?sslaccept=strict` 파라미터 |
| Claude 에이전트 콘텐츠 품질 편차 | Medium | Medium | 프롬프트에 포맷 스키마 명시, JSON 스키마 검증 |
| seed 데이터 부족 — 빈 페이지 노출 | High | Low | seed 스크립트 실행 확인을 DoD에 포함 |
| Next.js App Router + Prisma Client 충돌 | Medium | Low | `prisma/client` singleton 패턴 (nuami-Lifestyle 동일 패턴 검증됨) |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `prisma/schema.prisma` | Schema | NEW — `ContentPost` 모델 |
| `src/lib/db.ts` | Lib | NEW — Prisma Client singleton |
| `src/types/content.ts` | Type | NEW — `ContentPost`, `ContentCategory`, `ContentCountry` |
| `src/app/api/content/route.ts` | API Route | NEW — `GET /api/content` |
| `src/app/api/content/generate/route.ts` | API Route | NEW — `POST /api/content/generate` |
| `src/app/content/page.tsx` | Page | NEW — 콘텐츠 브라우징 페이지 |
| `src/app/content/[id]/page.tsx` | Page | NEW — 콘텐츠 상세 페이지 |
| `src/components/ContentCard.tsx` | Component | NEW — 카드 UI |
| `src/components/CountryTabs.tsx` | Component | NEW — KR/JP 탭 |
| `src/components/CategoryFilter.tsx` | Component | NEW — 카테고리 필터 버튼 |
| `src/components/BottomNav.tsx` | Component | Modified — content 탭 라우팅 |
| `src/components/TopNav.tsx` | Component | Modified — Content 링크 활성화 |
| `scripts/seed-content.ts` | Script | NEW — 초기 32개 콘텐츠 |
| `.env.example` | Config | Modified — `DATABASE_URL` 추가 |

### 6.2 Current Consumers

| Resource | Operation | Impact |
|----------|-----------|--------|
| `BottomNav.tsx` | Render | content 탭 href 추가 — 기존 탭 영향 없음 |
| `TopNav.tsx` | Render | Content 링크 href 추가 — additive |

---

## 7. Architecture Considerations

### 7.1 Project Level

Dynamic — 기존 결정 유지. DB 추가로 복잡도 증가하나 scope는 명확.

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| DB | SQLite / TiDB Cloud / JSON | **TiDB Cloud (MySQL)** | 사용자 요청. 나중에 MySQL 마이그레이션 무비용 |
| 에이전트 | OpenAI / Claude | **Claude (Anthropic SDK)** | 기존 `claudeExtract` 패턴 재사용 |
| 콘텐츠 생성 시점 | 빌드타임 / 런타임 | **런타임 API** | 콘텐츠 추가/수정 유연성 |
| 라우팅 | `/content` App Router | **App Router** | 기존 Next.js 16 구조 유지 |

### 7.3 New Files

```
prisma/
└── schema.prisma                         [NEW — ContentPost 모델]

scripts/
└── seed-content.ts                       [NEW — 32개 초기 콘텐츠]

src/
├── lib/
│   ├── db.ts                             [NEW — Prisma Client singleton]
│   └── content/
│       ├── agent.ts                      [NEW — Claude 콘텐츠 생성 agent]
│       └── types.ts                      [NEW — ContentPost, Category, Country]
├── app/
│   ├── content/
│   │   ├── page.tsx                      [NEW — 브라우징 페이지]
│   │   └── [id]/
│   │       └── page.tsx                  [NEW — 상세 페이지]
│   └── api/
│       └── content/
│           ├── route.ts                  [NEW — GET /api/content]
│           └── generate/
│               └── route.ts             [NEW — POST /api/content/generate]
└── components/
    ├── ContentCard.tsx                   [NEW]
    ├── CountryTabs.tsx                   [NEW]
    └── CategoryFilter.tsx               [NEW]

Modified:
├── src/components/BottomNav.tsx          [content 탭 href]
├── src/components/TopNav.tsx             [Content 링크 href]
└── .env.example                          [DATABASE_URL 추가]
```

---

## 8. Convention Prerequisites

### 8.1 Environment Variables Needed

| Variable | Purpose | Required |
|----------|---------|:--------:|
| `DATABASE_URL` | TiDB Cloud 연결 문자열 (mysql://) | ✅ |
| `INTERNAL_API_KEY` | `/api/content/generate` 보호 | ☐ (dev 환경에서 skip 가능) |

### 8.2 Packages to Install

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider mysql
```

---

## 9. Next Steps

1. [ ] `/pdca design content-hub` — 설계 문서 (3가지 아키텍처 옵션)
2. [ ] `.env.local`에 `DATABASE_URL` 추가 (TiDB Cloud 연결 문자열)
3. [ ] `/pdca do content-hub --scope module-db` — Prisma 스키마 + DB 연결
4. [ ] `/pdca do content-hub --scope module-api` — API routes
5. [ ] `/pdca do content-hub --scope module-ui` — 브라우징 페이지 + 카드 컴포넌트
6. [ ] seed 스크립트 실행: `npx ts-node scripts/seed-content.ts`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-20 | Initial draft — nuami-Lifestyle 참조, TiDB Cloud + Claude agent | Jay |
