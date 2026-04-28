# market-validation PRD

> **Feature**: market-validation (시장검증 MVP — Freemium Gate)
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: Jay
> **Date**: 2026-04-22
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Nuami의 핵심 가치(Video AI 행동 카드)가 무료로 무제한 제공되면 실제 지불 의향을 측정할 수 없음. 시장검증 없이 B2C 구독/B2B 라이선스 BM을 확장하면 매출 가설이 검증되지 않은 채 리소스가 소진됨. |
| **Solution** | 3계정 클로즈드 베타 구조: Admin(무제한) + Tester×2(라이선스 부여, Video AI 3회 무료 → 이후 결제 팝업). 실제 "3회 이후 구매 의향"을 측정하는 최소 유료 전환 실험. |
| **Function/UX Effect** | 테스터가 3회 이상 Video AI를 사용하려는 순간 "더 보려면 크레딧 또는 라이선스가 필요합니다" 팝업 노출 → CTA("구매하기" / "나중에") → 클릭률·이탈률로 전환 의향 측정. |
| **Core Value** | "지불 의향이 있는 사용자가 얼마나 되는가"를 실데이터로 검증 — B2C 구독 가격 설정(4,900원/9,900원)과 B2B 라이선스 피칭 근거 마련. |

---

## 1. WHY — 시장검증의 필요성

### 1.1 핵심 가설

**Nuami의 BM 가설**: "외국인 사용자는 Video AI 행동 카드(3회 무료 체험 후) 유료 전환에 동의할 것이다."

이 가설이 검증되지 않으면:
- B2C 구독(4,900~9,900원/월) 가격 설정 근거 없음
- B2B 기관 라이선스 피칭 시 "실사용 데이터" 없음
- 투자 유치 및 창업 대회 발표 자료에 실증 지표 부재

### 1.2 검증 실험 설계

```
[실험 대상]
  Admin (Jay): 무제한 사용 (운영/QA 목적)
  Tester A, B: 라이선스 부여 → 3회 무료 → 결제 전환 측정

[측정 지표]
  - 3회 도달률: 전체 tester 중 3회를 다 사용한 비율
  - 결제 팝업 CTA 클릭률: "구매하기" 클릭 / 팝업 노출 수
  - 이탈률: "나중에" 클릭 또는 팝업 닫기 / 팝업 노출 수
  - 재방문률: 팝업 이후 앱 재방문 여부
```

---

## 2. WHO — 타깃 페르소나

### Persona A — 클로즈드 베타 테스터 (Tester)
- **배경**: Jay가 직접 선정한 2명의 외국인 지인 또는 잠재 사용자
- **행동 패턴**: Nuami를 처음 사용하는 초기 얼리어답터
- **목적**: 실제 서비스 경험 + 지불 의향 피드백 제공
- **Pain Point**: "좋긴 한데 돈 내야 하면 쓸지 모르겠다" 수준에서 실제 CTA 반응을 측정

### Persona B — Admin (Jay / 창업자)
- **배경**: 서비스 운영자, 무제한 접근 필요
- **목적**: QA, 콘텐츠 생성, 지표 모니터링
- **요구사항**: 사용량 제한 없이 모든 기능 접근

### Persona C — 미래 B2B 바이어 (기관 담당자)
- **배경**: 대학 국제교류처, 다문화 기관 담당자
- **목적**: "외국인 직원/학생 적응 지원 툴" 도입 검토
- **근거 필요**: "실제 사용자 X명이 유료 전환 의향 Y%를 보였다"는 데이터

---

## 3. VALUE PROPOSITION (JTBD)

