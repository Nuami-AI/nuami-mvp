# place-video-enrichment Planning Document

> **Summary**: YouTube 영상 임베드 + 카카오/구글맵 링크 활성화 + 문화공공데이터 연동 scaffold — 결과화면을 실제로 '쓸 수 있는' 화면으로 업그레이드.
>
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: Jay
> **Date**: 2026-04-20
> **Status**: Draft
> **Reference**: `/Users/jay/Documents/Dev/nuami-Lifestyle` (kakao-map-links.ts, culture-api.ts 패턴 참조)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 추출 결과에서 지도 버튼은 장식이고 영상은 썸네일 이미지만 보임. 실제 콘텐츠 참여(영상 시청, 지도 이동)가 불가능해 사용자가 결과 확인 후 직접 검색하러 떠남. |
| **Solution** | (1) ResultsScreen에 YouTube iframe 임베드. (2) 카카오맵/구글맵 버튼을 실제 검색 링크 `<a>`로 전환 — API 키 없이도 동작. (3) 문화공공데이터 API scaffold — 키가 있으면 장소별 주변 문화행사를 카드로 표시, 없으면 graceful degradation. |
| **Function/UX Effect** | 결과화면 내에서 영상 다시 보기 → 장소 확인 → 지도 바로 이동까지 원스톱. 이탈 없이 세션 내에서 정보 소비 완결. |
| **Core Value** | "링크 하나 붙여넣으면 모든 정보가 그 자리에서 연결된다" — 결과화면이 단순 카드 나열에서 실행 가능한 여행 브리핑으로 격상. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 지도/영상 버튼이 inert인 상태는 MVP의 두 번째 최대 신뢰성 갭. 추출은 됐는데 활용이 안 됨. |
| **WHO** | SEA 아웃바운드 여행자 22–38세. 영상 보면서 카드 확인 → 바로 지도 이동하는 멀티태스킹 패턴. |
| **RISK** | (1) YouTube iframe 모바일 aspect ratio 깨짐. (2) CORS 없는 문화 API 직접 호출 이슈. (3) 문화 API 키 없는 환경에서 에러 노출. |
| **SUCCESS** | 영상 임베드 모바일/PC 정상 렌더, 지도 링크 클릭 시 신규 탭에서 올바른 장소 검색 결과 이동, 문화 API 키 없을 때 UI 깨짐 없음. |
| **SCOPE** | IN: YouTube embed, 지도 링크 활성화, 문화데이터 scaffold + route. OUT: 카카오맵 SDK 임베드, 저장/북마크 연동, TikTok 지원, 문화데이터 full UI (API 키 준비 후 별도 세션). |

---

## 1. Overview

### 1.1 Purpose

결과화면(`ResultsScreen`)에서 세 가지 '죽어있는' 요소를 활성화:
- 정적 썸네일 → YouTube iframe 임베드
- inert 지도 버튼 → 실제 검색 링크
- 빈 장소 카드 하단 → 문화공공데이터 연동 scaffold

### 1.2 Background

`cultural-action-service` 구현으로 추출 파이프라인이 완성됐지만 결과화면의 실행 연결은 미완. 영상을 보면서 장소를 확인하고, 카드에서 바로 지도로 이동하는 경험이 핵심 UX 가설이다. 지도 버튼은 API 키 없이도 name-based search URL로 즉시 활성화 가능하며, YouTube embed도 videoId만 있으면 추가 비용 없이 동작한다.

nuami-Lifestyle `kakao-map-links.ts` 참조: `https://map.kakao.com/link/search/${encodeURIComponent(name)}` 패턴.

### 1.3 Related Documents

- 상위 Plan: [cultural-action-service.plan.md](./cultural-action-service.plan.md)
- 참조 프로젝트: `/Users/jay/Documents/Dev/nuami-Lifestyle/src/lib/ktube/kakao-map-links.ts`
- 참조 프로젝트: `/Users/jay/Documents/Dev/nuami-Lifestyle/src/lib/culture-api.ts`

---

## 2. Scope

### 2.1 In Scope

