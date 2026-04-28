# market-validation Design Document

> **Summary**: 3계정 클로즈드 베타 — jose JWT 쿠키 인증 + UsageEvent DB 사용량 게이트 + PaywallModal
>
> **Project**: nuami-mvp
> **Version**: 0.1.0
> **Author**: Jay
> **Date**: 2026-04-22
> **Status**: Draft
> **Planning Doc**: [market-validation.plan.md](../../01-plan/features/market-validation.plan.md)

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

### 1.1 Design Goals

- Next.js 16 Edge Runtime과 호환되는 `middleware.ts` 기반 라우트 보호
- `lib/auth/` 와 `lib/usage/` 를 분리하여 각 책임을 단일화
- 기존 `/api/extract` 로직을 최소 수정하면서 usage gate 삽입
- DB 마이그레이션은 Prisma schema에 `UsageEvent` 모델만 추가

### 1.2 Design Principles

- **완전 분리 (Clean Architecture)**: auth, usage, UI 레이어가 서로 import 없이 독립
- **Edge/Node 경계 명확화**: `middleware.ts`는 jose만 사용(Edge), usage 카운팅은 Node route 내부
- **환경변수 단일 진실 소스**: 계정 자격증명·시크릿 모두 `.env.local`

---

## 2. Architecture

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | **Option B: Clean** | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **New Files** | 5 | 9 | 7 |
| **Modified Files** | 2 | 2 | 2 |
| **Complexity** | Low | Medium | Medium |
| **Maintainability** | Low | **High** | High |
| **Effort** | Low | Medium | Medium |
| **Selected** | | ✅ | |

**Selected**: Option B — Clean Architecture
**Rationale**: 3계정 MVP지만 admin 대시보드·usage tracker가 별개 관심사이므로 분리가 명확히 이점. 추후 계정 확장 시에도 `accounts.ts`만 수정.

### 2.1 Component Diagram

```
Browser
  │
  ├─ GET /login, /admin, /video-ai ──→ middleware.ts (Edge)
  │     └─ jose.jwtVerify(cookie) ──→ 실패 시 302 /login
  │
  ├─ POST /api/auth/login ──────────→ lib/auth/accounts.ts (검증)
  │                                    └─ lib/auth/session.ts (JWT 발급)
  │
  ├─ POST /api/auth/logout ─────────→ Set-Cookie: session=; MaxAge=0
  │
  ├─ GET  /api/usage ───────────────→ lib/usage/tracker.ts → DB (count)
  │
  └─ POST /api/extract ─────────────→ lib/auth/session.ts (세션 파싱)
                                       └─ lib/usage/tracker.ts (gate + log)
                                            ├─ admin → 패스
                                            ├─ count < 3 → 기존 로직 + video_ai_use 기록
                                            └─ count ≥ 3 → 402 + paywall_shown 기록
```

### 2.2 Data Flow — tester Video AI 사용

```
1. Browser: POST /api/extract { url }
2. extract/route.ts: session 파싱 → email, role 추출
3. tracker.getCount(email, "video_ai_use") → DB 쿼리
4. count ≥ 3 → tracker.log(email, "paywall_shown")
              → return 402 { error: "LIMIT_EXCEEDED", used, limit }
   count < 3 → 기존 Claude 추출 로직 실행
              → tracker.log(email, "video_ai_use")
              → return 200
5. Browser: 402 수신 → PaywallModal 오픈
6. CTA 클릭: POST /api/usage/event { action: "paywall_cta_click" | "paywall_dismiss" }
```

### 2.3 Dependencies

| Module | Depends On | Purpose |
|--------|-----------|---------|
| `middleware.ts` | `lib/auth/session.ts` | JWT verify only |
| `api/auth/login` | `lib/auth/accounts.ts`, `lib/auth/session.ts` | 자격증명 검증 + 토큰 발급 |
| `api/extract` | `lib/auth/session.ts`, `lib/usage/tracker.ts` | 세션 파싱 + 사용량 게이트 |
| `api/usage` | `lib/usage/tracker.ts` | 잔여 횟수 조회 |
| `api/usage/event` | `lib/usage/tracker.ts` | CTA 이벤트 기록 |
| `lib/usage/tracker.ts` | `lib/db.ts` (Prisma) | UsageEvent CRUD |
| `PaywallModal` | — | 클라이언트 전용 UI |

