import { searchKakaoPlaces, getKakaoRestApiKey } from "@/lib/kakao/search";
import { fetchNearbyCommunityCenters } from "./admin";
import { fetchNearbyImmigration } from "./agencies";
import { getDataGoKrKey, fetchDataGoKr } from "./client";
import { geocodeRoadAddress } from "./geo";
import { fetchNearbyPublicHealthCenters } from "./health";
import type { OpenDataStatus } from "./status";
import { OPEN_DATA_INTEGRATIONS } from "./status";

const HIRA_LIST = "https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList";
const PHARMACY_LIST = "https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire";

const SEOUL_COORDS = { lat: 37.5665, lng: 126.978 };

export interface SyncProbeResult {
  id: string;
  ok: boolean;
  status: OpenDataStatus;
  message?: string;
  sampleCount?: number;
  syncedAt: string;
}

export interface SyncSnapshot {
  syncedAt: string;
  priority: "P0";
  results: Record<string, SyncProbeResult>;
  summary: { total: number; ok: number; failed: number };
}

let cachedSnapshot: SyncSnapshot | null = null;

export function getCachedP0Sync(): SyncSnapshot | null {
  return cachedSnapshot;
}

function probeResult(
  id: string,
  ok: boolean,
  syncedAt: string,
  opts?: { message?: string; sampleCount?: number; plannedOk?: boolean },
): SyncProbeResult {
  const row = OPEN_DATA_INTEGRATIONS.find((r) => r.id === id);
  const baseStatus = row?.status ?? "PLANNED";
  let status: OpenDataStatus = ok ? "CONNECTED" : "ERROR";
  if (!ok && (baseStatus === "PLANNED" || baseStatus === "INACTIVE")) {
    status = baseStatus === "INACTIVE" ? "INACTIVE" : "ERROR";
  }
  if (ok && baseStatus === "INACTIVE") status = "INACTIVE";

  return {
    id,
    ok,
    status,
    message: opts?.message,
    sampleCount: opts?.sampleCount,
    syncedAt,
  };
}

async function withProbeTimeout(
  id: string,
  syncedAt: string,
  work: () => Promise<SyncProbeResult>,
  timeoutMs = 10000,
): Promise<SyncProbeResult> {
  try {
    return await Promise.race([
      work(),
      new Promise<SyncProbeResult>((resolve) => {
        setTimeout(
          () => resolve(probeResult(id, false, syncedAt, { message: `probe timeout ${timeoutMs}ms` })),
          timeoutMs,
        );
      }),
    ]);
  } catch (err) {
    return probeResult(id, false, syncedAt, {
      message: err instanceof Error ? err.message : "probe failed",
    });
  }
}

async function probeIntegration(id: string, syncedAt: string): Promise<SyncProbeResult> {
  return withProbeTimeout(id, syncedAt, async () => {
    switch (id) {
      case "healthcare-hospitals": {
        const { items, error } = await fetchDataGoKr(
          HIRA_LIST,
          { pageNo: "1", numOfRows: "3", sidoCd: "110000" },
          { timeoutMs: 8000 },
        );
        return probeResult(id, items.length > 0, syncedAt, {
          sampleCount: items.length,
          message: items.length ? undefined : error ?? "no hospitals",
        });
      }
      case "healthcare-pharmacies": {
        const { items, error } = await fetchDataGoKr(
          PHARMACY_LIST,
          { pageNo: "1", numOfRows: "3", Q0: "서울특별시" },
          { timeoutMs: 8000 },
        );
        return probeResult(id, items.length > 0, syncedAt, {
          sampleCount: items.length,
          message: items.length ? undefined : error ?? "no pharmacies",
        });
      }
      case "healthcare-public-health": {
        const { facilities, error } = await fetchNearbyPublicHealthCenters(SEOUL_COORDS, "seoul");
        return probeResult(id, facilities.length > 0, syncedAt, {
          sampleCount: facilities.length,
          message: facilities.length ? "카카오 장소검색" : error ?? "no health centers",
        });
      }
      case "immigration-offices": {
        const { facilities } = await fetchNearbyImmigration(SEOUL_COORDS, "seoul");
        return probeResult(id, facilities.length > 0, syncedAt, {
          sampleCount: facilities.length,
          message: "공식 목록 + 카카오 보강",
        });
      }
      case "immigration-hikorea": {
        return probeResult(id, true, syncedAt, {
          message: "공식 웹·가이드 참조 (OpenAPI 아님)",
        });
      }
      case "geo-kakao-local": {
        const { places, error } = await searchKakaoPlaces("약국", 1, { ...SEOUL_COORDS, radius: 3000 });
        return probeResult(id, places.length > 0, syncedAt, {
          sampleCount: places.length,
          message: places.length ? undefined : error ?? "kakao local failed",
        });
      }
      case "geo-kakao-map-js": {
        const configured = Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim());
        return probeResult(id, configured, syncedAt, {
          message: configured ? "JS 키 설정됨" : "NEXT_PUBLIC_KAKAO_JS_KEY 미설정",
        });
      }
      case "geo-road-name-address": {
        const { result, error } = await geocodeRoadAddress("서울특별시 중구 세종대로 110");
        return probeResult(id, Boolean(result), syncedAt, {
          message: result ? `region=${result.region}` : error ?? "geocode failed",
        });
      }
      case "admin-community-centers": {
        const { facilities, error } = await fetchNearbyCommunityCenters(SEOUL_COORDS, "seoul");
        return probeResult(id, facilities.length > 0, syncedAt, {
          sampleCount: facilities.length,
          message: facilities.length ? "카카오 장소검색" : error ?? "no community centers",
        });
      }
      default:
        return probeResult(id, false, syncedAt, { message: "unknown P0 id" });
    }
  });
}

export async function syncP0Integrations(options?: { force?: boolean }): Promise<SyncSnapshot> {
  const syncedAt = new Date().toISOString();
  if (!options?.force && cachedSnapshot) {
    const ageMs = Date.now() - new Date(cachedSnapshot.syncedAt).getTime();
    if (ageMs < 5 * 60 * 1000) return cachedSnapshot;
  }

  const p0Ids = OPEN_DATA_INTEGRATIONS.filter((r) => r.priority === "P0").map((r) => r.id);
  const probes = await Promise.all(p0Ids.map((id) => probeIntegration(id, syncedAt)));

  const results: Record<string, SyncProbeResult> = {};
  let ok = 0;
  for (const probe of probes) {
    results[probe.id] = probe;
    if (probe.ok) ok += 1;
  }

  cachedSnapshot = {
    syncedAt,
    priority: "P0",
    results,
    summary: { total: probes.length, ok, failed: probes.length - ok },
  };

  return cachedSnapshot;
}

export function isOpenDataEnvReady(): { dataGoKr: boolean; kakaoRest: boolean; kakaoJs: boolean } {
  return {
    dataGoKr: Boolean(getDataGoKrKey()),
    kakaoRest: Boolean(getKakaoRestApiKey()),
    kakaoJs: Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim()),
  };
}
