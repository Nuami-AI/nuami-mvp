# Design: Design System Audit & Standardization

**Feature**: `design-system`
**Phase**: Design
**Date**: 2026-04-20
**Reference**: `.claude/agents/nuami-design.md` (NUAMI Design Tokens)

---

## 1. 감사 결과 요약 (Audit Findings)

### 1.1 페이지 레이아웃 패턴 불일치

| 페이지 | TopNav 위치 | 페이지 랩퍼 |
|--------|------------|------------|
| InputScreen | flex 컨테이너 **안** | ✅ `flex-col min-h-screen max-w-[390px]` |
| content/page | `<main>` **밖** (sibling) | ❌ 별도 max-w 없음 |
| content/[id]/page | `<main>` **밖** (sibling) | ❌ 별도 max-w 없음 |
| mypage/page | flex 컨테이너 **안** | ✅ `flex-col min-h-screen max-w-[390px]` |

**문제**: TopNav가 어떤 페이지는 flex 컨테이너 안에, 어떤 페이지는 밖에 있어 레이아웃 동작이 다름.

---

### 1.2 모바일 상단 여백 불일치

| 페이지/컴포넌트 | 상단 padding | 기준 |
|----------------|-------------|------|
| InputScreen 헤더 | `pt-14` (56px) | ✅ header token 일치 |
| MypageHeader | `pt-14` (56px) | ✅ |
| ContentPageHeader | `pt-5` (20px) | ❌ 36px 부족 |
| content/[id] 헤더 | `pt-5` (20px) | ❌ 36px 부족 |

디자인 토큰 `componentSizes.header = '3.5rem'` (56px = `h-14`) 기준으로 모바일 최상단 페이지 타이틀 영역은 `pt-14` 통일 필요.

---

### 1.3 수평 패딩 불일치

| 위치 | 현재 값 | 표준 |
|------|---------|------|
| InputScreen 헤더 | `px-5` | — |
| InputScreen 콘텐츠 | `px-5 md:px-8` | — |
| ContentPageHeader | `px-4` | — |
| content 그리드 | `px-4` | — |
| content/[id] 전체 | `px-4` | — |
| MypageHeader | `px-5` | — |
| LanguageSelector | `px-5` | — |

`px-4`와 `px-5`가 혼재. 표준: **`px-4 md:px-6`**.

---

### 1.4 하단 패딩 불일치

| 페이지 | 모바일 pb | 데스크탑 pb |
|--------|----------|-----------|
| InputScreen 콘텐츠 | `pb-44` | `pb-16 lg:pb-20` |
| content/page | `pb-20` | `pb-6` |
| content/[id] | `pb-20` | `pb-6` |
| mypage main | `pb-20` | `pb-6` |

InputScreen은 고정 CTA 버튼이 있어 `pb-44` 유지. 나머지 표준: **`pb-20 md:pb-8`**.

---

### 1.5 Max-width 불일치

| 페이지 | 현재 | 표준 |
|--------|------|------|
| InputScreen | `max-w-[390px] md:max-w-3xl lg:max-w-5xl` | ✅ |
| content/page inner | `max-w-[390px] md:max-w-3xl lg:max-w-5xl` | ✅ |
| content/[id] inner | `max-w-[390px] md:max-w-2xl` | ❌ `md:max-w-3xl` 누락 |
| mypage | `max-w-[390px] md:max-w-3xl lg:max-w-5xl` | ✅ |

---

### 1.6 i18n 누락 (content/[id]/page.tsx)

```typescript
// 현재: 하드코딩된 한국어
const CATEGORY_LABELS = { culture: "문화", action: "행동", ... };
const COUNTRY_LABELS  = { KR: "한국", JP: "일본" };
```

→ `t("content.cat.culture")`, `t("content.country.kr")` 사용해야 함.  
Server Component이므로 Client Component로 분리 필요.

---

## 2. 표준 레이아웃 토큰 (Standard Layout Tokens)