- [ ] **FR-01** `VideoEmbed` 컴포넌트 — YouTube videoId 기반 iframe 임베드, 모바일 16:9 aspect ratio
- [ ] **FR-02** `ExtractionResult.video.videoId` 필드 추가 — route.ts에서 파싱된 videoId를 응답에 포함
- [ ] **FR-03** 카카오맵 버튼 → `<a href="https://map.kakao.com/link/search/{name}" target="_blank">` (API 키 불필요)
- [ ] **FR-04** 구글맵 버튼 → `<a href="https://www.google.com/maps/search/{name}+한국" target="_blank">` (API 키 불필요)
- [ ] **FR-05** `GET /api/culture/nearby` route — 장소명으로 문화공공데이터 API 조회, 키 없으면 `[]` 반환
- [ ] **FR-06** `NEXT_PUBLIC_KAKAO_JS_KEY`, `KAKAO_MAP_API_KEY`, `CULTURE_API_KEY`, `DATA_GO_KR_KEY` env 변수 scaffold + `.env.example` 업데이트
- [ ] **FR-07** ResultsScreen 장소 카드 하단 — 문화행사 mini-list (API 키 있을 때만 표시, 없으면 hidden)

### 2.2 Out of Scope

- 카카오맵 JS SDK를 이용한 인라인 지도 임베드 (다음 세션, SDK 키 준비 후)
- 문화데이터 전체 UI (별도 기능 `cultural-events-tab`)
- TikTok 영상 임베드
- 구글 Places API 상세 정보 (장소 사진, 리뷰)
- 결과 저장/공유 기능

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `VideoEmbed`: `videoId` prop을 받아 `https://www.youtube.com/embed/{videoId}` iframe 렌더. 모바일 `aspect-video`, PC `max-w-2xl` | High | Pending |
| FR-02 | `VideoMeta`에 `videoId?: string` 추가. route.ts에서 `parseUrl()` 결과의 `videoId`를 response에 포함 | High | Pending |
| FR-03 | 카카오맵 버튼: `<a>` 태그로 변환, href = `https://map.kakao.com/link/search/${encodeURIComponent(p.name)}`, `target="_blank" rel="noopener noreferrer"` | High | Pending |
| FR-04 | 구글맵 버튼: `<a>` 태그로 변환, href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' 한국')}`, `target="_blank" rel="noopener noreferrer"` | High | Pending |
| FR-05 | `GET /api/culture/nearby?place={name}`: `CULTURE_API_KEY` 환경변수 없으면 `{ events: [] }` 반환. 있으면 문화공공데이터 API 호출 후 파싱 반환 | Medium | Pending |
| FR-06 | `.env.example` 업데이트: 4개 신규 env 변수 항목 추가 (주석으로 설명) | Medium | Pending |
| FR-07 | ResultsScreen 장소 카드: `NEXT_PUBLIC_CULTURE_ENABLED === 'true'` 일 때만 문화행사 섹션 표시 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | `VideoEmbed` lazy-load (`loading="lazy"`) — 초기 렌더 블로킹 없음 | Lighthouse |
| Graceful Degradation | `CULTURE_API_KEY` 없을 때 콘솔 경고만, UI 에러 없음 | 환경변수 없이 dev 테스트 |
| Security | iframe sandbox: `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"` — 최소 권한 | Code review |
| UX | 지도 링크 신규 탭 열기 (`target="_blank"`) — 결과화면 이탈 없음 | 수동 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 유효한 YouTube URL 추출 후 결과화면에 iframe 영상이 재생 가능하게 표시됨
- [ ] 카카오맵 버튼 클릭 시 신규 탭에서 해당 장소명 검색 결과 열림
- [ ] 구글맵 버튼 클릭 시 신규 탭에서 해당 장소명+"한국" 검색 결과 열림
- [ ] `CULTURE_API_KEY` 없는 환경에서 `/api/culture/nearby` 호출 시 에러 없이 `{ events: [] }` 반환
- [ ] `npm run build` 0 errors, `npm run lint` 0 errors
- [ ] TypeScript strict — 신규 타입에 `any` 없음

### 4.2 Quality Criteria

