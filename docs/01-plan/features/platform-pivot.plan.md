# platform-pivot Planning Document

> **Summary**: YouTube URL 추출 도구 → 한국 거주 외국인(유학생·장기체류자) AI 생활 적응 플랫폼 전면 피벗. 상황 텍스트 입력 + Situation Card 신규 도입, 영상 임베드 제거, 액션 우선 UX 재설계.
>
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: Jay
> **Date**: 2026-05-23
> **Status**: Draft
> **Reference**: `.jun_memo/0523.md`

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 UI가 "YouTube 영상 요약 앱"처럼 느껴져 실제 서비스 가치(생활 적응 AI 플랫폼)를 전달하지 못함. URL 전용 입력은 진입 장벽이 높고, 타겟 사용자(한국 거주 외국인)의 즉각적인 상황 해결 니즈와 맞지 않음. |
| **Solution** | 입력화면을 상황 텍스트 + 퀵칩 + 선택적 URL로 재설계. Situation Card(서류·장소·체크리스트·소요시간) 신규 추가. 카드 순서를 Situation → Action → Context로 재정렬. 영상 임베드 제거. |
| **Function/UX Effect** | 사용자가 "은행 계좌 개설"을 입력하면 필요 서류, 가야 할 곳, 단계별 행동, 한국 표현, 실수 방지 팁을 한 화면에서 확인. Duolingo/Toss 레퍼런스의 액션 우선 경험. |
| **Core Value** | 정보 검색이 아닌 실제 행동 가이드. Situation → Action → Practice 철학 구현으로 진정한 "생활 어시스턴트" 포지셔닝. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 서비스 정체성이 "영상 요약"에 갇혀 있음. 타겟 사용자(한국 거주 외국인)는 URL이 없어도 즉각 도움이 필요한 상황이 대부분. 피벗으로 실제 가치와 UI를 정렬. |
| **WHO** | 한국 거주 외국인: 유학생, 교환학생, 장기 체류자 (여행자 X) |
| **RISK** | Situation Card 신규 타입 추가 시 기존 Zod schema/타입 하위호환 깨짐 위험 / API가 텍스트와 URL 두 경로를 처리해야 하는 복잡도 증가 |
| **SUCCESS** | 입력화면에서 URL 없이 상황 텍스트만으로 가이드 생성 가능 / Situation·Action·Context 3카드 모두 정상 렌더 / 기존 인증·사용량 제한·페이월 기능 유지 |
| **SCOPE** | IN: InputScreen·ResultsScreen 재설계, 타입·스키마·API·프롬프트·i18n 업데이트, 네비 탭명 변경. OUT: 실결제, 저장된 가이드 목록(/guide 페이지), 음성 지원 구현. |

---

## 1. Overview

### 1.1 Purpose

NUAMI를 YouTube 영상 추출 도구에서 한국 거주 외국인을 위한 AI 생활 적응 플랫폼으로 전면 피벗한다.

**핵심 철학**: 상황(Situation) → 행동(Action) → 실천(Practice)

사용자는:
1. 상황을 텍스트로 입력하거나 퀵칩으로 선택
2. (선택) 관련 YouTube/TikTok URL 추가
3. AI가 Situation Card + Action Card + Context Card 생성

### 1.2 Background

- `.jun_memo/0523.md` 피벗 메모에서 도출
- 기존 market-validation(인증·사용량 제한·페이월) 구조는 유지
- 타겟: 한국 거주 외국인 — 은행 계좌 개설, 교수 연락, 병원 방문, 대중교통, 외국인등록증 등

### 1.3 Related Documents

- 피벗 메모: `.jun_memo/0523.md`
- 유지되는 기능: `docs/01-plan/features/market-validation.plan.md`
- 핵심 파일: `src/app/page.tsx`, `src/components/InputScreen.tsx`, `src/components/ResultsScreen.tsx`

---

## 2. Scope

### 2.1 In Scope

- [ ] **FR-01** `InputScreen` 전면 재설계
  - 히어로: "오늘 어떤 상황인가요?" (상황 우선 메시지)
  - 퀵칩: 은행 계좌 개설, 교수 연락, 병원 방문, 대중교통, 기숙사 찾기, 음식 주문
  - 대형 텍스트 입력: "상황을 설명해주세요"
  - 선택적 URL 입력: YouTube/Shorts/TikTok (보조 섹션으로 접기)
  - CTA: "액션 가이드 생성하기"
  - 일러스트: 여행/영상 아이콘 → 생활 적응 아이콘
- [ ] **FR-02** `ExtractionResult` 타입에 `situation: SituationCard` 추가
  - `SituationCard`: `{ summary, documents: string[], whereTo: string[], checklist: string[], estimatedMinutes?: number }`
