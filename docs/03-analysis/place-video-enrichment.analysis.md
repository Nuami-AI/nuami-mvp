# place-video-enrichment Gap Analysis

> **Feature**: place-video-enrichment
> **Phase**: Check
> **Date**: 2026-04-20
> **Match Rate**: 94.4%
> **Status**: PASS (≥ 90%)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 지도/영상 버튼이 inert인 상태는 MVP의 신뢰성 갭. 추출은 됐는데 활용이 안 됨. |
| **WHO** | SEA 아웃바운드 여행자 22–38세. 영상 보면서 카드 확인 → 바로 지도 이동. |
| **RISK** | YouTube embed 비허용 영상, 문화 API CORS, API 키 없는 환경 에러 노출 |
| **SUCCESS** | 영상 임베드 정상, 지도 링크 신규 탭 이동, 문화 API 키 없을 때 UI 안 깨짐 |
| **SCOPE** | IN: YouTube embed, 지도 링크, 문화데이터 scaffold. OUT: SDK embed, TikTok |

---

## 1. Plan Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | YouTube URL → iframe 재생 가능 | ✅ Met | `VideoEmbed.tsx` — iframe, `aspect-video`, `loading="lazy"` |
| 2 | 카카오맵 버튼 → 신규 탭 검색 | ✅ Met | `ResultsScreen.tsx:214` |
| 3 | 구글맵 버튼 → 신규 탭 검색 | ✅ Met | `ResultsScreen.tsx:226` |
| 4 | `CULTURE_API_KEY` 없이 `/api/culture/nearby` → `{ events: [] }` | ✅ Met | `api-client.ts:6` |
| 5 | `npm run build` 0 errors | ✅ Met | Build confirmed |
| 6 | TypeScript strict — 신규 타입 `any` 없음 | ✅ Met | All explicit interfaces |

---

## 2. FR Coverage

| FR | Priority | Status | Notes |
|----|----------|--------|-------|
| FR-01 VideoEmbed | High | ✅ | `src/components/VideoEmbed.tsx` |
| FR-02 videoId in response | High | ✅ | `extraction.ts` + `route.ts:193` |
| FR-03 Kakao Map link | High | ✅ | `<a>` with aria-label, rel="noopener noreferrer" |
| FR-04 Google Maps link | High | ✅ | `<a>` with `+한국` suffix |
| FR-05 `/api/culture/nearby` | Medium | ✅ | Graceful degradation on missing API key |
| FR-06 `.env.example` | Medium | ✅ | 5 vars documented |
| FR-07 Cultural events UI | Low | ⚠️ Partial | Route ready; ResultsScreen UI not rendered (deferred) |

---

## 3. Structural Analysis

| Resource | Expected | Actual | Match |
|----------|----------|--------|-------|
| `src/components/VideoEmbed.tsx` | NEW | ✅ Exists | ✅ |
| `src/types/extraction.ts` | `videoId?` added | ✅ Line 8 | ✅ |
| `src/app/api/extract/route.ts` | `videoId` in response | ✅ Line 193 | ✅ |
| `src/components/ResultsScreen.tsx` | VideoEmbed + map `<a>` | ✅ Lines 152, 213, 226 | ✅ |
| `src/lib/culture/types.ts` | NEW | ✅ Exists | ✅ |
| `src/lib/culture/api-client.ts` | NEW | ✅ Exists | ✅ |
| `src/app/api/culture/nearby/route.ts` | NEW | ✅ Exists | ✅ |
| `.env.example` | NEW | ✅ Exists | ✅ |

---

## 4. Match Rate

```
Structural  (file coverage)  : 8/8  = 100%
Functional  (FR coverage)    : 6/7  =  86%  (FR-07 deferred — Low priority)
Contract    (API + types)    : 100%

Overall (static-only formula):
  100 × 0.20 + 86 × 0.40 + 100 × 0.40 = 94.4%
```

**Result: PASS** — 94.4% ≥ 90% threshold.

---

## 5. Decision Record

| Decision | Followed | Outcome |
|----------|----------|---------|
| 지도 링크 방식 → search URL (no API key) | ✅ | 즉시 활성화, API 키 불필요 |
| 문화 API 호출 → Server route | ✅ | CORS 회피, `CULTURE_API_KEY` 서버사이드 전용 |
| VideoEmbed 폴백 → 정적 썸네일+링크 | ✅ | embed 실패 시 기존 UI 유지 |
| 문화데이터 활성화 → env flag | ⚠️ Partial | Route 준비, UI 토글은 다음 세션 |

---

## 6. Gaps (Deferred)

| Gap | Severity | Deferred Reason |
|-----|----------|-----------------|
| FR-07: ResultsScreen 문화행사 mini-list | Low | API 키 준비 후 별도 세션 |