---

## 3. Data Model

### 3.1 Session Payload (JWT Cookie)

```typescript
interface SessionPayload {
  email: string;
  role: "admin" | "tester";
  iat: number;
  exp: number;
}
// Cookie name: "nuami-session"
// Algorithm: HS256 (jose SignJWT)
// MaxAge: 7 days
```

### 3.2 Account Registry (환경변수)

```typescript
// lib/auth/accounts.ts
interface Account {
  email: string;
  password: string;
  role: "admin" | "tester";
}
// 3개 고정 — DB 불필요
```

### 3.3 UsageEvent Prisma Model (신규)

```prisma
model UsageEvent {
  id        String   @id @default(cuid())
  userEmail String
  action    String   // "video_ai_use" | "paywall_shown" | "paywall_cta_click" | "paywall_dismiss"
  metadata  String?  @db.Text  // JSON: { url?, ctaLabel? }
  createdAt DateTime @default(now())

  @@index([userEmail, action])
  @@index([createdAt])
}
```

**Migration**: `npx prisma migrate dev --name add-usage-event`

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth | Runtime |
|--------|------|-------------|------|---------|
| POST | `/api/auth/login` | 로그인 — JWT 쿠키 발급 | 없음 | Node |
| POST | `/api/auth/logout` | 로그아웃 — 쿠키 삭제 | 없음 | Node |
| GET | `/api/usage` | 잔여 횟수 조회 | 세션 필요 | Node |
| POST | `/api/usage/event` | CTA 이벤트 기록 | 세션 필요 | Node |
| POST | `/api/extract` | Video AI (기존 수정) | 세션 필요 | Node |

### 4.2 Detailed Specification

#### `POST /api/auth/login`

**Request:**
```json
{ "email": "tester1@nuami.app", "password": "nuami-test-1" }
```

**Response (200 OK):**
```json
{ "ok": true, "role": "tester" }
```
Set-Cookie: `nuami-session=<JWT>; HttpOnly; SameSite=Lax; Path=/; MaxAge=604800`

**Error (401):**
```json
{ "error": "INVALID_CREDENTIALS" }
```

---

#### `POST /api/auth/logout`

**Response (200 OK):**
```json
{ "ok": true }
```
Set-Cookie: `nuami-session=; MaxAge=0`

---

#### `GET /api/usage`

**Response (200 OK):**
```json
{ "used": 2, "limit": 3, "remaining": 1, "role": "tester" }
```
admin 응답: `{ "used": null, "limit": null, "remaining": null, "role": "admin" }`

**Error (401):** 세션 없음

---

#### `POST /api/usage/event`

**Request:**
```json
{ "action": "paywall_cta_click", "metadata": { "ctaLabel": "구독 시작하기" } }
```

**Response (200 OK):**
```json
{ "ok": true }
```

---

#### `POST /api/extract` (수정)

기존 로직 앞에 Usage Gate 삽입:

```
1. 세션 쿠키 파싱 → 없으면 401
2. role === "admin" → 기존 로직으로 패스
3. role === "tester":
   a. count = await tracker.getCount(email, "video_ai_use")
   b. count ≥ USAGE_LIMIT(3) → log("paywall_shown") → 402 LIMIT_EXCEEDED
   c. count < limit → 기존 Claude 추출 → log("video_ai_use") → 200
```

**402 Response:**
```json
{
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "무료 체험 횟수를 모두 사용했습니다.",
    "requestId": "...",
    "used": 3,
    "limit": 3
  }
}
```

---

## 5. UI/UX Design

### 5.1 `/login` 페이지

```
┌─────────────────────────────────┐
│         Nuami                   │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 이메일                  │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 비밀번호               │    │
│  └─────────────────────────┘    │
│                                 │
│  [      로그인하기      ]        │
│                                 │
│  error: "이메일 또는 비밀번호..."  │
└─────────────────────────────────┘
```

- 에러 메시지: `text-destructive` 토큰
- 로그인 성공: `redirect` 쿼리파라미터 있으면 해당 URL, 없으면 `/`
- 로그인 상태에서 `/login` 접근: `/`로 리다이렉트

### 5.2 Video AI 화면 — 잔여 횟수 배지

