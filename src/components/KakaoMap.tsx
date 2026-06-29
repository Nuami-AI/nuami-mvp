"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const [places, setPlaces] = useState<KakaoLocalPlace[]>([]);
  const [jsKey, setJsKey] = useState(process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "");
  const [apiError, setApiError] = useState<string | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitKey, setMapInitKey] = useState(0);

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

    fetch(`/api/kakao/places?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { places?: KakaoLocalPlace[]; jsKey?: string; error?: string }) => {
        if (cancelled) return;
        setPlaces(data.places ?? []);
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
  }, [query, situation, venue, additionalQueries.join("|")]);

  useLayoutEffect(() => {
    if (loading || places.length === 0 || !jsKey || !containerRef.current) return;

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
        const center = new maps.LatLng(places[0].lat, places[0].lng);
        const map = new maps.Map(container, { center, level: 5 }) as MapInstance;
        mapRef.current = map;

        const bounds = new maps.LatLngBounds();

        for (const place of places) {
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
            </div>`,
          });

          maps.event.addListener(marker, "click", () => {
            info.open(map, marker);
          });
        }

        if (places.length > 1) {
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
  }, [loading, places, jsKey, mapInitKey]);

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
        {places.slice(0, 5).map((place) => (
          <a
            key={place.id}
            href={place.placeUrl || `https://map.kakao.com/link/map/${place.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3 hover:bg-infoBox transition-colors"
          >
            <span className="text-lg shrink-0">📍</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-text-primary leading-snug">{place.placeName}</p>
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