```
┌─────────────────────────────────────────┐
│  TopNav (h-14 = 56px, sticky, md+only) │ ← componentSizes.header
├─────────────────────────────────────────┤
│  Page Title Area (mobile only)          │
│  pt-14 pb-3 px-4                       │ ← 상단 안전 여백
├─────────────────────────────────────────┤
│  Content Area                           │
│  px-4 md:px-6                          │ ← 수평 패딩 표준
│  pb-20 md:pb-8                         │ ← 하단 패딩 (BottomNav 56px + 여백)
├─────────────────────────────────────────┤
│  BottomNav (h-14 = 56px, fixed, mobile) │
└─────────────────────────────────────────┘
```

### 표준 값 정리

| 토큰 | 값 | 설명 |
|------|------|------|
| `PAGE_PX` | `px-4 md:px-6` | 수평 패딩 |
| `PAGE_PB` | `pb-20 md:pb-8` | 하단 패딩 |
| `PAGE_HEADER_PT` | `pt-14` | 모바일 페이지 상단 여백 |
| `PAGE_MAX_W` | `max-w-[390px] md:max-w-3xl lg:max-w-5xl mx-auto` | 최대 너비 |
| `HEADER_H` | `h-14` (56px) | TopNav / BottomNav 높이 |

---

## 3. 누락 컴포넌트 목록 (Missing Components)

### 3.1 신규 생성 필요

| 컴포넌트 | 경로 | 역할 |
|---------|------|------|
| `PageShell` | `src/components/PageShell.tsx` | 표준 페이지 래퍼 (TopNav + BottomNav + max-w + pb) |
| `PageHeader` | `src/components/PageHeader.tsx` | 모바일 페이지 타이틀 (pt-14, px-4, md:hidden) |
| `BackButton` | `src/components/BackButton.tsx` | 뒤로가기 버튼 (content/[id]에서 추출) |
| `EmptyState` | `src/components/EmptyState.tsx` | 빈 목록 상태 (content/page에서 추출) |
| `ContentDetailBadges` | 인라인 → 분리 | content/[id] 카테고리·국가 뱃지 + i18n |

### 3.2 기존 컴포넌트 수정 필요

| 컴포넌트 | 수정 내용 |
|---------|---------|
| `ContentPageHeader` | `pt-5` → `pt-14`, `px-4` → `px-4 md:px-6` |
| `MypageHeader` | `px-5` → `px-4 md:px-6` (표준 패딩) |
| `LanguageSelector` | `px-5` → `px-4 md:px-6` |

---

## 4. 페이지별 변경 명세 (Per-Page Fix Spec)

### 4.1 content/page.tsx

**현재 구조:**
```tsx
<>
  <TopNav active="content" />
  <main className="min-h-screen bg-background pb-20 md:pb-6">
    <div className="max-w-[390px] md:max-w-3xl lg:max-w-5xl mx-auto">
      <ContentPageHeader />
      ...
    </div>
  </main>
  <BottomNav active="content" />
</>
```

**변경 후:**
```tsx
<PageShell topNav="content" bottomNav="content">
  <ContentPageHeader />
  ...
</PageShell>
```

변경점:
- Fragment + `<main>` → `PageShell` 컴포넌트로 교체
- `pb-20 md:pb-6` → `pb-20 md:pb-8` (표준 통일)

---

### 4.2 content/[id]/page.tsx

**변경 내용:**
- `max-w-[390px] md:max-w-2xl` → `max-w-[390px] md:max-w-3xl lg:max-w-5xl`
- `pt-5` → `pt-14` (모바일 상단 여백)
- `CATEGORY_LABELS` / `COUNTRY_LABELS` → `ContentDetailBadges` (i18n 적용)
- 뒤로가기 버튼 → `BackButton` 컴포넌트 사용

---

### 4.3 ContentPageHeader.tsx

```tsx
// 현재
<div className="pt-5 pb-3 px-4">

// 변경
<div className="px-4 h-14 flex items-center md:hidden">
```

---

### 4.4 MypageHeader.tsx + LanguageSelector.tsx