```
[InputScreen 헤더 영역]
  tester: "3회 남음" 배지 (bg-infoBox, text-accent-700, rounded-full px-2 py-0.5 text-xs)
  admin:  배지 없음
```

- `GET /api/usage` 를 컴포넌트 마운트 시 fetch
- 사용 후 추출 성공 시 `-1` 로컬 업데이트

### 5.3 `PaywallModal`

```
┌─────────────────────────────────┐
│  🔒 더 보려면 구독이 필요합니다  │
│                                 │
│  Nuami의 Video AI를 계속        │
│  사용하려면 구독이 필요합니다.   │
│  월 4,900원부터 시작하세요.     │
│                                 │
│  [구독 시작하기]                 │
│  [나중에]                       │
└─────────────────────────────────┘
```

- ESC·바깥 클릭으로 닫기 불가 ("나중에" 버튼만)
- "구독 시작하기": `paywall_cta_click` 기록 → `/pricing` (placeholder)
- "나중에": `paywall_dismiss` 기록 → 팝업 닫기
- NUAMI 디자인 시스템 `Dialog` 또는 Portal 기반 오버레이

### 5.4 `/admin` 대시보드

```
┌──────────── Admin Dashboard ────────────┐
│                              [로그아웃] │
│                                         │
│  tester1@nuami.app                      │
│  ┌──────┬──────┬──────┬──────┐          │
│  │사용  │팝업  │CTA  │이탈  │          │
│  │ 3회  │ 2회  │ 1회 │ 1회  │          │
│  └──────┴──────┴──────┴──────┘          │
│                                         │
│  tester2@nuami.app                      │
│  ┌──────┬──────┬──────┬──────┐          │
│  │사용  │팝업  │CTA  │이탈  │          │
│  │ 1회  │ 0회  │ 0회 │ 0회  │          │
│  └──────┴──────┴──────┴──────┘          │
└─────────────────────────────────────────┘
```

- Server Component: DB 쿼리를 서버에서 직접 실행
- admin 이외 접근: middleware가 `/login` 리다이렉트

---

## 6. Middleware Design

```typescript
// src/middleware.ts (Edge Runtime)
export const config = {
  matcher: ["/video-ai/:path*", "/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("nuami-session");
  if (!sessionCookie) {
    return redirectToLogin(request);
  }
  try {
    await verifySession(sessionCookie.value); // jose jwtVerify
  } catch {
    return redirectToLogin(request);
  }
  // /admin 경로: role 체크
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const payload = await getSessionPayload(sessionCookie.value);
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  return NextResponse.next();
}
```

**Edge 주의사항**:
- `lib/auth/session.ts`는 `jose`만 import (Node 모듈 금지)
- DB 접근 불가 — usage 카운팅은 Node route에서만

---

## 7. lib/auth/ 설계

### `lib/auth/session.ts`

```typescript
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
const COOKIE_NAME = "nuami-session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSession(email: string, role: "admin" | "tester"): Promise<string>
export async function verifySession(token: string): Promise<SessionPayload>
export function getSessionCookieOptions(): ResponseCookie
export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null>
```

### `lib/auth/accounts.ts`

```typescript
interface Account { email: string; password: string; role: "admin" | "tester" }

const ACCOUNTS: Account[] = [
  { email: process.env.ADMIN_EMAIL!, password: process.env.ADMIN_PASSWORD!, role: "admin" },
  { email: process.env.TESTER1_EMAIL!, password: process.env.TESTER1_PASSWORD!, role: "tester" },
  { email: process.env.TESTER2_EMAIL!, password: process.env.TESTER2_PASSWORD!, role: "tester" },
];

export function findAccount(email: string, password: string): Account | null
export function getTesterEmails(): string[]
```

---

## 8. lib/usage/ 설계

### `lib/usage/tracker.ts`

```typescript
const USAGE_LIMIT = parseInt(process.env.USAGE_LIMIT ?? "3", 10);

export type UsageAction = "video_ai_use" | "paywall_shown" | "paywall_cta_click" | "paywall_dismiss";

export async function getCount(userEmail: string, action: UsageAction): Promise<number>
export async function logEvent(userEmail: string, action: UsageAction, metadata?: object): Promise<void>
export async function checkGate(userEmail: string): Promise<{ allowed: boolean; used: number; limit: number }>
export async function getAdminStats(): Promise<TesterStats[]>

interface TesterStats {
  email: string;
  video_ai_use: number;
  paywall_shown: number;
  paywall_cta_click: number;
  paywall_dismiss: number;
}
```

