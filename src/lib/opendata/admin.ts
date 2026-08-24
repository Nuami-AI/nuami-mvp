import { searchKakaoPlaces } from "@/lib/kakao/search";
import { cityQueryLabel, isPhysicalPlaceName, type CityRegion, type UserCoords } from "@/lib/geo/region";
import type { PublicFacility } from "./types";

function toFacility(
  place: {
    placeName: string;
    address: string;
    roadAddress: string;
    phone: string;
    lat: number;
    lng: number;
    category?: string;
  },
  category: string,
  provider: string,
  dataset: string,
  datasetUrl: string,
): PublicFacility {
  return {
    name: place.placeName,
    address: place.roadAddress || place.address,
    phone: place.phone,
    lat: place.lat,
    lng: place.lng,
    category: place.category || category,
    provider,
    dataset,
    datasetUrl,
    live: true,
  };
}

export async function fetchNearbyCommunityCenters(
  coords?: UserCoords,
  region: CityRegion = "other",
): Promise<{ facilities: PublicFacility[]; error?: string }> {
  const city = cityQueryLabel(region);
  const queries = coords
    ? ["주민센터", "행정복지센터"]
    : city
      ? [`${city} 주민센터`, `${city} 행정복지센터`]
      : ["주민센터"];

  const seen = new Set<string>();
  const facilities: PublicFacility[] = [];
  let error: string | undefined;

  for (const query of queries) {
    const kakao = await searchKakaoPlaces(query, 5, coords ? { ...coords, radius: 5000 } : undefined);
    if (kakao.error && !error) error = kakao.error;
    for (const place of kakao.places) {
      if (seen.has(place.id)) continue;
      if (!isPhysicalPlaceName(place.placeName, place.roadAddress || place.address)) continue;
      seen.add(place.id);
      facilities.push(
        toFacility(
          place,
          "주민센터·행정복지센터",
          "행정안전부 / 지자체 + 카카오 위치정보",
          "민원시설 검색",
          "https://www.data.go.kr",
        ),
      );
    }
    if (facilities.length >= 5) break;
  }

  return { facilities: facilities.slice(0, 5), error: facilities.length ? undefined : error };
}