| JTBD 요소 | 내용 |
|-----------|------|
| **When** | 클로즈드 베타 실험을 통해 실제 사용자 전환 데이터가 필요할 때 |
| **I want to** | Video AI 사용을 제한하고 결제 의향을 측정하고 싶다 |
| **So I can** | B2C 구독 가격 설정과 B2B 피칭 근거를 마련하고 싶다 |
| **But** | 현재는 모든 사용자가 무제한으로 서비스를 사용 가능 |
| **Nuami does** | 3계정 구조 + 3회 제한 + 결제 팝업으로 최소 전환 실험 제공 |
| **Which means** | 추가 마케팅 비용 없이 실데이터로 BM 가설 검증 가능 |

---

## 4. LEAN CANVAS

| 항목 | 내용 |
|------|------|
| **Problem** | BM 가설 미검증 / 지불 의향 데이터 없음 |
| **Solution** | 3계정 클로즈드 베타 + 3회 제한 + 결제 팝업 |
| **Key Metrics** | CTA 클릭률, 이탈률, 3회 도달률 |
| **Unique Value** | "실제 전환 실험" — 추측이 아닌 데이터 |
| **Channels** | 직접 초대 (Jay → Tester A, B) |
| **Customer Segments** | 클로즈드 베타 2명 → 향후 B2C/B2B 확장 |
| **Cost Structure** | 개발 시간 (1-2 세션) |
| **Revenue Streams** | 실험 목적 (당장 매출 없음, 데이터가 자산) |

---

## 5. 기능 요구사항 (PRD)

### 5.1 계정 구조

| 계정 | 역할 | 접근 권한 | 설정 방법 |
|------|------|-----------|-----------|
| `admin@nuami.app` | admin | 무제한 | `.env.local` 하드코딩 |
| `tester1@nuami.app` | tester | Video AI 3회 무료 | `.env.local` 하드코딩 |
| `tester2@nuami.app` | tester | Video AI 3회 무료 | `.env.local` 하드코딩 |

> **MVP 원칙**: OAuth/이메일 인증 없이 **이메일+비밀번호 하드코딩** 방식. 3계정 고정이므로 DB 불필요.

### 5.2 인증 시스템 (FR-01~03)

| ID | 요구사항 |
|----|---------|
| FR-01 | 로그인 페이지 (`/login`): 이메일 + 비밀번호 입력, 세션 쿠키 발급 |
| FR-02 | 세션 미들웨어: 비로그인 시 Video AI 페이지 → `/login` 리다이렉트 |
| FR-03 | 로그아웃: 세션 쿠키 삭제 + `/login` 리다이렉트 |

### 5.3 사용량 제한 (FR-04~06)

| ID | 요구사항 |
|----|---------|
| FR-04 | UsageLog: 사용자별 Video AI 호출 횟수를 DB(ContentPost 테이블과 동일 DB) 또는 쿠키에 기록 |
| FR-05 | `POST /api/extract` 호출 전 사용량 체크: admin이면 패스, tester이면 count ≥ 3 시 `402 Payment Required` 반환 |
| FR-06 | 남은 횟수 표시: Video AI 입력 화면에 "X회 남음" 표시 (admin은 표시 없음) |

### 5.4 결제 팝업 (FR-07~09)

| ID | 요구사항 |
|----|---------|
| FR-07 | 결제 팝업 트리거: API 402 응답 수신 시 클라이언트에서 팝업 표시 |
| FR-08 | 팝업 구성: 제목 "더 보려면 구독이 필요합니다" + 설명 + CTA 2개 ("구독 시작하기" / "나중에") |
| FR-09 | CTA 액션: "구독 시작하기" → 구매 페이지(placeholder URL) 이동 / "나중에" → 팝업 닫기, 로그 기록 |

### 5.5 어드민 대시보드 (FR-10)

| ID | 요구사항 |
|----|---------|
| FR-10 | `/admin` 페이지 (admin 계정만 접근): tester별 사용 횟수, 팝업 노출 수, CTA 클릭 수 조회 |

---

## 6. 데이터 모델

### 6.1 계정 정보 (하드코딩, `.env.local`)

