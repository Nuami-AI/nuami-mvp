"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { formatDistanceMeters, withDistanceFromUser } from "@/lib/geo/distance";
import { useLanguage } from "@/lib/i18n";
import type { KakaoLocalPlace } from "@/types/kakao";

interface Props {
  query: string;
  situation?: string;
  venue?: "store" | "bank" | "hospital" | "default";
  additionalQueries?: string[];
  className?: string;
}

type MapInstance = {
  setBounds: (bounds: unknown) => void;
  relayout: () => void;
};

const SDK_ID = "kakao-map-sdk";

function sdkScriptUrl(appKey: string): string {
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
}

function removeKakaoSdkScript(): void {
  document.getElementById(SDK_ID)?.remove();
  delete window.kakao;
}

function waitForKakaoMaps(maxMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => resolve());
        return;
      }
      if (Date.now() - start > maxMs) {
        reject(new Error("카카오맵 SDK 로드 시간 초과"));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

async function diagnoseSdkLoadFailure(appKey: string): Promise<string> {
  try {
    const res = await fetch(sdkScriptUrl(appKey), { method: "GET", cache: "no-store" });
    if (res.ok) return "카카오맵 SDK 스크립트 로드 실패";
    const body = await res.text();
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message?.includes("domain mismatched")) {
        return `도메인 불일치: ${window.location.origin} — 카카오 Developers Web 플랫폼에 이 주소를 등록해주세요.`;
      }
      if (parsed.message) return parsed.message;
    } catch {
      // ignore JSON parse errors
    }
  } catch {
    // ignore network errors
  }
  return "카카오맵 SDK 스크립트 로드 실패";
}