---

## 9. Environment Variables

`.env.local` 추가 항목:

```env
# Auth
SESSION_SECRET=<32자 이상 랜덤 문자열>
ADMIN_EMAIL=admin@nuami.app
ADMIN_PASSWORD=nuami-admin-2026
TESTER1_EMAIL=tester1@nuami.app
TESTER1_PASSWORD=nuami-test-1
TESTER2_EMAIL=tester2@nuami.app
TESTER2_PASSWORD=nuami-test-2

# Usage limit (optional, default: 3)
USAGE_LIMIT=3
```

`.env.example` 에도 동일 키 추가 (값은 placeholder).

---

## 10. Packages

```bash
npm install jose
```

---

## 11. Implementation Guide

### 11.1 Implementation Order

1. **Prisma schema** — `UsageEvent` 모델 추가 + migrate
2. **lib/auth/session.ts** — JWT sign/verify (Edge 호환)
3. **lib/auth/accounts.ts** — 3계정 env 조회
4. **lib/usage/tracker.ts** — getCount, logEvent, checkGate, getAdminStats
5. **middleware.ts** — 라우트 보호 (/video-ai, /admin)
6. **api/auth/login/route.ts** — 로그인 + 쿠키 발급
7. **api/auth/logout/route.ts** — 쿠키 삭제
8. **api/usage/route.ts** — GET 잔여 횟수
9. **api/usage/event/route.ts** — POST CTA 이벤트 기록
10. **api/extract/route.ts** — Usage Gate 삽입 (2. Rate limit 앞에)
11. **app/login/page.tsx** — 로그인 폼 UI
12. **components/PaywallModal.tsx** — 결제 팝업
13. **app/page.tsx (InputScreen)** — 잔여 횟수 배지 + 402 핸들링
14. **app/admin/page.tsx** — 어드민 대시보드
15. **.env.example** — 신규 키 추가

### 11.2 Files Summary

**신규 파일 (9개)**:
- `src/proxy.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/accounts.ts`
- `src/lib/usage/tracker.ts`
- `src/app/login/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/usage/route.ts`
- `src/app/api/usage/event/route.ts`
- `src/components/PaywallModal.tsx`

**수정 파일 (3개)**:
- `prisma/schema.prisma` — UsageEvent 모델 추가
- `src/app/api/extract/route.ts` — Usage Gate 삽입
- `src/app/page.tsx` — 잔여 횟수 배지 + PaywallModal 연결
- `.env.example` — 신규 환경변수

### 11.3 Session Guide

| Module | Scope Key | Files | 예상 시간 |
|--------|-----------|-------|-----------|
| **module-auth** | `--scope module-auth` | prisma schema, lib/auth/*, middleware.ts, api/auth/*, app/login/ | ~1h |
| **module-gate** | `--scope module-gate` | lib/usage/tracker.ts, api/usage/*, api/extract 수정 | ~45m |
| **module-ui** | `--scope module-ui` | PaywallModal, app/page.tsx 수정, app/admin/, .env.example | ~45m |

**추천 세션 분할**:
```
세션 1: /pdca do market-validation --scope module-auth
세션 2: /pdca do market-validation --scope module-gate
세션 3: /pdca do market-validation --scope module-ui
```

---

## 12. Test Plan

### Definition of Done

- [ ] `/login` → 로그인 성공 → `/` 리다이렉트
- [ ] 비로그인 `/video-ai` 접근 → `/login` 리다이렉트
- [ ] tester Video AI 3회 → 4번째 시도 시 PaywallModal
- [ ] admin Video AI 4회 이상 → 팝업 없이 정상
- [ ] PaywallModal CTA → DB 이벤트 기록 확인
- [ ] `/admin` → tester 이벤트 현황 조회

### L1 — API Tests

```bash
# 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tester1@nuami.app","password":"nuami-test-1"}' -c /tmp/tester.cookies

# 잔여 횟수
curl http://localhost:3000/api/usage -b /tmp/tester.cookies

# 402 트리거 (3회 후)
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  -b /tmp/tester.cookies
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-22 | Initial Design — Option B Clean Architecture | Jay |