```env
# Admin
ADMIN_EMAIL=admin@nuami.app
ADMIN_PASSWORD=nuami-admin-2026

# Testers
TESTER1_EMAIL=tester1@nuami.app
TESTER1_PASSWORD=nuami-test-1
TESTER2_EMAIL=tester2@nuami.app
TESTER2_PASSWORD=nuami-test-2
```

### 6.2 UsageEvent (Prisma DB)

```prisma
model UsageEvent {
  id        String   @id @default(cuid())
  userEmail String
  action    String   // "video_ai_use" | "paywall_shown" | "paywall_cta_click" | "paywall_dismiss"
  metadata  String?  @db.Text  // JSON: { url, ctaLabel }
  createdAt DateTime @default(now())

  @@index([userEmail, action])
  @@index([createdAt])
}
```

### 6.3 세션 (Next.js 쿠키 기반)

```typescript
// 세션 페이로드
interface SessionPayload {
  email: string;
  role: "admin" | "tester";
  iat: number;
}
// JWT 서명 또는 단순 암호화 쿠키 (jose 라이브러리)
```

---

## 7. UX 플로우

```
[비로그인] → GET /video-ai → 미들웨어 → 302 /login
[로그인] → /login → POST /api/auth/login → 세션 쿠키 → /video-ai

[tester @ /video-ai]
  잔여 횟수 표시: "3회 남음"
  영상 URL 입력 → POST /api/extract
    ↳ 서버: count < 3 → 정상 응답 + count++
    ↳ 서버: count ≥ 3 → 402 { error: "LIMIT_EXCEEDED", used: 3, limit: 3 }
  클라이언트: 402 수신 → PaywallModal 오픈
    ↳ "구독 시작하기" 클릭 → /pricing 이동 + paywall_cta_click 로그
    ↳ "나중에" 클릭 → 팝업 닫기 + paywall_dismiss 로그

[admin @ /video-ai]
  잔여 횟수 없음, 무제한 → 바로 응답

[admin @ /admin]
  tester1: 사용 3회 / 팝업 2회 / CTA 1회 / 이탈 1회
  tester2: 사용 1회 / 팝업 0회
```

---

## 8. 기술 스택 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| 인증 방식 | 하드코딩 계정 + JWT 쿠키 | 3계정 고정, OAuth 불필요, 빠른 구현 |
| 세션 라이브러리 | `jose` (JWT) | Next.js Edge 호환, lightweight |
| 사용량 저장 | Prisma DB (UsageEvent) | 기존 TiDB Cloud 재사용 |
| 팝업 구현 | NUAMI 디자인 시스템 모달 | 기존 컴포넌트 재사용 |
| 미들웨어 | Next.js `middleware.ts` | 라우트 보호, 세션 검증 |

---

## 9. 시장검증 성공 기준

| 지표 | 목표 |
|------|------|
| 3회 사용 도달률 | 2명 중 2명 (100%) |
| 팝업 CTA 클릭률 | ≥ 50% ("구독 시작하기" 클릭) |
| 재방문률 | 팝업 이후 24시간 내 재방문 ≥ 1회 |
| 정성 피드백 | "얼마면 구독할 것인가?" 인터뷰 응답 수집 |

---

## 10. 구현 범위 (OUT OF SCOPE)

- 실제 결제 처리 (Stripe, Toss Payments) — 이번 MVP에선 placeholder
- 일반 회원가입/이메일 인증 — 3계정 고정으로 충분
- B2B 어드민 대시보드 고도화 — 기본 지표만
- 크레딧 충전/차감 시스템 — 다음 단계

---

## 11. 다음 단계

```
/pdca plan market-validation   → 상세 개발 계획
/pdca design market-validation → DB 모델 + API + UI 설계
/pdca do market-validation     → 구현 (2-3 세션 예상)
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-22 | Initial PRD — 3계정 클로즈드 베타 + Freemium Gate MVP | Jay |