- [ ] `VideoEmbed` 모바일(375px)/태블릿(768px)/데스크탑(1280px) 화면비 정상
- [ ] 지도 버튼 접근성: `aria-label` 포함
- [ ] `.env.example`에 모든 신규 변수 문서화

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| YouTube 영상이 embed 비허용 설정인 경우 (`embedsDisabled`) | Medium | Medium | iframe 로드 실패 시 폴백: 정적 썸네일 + "Watch on YouTube" 링크 표시 |
| 문화 API CORS 이슈 (클라이언트 직접 호출 불가) | High | High | 반드시 Next.js API route를 통한 서버사이드 호출 — 클라이언트에서 직접 호출 금지 |
| 문화 API 응답 형식 불안정 (XML/JSON 혼재) | Medium | Medium | nuami-Lifestyle culture-api.ts 패턴 참조: try/parse with fallback |
| `videoId`가 응답에 없는 경우 VideoEmbed 렌더 불가 | Low | Low | `videoId?: string` optional 필드 — 없으면 기존 정적 썸네일 유지 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/types/extraction.ts` | Type | `VideoMeta`에 `videoId?: string` 추가 |
| `src/app/api/extract/route.ts` | API Route | response `video` 객체에 `videoId` 포함 |
| `src/components/ResultsScreen.tsx` | Component | VideoEmbed 추가, 지도 버튼 `<a>` 전환, 문화행사 섹션 scaffold |
| `.env.example` (신규 생성) | Config | 신규 4개 변수 문서화 |
| `src/app/api/culture/nearby/route.ts` | API Route | **NEW** — 문화공공데이터 scaffold |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `VideoMeta` type | READ | `ResultsScreen.tsx` — `data.video.title/channel/language` | Additive — 기존 필드 유지, `videoId` 추가만 |
| `ResultsScreen` | RENDER | `src/app/page.tsx` — `<ResultsScreen data={data} onBack={...} />` | No change — props 동일 |
| `ExtractionResult` type | READ | `src/app/page.tsx`, `ResultsScreen` | Additive — 기존 소비자 영향 없음 |

### 6.3 Verification

- [ ] `VideoMeta.videoId` 추가 후 기존 `title/channel/language` 소비 코드 타입 에러 없음
- [ ] `ResultsScreen` props 변경 없음 — `page.tsx` 수정 불필요

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

Dynamic — 기존 결정 유지. 새 API route 1개 추가.

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 지도 링크 방식 | SDK embed / search URL | **search URL** | API 키 불필요, 즉시 활성화. SDK embed는 다음 세션 |
| 문화 API 호출 위치 | Client fetch / Server route | **Server route** | CORS 회피 필수; `CULTURE_API_KEY` 서버사이드 전용 |
| VideoEmbed 폴백 | 에러 표시 / 정적 썸네일+링크 | **정적 썸네일+링크** | embed 실패가 드물고 사용자 혼란 최소화 |
| 문화데이터 활성화 조건 | 하드코딩 / env flag | **`NEXT_PUBLIC_CULTURE_ENABLED`** | 키 준비 전 배포 가능, 기능 토글 명확 |

### 7.3 New Files

```
src/
├── components/
│   └── VideoEmbed.tsx                [NEW — YouTube iframe with fallback]
├── lib/
│   └── culture/
│       ├── api-client.ts             [NEW — 문화공공데이터 HTTP client]
│       └── types.ts                  [NEW — CulturalEvent type]
└── app/
    └── api/
        └── culture/
            └── nearby/
                └── route.ts          [NEW — GET /api/culture/nearby]

Modified:
├── src/types/extraction.ts           [videoId 추가]
├── src/app/api/extract/route.ts      [video에 videoId 포함]
├── src/components/ResultsScreen.tsx  [VideoEmbed, 지도 <a> 링크, 문화행사 scaffold]
└── .env.example                      [신규 생성 — 환경변수 문서]
```

---

## 8. Convention Prerequisites

### 8.1 Environment Variables Needed

| Variable | Purpose | Scope | Required |
|----------|---------|-------|:--------:|
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오맵 JS SDK (다음 세션) | Client | ☐ |
| `KAKAO_MAP_API_KEY` | 카카오 REST API (장소 검색) | Server | ☐ |
| `CULTURE_API_KEY` | 문화공공데이터광장 API 키 | Server | ☐ |
| `DATA_GO_KR_KEY` | 공공데이터포털 API 키 | Server | ☐ |
| `NEXT_PUBLIC_CULTURE_ENABLED` | 문화데이터 UI 활성화 토글 | Client | ☐ |

> 위 키들은 사용자가 직접 `.env.local`에 추가 예정. 키 없어도 앱 정상 동작해야 함.

---

## 9. Next Steps

1. [ ] `/pdca design place-video-enrichment` — 설계 문서 + 3가지 아키텍처 옵션
2. [ ] `/pdca do place-video-enrichment` — 구현
3. [ ] `.env.local`에 카카오맵/구글맵/문화공공데이터 API 키 추가
4. [ ] `/pdca do place-video-enrichment --scope module-culture` — 문화데이터 활성화

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-20 | Initial draft — nuami-Lifestyle 참조, 3가지 고도화 정의 | Jay |
