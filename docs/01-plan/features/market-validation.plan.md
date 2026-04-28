# market-validation Planning Document

> **Summary**: 3계정 클로즈드 베타 + Video AI 3회 무료 제한 + 결제 팝업으로 B2C 지불 의향 시장검증
>
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: Jay
> **Date**: 2026-04-22
> **Status**: Draft
> **Reference**: `docs/00-pm/market-validation.prd.md`

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Video AI가 무제한 무료라 지불 의향 측정 불가 — BM 가설(3회 무료 → 유료 전환)이 실데이터 없이 추측에 머물고 있음. |
| **Solution** | Admin(무제한) + Tester×2(Video AI 3회 제한, 이후 결제 팝업) 클로즈드 베타 구조를 Next.js 미들웨어 + JWT 쿠키 + UsageEvent DB로 구현. |
| **Function/UX Effect** | 로그인 후 Video AI 화면에 "X회 남음" 표시 → 3회 초과 시 PaywallModal 자동 노출 → CTA 클릭률·이탈률을 DB 이벤트로 기록. |
| **Core Value** | 실데이터 기반 "지불 의향 측정" — B2C 구독 가격 설정(4,900~9,900원) 근거 + B2B 기관 피칭 자료 확보. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | BM 가설 검증 없이 B2C/B2B 확장 불가. 3회 제한 + 결제 팝업으로 최소 전환 실험 필요. |
| **WHO** | Admin 1명(Jay) + 테스터 2명(직접 선정한 외국인 잠재 사용자) |
| **RISK** | jose JWT 쿠키 미들웨어 Next.js 16 호환성 / TiDB Cloud UsageEvent 추가 마이그레이션 / 하드코딩 자격증명 보안 |
| **SUCCESS** | tester 2명 모두 3회 도달 / 결제 팝업 CTA 클릭률 ≥ 50% / `/admin` 이벤트 조회 정상 동작 |
| **SCOPE** | IN: 인증·세션·사용량 제한·팝업·어드민 대시보드. OUT: 실결제, 일반 회원가입, 크레딧 충전, B2B 대시보드 고도화 |

---

## 1. Overview

### 1.1 Purpose

Nuami Video AI의 실제 지불 의향을 클로즈드 베타로 측정한다:
- **Admin**: 운영·QA 목적 무제한 사용
- **Tester**: 3회 무료 체험 후 결제 팝업 노출 → CTA 반응 데이터 수집

### 1.2 Background

`docs/00-pm/market-validation.prd.md`에서 도출:
- Nuami BM: B2C 초기 3회 무료 → 월 구독(4,900/9,900원) → B2B 기관 라이선스
- 현재 `/api/extract`(Video AI)는 인증 없이 무제한 사용 가능
- 시장검증 없이 유료화 전환 시 실패 리스크 高

### 1.3 Related Documents

- PRD: `docs/00-pm/market-validation.prd.md`
- 참조: `src/app/api/extract/route.ts` (Video AI 핵심 엔드포인트)
- 참조: `prisma/schema.prisma` (UsageEvent 모델 추가 대상)

---

## 2. Scope

### 2.1 In Scope

- [ ] **FR-01** 로그인 페이지 (`/login`): 이메일 + 비밀번호 폼, 세션 쿠키 발급
- [ ] **FR-02** Next.js `middleware.ts`: `/video-ai`, `/admin` 라우트 보호 (비로그인 → `/login`)
- [ ] **FR-03** 로그아웃: 쿠키 삭제 + `/login` 리다이렉트
- [ ] **FR-04** `UsageEvent` Prisma 모델: userEmail, action, metadata, createdAt
- [ ] **FR-05** `POST /api/extract` 사용량 게이트: tester는 3회 초과 시 `402 LIMIT_EXCEEDED` 반환
- [ ] **FR-06** 남은 횟수 API `GET /api/usage`: 현재 사용자의 남은 횟수 반환
- [ ] **FR-07** Video AI 화면: "X회 남음" 잔여 횟수 배지 표시 (admin은 미표시)
- [ ] **FR-08** `PaywallModal` 컴포넌트: 402 응답 시 자동 노출, "구독 시작하기" / "나중에" CTA
- [ ] **FR-09** CTA 이벤트 로그: `paywall_shown`, `paywall_cta_click`, `paywall_dismiss` 기록
- [ ] **FR-10** `/admin` 대시보드: tester별 사용 횟수 + 이벤트 현황 조회 (admin 전용)

### 2.2 Out of Scope

