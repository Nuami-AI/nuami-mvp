import type { KakaoLocalPlace } from "@/types/kakao";
import { withDistanceFromUser } from "@/lib/geo/distance";

const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

export interface KakaoSearchLocation {
  lat: number;
  lng: number;
  radius?: number;
}

interface KakaoKeywordDocument {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  phone: string;
  category_name: string;
  distance?: string;
}

interface KakaoKeywordResponse {
  documents: KakaoKeywordDocument[];
}

export function getKakaoRestApiKey(): string | undefined {
  return process.env.KAKAO_REST_API_KEY ?? process.env.KAKAO_MAP_API_KEY;
}

function toPlace(doc: KakaoKeywordDocument): KakaoLocalPlace {
  const distanceMeters = doc.distance ? Number.parseInt(doc.distance, 10) : undefined;
  return {
    id: doc.id,
    placeName: doc.place_name,
    address: doc.address_name,
    roadAddress: doc.road_address_name,
    lat: Number.parseFloat(doc.y),
    lng: Number.parseFloat(doc.x),
    placeUrl: doc.place_url,
    phone: doc.phone,
    category: doc.category_name,
    distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : undefined,
  };
}

export async function searchKakaoPlaces(
  query: string,
  size = 5,
  location?: KakaoSearchLocation,
): Promise<{ places: KakaoLocalPlace[]; error?: string }> {
  const apiKey = getKakaoRestApiKey();
  if (!apiKey || !query.trim()) return { places: [] };

  const url = new URL(KAKAO_KEYWORD_URL);
  url.searchParams.set("query", query.trim());
  url.searchParams.set("size", String(Math.min(size, 15)));
  if (location) {
    url.searchParams.set("x", String(location.lng));
    url.searchParams.set("y", String(location.lat));
    url.searchParams.set("radius", String(location.radius ?? 5000));
    url.searchParams.set("sort", "distance");
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = `Kakao API ${res.status}`;
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      /* ignore */
    }
    return { places: [], error: message };
  }

  const data = (await res.json()) as KakaoKeywordResponse;
  return { places: (data.documents ?? []).map(toPlace) };
}

export async function searchKakaoPlacesMany(
  queries: string[],
  perQuery = 5,
  location?: KakaoSearchLocation,
): Promise<{ places: KakaoLocalPlace[]; error?: string }> {
  const uniqueQueries = [...new Set(queries.map((q) => q.trim()).filter(Boolean))].slice(0, 6);
  if (uniqueQueries.length === 0) return { places: [] };

  const [primary, ...rest] = uniqueQueries;
  const primaryResult = await searchKakaoPlaces(primary, Math.max(perQuery, 8), location);

  const seen = new Set<string>();
  const merged: KakaoLocalPlace[] = [];
  let error: string | undefined = primaryResult.error;

  for (const place of primaryResult.places) {
    if (seen.has(place.id)) continue;
    seen.add(place.id);
    merged.push(place);
  }

  if (merged.length < perQuery && rest.length > 0) {
    const supplements = await Promise.all(
      rest.slice(0, 2).map((q) => searchKakaoPlaces(q, 3, location)),
    );
    for (const group of supplements) {
      if (group.error && !error) error = group.error;
      for (const place of group.places) {
        if (seen.has(place.id)) continue;
        seen.add(place.id);
        merged.push(place);
      }
    }
  }

  const sorted = location
    ? withDistanceFromUser(merged, location.lat, location.lng)
    : merged;

  return { places: sorted.slice(0, 12), error: sorted.length === 0 ? error : undefined };
}
