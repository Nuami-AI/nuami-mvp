# ui-i18n Planning Document

> **Summary**: 전체 UI를 한국어 기반으로 전환하고, 마이페이지에 언어 설정 기능 추가 (ko/en/ja)
>
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: JJUN
> **Date**: 2026-04-20
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 모든 UI 텍스트가 영어로 하드코딩되어 있어 한국어 사용자 경험이 불일치하고, 다국어 사용자 지원이 불가함 |
| **Solution** | 경량 TypeScript i18n 딕셔너리 + React Context 방식으로 ko/en/ja 3개 언어 지원. 외부 라이브러리 없이 구현 |
| **Function/UX Effect** | 처음 방문 시 브라우저 언어로 자동 감지, 마이페이지에서 언어 변경 가능. 전체 UI가 즉시 해당 언어로 렌더링 |
| **Core Value** | 일본어·영어 사용 해외 사용자도 nuami를 자국어로 이용 가능 → 글로벌 사용성 확보 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | UI가 영어 하드코딩이라 한국어 기본값 불일치 + 다국어 사용자 지원 불가 |
| **WHO** | 한국어/영어/일본어 사용자 (여행 콘텐츠 소비자) |
| **RISK** | 컴포넌트 수가 많아 누락 번역 키 발생 가능성; hydration mismatch (localStorage는 client-only) |
| **SUCCESS** | 전체 UI 텍스트 한국어 기본 표시 + 마이페이지에서 언어 전환 시 즉시 반영 |
| **SCOPE** | Phase 1: i18n 인프라 + 번역 딕셔너리; Phase 2: 컴포넌트 적용; Phase 3: 마이페이지 |

---

## 1. Overview

### 1.1 Purpose

전체 UI를 한국어 기반으로 전환하고, 사용자가 마이페이지에서 언어를 선택할 수 있게 한다. 선택한 언어는 localStorage에 저장되어 재방문 시에도 유지된다.

### 1.2 Background

nuami는 영어권이 아닌 한국/일본 여행자를 타깃으로 하는 앱이다. 현재 모든 UI 텍스트가 영어로 하드코딩되어 있어 제품-시장 불일치가 발생하고 있다. 로그인/회원가입은 추후 고도화 단계에서 추가하고, 이번 단계에서는 언어 설정만 구현한다.

### 1.3 Related Documents

- Design: `docs/02-design/features/ui-i18n.design.md`
- content-hub Plan: `docs/01-plan/features/content-hub.plan.md`

---

## 2. Scope

### 2.1 In Scope

- [x] `src/lib/i18n/` — 경량 TypeScript i18n 딕셔너리 (ko/en/ja)
- [x] `LanguageContext` — React Context + `useLanguage` 훅
- [x] `src/app/layout.tsx` — `LanguageProvider` 래핑
- [x] `/mypage` 라우트 — 언어 선택 UI (기타 기능 없음)
- [x] `BottomNav` / `TopNav` — `/mypage` 링크 연결 + i18n 탭 라벨
- [x] 전체 컴포넌트 번역 적용: InputScreen, ResultsScreen, CountryTabs, CategoryFilter, ContentCard, content/page, content/[id]/page

### 2.2 Out of Scope