- [ ] **FR-03** `extractionSchema` Zod 스키마에 `situationCard` 추가
- [ ] **FR-04** `POST /api/extract` — 텍스트 상황 입력 처리 경로 추가
  - `situation` 필드 (필수) + `url` 필드 (선택)
  - URL 없을 때: 트랜스크립트 페치 생략, 상황 텍스트 직접 Claude 전송
  - URL 있을 때: 기존 YouTube 트랜스크립트 + 상황 텍스트 결합
- [ ] **FR-05** `buildSystemPrompt` / `buildUserMessage` 업데이트
  - SituationCard 생성 지시 추가 (필요 서류, 가야 할 곳, 체크리스트, 소요시간)
  - 상황 텍스트 기반 입력 처리 추가
- [ ] **FR-06** `ResultsScreen` 재설계
  - 영상 임베드 섹션 제거 (URL 제공 시에도 플레이어 미표시)
  - 카드 순서: Situation Card → Action Card → Context Card
  - Situation Card UI: 필요 서류 뱃지, 방문 장소, 체크리스트, 소요시간 칩
  - 배너 문구 업데이트: 국가 감지 → 상황 요약
- [ ] **FR-07** `i18n` (ko/en) 전체 카피 업데이트
  - `input.*`: 새 히어로·레이블·플레이스홀더·CTA
  - `results.*`: 새 카드명, Situation Card 레이블
  - `nav.*`: "Video AI" → "가이드" / "Guide"
- [ ] **FR-08** `TopNav` 탭명 변경: `videoai` → `guide` (id + labelKey)
- [ ] **FR-09** `page.tsx` 상태 업데이트
  - `url` 단일 상태 → `situation` + `url` 분리
  - API 요청 body에 `situation` 포함

### 2.2 Out of Scope