- 실제 결제 처리 (Stripe, Toss Payments) — placeholder URL로 대체
- 일반 회원가입 / 이메일 인증
- 크레딧 충전·차감 시스템 (추후 단계)
- B2B 기관 대시보드 고도화
- 비밀번호 재설정

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `/login` 페이지: 이메일+비밀번호 폼 → POST /api/auth/login → JWT 쿠키 발급 → 원래 페이지 또는 `/` 리다이렉트 | High | Pending |
| FR-02 | `middleware.ts`: 보호 경로(`/video-ai`, `/admin`) 요청 시 쿠키 검증 → 없으면 `/login?redirect=` | High | Pending |
| FR-03 | `POST /api/auth/logout`: 세션 쿠키 삭제 → 200 | High | Pending |
| FR-04 | `UsageEvent` 모델: `id(cuid)`, `userEmail`, `action(video_ai_use|paywall_shown|paywall_cta_click|paywall_dismiss)`, `metadata(Text JSON?)`, `createdAt` | High | Pending |
| FR-05 | `POST /api/extract` 인터셉트: 세션에서 role 추출 → admin이면 통과, tester이면 UsageEvent count ≥ 3 시 402 반환 + `paywall_shown` 로그 | High | Pending |
| FR-06 | `GET /api/usage`: 현재 세션 사용자의 `video_ai_use` count와 limit(3) 반환 `{ used, limit, remaining }` | High | Pending |
| FR-07 | Video AI 입력 화면(`InputScreen` 또는 홈 페이지): tester일 때 "N회 남음" 배지 표시 | Medium | Pending |
| FR-08 | `PaywallModal`: 402 수신 시 오버레이 팝업 — 제목·설명·CTA 2개 렌더 | High | Pending |
| FR-09 | CTA 클릭 시 이벤트 기록: "구독 시작하기" → `paywall_cta_click` + `/pricing` 이동 / "나중에" → `paywall_dismiss` + 팝업 닫기 | High | Pending |
| FR-10 | `/admin` 페이지: tester1·tester2 각각 `video_ai_use` 횟수, `paywall_shown` 횟수, `paywall_cta_click` 횟수, `paywall_dismiss` 횟수 표시 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| Security | JWT 서명 키는 `.env.local` `SESSION_SECRET` 환경변수. 계정 자격증명도 env 관리. |
| Performance | 사용량 체크가 `/api/extract` 응답에 추가하는 지연 < 50ms |
| UX | PaywallModal은 ESC·바깥 클릭으로 닫기 불가 (강제 선택 유도) — "나중에"만으로 닫기 가능 |
| Compatibility | Next.js 16 App Router + `middleware.ts` Edge Runtime 호환 (jose 사용) |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `/login` → 로그인 성공 → `/` 리다이렉트 동작
- [ ] 비로그인 상태에서 `/video-ai` 접근 → `/login`으로 리다이렉트
- [ ] tester로 Video AI 3회 사용 → 4번째 시도 시 PaywallModal 표시
- [ ] admin으로 Video AI 4회 이상 사용 → 팝업 없이 정상 동작
- [ ] PaywallModal CTA 클릭 → DB에 이벤트 기록 확인
- [ ] `/admin` 페이지에서 tester 이벤트 현황 조회 가능

### 4.2 Quality Criteria

- [ ] admin과 tester 역할 구분이 미들웨어 레벨에서 정확히 동작
- [ ] UsageEvent 로그가 실제 사용 흐름과 1:1 매칭
- [ ] `npm run build` 0 errors

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| jose JWT / Next.js 16 Edge Runtime 비호환 | High | Low | `jose` v5+ 사용, Edge에서 동작 확인된 패턴 적용 |
| TiDB Cloud UsageEvent 마이그레이션 실패 | High | Low | `prisma migrate deploy` 전에 `prisma migrate dev` 로컬 검증 |
| 하드코딩 자격증명 노출 | Medium | Low | `.env.local` 관리, `.gitignore` 확인, 실운영 전 교체 명시 |
| `/api/extract` 게이트 추가로 기존 동작 깨짐 | Medium | Low | admin 계정으로 회귀 테스트, 기존 rate-limit 로직 충돌 확인 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `prisma/schema.prisma` | DB Schema | `UsageEvent` 모델 추가 |
| `src/app/api/extract/route.ts` | API Route | 세션 체크 + 사용량 게이트 로직 추가 |
| `src/app/api/` | API Route | `auth/login/route.ts`, `auth/logout/route.ts`, `usage/route.ts` 신규 |
| `src/middleware.ts` | Next.js Middleware | 신규 — 보호 경로 JWT 검증 |
| `src/app/page.tsx` (또는 InputScreen) | Page/Component | 잔여 횟수 배지 + 402 핸들링 + PaywallModal 연결 |