- 로그인 / 회원가입 / 프로필 기능
- next-intl, i18next 등 외부 i18n 라이브러리
- URL 기반 locale 라우팅 (`/ko/`, `/en/`)
- SEO용 서버사이드 언어 감지
- Video AI 추출 결과 언어 (별도 `userLanguage` 로직으로 이미 처리됨)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | i18n 딕셔너리: ko/en/ja 3개 언어, 모든 UI 문자열 커버 | High | Pending |
| FR-02 | `LanguageContext` + `useLanguage` 훅으로 앱 전체에 언어 상태 공급 | High | Pending |
| FR-03 | 언어 감지 순서: localStorage → Accept-Language 헤더 → 기본 'ko' | High | Pending |
| FR-04 | 마이페이지 `/mypage` 생성: 언어 선택 UI (3개 버튼) | High | Pending |
| FR-05 | 언어 변경 즉시 반영 (페이지 리로드 없음), localStorage 저장 | High | Pending |
| FR-06 | BottomNav / TopNav 마이페이지 탭을 실제 `/mypage`로 연결 | Medium | Pending |
| FR-07 | 모든 기존 컴포넌트 UI 텍스트를 i18n 키로 교체 | High | Pending |
| FR-08 | hydration mismatch 방지: 서버/클라이언트 초기 언어 일치 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 언어 전환 시 렌더링 < 100ms | 브라우저 DevTools |
| Bundle Size | i18n 딕셔너리 추가로 인한 번들 증가 < 5KB gzip | next build 분석 |
| Hydration | SSR → CSR hydration mismatch 0건 | 콘솔 에러 없음 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 앱 전체 UI가 기본 한국어로 표시됨
- [ ] 마이페이지에서 언어 선택 시 전체 UI 즉시 변경
- [ ] 브라우저 언어가 en이면 영어로, ja면 일본어로 자동 감지
- [ ] localStorage에 선택 언어 저장 → 재방문 시 유지
- [ ] hydration 경고 없음 (콘솔 클린)
- [ ] TypeScript 에러 없음

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] Build succeeds
- [ ] 번역 키 누락 없음 (컴파일 타임 타입 체크)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Hydration mismatch (localStorage는 SSR에서 undefined) | High | High | `suppressHydrationWarning` + `useEffect`로 초기화, 초기값은 항상 'ko' |
| 번역 키 누락 (컴포넌트 많음) | Medium | Medium | TypeScript 타입으로 모든 키 강제 — 누락 시 컴파일 에러 |
| 일본어 번역 품질 | Low | Medium | 기본 여행 앱 용어 수준, MVP이므로 machine-quality 허용 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/app/layout.tsx` | 레이아웃 | `LanguageProvider` 래핑 추가 |
| `src/components/BottomNav.tsx` | 컴포넌트 | 탭 라벨 i18n 적용 + `/mypage` href 연결 |
| `src/components/TopNav.tsx` | 컴포넌트 | 탭 라벨 i18n 적용 + `/mypage` href 연결 |
| `src/components/InputScreen.tsx` | 컴포넌트 | 모든 UI 텍스트 i18n 키 교체 |
| `src/components/ResultsScreen.tsx` | 컴포넌트 | 모든 UI 텍스트 i18n 키 교체 |
| `src/components/CategoryFilter.tsx` | 컴포넌트 | 카테고리 라벨 i18n 교체 |
| `src/components/CountryTabs.tsx` | 컴포넌트 | 탭 라벨 i18n 교체 |
| `src/app/content/page.tsx` | 페이지 | UI 텍스트 i18n 교체 |
| `src/app/content/[id]/page.tsx` | 페이지 | UI 텍스트 i18n 교체 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| BottomNav label | READ | 모든 페이지 BottomNav | Needs update |
| TopNav label | READ | 모든 페이지 TopNav | Needs update |
| InputScreen 텍스트 | READ | `src/app/page.tsx` | Needs update |
| ResultsScreen 텍스트 | READ | `src/app/page.tsx` | Needs update |

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| **Starter** | ☐ |
| **Dynamic** | ☑ |
| **Enterprise** | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| i18n 라이브러리 | 없음 (custom) | 의존성 최소화, 번들 경량화, MVP 수준 |
| 상태 관리 | React Context | 단순한 전역 상태, 외부 라이브러리 불필요 |
| 언어 감지 | useEffect + navigator.language | SSR 안전, hydration mismatch 회피 |
| 번역 키 타입 | TypeScript keyof | 컴파일 타임 누락 검출 |
| 저장소 | localStorage | 인증 없이 영구 저장 |

### 7.3 Folder Structure

```
src/lib/i18n/
├── index.ts        # LanguageContext, LanguageProvider, useLanguage 훅
├── types.ts        # Language 타입, TranslationKey 타입
├── ko.ts           # 한국어 딕셔너리 (기준 딕셔너리)
├── en.ts           # 영어 딕셔너리
└── ja.ts           # 일본어 딕셔너리

src/app/
└── mypage/
    └── page.tsx    # 마이페이지 (언어 설정만)

src/components/
└── LanguageProvider.tsx  # (또는 lib/i18n/index.ts에 통합)
```

---

## 8. Convention Prerequisites

- TypeScript strict mode 유지
- "use client" 컴포넌트에서만 `useLanguage` 훅 사용
- Server Component에서는 i18n 딕셔너리 직접 import 불가 (Context 미지원)

---

## 9. Next Steps

1. [ ] `/pdca design ui-i18n` — 설계 문서 작성
2. [ ] `/pdca do ui-i18n` — 구현

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-20 | Initial draft | JJUN |