```tsx
// MypageHeader 현재
<div className="px-5 pt-14 pb-2 md:hidden">

// 변경 (px-5 → px-4)
<div className="px-4 h-14 flex items-center md:hidden">

// LanguageSelector 현재
<div className="px-5 mt-6">

// 변경
<div className="px-4 md:px-6 mt-6">
```

---

## 5. 신규 컴포넌트 명세

### 5.1 PageShell

```tsx
// src/components/PageShell.tsx
"use client";  // BottomNav/TopNav가 클라이언트 컴포넌트이므로

interface Props {
  topNav?: TabId;        // TopNav active tab (없으면 TopNav 숨김)
  bottomNav?: BottomTabId; // BottomNav active tab (없으면 BottomNav 숨김)
  children: React.ReactNode;
  className?: string;    // main 영역 추가 클래스
}
```

내부 구조:
```tsx
<div className="relative flex flex-col min-h-screen max-w-[390px] md:max-w-3xl lg:max-w-5xl mx-auto bg-background">
  {topNav && <TopNav active={topNav} />}
  <main className={cn("flex-1 overflow-y-auto pb-20 md:pb-8", className)}>
    {children}
  </main>
  {bottomNav && <BottomNav active={bottomNav} />}
</div>
```

---

### 5.2 PageHeader

```tsx
// src/components/PageHeader.tsx
interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;   // 우측 액션 버튼 (e.g. 검색 아이콘)
}
```

구조:
```tsx
<div className="flex items-center justify-between px-4 pt-14 pb-3 md:hidden">
  <div>
    <h1 className="text-[18px] font-bold text-text-primary">{title}</h1>
    {subtitle && <p className="text-[13px] text-text-secondary mt-0.5">{subtitle}</p>}
  </div>
  {action}
</div>
```

---

### 5.3 BackButton

```tsx
// src/components/BackButton.tsx
interface Props {
  href: string;
  label?: string;   // aria-label
}
```

구조:
```tsx
<Link href={href} className="w-8 h-8 rounded-full bg-infoBox flex items-center justify-center">
  <ChevronLeft />
</Link>
```

---

### 5.4 EmptyState

```tsx
// src/components/EmptyState.tsx
interface Props {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
}
```

구조:
```tsx
<div className="flex flex-col items-center justify-center py-20 px-8 text-center">
  {icon && <div className="w-12 h-12 rounded-full bg-infoBox flex items-center justify-center mb-3">{icon}</div>}
  <p className="text-[14px] font-medium text-text-secondary">{title}</p>
  {desc && <p className="text-[12px] text-text-disabled mt-1">{desc}</p>}
</div>
```

---

## 6. 구현 순서 (Session Guide)

### Module A — 신규 공유 컴포넌트 (우선)
1. `src/components/PageShell.tsx` 생성
2. `src/components/PageHeader.tsx` 생성
3. `src/components/BackButton.tsx` 생성
4. `src/components/EmptyState.tsx` 생성

### Module B — 기존 컴포넌트 패딩 수정
5. `ContentPageHeader.tsx` — pt-5→pt-14, px-4→px-4 md:px-6
6. `MypageHeader.tsx` — px-5→px-4
7. `LanguageSelector.tsx` — px-5→px-4 md:px-6

### Module C — 페이지 레이아웃 교체
8. `content/page.tsx` — Fragment+main → PageShell, pb 표준화
9. `content/[id]/page.tsx` — PageShell, max-w 수정, pt-14, i18n, BackButton/EmptyState 적용

---

## 7. 변경 범위 요약

| 항목 | 신규 | 수정 |
|------|------|------|
| 컴포넌트 | 4개 | 3개 |
| 페이지 | 0 | 2개 |
| 예상 변경량 | ~120줄 | ~80줄 |

**핵심 원칙 (재확인):**
- 모바일 상단: `pt-14` (56px = header token)
- 수평 패딩: `px-4 md:px-6`
- 하단 패딩: `pb-20 md:pb-8` (CTA 페이지 제외)
- Max-width: `max-w-[390px] md:max-w-3xl lg:max-w-5xl mx-auto`
- 레이아웃 래퍼: `PageShell` 컴포넌트로 통일