### 6.2 Current Consumers

| Resource | Operation | Impact |
|----------|-----------|--------|
| `src/app/api/extract/route.ts` | POST (클라이언트, 현재 무인증) | 인증 게이트 추가 — 기존 비로그인 호출 차단됨 |
| `src/app/page.tsx` (InputScreen) | 렌더 | PaywallModal 상태 추가, 잔여 횟수 fetch 추가 |

---

## 7. Architecture Considerations

### 7.1 Project Level

**Dynamic** — 기존 결정 유지. 신규 auth 레이어 추가.

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 인증 방식 | OAuth / DB 사용자 / 하드코딩+JWT | **하드코딩 계정 + `jose` JWT 쿠키** | 3계정 고정, 빠른 구현, 외부 서비스 불필요 |
| 세션 저장 | DB Session / Redis / JWT 쿠키 | **JWT 쿠키 (jose)** | stateless, Edge 호환 |
| 사용량 저장 | in-memory / Redis / DB | **Prisma DB (UsageEvent)** | 기존 TiDB Cloud 재사용, 영속성 보장 |
| 미들웨어 | 각 route 개별 체크 / middleware.ts | **`middleware.ts`** | 중앙화된 라우트 보호, DRY |
| 팝업 트리거 | 서버 redirect / 클라이언트 402 핸들 | **클라이언트 402 핸들** | UX 부드러움, 현재 클라이언트 구조 재사용 |

### 7.3 New Files

```
src/
├── middleware.ts                           [NEW — 라우트 보호]
├── lib/
│   ├── auth/
│   │   ├── session.ts                      [NEW — jose JWT 유틸]
│   │   └── accounts.ts                     [NEW — 하드코딩 계정 + role 확인]
│   └── usage/
│       └── tracker.ts                      [NEW — UsageEvent DB 헬퍼]
├── app/
│   ├── login/
│   │   └── page.tsx                        [NEW — 로그인 페이지]
│   ├── admin/
│   │   └── page.tsx                        [NEW — 어드민 대시보드]
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts              [NEW]
│       │   └── logout/route.ts             [NEW]
│       └── usage/route.ts                  [NEW — GET 잔여 횟수]
└── components/
    └── PaywallModal.tsx                    [NEW — 결제 팝업]

prisma/schema.prisma                        [MODIFIED — UsageEvent 모델 추가]
src/app/api/extract/route.ts                [MODIFIED — 세션 체크 + 게이트]
src/app/page.tsx (또는 InputScreen)         [MODIFIED — 잔여 횟수 + 팝업 연결]
.env.example                                [MODIFIED — SESSION_SECRET 등 추가]
```

---

## 8. Convention Prerequisites

### 8.1 Environment Variables Needed

| Variable | Purpose | Required |
|----------|---------|:--------:|
| `SESSION_SECRET` | JWT 서명 키 (32자 이상 랜덤 문자열) | ✅ |
| `ADMIN_EMAIL` | admin 계정 이메일 | ✅ |
| `ADMIN_PASSWORD` | admin 계정 비밀번호 | ✅ |
| `TESTER1_EMAIL` | tester1 이메일 | ✅ |
| `TESTER1_PASSWORD` | tester1 비밀번호 | ✅ |
| `TESTER2_EMAIL` | tester2 이메일 | ✅ |
| `TESTER2_PASSWORD` | tester2 비밀번호 | ✅ |
| `USAGE_LIMIT` | tester 무료 횟수 (기본: 3) | ☐ (hardcode default) |

### 8.2 Packages to Install

```bash
npm install jose
```

---

## 9. Next Steps

1. [ ] `/pdca design market-validation` — DB 모델 + API + UI 상세 설계
2. [ ] `.env.local`에 SESSION_SECRET + 계정 정보 추가
3. [ ] `/pdca do market-validation --scope module-auth` — 인증 먼저 구현
4. [ ] `/pdca do market-validation --scope module-gate` — 사용량 게이트
5. [ ] `/pdca do market-validation --scope module-ui` — UI (팝업 + 배지 + 어드민)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-22 | Initial plan — 3계정 클로즈드 베타 + Freemium Gate | Jay |