function loadKakaoMapsScript(appKey: string, forceReload = false): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));

  const expectedSrc = sdkScriptUrl(appKey);
  const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
  const sameScript = existing?.src === expectedSrc;

  if (forceReload || (existing && !sameScript)) {
    removeKakaoSdkScript();
  } else if (window.kakao?.maps) {
    return waitForKakaoMaps();
  } else if (existing && sameScript) {
    return waitForKakaoMaps();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SDK_ID;
    script.src = expectedSrc;
    script.async = true;
    script.onload = () => waitForKakaoMaps().then(resolve).catch(reject);
    script.onerror = async () => {
      removeKakaoSdkScript();
      reject(new Error(await diagnoseSdkLoadFailure(appKey)));
    };
    document.head.appendChild(script);
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function KakaoMap({
  query,
  situation,
  venue = "default",
  additionalQueries = [],
  className = "",
}: Props) {
  const { t } = useLanguage();
  const { coords: userCoords, status: locationStatus, request: requestLocation } = useUserLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const [places, setPlaces] = useState<KakaoLocalPlace[]>([]);
  const [sortedByDistance, setSortedByDistance] = useState(false);
  const [jsKey, setJsKey] = useState(process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "");
  const [apiError, setApiError] = useState<string | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitKey, setMapInitKey] = useState(0);

  const displayPlaces = useMemo(() => {
    if (!userCoords) return places;
    return withDistanceFromUser(places, userCoords.lat, userCoords.lng);
  }, [places, userCoords]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMapReady(false);
    setSdkError(null);
    mapRef.current = null;

    const params = new URLSearchParams();
    params.set("situation", (situation ?? query).trim());
    params.set("venue", venue);
    if (query.trim()) params.set("q", query.trim());
    for (const q of additionalQueries) {
      if (q.trim()) params.append("extra", q.trim());
    }
    if (userCoords) {
      params.set("lat", String(userCoords.lat));
      params.set("lng", String(userCoords.lng));
    }

    fetch(`/api/kakao/places?${params.toString()}`)
      .then((r) => r.json())
      .then((data: {
        places?: KakaoLocalPlace[];
        jsKey?: string;
        error?: string;
        sortedByDistance?: boolean;
      }) => {
        if (cancelled) return;
        setPlaces(data.places ?? []);
        setSortedByDistance(Boolean(data.sortedByDistance));
        setApiError(data.error ?? null);
        if (data.jsKey) setJsKey(data.jsKey);
      })
      .catch(() => {
        if (!cancelled) setApiError("장소 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, situation, venue, additionalQueries.join("|"), userCoords?.lat, userCoords?.lng]);

  useLayoutEffect(() => {
    if (loading || displayPlaces.length === 0 || !jsKey || !containerRef.current) return;

    let cancelled = false;
    setMapReady(false);
    setSdkError(null);

    const container = containerRef.current;
    container.replaceChildren();

    (async () => {
      try {
        await loadKakaoMapsScript(jsKey, mapInitKey > 0);
        if (cancelled || !containerRef.current) return;

        const { maps } = window.kakao!;
        const first = displayPlaces[0];
        const center = userCoords
          ? new maps.LatLng(userCoords.lat, userCoords.lng)
          : new maps.LatLng(first.lat, first.lng);
        const map = new maps.Map(container, { center, level: userCoords ? 4 : 5 }) as MapInstance;
        mapRef.current = map;

        const bounds = new maps.LatLngBounds();

        if (userCoords) {
          const userPosition = new maps.LatLng(userCoords.lat, userCoords.lng);
          bounds.extend(userPosition);
          new maps.Circle({
            map,
            center: userPosition,
            radius: 40,
            strokeWeight: 2,
            strokeColor: "#8651F2",
            strokeOpacity: 0.9,
            fillColor: "#8651F2",
            fillOpacity: 0.25,
          });
        }

        for (const place of displayPlaces) {
          const position = new maps.LatLng(place.lat, place.lng);
          bounds.extend(position);

          const marker = new maps.Marker({
            map,
            position,
            title: place.placeName,
          });

          const info = new maps.InfoWindow({
            content: `<div style="padding:8px 10px;font-size:12px;line-height:1.4;max-width:220px;">
              <strong>${escapeHtml(place.placeName)}</strong><br/>
              <span style="color:#666">${escapeHtml(place.roadAddress || place.address)}</span>
              ${place.distanceMeters != null ? `<br/><span style="color:#8651F2">${formatDistanceMeters(place.distanceMeters)}</span>` : ""}
            </div>`,
          });

          maps.event.addListener(marker, "click", () => {
            info.open(map, marker);
          });
        }

        if (displayPlaces.length > 1 || userCoords) {
          map.setBounds(bounds);
        }

        window.requestAnimationFrame(() => {
          map.relayout();
          window.setTimeout(() => {
            if (!cancelled) {
              map.relayout();
              setMapReady(true);
            }
          }, 100);
        });
      } catch (err) {
        if (!cancelled) {
          setSdkError(err instanceof Error ? err.message : "카카오맵을 표시할 수 없습니다.");
          setMapReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, [loading, displayPlaces, jsKey, mapInitKey, userCoords?.lat, userCoords?.lng]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !mapRef.current) return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.relayout();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [mapReady]);

  if (loading) {
    return (
      <div className={`relative w-full h-[280px] rounded-xl overflow-hidden bg-infoBox border border-line-neutral animate-pulse ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center text-[13px] text-text-tertiary">
          카카오맵 불러오는 중…
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className={`rounded-xl border border-line-neutral bg-infoBox p-5 text-center text-[13px] text-text-secondary ${className}`}>
        {apiError ? (
          <>
            <p className="text-amber-900">{apiError}</p>
            <p className="mt-2 text-[12px] text-text-tertiary">
              카카오 Developers에서 지도/로컬 API와 Web 도메인(localhost:3000)을 확인해주세요.
            </p>
          </>
        ) : (
          "검색 결과 장소가 없습니다. 검색어를 더 구체적으로 입력해보세요."
        )}
      </div>
    );
  }

  if (!jsKey) {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-900 ${className}`}>
        NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았습니다. .env에 추가 후 dev 서버를 재시작해주세요.
      </div>
    );
  }

  return (
    <div className={className}>
      {locationStatus === "prompting" && (
        <div className="mb-3 rounded-xl border border-line-neutral bg-infoBox px-4 py-3 text-[13px] text-text-secondary">
          {t("results.location.loading")}
        </div>
      )}
      {(locationStatus === "idle" || locationStatus === "denied") && !userCoords && (
        <div className="mb-3 rounded-xl border border-accent-100 bg-accent-50 px-4 py-3">
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {locationStatus === "denied"
              ? t("results.location.denied")
              : t("results.location.prompt")}
          </p>
          <button
            type="button"
            onClick={requestLocation}
            className="mt-2 rounded-lg bg-accent-700 px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            {t("results.location.requestBtn")}
          </button>
        </div>
      )}
      {locationStatus === "unavailable" && !userCoords && (
        <div className="mb-3 rounded-xl border border-line-neutral bg-infoBox px-4 py-3 text-[13px] text-text-secondary">
          {t("results.location.unavailable")}
        </div>
      )}
      {userCoords && sortedByDistance && (
        <p className="mb-2 text-[12px] font-semibold text-accent-700">
          {t("results.location.nearbySort")}
        </p>
      )}

      <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-line-neutral shadow-sm">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        {!mapReady && !sdkError && (
          <div className="absolute inset-0 flex items-center justify-center bg-infoBox/80 text-[13px] text-text-tertiary">
            지도 렌더링 중…
          </div>
        )}
        {sdkError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-infoBox/95 px-4 text-center z-10">
            <p className="text-[13px] text-amber-900">{sdkError}</p>
            <p className="text-[12px] text-text-tertiary">
              JavaScript 키 Web 플랫폼에 <strong>{typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}</strong> 등록 여부와
              .env.local의 <strong>NEXT_PUBLIC_KAKAO_JS_KEY</strong>가 최신 키인지 확인해주세요.
            </p>
            <button
              type="button"
              onClick={() => setMapInitKey((k) => k + 1)}
              className="mt-1 rounded-lg bg-accent-700 px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 bg-white rounded-2xl border border-line-neutral shadow-sm divide-y divide-line-neutral">
        {displayPlaces.slice(0, 5).map((place) => (
          <a
            key={place.id}
            href={place.placeUrl || `https://map.kakao.com/link/map/${place.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3 hover:bg-infoBox transition-colors"
          >
            <span className="text-lg shrink-0">📍</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-semibold text-text-primary leading-snug">{place.placeName}</p>
                {place.distanceMeters != null && (
                  <span className="shrink-0 rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
                    {formatDistanceMeters(place.distanceMeters)}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-text-secondary mt-0.5 truncate">
                {place.roadAddress || place.address}
              </p>
              {place.category && (
                <p className="text-[11px] text-text-disabled mt-0.5">{place.category}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