- 실결제 처리 (Stripe/Toss)
- `/guide` 페이지 저장된 가이드 목록
- 음성 지원 (Action Card 듣기 기능)
- TikTok 트랜스크립트 지원
- 장소 지도 기능 (Place 섹션 — 유지하되 낮은 우선순위)
- 로그인·사용량 제한·페이월 구조 변경

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | InputScreen: 퀵칩 + 상황 텍스트 + 선택적 URL + "액션 가이드 생성하기" CTA | High | Pending |
| FR-02 | `SituationCard` 타입 추가: summary, documents[], whereTo[], checklist[], estimatedMinutes? | High | Pending |
| FR-03 | Zod `situationCardSchema` + `extractionSchema`에 `situation` 필드 추가 | High | Pending |
| FR-04 | `/api/extract`: `situation`(필수) + `url`(선택) 처리, URL 없을 때 트랜스크립트 생략 | High | Pending |
| FR-05 | Claude 프롬프트: SituationCard 출력 지시 + 상황 텍스트 기반 생성 지원 | High | Pending |
| FR-06 | ResultsScreen: 영상 임베드 제거, 카드 순서 Situation→Action→Context | High | Pending |
| FR-07 | i18n ko/en: input.*, results.*, nav.* 카피 전체 업데이트 | Medium | Pending |
| FR-08 | TopNav: `videoai` 탭 id/labelKey → `guide` 변경 | Low | Pending |
| FR-09 | page.tsx: `situation` + `url` 분리 상태, API 요청 body 업데이트 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| Performance | 상황 텍스트 전용 경로(URL 없음)는 트랜스크립트 페치 생략으로 기존 대비 응답 빠름 |
| UX | 퀵칩 클릭 → 텍스트 입력란 자동 채워짐. CTA는 situation이 비어 있으면 비활성화 |
| Compatibility | 기존 인증·사용량 추적·페이월 로직 무변경 유지 |
| Style | 소프트 퍼플(#8651F2) 유지, 여행/영상 일러스트 교체, 액션 우선 레이아웃 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 상황 텍스트만 입력(URL 없음) → 가이드 생성 성공
- [ ] 퀵칩("은행 계좌 개설") 클릭 → 텍스트 입력란에 자동 입력
- [ ] 결과 화면에 Situation Card 정상 표시 (documents, whereTo, checklist)
- [ ] 결과 화면 카드 순서: Situation Card → Action Card → Context Card
- [ ] 영상 임베드 섹션 미표시 (URL 제공 시에도)
- [ ] 기존 tester 3회 제한 + PaywallModal 정상 동작
- [ ] `npm run build` 0 errors

### 4.2 Quality Criteria

- [ ] TypeScript 타입 오류 없음 (`SituationCard` ↔ Zod schema ↔ React props 일치)
- [ ] 상황 텍스트 없이 URL만 제공 시 적절한 에러 메시지
- [ ] ko/en 두 언어 모두 새 카피 정상 표시

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Zod schema 변경으로 기존 extract 응답 파싱 실패 | High | Medium | `situation` 필드를 optional로 시작 후 required로 전환, 점진적 적용 |
| Claude가 SituationCard를 올바르게 생성 못함 | Medium | Medium | 프롬프트에 bank account opening 예시 시나리오 포함, Few-shot 예시 추가 |
| 텍스트 전용 경로에서 XAI `source` 필드 부재 | Low | High | URL 없는 경우 source는 optional — 이미 optional로 정의되어 있음 |
| place의 hallucination guard (quote 검증) 텍스트 경로에서 동작 안 함 | Medium | High | 텍스트 경로에서는 hallucination guard 스킵, places를 빈 배열로 처리 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/types/extraction.ts` | Type | `SituationCard` 인터페이스 추가, `ExtractionResult`에 `situation` 필드 추가 |
| `src/lib/extract/schema.ts` | Zod Schema | `situationCardSchema` + `extractionSchema`에 `situation` 추가 |
| `src/app/page.tsx` | Page | `url` → `situation` + `url` 상태 분리, API 요청 body 업데이트 |
| `src/components/InputScreen.tsx` | Component | 전면 재설계 (퀵칩 + 텍스트 + 선택 URL) |
| `src/components/ResultsScreen.tsx` | Component | Situation Card 섹션 추가, 영상 임베드 제거, 카드 순서 재정렬 |
| `src/app/api/extract/route.ts` | API Route | `situation` 필드 파싱, 텍스트 전용 경로 추가 |
| `src/lib/extract/claude/prompt.ts` | Prompt | `SituationCard` 출력 지시 + `PromptInput` 인터페이스 `situation?` 추가 |
| `src/lib/extract/claude/client.ts` | Client | `PromptInput`에 `situation?` 필드 추가 |
| `src/lib/i18n/ko.ts` | i18n | input.*, results.*, nav.* 전체 카피 업데이트 |
| `src/lib/i18n/en.ts` | i18n | input.*, results.*, nav.* 전체 카피 업데이트 |
| `src/components/TopNav.tsx` | Component | `videoai` → `guide` (id, labelKey, i18n key) |

### 6.2 Unchanged Resources (market-validation 유지)

| Resource | Reason |
|----------|--------|
| `src/lib/auth/session.ts` | 인증 로직 무변경 |
| `src/lib/usage/tracker.ts` | 사용량 추적 무변경 |
| `src/components/PaywallModal.tsx` | 페이월 팝업 무변경 |
| `src/app/api/auth/*` | 인증 API 무변경 |
| `src/app/api/usage/*` | 사용량 API 무변경 |
| `src/middleware.ts` | 라우트 보호 무변경 |

---

## 7. Architecture Considerations

### 7.1 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| API 입력 방식 | URL 필수 유지 / situation 필수+URL 선택 | **situation 필수, url 선택** | 메모의 핵심 철학. URL 없어도 가이드 생성 가능해야 함 |
| SituationCard 위치 | 별도 API / extractionSchema 내부 | **extractionSchema 내부** | 단일 Claude 호출로 모든 카드 생성, 복잡도 최소화 |
| 텍스트 전용 경로 hallucination guard | 적용 / 스킵 | **스킵 (places 빈 배열)** | source quote가 없는 텍스트 경로에서 의미 없음 |
| 영상 임베드 | 조건부 표시 / 완전 제거 | **완전 제거** | 서비스 정체성 명확화. 영상은 맥락 소스일 뿐 |

### 7.2 File Change Map

```
src/
├── types/
│   └── extraction.ts              [MODIFIED — SituationCard 추가]
├── lib/
│   └── extract/
│       ├── schema.ts              [MODIFIED — situationCardSchema 추가]
│       └── claude/
│           ├── prompt.ts          [MODIFIED — SituationCard 지시 + situation 입력]
│           └── client.ts          [MODIFIED — PromptInput.situation? 추가]
├── app/
│   ├── page.tsx                   [MODIFIED — situation+url 상태 분리]
│   └── api/
│       └── extract/
│           └── route.ts           [MODIFIED — situation 파싱 + 텍스트 전용 경로]
└── components/
    ├── InputScreen.tsx            [MODIFIED — 전면 재설계]
    ├── ResultsScreen.tsx          [MODIFIED — Situation Card + 재정렬]
    └── TopNav.tsx                 [MODIFIED — videoai → guide]

src/lib/i18n/
├── ko.ts                          [MODIFIED — 전체 카피]
└── en.ts                          [MODIFIED — 전체 카피]
```

---

## 8. Convention Prerequisites

변경 없음. 기존 스택(Next.js 16, Tailwind v4, Prisma, OpenAI SDK, Zod) 유지.

---

## 9. Next Steps

1. [ ] `/pdca design platform-pivot` — 상세 UI 설계 (Situation Card UI, InputScreen 레이아웃, 프롬프트 구조)
2. [ ] `/pdca do platform-pivot --scope module-types` — 타입·스키마 먼저
3. [ ] `/pdca do platform-pivot --scope module-api` — API + 프롬프트
4. [ ] `/pdca do platform-pivot --scope module-ui` — InputScreen + ResultsScreen

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-23 | Initial plan — YouTube 도구 → AI 생활 적응 플랫폼 피벗 | Jay |
